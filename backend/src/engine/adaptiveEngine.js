// Adaptive Assessment Engine: Explicit, testable rules for question selection and path branching

/**
 * Calculates current coverage and status across all competencies based on evidence ledger.
 * @param {Array} competencies - List of competencies with weights
 * @param {Array} events - List of completed assessment ledger events
 * @returns {Array} Updated competencies with assessment counts and statuses
 */
function computeCompetencyCoverage(competencies, events) {
  const compMap = {};

  for (const c of competencies) {
    compMap[c.id] = {
      ...c,
      times_assessed: 0,
      demonstrated_count: 0,
      partially_count: 0,
      insufficient_count: 0,
      current_status: 'not_assessed'
    };
  }

  for (const ev of events) {
    if (compMap[ev.competency_id]) {
      compMap[ev.competency_id].times_assessed += 1;
      if (ev.evaluation_status === 'demonstrated') {
        compMap[ev.competency_id].demonstrated_count += 1;
        compMap[ev.competency_id].current_status = 'demonstrated';
      } else if (ev.evaluation_status === 'partially_demonstrated') {
        compMap[ev.competency_id].partially_count += 1;
        // Don't downgrade if already demonstrated previously
        if (compMap[ev.competency_id].current_status !== 'demonstrated') {
          compMap[ev.competency_id].current_status = 'partially_demonstrated';
        }
      } else if (ev.evaluation_status === 'insufficient_evidence') {
        compMap[ev.competency_id].insufficient_count += 1;
        if (compMap[ev.competency_id].current_status === 'not_assessed') {
          compMap[ev.competency_id].current_status = 'insufficient_evidence';
        }
      }
    }
  }

  return Object.values(compMap);
}

/**
 * Selects the next assessment question and provides transparent rationale and alternatives.
 * 
 * Core Decision Logic:
 * 1. Check max question limit. If reached -> finish assessment.
 * 2. Check if all competencies are 'demonstrated'. If so and min questions met -> finish assessment.
 * 3. If the immediate previous evaluation had unresolved criteria (partially_demonstrated or insufficient):
 *    - Check for targeted follow-up questions linked via follow_up_triggers or same competency.
 *    - If an unasked targeted follow-up exists, select it to resolve the specific knowledge gap!
 * 4. If previous evaluation was demonstrated (or no targeted follow-up exists):
 *    - Prioritize among unassessed or under-evidenced competencies based on weight and assessment count.
 *    - Select the highest-priority question from the target competency.
 * 
 * @param {Object} params
 * @param {Object} params.lastQuestion - The question just answered
 * @param {Object} params.lastEvaluation - The evaluation result of the last answer
 * @param {Array} params.events - Historical assessment events in this session
 * @param {Array} params.competencies - All competencies for this role
 * @param {Array} params.availableQuestions - All candidate questions in the bank
 * @param {number} params.maxQuestions - Assessment question limit
 * @returns {Object} Adaptive decision result
 */
function selectNextAdaptiveQuestion({
  lastQuestion,
  lastEvaluation,
  events = [],
  competencies = [],
  availableQuestions = [],
  maxQuestions = 5
}) {
  const askedQuestionIds = new Set(events.map(e => e.question_id));
  if (lastQuestion && lastQuestion.id) {
    askedQuestionIds.add(lastQuestion.id);
  }

  const currentCount = events.length + (lastQuestion ? 1 : 0);

  // Calculate current competency coverage
  const updatedCompetencies = computeCompetencyCoverage(competencies, [
    ...events,
    ...(lastQuestion && lastEvaluation ? [{
      competency_id: lastQuestion.competency_id,
      evaluation_status: lastEvaluation.evaluation_status
    }] : [])
  ]);

  // Identify competencies that have not yet received an initial assessment
  const unassessedCompetencies = updatedCompetencies.filter(c => c.current_status === 'not_assessed');
  const unassessedWithQuestions = unassessedCompetencies.filter(c => 
    availableQuestions.some(q => q.competency_id === c.id && !askedQuestionIds.has(q.id))
  );

  // Rule 1: Termination condition - Question limit reached
  // Ensure every required competency receives an initial assessment opportunity before concluding
  if (currentCount >= maxQuestions && unassessedWithQuestions.length === 0) {
    return {
      action: 'conclude',
      decision_rule: 'RULE_MAX_QUESTIONS_REACHED',
      decision_rationale: `Target question limit of ${maxQuestions} questions reached and all required competencies have received initial assessment. Concluding assessment to generate evidence report.`,
      alternatives_considered: ['Continue probing additional competencies: rejected due to session limit.'],
      nextQuestion: null,
      targetCompetency: null
    };
  }

  // Rule 2: Termination condition - Full competency coverage achieved
  const allDemonstrated = updatedCompetencies.length > 0 && updatedCompetencies.every(c => c.current_status === 'demonstrated');
  if (allDemonstrated && currentCount >= 3) {
    return {
      action: 'conclude',
      decision_rule: 'RULE_ALL_COMPETENCIES_DEMONSTRATED',
      decision_rationale: 'All critical role competencies have been fully demonstrated with verified evidence. Concluding early.',
      alternatives_considered: ['Extend depth inquiries: rejected because sufficient evidence coverage is verified.'],
      nextQuestion: null,
      targetCompetency: null
    };
  }

  const alternatives = [];

  // Rule 3: Targeted Gap Follow-up (Path A)
  // If the last evaluation was partially demonstrated or insufficient, drill down on the specific missing criteria!
  // BUT: Do not monopolize the assessment with repeat follow-ups on the same competency while others remain unassessed.
  // Allow at most 1 follow-up on the same competency before branching to unassessed competencies.
  const lastComp = lastQuestion ? updatedCompetencies.find(c => c.id === lastQuestion.competency_id) : null;
  const canFollowUpSameComp = !lastComp || lastComp.times_assessed < 2 || unassessedWithQuestions.length === 0;

  if (canFollowUpSameComp && lastQuestion && lastEvaluation && (lastEvaluation.evaluation_status === 'partially_demonstrated' || lastEvaluation.evaluation_status === 'insufficient_evidence')) {
    const uncertainIds = (lastEvaluation.criteria_uncertain || []).map(u => u.id);
    const triggers = typeof lastQuestion.follow_up_triggers === 'string'
      ? JSON.parse(lastQuestion.follow_up_triggers || '{}')
      : (lastQuestion.follow_up_triggers || {});

    // Check if a specific trigger maps to an unasked question
    let triggeredQuestionId = null;
    let missingCriterionName = '';

    if (triggers.on_missing) {
      for (const critId of uncertainIds) {
        if (triggers.on_missing[critId] && !askedQuestionIds.has(triggers.on_missing[critId])) {
          triggeredQuestionId = triggers.on_missing[critId];
          const critObj = lastEvaluation.criteria_uncertain.find(c => c.id === critId);
          missingCriterionName = critObj ? critObj.name : critId;
          break;
        }
      }
    }

    if (triggeredQuestionId) {
      const followUpQ = availableQuestions.find(q => q.id === triggeredQuestionId);
      if (followUpQ) {
        const targetComp = updatedCompetencies.find(c => c.id === followUpQ.competency_id) || {};
        return {
          action: 'proceed',
          selected_question_id: followUpQ.id,
          target_competency_id: followUpQ.competency_id,
          decision_rule: 'RULE_TARGETED_GAP_FOLLOW_UP',
          decision_rationale: `Candidate partially demonstrated "${targetComp.name || 'competency'}" but left key criterion "${missingCriterionName}" unresolved. Selected targeted follow-up "${followUpQ.title}" to directly investigate this gap.`,
          alternatives_considered: [
            'Move immediately to next competency: rejected because evidence on current competency remains inconclusive.',
            'Repeat original question: rejected to avoid redundant testing.'
          ],
          nextQuestion: followUpQ,
          targetCompetency: targetComp
        };
      }
    }

    // If no direct trigger, only fall back to same-competency probe if there are NO unassessed competencies
    if (unassessedWithQuestions.length === 0) {
      const sameCompUnasked = availableQuestions.find(q => 
        q.competency_id === lastQuestion.competency_id && !askedQuestionIds.has(q.id)
      );

      if (sameCompUnasked) {
        const targetComp = updatedCompetencies.find(c => c.id === sameCompUnasked.competency_id) || {};
        return {
          action: 'proceed',
          selected_question_id: sameCompUnasked.id,
          target_competency_id: sameCompUnasked.competency_id,
          decision_rule: 'RULE_SAME_COMPETENCY_SECONDARY_PROBE',
          decision_rationale: `Previous response provided inconclusive evidence on "${targetComp.name}". Selected secondary probe "${sameCompUnasked.title}" to gather required evidence.`,
          alternatives_considered: [
            'Conclude assessment: rejected because depth probing is available.'
          ],
          nextQuestion: sameCompUnasked,
          targetCompetency: targetComp
        };
      }
    }
  }

  // Rule 4: Broaden Coverage to Untested / High-Priority Competencies (Path B)
  // Give unassessed competencies highest priority (+50.0) so every required competency receives an initial assessment
  const rankedCompetencies = [...updatedCompetencies]
    .map(comp => {
      let score = (comp.weight || 1.0) * 2.5;
      if (comp.current_status === 'not_assessed') score += 50.0;
      else if (comp.current_status === 'insufficient_evidence') score += 3.0;
      else if (comp.current_status === 'partially_demonstrated') score += 1.5;
      else if (comp.current_status === 'demonstrated') score -= 5.0;

      score -= (comp.times_assessed || 0) * 3.0;

      // Check if competency has available unasked questions
      const unaskedCount = availableQuestions.filter(q => q.competency_id === comp.id && !askedQuestionIds.has(q.id)).length;

      return {
        ...comp,
        priorityScore: score,
        unaskedCount
      };
    })
    .filter(c => c.unaskedCount > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (rankedCompetencies.length === 0) {
    // No more questions available in any competency
    return {
      action: 'conclude',
      decision_rule: 'RULE_QUESTION_BANK_EXHAUSTED',
      decision_rationale: 'All candidate questions across relevant competencies have been administered. Concluding assessment.',
      alternatives_considered: ['No remaining unasked questions in the question bank.'],
      nextQuestion: null,
      targetCompetency: null
    };
  }

  const selectedComp = rankedCompetencies[0];

  // Pick the best unasked question for this competency (prefer initial question)
  const candidateQuestionsForComp = availableQuestions.filter(
    q => q.competency_id === selectedComp.id && !askedQuestionIds.has(q.id)
  );

  // Prefer is_initial if available, or first available
  const nextQ = candidateQuestionsForComp.find(q => q.is_initial === 1) || candidateQuestionsForComp[0];

  for (let i = 1; i < Math.min(3, rankedCompetencies.length); i++) {
    alternatives.push(`Competency "${rankedCompetencies[i].name}" (priority ${rankedCompetencies[i].priorityScore.toFixed(1)}): deferred in favor of higher-priority "${selectedComp.name}".`);
  }

  const lastCompName = lastQuestion ? (updatedCompetencies.find(c => c.id === lastQuestion.competency_id)?.name || 'previous topic') : null;

  return {
    action: 'proceed',
    selected_question_id: nextQ.id,
    target_competency_id: selectedComp.id,
    decision_rule: 'RULE_BROADEN_COVERAGE_HIGH_PRIORITY',
    decision_rationale: lastQuestion
      ? (selectedComp.current_status === 'not_assessed'
          ? `Proceeding to evaluate unassessed competency "${selectedComp.name}" (weight: ${selectedComp.weight}) to ensure comprehensive coverage across all required competencies.`
          : `Candidate completed evaluation on "${lastCompName}". Switching to priority competency "${selectedComp.name}" (weight: ${selectedComp.weight}, status: ${selectedComp.current_status}) to deepen evidence.`)
      : `Initiating assessment with highest-priority competency "${selectedComp.name}" (weight: ${selectedComp.weight}).`,
    alternatives_considered: alternatives.length > 0 ? alternatives : ['All other competencies already adequately assessed.'],
    nextQuestion: nextQ,
    targetCompetency: selectedComp
  };
}

module.exports = {
  computeCompetencyCoverage,
  selectNextAdaptiveQuestion
};
