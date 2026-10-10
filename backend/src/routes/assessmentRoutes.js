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
const { JOB_TEMPLATES } = require('../db/seedData');
const { isGeminiConfigured } = require('../ai/geminiService');

const router = express.Router();

// GET /api/templates - Get pre-configured job templates
router.get('/templates', (req, res) => {
  res.json({
    templates: JOB_TEMPLATES.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      candidateProfile: t.candidateProfile,
      competenciesCount: t.competencies.length,
      competencies: t.competencies.map(c => c.name)
    }))
  });
});

// GET /api/assessments - List all assessments for history
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find().sort({ created_at: -1 }).lean();

    const enriched = await Promise.all(
      assessments.map(async (a) => {
        const [events_count, competencies_count, demonstrated_count] = await Promise.all([
          AssessmentEvent.countDocuments({ assessment_id: a.id }),
          Competency.countDocuments({ assessment_id: a.id }),
          Competency.countDocuments({ assessment_id: a.id, current_status: 'demonstrated' })
        ]);

        return {
          ...a,
          events_count,
          competencies_count,
          demonstrated_count
        };
      })
    );

    res.json({ assessments: enriched });
  } catch (err) {
    console.error('[MongoDB Error] GET /api/assessments failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve assessments', details: err.message });
  }
});

// POST /api/assessments - Create a new assessment
router.post('/assessments', async (req, res) => {
  const {
    jobTitle,
    jobDescription,
    candidateName,
    candidateProfile,
    templateId,
    maxQuestions = 5
  } = req.body;

  if (!jobTitle || !candidateName) {
    return res.status(400).json({ error: 'jobTitle and candidateName are required' });
  }

  try {
    const assessmentId = `asmt_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const aiMode = isGeminiConfigured() ? 'gemini_live' : 'deterministic_demo';

    // Find matching template or fallback to default
    let selectedTemplate = JOB_TEMPLATES.find(t => t.id === templateId);
    if (!selectedTemplate) {
      selectedTemplate = JOB_TEMPLATES.find(t =>
        jobTitle.toLowerCase().includes('full') ? t.id === 'fullstack-web-architect' : true
      ) || JOB_TEMPLATES[0];
    }

    // Insert assessment record
    const newAssessment = await Assessment.create({
      id: assessmentId,
      title: `${jobTitle} - ${candidateName}`,
      job_title: jobTitle,
      job_description: jobDescription || selectedTemplate.description,
      candidate_name: candidateName,
      candidate_profile: candidateProfile || selectedTemplate.candidateProfile,
      status: 'in_progress',
      max_questions: maxQuestions,
      current_question_index: 0,
      current_question_id: null,
      ai_mode: aiMode,
      created_at: now,
      updated_at: now
    });

    console.log(`[MongoDB] Assessment created and persisted: ${assessmentId} (candidate: "${candidateName}", role: "${jobTitle}")`);

    // Insert competencies
    const compMap = {};
    const compDocs = [];
    for (const comp of selectedTemplate.competencies) {
      const compId = `comp_${crypto.randomBytes(5).toString('hex')}`;
      compMap[comp.id] = compId;

      compDocs.push({
        id: compId,
        assessment_id: assessmentId,
        name: comp.name,
        category: comp.category || 'Core Skill',
        description: comp.description,
        weight: comp.weight || 1.0,
        current_status: 'not_assessed',
        times_assessed: 0,
        created_at: now
      });
    }
    await Competency.insertMany(compDocs);

    // Insert questions
    let initialQuestionId = null;
    const qMap = {};
    const questionDocs = [];

    for (const q of selectedTemplate.questions) {
      const qId = `q_${crypto.randomBytes(5).toString('hex')}`;
      qMap[q.id] = qId;
      const mappedCompId = compMap[q.competency_id] || Object.values(compMap)[0];

      questionDocs.push({
        id: qId,
        assessment_id: assessmentId,
        competency_id: mappedCompId,
        title: q.title,
        prompt: q.prompt,
        type: q.type || 'conceptual',
        difficulty: q.difficulty || 'intermediate',
        starter_code: q.starter_code || null,
        test_cases: q.test_cases || null,
        rubric_criteria: typeof q.rubric_criteria === 'string' ? JSON.parse(q.rubric_criteria) : q.rubric_criteria,
        follow_up_triggers: typeof q.follow_up_triggers === 'string' ? JSON.parse(q.follow_up_triggers) : (q.follow_up_triggers || {}),
        is_initial: q.is_initial ? 1 : 0,
        created_at: now
      });

      if (q.is_initial && !initialQuestionId) {
        initialQuestionId = qId;
      }
    }

    // Update triggers with mapped question IDs
    for (const doc of questionDocs) {
      let triggers = doc.follow_up_triggers || {};
      let modified = false;

      if (triggers.on_missing) {
        for (const k of Object.keys(triggers.on_missing)) {
          const oldId = triggers.on_missing[k];
          if (qMap[oldId]) {
            triggers.on_missing[k] = qMap[oldId];
            modified = true;
          }
        }
      }
      if (triggers.on_demonstrated && triggers.on_demonstrated.all) {
        const oldId = triggers.on_demonstrated.all;
        if (qMap[oldId]) {
          triggers.on_demonstrated.all = qMap[oldId];
          modified = true;
        }
      }
      if (modified) {
        doc.follow_up_triggers = triggers;
      }
    }

    await Question.insertMany(questionDocs);

    // If no initial was found, select the first question
    if (!initialQuestionId && questionDocs.length > 0) {
      initialQuestionId = questionDocs[0].id;
    }

    // Update assessment with current question id
    await Assessment.updateOne(
      { id: assessmentId },
      {
        current_question_id: initialQuestionId,
        current_question_index: 1,
        updated_at: now
      }
    );

    res.status(201).json({
      assessmentId,
      message: 'Assessment created successfully',
      initialQuestionId
    });
  } catch (err) {
    console.error('[MongoDB Error] POST /api/assessments failed:', err.message);
    res.status(500).json({ error: 'Failed to create assessment in MongoDB', details: err.message });
  }
});

// GET /api/assessments/:id - Fetch full assessment status
router.get('/assessments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await Assessment.findOne({ id }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const competencies = await Competency.find({ assessment_id: id }).sort({ weight: -1 }).lean();

    let currentQuestion = null;
    if (assessment.current_question_id) {
      currentQuestion = await Question.findOne({ id: assessment.current_question_id }).lean();
      if (currentQuestion) {
        const comp = competencies.find(c => c.id === currentQuestion.competency_id);
        currentQuestion.competency_name = comp ? comp.name : '';
      }
    }

    const eventsCount = await AssessmentEvent.countDocuments({ assessment_id: id });
    const decisions = await AdaptiveDecision.find({ assessment_id: id }).sort({ created_at: -1 }).lean();

    res.json({
      assessment,
      competencies,
      currentQuestion,
      eventsCount,
      lastDecision: decisions[0] || null,
      aiConfigured: isGeminiConfigured()
    });
  } catch (err) {
    console.error(`[MongoDB Error] GET /api/assessments/${id} failed:`, err.message);
    res.status(500).json({ error: 'Failed to fetch assessment', details: err.message });
  }
});

// DELETE /api/assessments/:id - Delete an assessment
router.delete('/assessments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Promise.all([
      Assessment.deleteOne({ id }),
      Competency.deleteMany({ assessment_id: id }),
      Question.deleteMany({ assessment_id: id }),
      AssessmentEvent.deleteMany({ assessment_id: id }),
      AdaptiveDecision.deleteMany({ assessment_id: id }),
      FinalReport.deleteOne({ assessment_id: id })
    ]);

    console.log(`[MongoDB] Assessment deleted: ${id}`);
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (err) {
    console.error(`[MongoDB Error] DELETE /api/assessments/${id} failed:`, err.message);
    res.status(500).json({ error: 'Failed to delete assessment', details: err.message });
  }
});

module.exports = router;
