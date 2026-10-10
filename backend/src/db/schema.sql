-- ProofPath Database Schema

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_profile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
  max_questions INTEGER NOT NULL DEFAULT 5,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  current_question_id TEXT,
  ai_mode TEXT NOT NULL DEFAULT 'deterministic_demo', -- 'gemini_live' or 'deterministic_demo'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS competencies (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  current_status TEXT NOT NULL DEFAULT 'not_assessed', -- 'not_assessed', 'insufficient_evidence', 'partially_demonstrated', 'demonstrated'
  times_assessed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'conceptual', -- 'conceptual', 'scenario', 'code_challenge'
  difficulty TEXT NOT NULL DEFAULT 'intermediate', -- 'fundamental', 'intermediate', 'advanced'
  starter_code TEXT,
  test_cases TEXT, -- JSON array of test cases
  rubric_criteria TEXT NOT NULL, -- JSON array of criteria
  follow_up_triggers TEXT, -- JSON rules mapping gaps to follow-up questions
  is_initial INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_events (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  event_sequence INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  candidate_response TEXT NOT NULL,
  evaluation_status TEXT NOT NULL, -- 'demonstrated', 'partially_demonstrated', 'insufficient_evidence'
  criteria_demonstrated TEXT NOT NULL, -- JSON array
  criteria_uncertain TEXT NOT NULL, -- JSON array
  supporting_excerpts TEXT NOT NULL, -- JSON array
  evaluation_reasoning TEXT NOT NULL,
  code_results TEXT, -- JSON object
  follow_up_question_id TEXT,
  follow_up_reason TEXT,
  evaluator_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (competency_id) REFERENCES competencies(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS adaptive_decisions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  from_question_id TEXT,
  selected_question_id TEXT,
  target_competency_id TEXT,
  decision_rule TEXT NOT NULL,
  decision_rationale TEXT NOT NULL,
  alternatives_considered TEXT NOT NULL, -- JSON array
  created_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS final_reports (
  id TEXT PRIMARY KEY,
  assessment_id TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  coverage_score REAL NOT NULL,
  competency_breakdown TEXT NOT NULL, -- JSON array
  verified_evidence TEXT NOT NULL, -- JSON array
  unverified_claims TEXT NOT NULL, -- JSON array
  untested_areas TEXT NOT NULL, -- JSON array
  recommended_next_steps TEXT NOT NULL, -- JSON array
  limitations_disclosure TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);
