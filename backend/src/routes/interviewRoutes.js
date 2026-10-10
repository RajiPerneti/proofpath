const express = require('express');
const crypto = require('crypto');
const {
  Assessment,
  Competency,
  Question,
  AssessmentEvent,
  AdaptiveDecision,
  FinalReport
} = require('../models');
const { evaluateWithAiOrFallback } = require('../ai/geminiService');
const { selectNextAdaptiveQuestion, computeCompetencyCoverage } = require('../engine/adaptiveEngine');

const router = express.Router();

/**
 * Compiles and persists the final evidence-backed assessment report in MongoDB
 */
async function generateAndSaveFinalReport(assessmentId) {
  const assessment = await Assessment.findOne({ id: assessmentId }).lean();
  const competencies = await Competency.find({ assessment_id: assessmentId }).lean();
  const events = await AssessmentEvent.find({ assessment_id: assessmentId }).sort({ event_sequence: 1 }).lean();

  const verifiedEvidence = [];
  const unverifiedClaims = [];
  const untestedAreas = [];

  for (const ev of events) {
    const demoCriteria = ev.criteria_demonstrated || [];
    const uncertCriteria = ev.criteria_uncertain || [];
    const excerpts = ev.supporting_excerpts || [];

    for (const c of demoCriteria) {
      verifiedEvidence.push({
        competencyId: ev.competency_id,
        criterionName: c.name,
        question: ev.question_text,
        excerpt: c.supportingExcerpt || (excerpts[0] || 'Technical criteria satisfied in response.')
      });
    }

    for (const u of uncertCriteria) {
      unverifiedClaims.push({
        competencyId: ev.competency_id,
        criterionName: u.name,
        question: ev.question_text,
        missingReason: u.missingReason || u.reason || 'Not demonstrated in response.'
      });
    }
  }

  let demonstratedCount = 0;
  for (const comp of competencies) {
    if (comp.current_status === 'not_assessed') {
      untestedAreas.push({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        weight: comp.weight
      });
    } else if (comp.current_status === 'demonstrated') {
      demonstratedCount++;
    }
  }

  const coverageScore = competencies.length > 0
    ? Math.round(((competencies.length - untestedAreas.length) / competencies.length) * 100)
    : 0;

  const nextSteps = [];
  if (unverifiedClaims.length > 0) {
    nextSteps.push(`Conduct deep dive on unverified criteria: ${unverifiedClaims.slice(0, 2).map(u => u.criterionName).join(', ')}.`);
  }
  if (untestedAreas.length > 0) {
    nextSteps.push(`Administer follow-up assessment on untested domain: ${untestedAreas[0].name}.`);
  }
  nextSteps.push('Review code artifacts and execution logs with candidate during live debrief.');

  const reportSummary = `Technical assessment conducted for ${assessment.candidate_name} applying for ${assessment.job_title}. Overall competency assessment coverage reached ${coverageScore}%, with ${demonstratedCount} of ${competencies.length} competencies fully demonstrated with concrete textual evidence.`;

  const limitations = 'ProofPath evaluates strictly observed technical evidence against predetermined rubrics. It does NOT evaluate soft skills, personality, candidate integrity, or cultural traits, and does NOT make hiring or rejection recommendations.';

  const reportId = `rep_${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const reportDoc = {
    id: reportId,
    assessment_id: assessmentId,
    summary: reportSummary,
    coverage_score: coverageScore,
    competency_breakdown: competencies,
    verified_evidence: verifiedEvidence,
    unverified_claims: unverifiedClaims,
    untested_areas: untestedAreas,
    recommended_next_steps: nextSteps,
    limitations_disclosure: limitations,
    created_at: now
  };

  await FinalReport.findOneAndUpdate(
    { assessment_id: assessmentId },
    reportDoc,
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`[MongoDB] Final assessment report compiled and saved: ${reportId} for assessment ${assessmentId}`);

  return {
    ...reportDoc,
    competencies,
    recommendedNextSteps: nextSteps
  };
}

// POST /api/assessments/:id/submit - Submit answer, evaluate against rubric, trigger adaptive engine
router.post('/assessments/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { responseText, questionId } = req.body;

  if (!responseText || !questionId) {
    return res.status(400).json({ error: 'responseText and questionId are required' });
  }

  try {
    const assessment = await Assessment.findOne({ id }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const currentQuestion = await Question.findOne({ id: questionId, assessment_id: id }).lean();
    if (!currentQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 1. Evaluate response against rubric
    const evaluation = await evaluateWithAiOrFallback(currentQuestion, responseText);

    // 2. Determine sequence number
    const prevEvents = await AssessmentEvent.find({ assessment_id: id }).sort({ event_sequence: 1 }).lean();
    const sequenceNum = prevEvents.length + 1;
    const eventId = `ev_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    // 3. Fetch all competencies and questions for adaptive decision
    const competencies = await Competency.find({ assessment_id: id }).lean();
    const availableQuestions = await Question.find({ assessment_id: id }).lean();

    // 4. Run Adaptive Selection Engine
    const decision = selectNextAdaptiveQuestion({
      lastQuestion: currentQuestion,
      lastEvaluation: evaluation,
      events: prevEvents,
      competencies,
      availableQuestions,
      maxQuestions: assessment.max_questions
    });

    // 5. Insert assessment event into Evidence Ledger in MongoDB
    await AssessmentEvent.create({
      id: eventId,
      assessment_id: id,
      competency_id: currentQuestion.competency_id,
      question_id: currentQuestion.id,
      event_sequence: sequenceNum,
      question_text: currentQuestion.prompt,
      candidate_response: responseText,
      evaluation_status: evaluation.evaluation_status,
      criteria_demonstrated: evaluation.criteria_demonstrated || [],
      criteria_uncertain: evaluation.criteria_uncertain || [],
      supporting_excerpts: evaluation.supporting_excerpts || [],
      evaluation_reasoning: evaluation.evaluation_reasoning,
      follow_up_question_id: decision.selected_question_id || null,
      follow_up_reason: decision.decision_rationale,
      evaluator_type: evaluation.evaluator_type,
      created_at: now
    });

    console.log(`[MongoDB] Candidate answer evaluated & event persisted: ${eventId} (status: ${evaluation.evaluation_status})`);

    // 6. Record adaptive decision in MongoDB
    const decisionId = `dec_${crypto.randomBytes(6).toString('hex')}`;
    await AdaptiveDecision.create({
      id: decisionId,
      assessment_id: id,
      from_question_id: currentQuestion.id,
      selected_question_id: decision.selected_question_id || null,
      target_competency_id: decision.target_competency_id || null,
      decision_rule: decision.decision_rule,
      decision_rationale: decision.decision_rationale,
      alternatives_considered: decision.alternatives_considered || [],
      created_at: now
    });

    // 7. Update competency status in MongoDB
    const updatedCoverage = computeCompetencyCoverage(competencies, [
      ...prevEvents,
      { competency_id: currentQuestion.competency_id, evaluation_status: evaluation.evaluation_status }
    ]);

    for (const comp of updatedCoverage) {
      await Competency.updateOne(
        { id: comp.id },
        {
          current_status: comp.current_status,
          times_assessed: comp.times_assessed
        }
      );
    }

    // 8. Handle next step or conclusion
    let isCompleted = false;
    let nextQuestionData = null;

    if (decision.action === 'conclude') {
      isCompleted = true;
      await Assessment.updateOne(
        { id },
        {
          status: 'completed',
          current_question_id: null,
          updated_at: now
        }
      );

      await generateAndSaveFinalReport(id);
    } else {
      // Proceed to next question
      await Assessment.updateOne(
        { id },
        {
          current_question_id: decision.selected_question_id,
          current_question_index: assessment.current_question_index + 1,
          updated_at: now
        }
      );

      nextQuestionData = await Question.findOne({ id: decision.selected_question_id }).lean();
      if (nextQuestionData) {
        const nextComp = competencies.find(c => c.id === nextQuestionData.competency_id);
        nextQuestionData.competency_name = nextComp ? nextComp.name : '';
      }
    }

    const latestCompetencies = await Competency.find({ assessment_id: id }).sort({ weight: -1 }).lean();

    res.json({
      message: 'Response recorded and evaluated',
      evaluation,
      decision,
      isCompleted,
      nextQuestion: nextQuestionData,
      competencies: latestCompetencies,
      eventSequence: sequenceNum
    });
  } catch (err) {
    console.error(`[MongoDB Error] POST /api/assessments/${id}/submit failed:`, err.message);
    res.status(500).json({ error: 'Failed to evaluate response', details: err.message });
  }
});

// GET /api/assessments/:id/events - Evidence Ledger and Timeline
router.get('/assessments/:id/events', async (req, res) => {
  const { id } = req.params;

  try {
    const [events, competencies, questions] = await Promise.all([
      AssessmentEvent.find({ assessment_id: id }).sort({ event_sequence: 1 }).lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const compMap = new Map(competencies.map(c => [c.id, c.name]));
    const qMap = new Map(questions.map(q => [q.id, { title: q.title, type: q.type }]));

    const formattedEvents = events.map(e => {
      const qInfo = qMap.get(e.question_id) || {};
      return {
        ...e,
        competency_name: compMap.get(e.competency_id) || 'Technical Competency',
        question_title: qInfo.title || 'Technical Inquiry',
        question_type: qInfo.type || 'conceptual',
        criteria_demonstrated: e.criteria_demonstrated || [],
        criteria_uncertain: e.criteria_uncertain || [],
        supporting_excerpts: e.supporting_excerpts || [],
        code_results: e.code_results || null
      };
    });

    res.json({ events: formattedEvents });
  } catch (err) {
    console.error(`[MongoDB Error] GET /api/assessments/${id}/events failed:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve events', details: err.message });
  }
});

// GET /api/assessments/:id/decisions - Adaptive decisions log
router.get('/assessments/:id/decisions', async (req, res) => {
  const { id } = req.params;

  try {
    const [decisions, competencies, questions] = await Promise.all([
      AdaptiveDecision.find({ assessment_id: id }).sort({ created_at: 1 }).lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const compMap = new Map(competencies.map(c => [c.id, c.name]));
    const qMap = new Map(questions.map(q => [q.id, q.title]));

    const formatted = decisions.map(d => ({
      ...d,
      target_competency_name: d.target_competency_id ? compMap.get(d.target_competency_id) : null,
      selected_question_title: d.selected_question_id ? qMap.get(d.selected_question_id) : null,
      alternatives_considered: d.alternatives_considered || []
    }));

    res.json({ decisions: formatted });
  } catch (err) {
    console.error(`[MongoDB Error] GET /api/assessments/${id}/decisions failed:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve decisions', details: err.message });
  }
});

// GET /api/assessments/:id/report - Final assessment report
router.get('/assessments/:id/report', async (req, res) => {
  const { id } = req.params;

  try {
    let report = await FinalReport.findOne({ assessment_id: id }).lean();

    if (!report) {
      report = await generateAndSaveFinalReport(id);
    }

    const [assessment, events, competencies, questions] = await Promise.all([
      Assessment.findOne({ id }).lean(),
      AssessmentEvent.find({ assessment_id: id }).sort({ event_sequence: 1 }).lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const compMap = new Map(competencies.map(c => [c.id, c.name]));
    const qMap = new Map(questions.map(q => [q.id, q.title]));

    const formattedEvents = events.map(e => ({
      ...e,
      competency_name: compMap.get(e.competency_id) || 'Competency',
      question_title: qMap.get(e.question_id) || 'Question',
      criteria_demonstrated: e.criteria_demonstrated || [],
      criteria_uncertain: e.criteria_uncertain || [],
      supporting_excerpts: e.supporting_excerpts || []
    }));

    res.json({
      assessment,
      report: {
        ...report,
        competency_breakdown: report.competency_breakdown || [],
        verified_evidence: report.verified_evidence || [],
        unverified_claims: report.unverified_claims || [],
        untested_areas: report.untested_areas || [],
        recommended_next_steps: report.recommended_next_steps || []
      },
      events: formattedEvents
    });
  } catch (err) {
    console.error(`[MongoDB Error] GET /api/assessments/${id}/report failed:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve report', details: err.message });
  }
});

module.exports = router;
