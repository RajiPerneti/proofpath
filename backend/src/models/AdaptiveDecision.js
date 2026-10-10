const mongoose = require('mongoose');

const adaptiveDecisionSchema = new mongoose.Schema({
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
  from_question_id: {
    type: String,
    default: null
  },
  selected_question_id: {
    type: String,
    default: null
  },
  target_competency_id: {
    type: String,
    default: null
  },
  decision_rule: {
    type: String,
    required: true
  },
  decision_rationale: {
    type: String,
    required: true
  },
  alternatives_considered: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  created_at: {
    type: String,
    required: true
  }
}, {
  collection: 'adaptive_decisions',
  timestamps: false,
  versionKey: false
});

const AdaptiveDecision = mongoose.models.AdaptiveDecision || mongoose.model('AdaptiveDecision', adaptiveDecisionSchema);

module.exports = AdaptiveDecision;
