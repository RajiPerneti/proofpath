// Rubric Evaluator: Explainable, evidence-based assessment against explicit criteria

/**
 * Extracts a relevant excerpt sentence from the candidate's response that matches a criterion keyword.
 */
function extractSupportingExcerpt(text, keywords) {
  if (!text || typeof text !== 'string') return null;

  // Split response into sentences
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    const lower = cleanSentence.toLowerCase();

    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        // Return clean quoted excerpt up to 220 chars
        return cleanSentence.length > 220
          ? cleanSentence.substring(0, 217) + '...'
          : cleanSentence;
      }
    }
  }

  return null;
}

/**
 * Evaluates candidate response against explicit rubric criteria.
 * @param {Object} question - The question object with rubric_criteria
 * @param {string} responseText - The candidate's answer
 * @returns {Object} Structured evaluation result
 */
function evaluateResponseRubric(question, responseText) {
  const criteria = typeof question.rubric_criteria === 'string'
    ? JSON.parse(question.rubric_criteria)
    : (question.rubric_criteria || []);

  const cleanText = (responseText || '').trim();
  const lowerText = cleanText.toLowerCase();

  // Guard against empty / trivial answers
  if (cleanText.length < 20) {
    return {
      evaluation_status: 'insufficient_evidence',
      criteria_demonstrated: [],
      criteria_uncertain: criteria.map(c => ({
        id: c.id,
        name: c.name,
        reason: 'Response is too brief or contains no technical detail.'
      })),
      supporting_excerpts: [],
      evaluation_reasoning: 'The response did not provide enough technical substance to evaluate against the rubric criteria.',
      evaluator_type: 'deterministic_rubric_engine'
    };
  }

  const demonstrated = [];
  const uncertain = [];
  const excerpts = [];

  for (const crit of criteria) {
    const keywords = crit.keywords || [];
    let matchCount = 0;
    const matchedKws = [];

    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        matchCount++;
        matchedKws.push(kw);
      }
    }

    const excerpt = extractSupportingExcerpt(cleanText, keywords);

    // Require at least 1 keyword match for demonstrated (or 2 if many keywords exist)
    const threshold = keywords.length >= 4 ? 2 : 1;

    if (matchCount >= threshold) {
      demonstrated.push({
        id: crit.id,
        name: crit.name,
        description: crit.description,
        matchedKeywords: matchedKws,
        supportingExcerpt: excerpt || `Demonstrated understanding of ${crit.name}`
      });
      if (excerpt && !excerpts.includes(excerpt)) {
        excerpts.push(excerpt);
      }
    } else {
      uncertain.push({
        id: crit.id,
        name: crit.name,
        description: crit.description,
        missingReason: `Did not demonstrate core concepts for "${crit.name}". Expected discussion of ${keywords.slice(0, 3).join(', ')}.`
      });
    }
  }

  // Determine overall status
  let overallStatus = 'insufficient_evidence';
  let reasoning = '';

  const total = criteria.length;
  const demoCount = demonstrated.length;

  if (demoCount === total && total > 0) {
    overallStatus = 'demonstrated';
    reasoning = `Candidate successfully satisfied all ${total} rubric criteria with concrete technical explanations and evidence.`;
  } else if (demoCount > 0) {
    overallStatus = 'partially_demonstrated';
    reasoning = `Candidate demonstrated ${demoCount} of ${total} criteria (${demonstrated.map(d => d.name).join('; ')}), but left ${uncertain.length} criteria unresolved (${uncertain.map(u => u.name).join('; ')}).`;
  } else {
    overallStatus = 'insufficient_evidence';
    reasoning = `Response failed to demonstrate sufficient technical evidence across the ${total} defined rubric criteria.`;
  }

  return {
    evaluation_status: overallStatus,
    criteria_demonstrated: demonstrated,
    criteria_uncertain: uncertain,
    supporting_excerpts: excerpts,
    evaluation_reasoning: reasoning,
    evaluator_type: 'deterministic_rubric_engine'
  };
}

module.exports = {
  evaluateResponseRubric,
  extractSupportingExcerpt
};
