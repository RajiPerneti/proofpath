// Gemini AI Service: Integration with Google Gemini with transparent deterministic fallback

const { evaluateResponseRubric } = require('../engine/rubricEvaluator');

/**
 * Checks if Gemini API credentials are available
 */
function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 10 && !key.includes('your_api_key'));
}

/**
 * Evaluates response using Gemini if configured, otherwise uses deterministic rubric evaluator.
 * @param {Object} question - Question object with rubric_criteria
 * @param {string} responseText - Candidate response
 * @returns {Promise<Object>} Structured evaluation report
 */
async function evaluateWithAiOrFallback(question, responseText) {
  if (!isGeminiConfigured()) {
    // Transparent deterministic fallback
    return evaluateResponseRubric(question, responseText);
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const criteria = typeof question.rubric_criteria === 'string'
    ? JSON.parse(question.rubric_criteria)
    : (question.rubric_criteria || []);

  const systemInstruction = `You are ProofPath's Evidence Evaluation Engine.
Your task is to evaluate technical candidate responses STRICTLY against the provided rubric criteria.
Rules:
1. Base your evaluation solely on what the candidate explicitly demonstrated or explained.
2. DO NOT judge honesty, emotion, confidence, tone, personality, or non-technical traits.
3. For each demonstrated criterion, extract an EXACT quote/excerpt from the candidate's answer as evidence.
4. For unresolved criteria, explicitly state what technical details are missing.
5. Allowed statuses: "demonstrated", "partially_demonstrated", "insufficient_evidence".
6. Respond with pure JSON matching this exact structure:
{
  "evaluation_status": "demonstrated" | "partially_demonstrated" | "insufficient_evidence",
  "criteria_demonstrated": [{"id": "crit_id", "name": "Crit Name", "supportingExcerpt": "exact quote from answer"}],
  "criteria_uncertain": [{"id": "crit_id", "name": "Crit Name", "missingReason": "explanation of what is missing"}],
  "supporting_excerpts": ["quote 1", "quote 2"],
  "evaluation_reasoning": "Clear factual explanation of the assigned evaluation status"
}`;

  const prompt = `Question Title: ${question.title}
Question Prompt: ${question.prompt}

Rubric Criteria:
${JSON.stringify(criteria, null, 2)}

Candidate Response:
"${responseText}"

Evaluate against the rubric and return strictly valid JSON:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemInstruction + '\n\n' + prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Falling back to deterministic engine.`);
      return evaluateResponseRubric(question, responseText);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return evaluateResponseRubric(question, responseText);
    }

    const parsed = JSON.parse(rawText);

    // Validate required fields
    if (!['demonstrated', 'partially_demonstrated', 'insufficient_evidence'].includes(parsed.evaluation_status)) {
      return evaluateResponseRubric(question, responseText);
    }

    return {
      evaluation_status: parsed.evaluation_status,
      criteria_demonstrated: Array.isArray(parsed.criteria_demonstrated) ? parsed.criteria_demonstrated : [],
      criteria_uncertain: Array.isArray(parsed.criteria_uncertain) ? parsed.criteria_uncertain : [],
      supporting_excerpts: Array.isArray(parsed.supporting_excerpts) ? parsed.supporting_excerpts : [],
      evaluation_reasoning: parsed.evaluation_reasoning || 'Evaluated via Gemini Live Engine.',
      evaluator_type: 'gemini_live'
    };
  } catch (error) {
    console.warn(`Gemini evaluation failed (${error.message}). Falling back to deterministic engine.`);
    return evaluateResponseRubric(question, responseText);
  }
}

module.exports = {
  isGeminiConfigured,
  evaluateWithAiOrFallback
};
