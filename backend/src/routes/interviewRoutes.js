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

const {
  selectNextAdaptiveQuestion,
  computeCompetencyCoverage
} = require('../engine/adaptiveEngine');
const { requireAuth, checkAssessmentOwnership } = require('../middleware/auth');

const router = express.Router();

/**
 * Compiles and persists an evidence-backed assessment report.
 *
 * Assessment coverage:
 * Percentage of competencies assessed at least once.
 *
 * Demonstration rate:
 * Percentage of competencies currently marked demonstrated.
 *
 * Evidence traceability:
 * Percentage of demonstrated criteria that have a real supporting excerpt.
 */
async function generateAndSaveFinalReport(assessmentId) {
  const assessment = await Assessment.findOne({ id: assessmentId }).lean();

  if (!assessment) {
    throw new Error('Assessment not found while generating report');
  }

  const competencies = await Competency.find({
    assessment_id: assessmentId
  }).lean();

  const events = await AssessmentEvent.find({
    assessment_id: assessmentId
  })
    .sort({ event_sequence: 1 })
    .lean();

  const verifiedEvidence = [];
  const unverifiedClaims = [];
  const untestedAreas = [];

  // Build evidence records from actual evaluation results.
  for (const ev of events) {
    const demonstratedCriteria = ev.criteria_demonstrated || [];
    const uncertainCriteria = ev.criteria_uncertain || [];

    for (const criterion of demonstratedCriteria) {
      const excerpt =
        typeof criterion.supportingExcerpt === 'string' &&
        criterion.supportingExcerpt.trim().length > 0
          ? criterion.supportingExcerpt.trim()
          : null;

      verifiedEvidence.push({
        competencyId: ev.competency_id,
        criterionId: criterion.id || null,
        criterionName: criterion.name || 'Unnamed criterion',
        questionId: ev.question_id,
        question: ev.question_text,
        excerpt,
        evidenceTraceable: Boolean(excerpt),
        evaluationStatus: ev.evaluation_status,
        evaluatorType: ev.evaluator_type || 'unknown',
        eventSequence: ev.event_sequence
      });
    }

    for (const criterion of uncertainCriteria) {
      unverifiedClaims.push({
        competencyId: ev.competency_id,
        criterionId: criterion.id || null,
        criterionName: criterion.name || 'Unnamed criterion',
        questionId: ev.question_id,
        question: ev.question_text,
        missingReason:
          criterion.missingReason ||
          criterion.reason ||
          'The available response did not establish this criterion.',
        eventSequence: ev.event_sequence
      });
    }
  }

  // Count competency statuses.
  let demonstratedCount = 0;
  let partiallyDemonstratedCount = 0;
  let insufficientEvidenceCount = 0;
  let assessedCount = 0;

  for (const comp of competencies) {
    if (comp.current_status === 'not_assessed') {
      untestedAreas.push({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        weight: comp.weight,
        status: 'not_assessed'
      });

      continue;
    }

    assessedCount++;

    if (comp.current_status === 'demonstrated') {
      demonstratedCount++;
    } else if (comp.current_status === 'partially_demonstrated') {
      partiallyDemonstratedCount++;
    } else if (comp.current_status === 'insufficient_evidence') {
      insufficientEvidenceCount++;
    }
  }

  const totalCompetencies = competencies.length;

  // Metric 1: How many competencies received an assessment?
  const coverageScore = totalCompetencies > 0
    ? Math.round((assessedCount / totalCompetencies) * 100)
    : 0;

  // Metric 2: How many competencies were fully demonstrated?
  const demonstrationRate = totalCompetencies > 0
    ? Math.round((demonstratedCount / totalCompetencies) * 100)
    : 0;

  // Metric 3: How many demonstrated criteria have actual excerpts?
  const traceableEvidenceCount = verifiedEvidence.filter(
    evidence => evidence.evidenceTraceable
  ).length;

  const evidenceTraceability = verifiedEvidence.length > 0
    ? Math.round(
        (traceableEvidenceCount / verifiedEvidence.length) * 100
      )
    : 0;

  // Recommend next steps based on actual gaps.
  const nextSteps = [];

  if (untestedAreas.length > 0) {
    nextSteps.push(
      `Assess untested competencies: ${untestedAreas
        .map(comp => comp.name)
        .join(', ')}.`
    );
  }

  if (unverifiedClaims.length > 0) {
    const unresolvedNames = [
      ...new Set(
        unverifiedClaims.map(criterion => criterion.criterionName)
      )
    ];

    nextSteps.push(
      `Investigate unresolved rubric criteria: ${unresolvedNames
        .slice(0, 3)
        .join(', ')}.`
    );
  }

  const evidenceWithoutExcerpts = verifiedEvidence.filter(
    evidence => !evidence.evidenceTraceable
  ).length;

  if (evidenceWithoutExcerpts > 0) {
    nextSteps.push(
      `Review ${evidenceWithoutExcerpts} demonstrated criterion record(s) that lack a directly linked supporting excerpt.`
    );
  }

  if (demonstratedCount < totalCompetencies) {
    nextSteps.push(
      'Review competency findings and supporting answers with a human assessor before drawing conclusions.'
    );
  }

  nextSteps.push(
    'Review technical artifacts and execution results with the candidate during a live debrief.'
  );

  const reportSummary =
    `Technical assessment conducted for ${assessment.candidate_name} applying for ${assessment.job_title}. ` +
    `Assessment coverage: ${coverageScore}% (${assessedCount} of ${totalCompetencies} competencies assessed). ` +
    `Demonstration rate: ${demonstrationRate}% (${demonstratedCount} of ${totalCompetencies} competencies marked demonstrated). ` +
    `${partiallyDemonstratedCount} partially demonstrated, ` +
    `${insufficientEvidenceCount} with insufficient evidence, and ` +
    `${untestedAreas.length} not yet assessed. ` +
    `Evidence traceability: ${evidenceTraceability}% of demonstrated criterion records contain a directly linked excerpt.`;

  const limitations =
    'ProofPath evaluates recorded responses against predetermined rubrics. ' +
    'Assessment coverage does not mean a competency has been demonstrated. ' +
    'Demonstration status depends on the configured evaluator and rubric and should be reviewed by a human assessor. ' +
    'Missing excerpts must not be treated as supporting evidence. ' +
    'ProofPath does not evaluate personality, emotion, integrity, or cultural traits and does not make hiring or rejection recommendations.';

  const reportId = `rep_${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const reportDoc = {
    id: reportId,
    assessment_id: assessmentId,
    summary: reportSummary,

    // Preserve the existing field used by the frontend.
    coverage_score: coverageScore,

    // New separate metrics.
    demonstration_rate: demonstrationRate,
    evidence_traceability: evidenceTraceability,

    // Additional counts for the report UI.
    total_competencies: totalCompetencies,
    assessed_competencies: assessedCount,
    demonstrated_competencies: demonstratedCount,
    partially_demonstrated_competencies: partiallyDemonstratedCount,
    insufficient_evidence_competencies: insufficientEvidenceCount,

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
    { $set: reportDoc },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(
    `[MongoDB] Evidence report generated for ${assessmentId}: ` +
    `coverage=${coverageScore}%, demonstration=${demonstrationRate}%, ` +
    `traceability=${evidenceTraceability}%`
  );

  return {
    ...reportDoc,
    competencies,
    recommendedNextSteps: nextSteps
  };
}


// POST /api/assessments/:id/submit
// Submit answer, evaluate against rubric, and trigger adaptive selection.
router.post('/assessments/:id/submit', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;
  const { responseText, questionId } = req.body;

  if (
    typeof responseText !== 'string' ||
    !responseText.trim() ||
    typeof questionId !== 'string' ||
    !questionId.trim()
  ) {
    return res.status(400).json({
      error: 'responseText and questionId are required'
    });
  }

  try {
    const assessment = await Assessment.findOne({ id }).lean();

    if (!assessment) {
      return res.status(404).json({
        error: 'Assessment not found'
      });
    }

    if (assessment.status === 'completed') {
      return res.status(409).json({
        error: 'This assessment has already been completed.'
      });
    }

    const currentQuestion = await Question.findOne({
      id: questionId,
      assessment_id: id
    }).lean();

    if (!currentQuestion) {
      return res.status(404).json({
        error: 'Question not found'
      });
    }

    // 1. Evaluate the submitted response.
    const evaluation = await evaluateWithAiOrFallback(
      currentQuestion,
      responseText
    );

    // 2. Read the existing evidence ledger.
    const prevEvents = await AssessmentEvent.find({
      assessment_id: id
    })
      .sort({ event_sequence: 1 })
      .lean();

    // Prevent accidental duplicate submission of an already answered question.
    if (prevEvents.some(event => event.question_id === questionId)) {
      return res.status(409).json({
        error: 'This question has already been answered.'
      });
    }

    const sequenceNum = prevEvents.length + 1;
    const eventId = `ev_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    // 3. Load competencies and available questions.
    const competencies = await Competency.find({
      assessment_id: id
    }).lean();

    const availableQuestions = await Question.find({
      assessment_id: id
    }).lean();

    // 4. Select the next question using deterministic rules.
    const decision = selectNextAdaptiveQuestion({
      lastQuestion: currentQuestion,
      lastEvaluation: evaluation,
      events: prevEvents,
      competencies,
      availableQuestions,
      maxQuestions: assessment.max_questions
    });

    // 5. Save the answer and evaluation in the evidence ledger.
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

    // 6. Persist the adaptive decision.
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

    // 7. Recalculate competency status from recorded evaluation events.
    const updatedCoverage = computeCompetencyCoverage(
      competencies,
      [
        ...prevEvents,
        {
          competency_id: currentQuestion.competency_id,
          evaluation_status: evaluation.evaluation_status
        }
      ]
    );

    for (const comp of updatedCoverage) {
      await Competency.updateOne(
        { id: comp.id, assessment_id: id },
        {
          current_status: comp.current_status,
          times_assessed: comp.times_assessed
        }
      );
    }

    // 8. Update the assessment and either continue or generate a report.
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
      await Assessment.updateOne(
        { id },
        {
          current_question_id: decision.selected_question_id,
          current_question_index: sequenceNum + 1,
          updated_at: now
        }
      );

      nextQuestionData = await Question.findOne({
        id: decision.selected_question_id,
        assessment_id: id
      }).lean();

      if (nextQuestionData) {
        const nextComp = competencies.find(
          comp => comp.id === nextQuestionData.competency_id
        );

        nextQuestionData.competency_name = nextComp
          ? nextComp.name
          : '';
      }
    }

    const latestCompetencies = await Competency.find({
      assessment_id: id
    })
      .sort({ weight: -1 })
      .lean();

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
    console.error(
      `[MongoDB Error] POST /api/assessments/${id}/submit failed:`,
      err.message
    );

    res.status(500).json({
      error: 'Failed to evaluate response'
    });
  }
});


// GET /api/assessments/:id/events
// Evidence ledger and timeline.
router.get('/assessments/:id/events', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;

  try {
    const [events, competencies, questions] = await Promise.all([
      AssessmentEvent.find({ assessment_id: id })
        .sort({ event_sequence: 1 })
        .lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const compMap = new Map(
      competencies.map(comp => [comp.id, comp.name])
    );

    const questionMap = new Map(
      questions.map(question => [
        question.id,
        { title: question.title, type: question.type }
      ])
    );

    const formattedEvents = events.map(event => {
      const questionInfo = questionMap.get(event.question_id) || {};

      return {
        ...event,
        competency_name:
          compMap.get(event.competency_id) || 'Technical Competency',
        question_title: questionInfo.title || 'Technical Inquiry',
        question_type: questionInfo.type || 'conceptual',
        criteria_demonstrated: event.criteria_demonstrated || [],
        criteria_uncertain: event.criteria_uncertain || [],
        supporting_excerpts: event.supporting_excerpts || [],
        code_results: event.code_results || null
      };
    });

    res.json({ events: formattedEvents });
  } catch (err) {
    console.error(
      `[MongoDB Error] GET /api/assessments/${id}/events failed:`,
      err.message
    );

    res.status(500).json({
      error: 'Failed to retrieve events'
    });
  }
});


// GET /api/assessments/:id/decisions
// Adaptive decisions log.
router.get('/assessments/:id/decisions', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;

  try {
    const [decisions, competencies, questions] = await Promise.all([
      AdaptiveDecision.find({ assessment_id: id })
        .sort({ created_at: 1 })
        .lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const compMap = new Map(
      competencies.map(comp => [comp.id, comp.name])
    );

    const questionMap = new Map(
      questions.map(question => [question.id, question.title])
    );

    const formatted = decisions.map(decision => ({
      ...decision,
      target_competency_name: decision.target_competency_id
        ? compMap.get(decision.target_competency_id)
        : null,
      selected_question_title: decision.selected_question_id
        ? questionMap.get(decision.selected_question_id)
        : null,
      alternatives_considered: decision.alternatives_considered || []
    }));

    res.json({ decisions: formatted });
  } catch (err) {
    console.error(
      `[MongoDB Error] GET /api/assessments/${id}/decisions failed:`,
      err.message
    );

    res.status(500).json({
      error: 'Failed to retrieve decisions'
    });
  }
});


// GET /api/assessments/:id/report
// Fetch the latest final report.
router.get('/assessments/:id/report', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await Assessment.findOne({ id }).lean();

    if (!assessment) {
      return res.status(404).json({
        error: 'Assessment not found'
      });
    }

    const [events, competencies, questions] = await Promise.all([
      AssessmentEvent.find({ assessment_id: id })
        .sort({ event_sequence: 1 })
        .lean(),
      Competency.find({ assessment_id: id }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    // Always regenerate the report so its metrics reflect current stored data
    // and updates to report-generation logic.
    const report = await generateAndSaveFinalReport(id);

    const compMap = new Map(
      competencies.map(comp => [comp.id, comp.name])
    );

    const questionMap = new Map(
      questions.map(question => [question.id, question.title])
    );

    const formattedEvents = events.map(event => ({
      ...event,
      competency_name:
        compMap.get(event.competency_id) || 'Competency',
      question_title:
        questionMap.get(event.question_id) || 'Question',
      criteria_demonstrated: event.criteria_demonstrated || [],
      criteria_uncertain: event.criteria_uncertain || [],
      supporting_excerpts: event.supporting_excerpts || []
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
    console.error(
      `[MongoDB Error] GET /api/assessments/${id}/report failed:`,
      err.message
    );

    res.status(500).json({
      error: 'Failed to retrieve report'
    });
  }
});

module.exports = router;
