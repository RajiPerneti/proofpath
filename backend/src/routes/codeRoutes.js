const express = require('express');
const crypto = require('crypto');
const {
  Assessment,
  Competency,
  Question,
  AssessmentEvent,
  AdaptiveDecision
} = require('../models');
const { runPythonCodeSafely } = require('../engine/codeRunner');
const { selectNextAdaptiveQuestion, computeCompetencyCoverage } = require('../engine/adaptiveEngine');
const { requireAuth, checkAssessmentOwnership } = require('../middleware/auth');

const router = express.Router();

// POST /api/assessments/:id/run-code - Safe isolated test run (does not record as final answer)
router.post('/assessments/:id/run-code', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;
  const { code, questionId } = req.body;

  if (!code || !questionId) {
    return res.status(400).json({ error: 'code and questionId are required' });
  }

  try {
    let question = await Question.findOne({ id: questionId, assessment_id: id }).lean();
    if (!question) {
      question = await Question.findOne({ type: 'code_challenge', assessment_id: id }).lean();
    }
    if (!question) {
      question = await Question.findOne({
        assessment_id: id,
        $or: [{ title: /Coding/i }, { title: /LRU/i }]
      }).lean();
    }
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = question.test_cases || [];
    const runResult = await runPythonCodeSafely(code, testCases);

    res.json({
      runResult,
      questionTitle: question.title
    });
  } catch (err) {
    console.error(`[MongoDB Error] POST /api/assessments/${id}/run-code failed:`, err.message);
    res.status(500).json({ error: 'Failed to run code', details: err.message });
  }
});

// POST /api/assessments/:id/submit-code - Submit code solution, record evidence into ledger, trigger adaptive engine
router.post('/assessments/:id/submit-code', requireAuth, checkAssessmentOwnership, async (req, res) => {
  const { id } = req.params;
  const { code, questionId } = req.body;

  if (!code || !questionId) {
    return res.status(400).json({ error: 'code and questionId are required' });
  }

  try {
    const assessment = await Assessment.findOne({ id }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    let currentQuestion = await Question.findOne({ id: questionId, assessment_id: id }).lean();
    if (!currentQuestion) {
      currentQuestion = await Question.findOne({ type: 'code_challenge', assessment_id: id }).lean();
    }
    if (!currentQuestion) {
      currentQuestion = await Question.findOne({
        assessment_id: id,
        $or: [{ title: /Coding/i }, { title: /LRU/i }]
      }).lean();
    }
    if (!currentQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = currentQuestion.test_cases || [];
    const runResult = await runPythonCodeSafely(code, testCases);

    // Derive rubric evaluation from test execution results
    const passRate = runResult.testsTotal > 0 ? (runResult.testsPassed / runResult.testsTotal) : 0;
    let evalStatus = 'insufficient_evidence';
    if (passRate === 1.0) {
      evalStatus = 'demonstrated';
    } else if (passRate > 0) {
      evalStatus = 'partially_demonstrated';
    }

    const criteria = currentQuestion.rubric_criteria || [];
    const demonstrated = [];
    const uncertain = [];

    for (const c of criteria) {
      if (evalStatus === 'demonstrated') {
        demonstrated.push({
          id: c.id,
          name: c.name,
          supportingExcerpt: `Verified by test suite: ${runResult.testsPassed}/${runResult.testsTotal} test cases passed (${runResult.executionTimeMs}ms).`
        });
      } else if (evalStatus === 'partially_demonstrated') {
        if (c.id && (c.id.includes('pass') || c.id.includes('correctness'))) {
          uncertain.push({
            id: c.id,
            name: c.name,
            missingReason: `Passed ${runResult.testsPassed} of ${runResult.testsTotal} test cases. Failed edge cases.`
          });
        } else {
          demonstrated.push({
            id: c.id,
            name: c.name,
            supportingExcerpt: `Code structure partially implemented with ${runResult.testsPassed} passing tests.`
          });
        }
      } else {
        uncertain.push({
          id: c.id,
          name: c.name,
          missingReason: runResult.error || 'Code failed all test assertions or failed compilation.'
        });
      }
    }

    const evaluation = {
      evaluation_status: evalStatus,
      criteria_demonstrated: demonstrated,
      criteria_uncertain: uncertain,
      supporting_excerpts: [`Test suite result: ${runResult.testsPassed}/${runResult.testsTotal} tests passed in ${runResult.executionTimeMs}ms.`],
      evaluation_reasoning: `Code execution verified in isolated sandbox. ${runResult.testsPassed} of ${runResult.testsTotal} test assertions satisfied.`,
      evaluator_type: 'isolated_test_runner'
    };

    // Determine sequence number
    const prevEvents = await AssessmentEvent.find({ assessment_id: id }).sort({ event_sequence: 1 }).lean();
    const sequenceNum = prevEvents.length + 1;
    const eventId = `ev_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    const competencies = await Competency.find({ assessment_id: id }).lean();
    const availableQuestions = await Question.find({ assessment_id: id }).lean();

    // Adaptive selection
    const decision = selectNextAdaptiveQuestion({
      lastQuestion: currentQuestion,
      lastEvaluation: evaluation,
      events: prevEvents,
      competencies,
      availableQuestions,
      maxQuestions: assessment.max_questions
    });

    // Record in Evidence Ledger
    await AssessmentEvent.create({
      id: eventId,
      assessment_id: id,
      competency_id: currentQuestion.competency_id,
      question_id: currentQuestion.id,
      event_sequence: sequenceNum,
      question_text: currentQuestion.prompt,
      candidate_response: code,
      evaluation_status: evaluation.evaluation_status,
      criteria_demonstrated: evaluation.criteria_demonstrated,
      criteria_uncertain: evaluation.criteria_uncertain,
      supporting_excerpts: evaluation.supporting_excerpts,
      evaluation_reasoning: evaluation.evaluation_reasoning,
      code_results: runResult,
      follow_up_question_id: decision.selected_question_id || null,
      follow_up_reason: decision.decision_rationale,
      evaluator_type: 'isolated_test_runner',
      created_at: now
    });

    console.log(`[MongoDB] Code submission recorded & event persisted: ${eventId}`);

    // Update decision and competencies
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
    } else {
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

    res.json({
      message: 'Code challenge evaluated and evidence recorded',
      runResult,
      evaluation,
      decision,
      isCompleted,
      nextQuestion: nextQuestionData
    });
  } catch (err) {
    console.error(`[MongoDB Error] POST /api/assessments/${id}/submit-code failed:`, err.message);
    res.status(500).json({ error: 'Failed to submit code', details: err.message });
  }
});

module.exports = router;
