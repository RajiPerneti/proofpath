const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    default: null,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  job_title: {
    type: String,
    required: true
  },
  job_description: {
    type: String,
    required: true
  },
  candidate_name: {
    type: String,
    required: true
  },
  candidate_profile: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'in_progress',
    enum: ['in_progress', 'completed']
  },
  max_questions: {
    type: Number,
    required: true,
    default: 5
  },
  current_question_index: {
    type: Number,
    required: true,
    default: 0
  },
  current_question_id: {
    type: String,
    default: null
  },
  ai_mode: {
    type: String,
    required: true,
    default: 'deterministic_demo'
  },
  resume_filename: {
    type: String,
    default: null
  },
  resume_text: {
    type: String,
    default: null
  },
  created_at: {
    type: String,
    required: true
  },
  updated_at: {
    type: String,
    required: true
  }
}, {
  collection: 'assessments',
  timestamps: false,
  versionKey: false
});

const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
