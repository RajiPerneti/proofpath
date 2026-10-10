const { test, describe } = require('node:test');
const assert = require('node:assert');
const { computeCompetencyCoverage, selectNextAdaptiveQuestion } = require('../../src/engine/adaptiveEngine');

describe('Adaptive Engine Unit Tests', () => {
  const competencies = [
    {
      id: 'comp_algo',
      name: 'Data Structures & Algorithmic Complexity',
      weight: 1.2
    },
    {
      id: 'comp_concurrency',
      name: 'Concurrency & Asynchronous I/O',
      weight: 1.1
    },
    {
      id: 'comp_arch',
      name: 'System Architecture & Scalability',
      weight: 1.3
    }
  ];

  const questionBank = [
    {
      id: 'q_algo_initial',
      competency_id: 'comp_algo',
      title: 'LRU Cache Design',
      is_initial: 1,
      follow_up_triggers: JSON.stringify({
        on_missing: {
          crit_time_complexity: 'q_algo_complexity_drilldown'
        },
        on_demonstrated: {
          all: 'q_concurrency_initial'
        }
      })
    },
    {
      id: 'q_algo_complexity_drilldown',
      competency_id: 'comp_algo',
      title: 'Algorithmic Complexity Drilldown',
      is_initial: 0
    },
    {
      id: 'q_concurrency_initial',
      competency_id: 'comp_concurrency',
      title: 'Async Event Loop & Concurrency',
      is_initial: 1
    },
    {
      id: 'q_arch_initial',
      competency_id: 'comp_arch',
      title: 'High-Throughput Ingestion Architecture',
      is_initial: 1
    }
  ];

  test('Path A: Partial demonstration with missing time complexity triggers targeted follow-up', () => {
    const lastQuestion = questionBank[0]; // q_algo_initial
    const lastEvaluation = {
      evaluation_status: 'partially_demonstrated',
      criteria_demonstrated: [{ id: 'crit_hash_doubly_linked', name: 'Hash Map + Linked List' }],
      criteria_uncertain: [{ id: 'crit_time_complexity', name: 'Rigorous O(1) Asymptotic Analysis' }]
    };

    const decision = selectNextAdaptiveQuestion({
      lastQuestion,
      lastEvaluation,
      events: [],
      competencies,
      availableQuestions: questionBank,
      maxQuestions: 5
    });

    assert.strictEqual(decision.action, 'proceed');
    assert.strictEqual(decision.selected_question_id, 'q_algo_complexity_drilldown');
    assert.strictEqual(decision.decision_rule, 'RULE_TARGETED_GAP_FOLLOW_UP');
    assert.strictEqual(decision.decision_rationale.includes('Rigorous O(1) Asymptotic Analysis'), true);
  });

  test('Path B: Demonstrated response branches to broaden coverage to next high-priority competency', () => {
    const lastQuestion = questionBank[0]; // q_algo_initial
    const lastEvaluation = {
      evaluation_status: 'demonstrated',
      criteria_demonstrated: [
        { id: 'crit_hash_doubly_linked', name: 'Hash Map + Linked List' },
        { id: 'crit_time_complexity', name: 'Rigorous O(1) Asymptotic Analysis' }
      ],
      criteria_uncertain: []
    };

    const decision = selectNextAdaptiveQuestion({
      lastQuestion,
      lastEvaluation,
      events: [],
      competencies,
      availableQuestions: questionBank,
      maxQuestions: 5
    });

    assert.strictEqual(decision.action, 'proceed');
    // Because comp_arch has higher weight (1.3) than comp_concurrency (1.1), it prioritizes comp_arch!
    assert.strictEqual(decision.target_competency_id, 'comp_arch');
    assert.strictEqual(decision.selected_question_id, 'q_arch_initial');
    assert.strictEqual(decision.decision_rule, 'RULE_BROADEN_COVERAGE_HIGH_PRIORITY');
    assert.strictEqual(decision.alternatives_considered.length > 0, true);
  });

  test('Avoid repeats: never re-selects an already asked question', () => {
    const events = [
      { question_id: 'q_algo_initial', competency_id: 'comp_algo', evaluation_status: 'demonstrated' },
      { question_id: 'q_arch_initial', competency_id: 'comp_arch', evaluation_status: 'demonstrated' }
    ];

    const decision = selectNextAdaptiveQuestion({
      lastQuestion: questionBank[3], // q_arch_initial
      lastEvaluation: { evaluation_status: 'demonstrated', criteria_demonstrated: [], criteria_uncertain: [] },
      events,
      competencies,
      availableQuestions: questionBank,
      maxQuestions: 5
    });

    assert.strictEqual(decision.action, 'proceed');
    // Only comp_concurrency is left unassessed
    assert.strictEqual(decision.selected_question_id, 'q_concurrency_initial');
  });

  test('Termination: Stops when maxQuestions limit is reached', () => {
    const events = [
      { question_id: 'q_algo_initial', competency_id: 'comp_algo', evaluation_status: 'demonstrated' },
      { question_id: 'q_arch_initial', competency_id: 'comp_arch', evaluation_status: 'demonstrated' },
      { question_id: 'q_concurrency_initial', competency_id: 'comp_concurrency', evaluation_status: 'demonstrated' }
    ];

    const decision = selectNextAdaptiveQuestion({
      lastQuestion: questionBank[2],
      lastEvaluation: { evaluation_status: 'demonstrated', criteria_demonstrated: [], criteria_uncertain: [] },
      events,
      competencies,
      availableQuestions: questionBank,
      maxQuestions: 3 // max limit reached!
    });

    assert.strictEqual(decision.action, 'conclude');
    assert.strictEqual(decision.decision_rule, 'RULE_MAX_QUESTIONS_REACHED');
  });

  test('Competency coverage calculation updates correctly', () => {
    const events = [
      { competency_id: 'comp_algo', evaluation_status: 'demonstrated' },
      { competency_id: 'comp_concurrency', evaluation_status: 'partially_demonstrated' }
    ];

    const coverage = computeCompetencyCoverage(competencies, events);
    const algoComp = coverage.find(c => c.id === 'comp_algo');
    const concComp = coverage.find(c => c.id === 'comp_concurrency');
    const archComp = coverage.find(c => c.id === 'comp_arch');

    assert.strictEqual(algoComp.current_status, 'demonstrated');
    assert.strictEqual(algoComp.times_assessed, 1);
    assert.strictEqual(concComp.current_status, 'partially_demonstrated');
    assert.strictEqual(concComp.times_assessed, 1);
    assert.strictEqual(archComp.current_status, 'not_assessed');
    assert.strictEqual(archComp.times_assessed, 0);
  });
});
