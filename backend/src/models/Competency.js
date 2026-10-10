const mongoose = require('mongoose');

const competencySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    default: 1.0
  },
  current_status: {
    type: String,
    required: true,
    default: 'not_assessed'
  },
  times_assessed: {
    type: Number,
    required: true,
    default: 0
  },
  created_at: {
    type: String,
    required: true
  }
}, {
  collection: 'competencies',
  timestamps: false,
  versionKey: false
});

const Competency = mongoose.models.Competency || mongoose.model('Competency', competencySchema);

module.exports = Competency;
