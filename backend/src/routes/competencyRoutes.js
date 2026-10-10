const express = require('express');
const {
  Assessment,
  Competency,
  Question,
  AssessmentEvent
} = require('../models');

const router = express.Router();

// GET /api/assessments/:id/competencies - Full details for interactive competency explorer
router.get('/assessments/:id/competencies', async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await Assessment.findOne({ id }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const [competencies, events, questions] = await Promise.all([
      Competency.find({ assessment_id: id }).sort({ weight: -1 }).lean(),
      AssessmentEvent.find({ assessment_id: id }).sort({ event_sequence: 1 }).lean(),
      Question.find({ assessment_id: id }).lean()
    ]);

    const competencyDetails = competencies.map(comp => {
      const compEvents = events.filter(e => e.competency_id === comp.id);
      const compQuestions = questions.filter(q => q.competency_id === comp.id);

      const demonstratedCriteria = [];
      const missingGaps = [];
      const evidenceQuotes = [];

      for (const ev of compEvents) {
        const demo = ev.criteria_demonstrated || [];
        const uncert = ev.criteria_uncertain || [];
        const quotes = ev.supporting_excerpts || [];

        for (const d of demo) demonstratedCriteria.push({ ...d, question: ev.question_text });
        for (const u of uncert) missingGaps.push({ ...u, question: ev.question_text });
        for (const q of quotes) evidenceQuotes.push(q);
      }

      // Recommended next assessment for this competency
      const unaskedQ = compQuestions.find(q => !compEvents.some(e => e.question_id === q.id));
      const nextRecommendation = comp.current_status === 'demonstrated'
        ? 'Competency demonstrated with conclusive evidence. No further assessment required.'
        : (unaskedQ ? `Administer "${unaskedQ.title}" to probe missing criteria.` : 'Design targeted live scenario to verify unresolved gaps.');

      return {
        ...comp,
        questionsAskedCount: compEvents.length,
        questionsAvailableCount: compQuestions.length,
        demonstratedCriteria,
        missingGaps,
        evidenceQuotes,
        recommendedNextAssessment: nextRecommendation,
        events: compEvents.map(e => ({
          id: e.id,
          sequence: e.event_sequence,
          question: e.question_text,
          evaluationStatus: e.evaluation_status,
          reasoning: e.evaluation_reasoning
        }))
      };
    });

    res.json({
      assessmentTitle: assessment.title,
      competencies: competencyDetails
    });
  } catch (err) {
    console.error(`[MongoDB Error] GET /api/assessments/${id}/competencies failed:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve competency map', details: err.message });
  }
});

module.exports = router;
