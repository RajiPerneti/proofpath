const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    default: 'conceptual'
  },
  difficulty: {
    type: String,
    required: true,
    default: 'intermediate'
  },
  starter_code: {
    type: String,
    default: null
  },
  test_cases: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  rubric_criteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  follow_up_triggers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_initial: {
    type: Number,
    required: true,
    default: 0
  },
  created_at: {
    type: String,
    required: true
  }
}, {
  collection: 'questions',
  timestamps: false,
  versionKey: false
});

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

module.exports = Question;
