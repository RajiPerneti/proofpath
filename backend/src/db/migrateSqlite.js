const fs = require('fs');
const path = require('path');
const {
  Assessment,
  Competency,
  Question,
  AssessmentEvent,
  AdaptiveDecision,
  FinalReport
} = require('../models');

async function migrateFromSqliteIfNeeded() {
  try {
    const existingCount = await Assessment.countDocuments();
    if (existingCount > 0) {
      // Already has data in MongoDB
      return;
    }

    const sqlitePath = process.env.DB_PATH || path.join(__dirname, '../../data/proofpath.sqlite');
    if (!fs.existsSync(sqlitePath)) {
      return;
    }

    console.log('[MongoDB Migration] Checking for existing SQLite records to preserve...');
    const { DatabaseSync } = require('node:sqlite');
    const sqliteDb = new DatabaseSync(sqlitePath);

    // 1. Migrate Assessments
    const assessments = sqliteDb.prepare('SELECT * FROM assessments').all();
    if (assessments.length === 0) {
      sqliteDb.close();
      return;
    }

    for (const a of assessments) {
      await Assessment.create({
        id: a.id,
        title: a.title,
        job_title: a.job_title,
        job_description: a.job_description,
        candidate_name: a.candidate_name,
        candidate_profile: a.candidate_profile,
        status: a.status,
        max_questions: a.max_questions,
        current_question_index: a.current_question_index,
        current_question_id: a.current_question_id,
        ai_mode: a.ai_mode,
        created_at: a.created_at,
        updated_at: a.updated_at
      });
    }

    // 2. Migrate Competencies
    const competencies = sqliteDb.prepare('SELECT * FROM competencies').all();
    for (const c of competencies) {
      await Competency.create({
        id: c.id,
        assessment_id: c.assessment_id,
        name: c.name,
        category: c.category,
        description: c.description,
        weight: c.weight,
        current_status: c.current_status,
        times_assessed: c.times_assessed,
        created_at: c.created_at
      });
    }

    // 3. Migrate Questions
    const questions = sqliteDb.prepare('SELECT * FROM questions').all();
    for (const q of questions) {
      let testCases = null;
      let rubric = [];
      let triggers = {};
      try { testCases = q.test_cases ? JSON.parse(q.test_cases) : null; } catch (e) {}
      try { rubric = typeof q.rubric_criteria === 'string' ? JSON.parse(q.rubric_criteria) : q.rubric_criteria; } catch (e) {}
      try { triggers = typeof q.follow_up_triggers === 'string' ? JSON.parse(q.follow_up_triggers) : q.follow_up_triggers; } catch (e) {}

      await Question.create({
        id: q.id,
        assessment_id: q.assessment_id,
        competency_id: q.competency_id,
        title: q.title,
        prompt: q.prompt,
        type: q.type,
        difficulty: q.difficulty,
        starter_code: q.starter_code,
        test_cases: testCases,
        rubric_criteria: rubric,
        follow_up_triggers: triggers,
        is_initial: q.is_initial,
        created_at: q.created_at
      });
    }

    // 4. Migrate Events
    const events = sqliteDb.prepare('SELECT * FROM assessment_events').all();
    for (const ev of events) {
      let demo = [];
      let uncert = [];
      let excerpts = [];
      let codeResults = null;
      try { demo = JSON.parse(ev.criteria_demonstrated || '[]'); } catch (e) {}
      try { uncert = JSON.parse(ev.criteria_uncertain || '[]'); } catch (e) {}
      try { excerpts = JSON.parse(ev.supporting_excerpts || '[]'); } catch (e) {}
      try { codeResults = ev.code_results ? JSON.parse(ev.code_results) : null; } catch (e) {}

      await AssessmentEvent.create({
        id: ev.id,
        assessment_id: ev.assessment_id,
        competency_id: ev.competency_id,
        question_id: ev.question_id,
        event_sequence: ev.event_sequence,
        question_text: ev.question_text,
        candidate_response: ev.candidate_response,
        evaluation_status: ev.evaluation_status,
        criteria_demonstrated: demo,
        criteria_uncertain: uncert,
        supporting_excerpts: excerpts,
        evaluation_reasoning: ev.evaluation_reasoning,
        code_results: codeResults,
        follow_up_question_id: ev.follow_up_question_id,
        follow_up_reason: ev.follow_up_reason,
        evaluator_type: ev.evaluator_type,
        created_at: ev.created_at
      });
    }

    // 5. Migrate Decisions
    const decisions = sqliteDb.prepare('SELECT * FROM adaptive_decisions').all();
    for (const d of decisions) {
      let alts = [];
      try { alts = JSON.parse(d.alternatives_considered || '[]'); } catch (e) {}

      await AdaptiveDecision.create({
        id: d.id,
        assessment_id: d.assessment_id,
        from_question_id: d.from_question_id,
        selected_question_id: d.selected_question_id,
        target_competency_id: d.target_competency_id,
        decision_rule: d.decision_rule,
        decision_rationale: d.decision_rationale,
        alternatives_considered: alts,
        created_at: d.created_at
      });
    }

    // 6. Migrate Reports
    const reports = sqliteDb.prepare('SELECT * FROM final_reports').all();
    for (const r of reports) {
      let comps = [];
      let verified = [];
      let unverified = [];
      let untested = [];
      let nextSteps = [];
      try { comps = JSON.parse(r.competency_breakdown || '[]'); } catch (e) {}
      try { verified = JSON.parse(r.verified_evidence || '[]'); } catch (e) {}
      try { unverified = JSON.parse(r.unverified_claims || '[]'); } catch (e) {}
      try { untested = JSON.parse(r.untested_areas || '[]'); } catch (e) {}
      try { nextSteps = JSON.parse(r.recommended_next_steps || '[]'); } catch (e) {}

      await FinalReport.create({
        id: r.id,
        assessment_id: r.assessment_id,
        summary: r.summary,
        coverage_score: r.coverage_score,
        competency_breakdown: comps,
        verified_evidence: verified,
        unverified_claims: unverified,
        untested_areas: untested,
        recommended_next_steps: nextSteps,
        limitations_disclosure: r.limitations_disclosure,
        created_at: r.created_at
      });
    }

    sqliteDb.close();
    console.log(`[MongoDB Migration] Preserved and migrated ${assessments.length} assessment records into MongoDB.`);
  } catch (err) {
    console.warn('[MongoDB Migration] Notice while migrating from SQLite:', err.message);
  }
}

module.exports = { migrateFromSqliteIfNeeded };
