const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');

const app = require('../../src/app');
const { connectDb, closeDb } = require('../../src/db/connection');
const { Assessment } = require('../../src/models');

describe('ProofPath End-to-End API Integration Tests (MongoDB)', () => {
  let server;
  let baseUrl;
  let authToken;
  let createdAssessmentId;
  let firstQuestionId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    // Connect to MongoDB
    await connectDb();

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

    // Clean up old test user if exists and register a fresh test user
    const { User } = require('../../src/models');
    await User.deleteOne({ email: 'flowtest@flow-test.proofpath.io' });

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Flow Test User',
        email: 'flowtest@flow-test.proofpath.io',
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    authToken = regData.token;
  });

  after(async () => {
    const { User } = require('../../src/models');
    await User.deleteOne({ email: 'flowtest@flow-test.proofpath.io' });

    // Clean up test assessment if created
    if (createdAssessmentId) {
      await Assessment.deleteOne({ id: createdAssessmentId });
    }

    await new Promise((resolve) => {
      server.close(async () => {
        await closeDb();
        resolve();
      });
    });
  });

  test('1. Health check returns active status and MongoDB connection', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.database.type, 'MongoDB');
    assert.strictEqual(data.database.status, 'connected');
    assert.ok(data.aiEngine);
  });

  test('2. POST /assessments creates a new assessment and writes directly to MongoDB', async () => {
    const payload = {
      jobTitle: 'Senior Backend Engineer',
      jobDescription: 'High performance microservices in Python',
      candidateName: 'Jane Developer',
      candidateProfile: '4 years backend experience',
      templateId: 'backend-systems-engineer',
      maxQuestions: 4
    };

    const res = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.assessmentId);
    assert.ok(data.initialQuestionId);
    createdAssessmentId = data.assessmentId;
    firstQuestionId = data.initialQuestionId;

    // Verify document directly in MongoDB collection
    const mongoDoc = await Assessment.findOne({ id: createdAssessmentId }).lean();
    assert.ok(mongoDoc, 'Assessment document must exist in MongoDB');
    assert.strictEqual(mongoDoc.candidate_name, 'Jane Developer');
    assert.strictEqual(mongoDoc.job_title, 'Senior Backend Engineer');
  });

  test('3. GET /assessments/:id retrieves assessment state from MongoDB', async () => {
    const res = await fetch(`${baseUrl}/assessments/${createdAssessmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.assessment.candidate_name, 'Jane Developer');
    assert.strictEqual(data.competencies.length >= 3, true);
    assert.strictEqual(data.currentQuestion.id, firstQuestionId);
  });

  test('4. POST /assessments/:id/submit evaluates response and executes adaptive decision', async () => {
    // Provide an answer with hash map + doubly linked list, but missing explicit time complexity (triggers Path A)
    const responseText = 'We should use a hash map with a doubly linked list to store keys and maintain the ordering of elements with pointers.';

    const res = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        responseText,
        questionId: firstQuestionId
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.evaluation.evaluation_status, 'partially_demonstrated');
    assert.ok(data.decision.decision_rule);
    assert.ok(data.nextQuestion);
    // Next question should be targeted follow-up on algorithmic complexity
    assert.strictEqual(data.decision.decision_rule, 'RULE_TARGETED_GAP_FOLLOW_UP');
  });

  test('5. GET /assessments/:id/events retrieves evidence ledger and timeline', async () => {
    const res = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/events`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.events.length, 1);
    assert.strictEqual(data.events[0].evaluation_status, 'partially_demonstrated');
    assert.ok(data.events[0].criteria_demonstrated.length > 0);
  });

  test('6. POST /assessments/:id/run-code runs Python test cases safely', async () => {
    const validPythonLRU = `
class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_to_head(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.value = value
            self._remove(node)
            self._add_to_head(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_to_head(new_node)
`;

    const runRes = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/run-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        code: validPythonLRU,
        questionId: firstQuestionId
      })
    });

    assert.strictEqual(runRes.status, 200);
    const runData = await runRes.json();
    assert.ok(runData.runResult);
  });

  test('7. GET /assessments/:id/report compiles final assessment report', async () => {
    const res = await fetch(`${baseUrl}/assessments/${createdAssessmentId}/report`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.report.summary);
    assert.ok(data.report.limitations_disclosure);
    assert.ok(Array.isArray(data.report.verified_evidence));
  });

  test('8. DELETE /assessments/:id deletes the assessment from MongoDB', async () => {
    const res = await fetch(`${baseUrl}/assessments/${createdAssessmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);

    const getRes = await fetch(`${baseUrl}/assessments/${createdAssessmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(getRes.status, 404);

    // Verify it is also gone from MongoDB collection
    const mongoDoc = await Assessment.findOne({ id: createdAssessmentId }).lean();
    assert.strictEqual(mongoDoc, null, 'Assessment must be removed from MongoDB');
    createdAssessmentId = null;
  });
});
