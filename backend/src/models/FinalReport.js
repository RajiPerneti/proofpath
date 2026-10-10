const mongoose = require('mongoose');

const finalReportSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  assessment_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  summary: {
    type: String,
    required: true
  },
  coverage_score: {
    type: Number,
    required: true
  },
  competency_breakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  verified_evidence: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  unverified_claims: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  untested_areas: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  recommended_next_steps: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  limitations_disclosure: {
    type: String,
    required: true
  },
  created_at: {
    type: String,
    required: true
  }
}, {
  collection: 'final_reports',
  timestamps: false,
  versionKey: false
});

const FinalReport = mongoose.models.FinalReport || mongoose.model('FinalReport', finalReportSchema);

module.exports = FinalReport;
