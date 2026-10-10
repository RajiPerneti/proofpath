const { test, describe } = require('node:test');
const assert = require('node:assert');
const { evaluateResponseRubric } = require('../../src/engine/rubricEvaluator');

describe('Rubric Evaluator Unit Tests', () => {
  const sampleQuestion = {
    id: 'q_test_lru',
    title: 'LRU Cache Design',
    rubric_criteria: JSON.stringify([
      {
        id: 'crit_hash_doubly_linked',
        name: 'Dual Structure Synergy (Hash Map + Doubly Linked List)',
        keywords: ['hash map', 'doubly linked list', 'pointers']
      },
      {
        id: 'crit_time_complexity',
        name: 'Rigorous O(1) Asymptotic Analysis',
        keywords: ['o(1)', 'constant time', 'time complexity']
      }
    ])
  };

  test('Fully demonstrated: matches all criteria and extracts excerpts', () => {
    const candidateAnswer = 'To build an LRU cache with O(1) time complexity, I will combine a hash map with a doubly linked list. The hash map allows constant time key lookups, while the doubly linked list nodes maintain the eviction order with prev and next pointers.';

    const result = evaluateResponseRubric(sampleQuestion, candidateAnswer);

    assert.strictEqual(result.evaluation_status, 'demonstrated');
    assert.strictEqual(result.criteria_demonstrated.length, 2);
    assert.strictEqual(result.criteria_uncertain.length, 0);
    assert.strictEqual(result.supporting_excerpts.length >= 1, true);
    assert.strictEqual(result.evaluator_type, 'deterministic_rubric_engine');
  });

  test('Partially demonstrated: demonstrates data structure but omits complexity analysis', () => {
    const candidateAnswer = 'I would use a hash map with a doubly linked list to hold the cached items and update node pointers when items are accessed.';

    const result = evaluateResponseRubric(sampleQuestion, candidateAnswer);

    assert.strictEqual(result.evaluation_status, 'partially_demonstrated');
    assert.strictEqual(result.criteria_demonstrated.length, 1);
    assert.strictEqual(result.criteria_demonstrated[0].id, 'crit_hash_doubly_linked');
    assert.strictEqual(result.criteria_uncertain.length, 1);
    assert.strictEqual(result.criteria_uncertain[0].id, 'crit_time_complexity');
  });

  test('Insufficient evidence: empty or trivial response is caught', () => {
    const trivialAnswer = 'Use cache.';

    const result = evaluateResponseRubric(sampleQuestion, trivialAnswer);

    assert.strictEqual(result.evaluation_status, 'insufficient_evidence');
    assert.strictEqual(result.criteria_demonstrated.length, 0);
    assert.strictEqual(result.criteria_uncertain.length, 2);
  });
});
