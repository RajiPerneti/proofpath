const mongoose = require('mongoose');

const assessmentEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  assessment_id: {
    type: String,
    required: true,
    index: true
  },
  competency_id: {
    type: String,
    required: true,
    index: true
  },
  question_id: {
    type: String,
    required: true,
    index: true
  },
  event_sequence: {
    type: Number,
    required: true
  },
  question_text: {
    type: String,
    required: true
  },
  candidate_response: {
    type: String,
    required: true
  },
  evaluation_status: {
    type: String,
    required: true
  },
  criteria_demonstrated: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  criteria_uncertain: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  supporting_excerpts: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  evaluation_reasoning: {
    type: String,
    required: true
  },
  code_results: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  follow_up_question_id: {
    type: String,
    default: null
  },
  follow_up_reason: {
    type: String,
    default: null
  },
  evaluator_type: {
    type: String,
    required: true
  },
  created_at: {
    type: String,
    required: true
  }
}, {
  collection: 'assessment_events',
  timestamps: false,
  versionKey: false
});

const AssessmentEvent = mongoose.models.AssessmentEvent || mongoose.model('AssessmentEvent', assessmentEventSchema);

module.exports = AssessmentEvent;
