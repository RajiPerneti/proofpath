const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const app = require('../../src/app');
const { connectDb, closeDb } = require('../../src/db/connection');
const { User, Assessment, Competency, Question, AssessmentEvent } = require('../../src/models');

describe('Step 2: Authentication & Assessment Ownership Integration Tests', () => {
  let server;
  let baseUrl;

  let userAToken;
  let userAId;
  let userBToken;
  let userBId;
  let assessmentAId;
  let legacyAssessmentId;

  before(async () => {
    // Explicitly set NODE_ENV to test to verify test db isolation
    process.env.NODE_ENV = 'test';
    await connectDb();

    // Clean up test collections in proofpath_test
    await Promise.all([
      User.deleteMany({ email: { $regex: /@auth-test\.proofpath\.io$/i } }),
      Assessment.deleteMany({ id: { $regex: /^asmt_test_/ } })
    ]);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    // Clean up created test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /@auth-test\.proofpath\.io$/i } }),
      Assessment.deleteMany({ id: { $regex: /^asmt_test_/ } }),
      assessmentAId ? Assessment.deleteOne({ id: assessmentAId }) : Promise.resolve(),
      legacyAssessmentId ? Assessment.deleteOne({ id: legacyAssessmentId }) : Promise.resolve()
    ]);

    await new Promise((resolve) => {
      server.close(async () => {
        await closeDb();
        resolve();
      });
    });
  });

  test('1. Public endpoints (health, templates) remain accessible without authentication', async () => {
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');

    const tmplRes = await fetch(`${baseUrl}/templates`);
    assert.strictEqual(tmplRes.status, 200);
    const tmplData = await tmplRes.json();
    assert.ok(Array.isArray(tmplData.templates));
    assert.ok(tmplData.templates.length > 0);
  });

  test('2. POST /auth/register creates a user with default role "user", preventing privilege escalation', async () => {
    const payload = {
      name: 'Alice Developer',
      email: 'alice@auth-test.proofpath.io',
      password: 'Password123!',
      role: 'admin' // Attempting privilege escalation
    };

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.token, 'Token must be issued');
    assert.strictEqual(data.user.email, 'alice@auth-test.proofpath.io');
    assert.strictEqual(data.user.role, 'user', 'Role must strictly remain user, ignoring payload admin');

    userAToken = data.token;
    userAId = data.user.id;
  });

  test('3. POST /auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Duplicate',
        email: 'alice@auth-test.proofpath.io',
        password: 'AnotherPassword123!'
      })
    });

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes('already exists'));
  });

  test('4. POST /auth/login validates credentials and issues JWT token', async () => {
    // Valid login
    const validRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@auth-test.proofpath.io',
        password: 'Password123!'
      })
    });
    assert.strictEqual(validRes.status, 200);
    const validData = await validRes.json();
    assert.ok(validData.token);
    assert.strictEqual(validData.user.id, userAId);

    // Invalid password
    const invalidRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@auth-test.proofpath.io',
        password: 'WrongPassword!'
      })
    });
    assert.strictEqual(invalidRes.status, 401);

    // Non-existent user
    const nonExistentRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@auth-test.proofpath.io',
        password: 'Password123!'
      })
    });
    assert.strictEqual(nonExistentRes.status, 401);
  });

  test('5. GET /auth/me returns authenticated user profile or 401 if unauthenticated', async () => {
    // Without token
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(unauthRes.status, 401);

    // With token
    const authRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(authRes.status, 200);
    const data = await authRes.json();
    assert.strictEqual(data.user.id, userAId);
    assert.strictEqual(data.user.email, 'alice@auth-test.proofpath.io');
  });

  test('6. Unauthenticated requests to assessment endpoints are rejected with 401', async () => {
    const listRes = await fetch(`${baseUrl}/assessments`);
    assert.strictEqual(listRes.status, 401);

    const createRes = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: 'Backend Engineer',
        candidateName: 'Test Candidate'
      })
    });
    assert.strictEqual(createRes.status, 401);
  });

  test('7. Authenticated User A creates Assessment A: tagged with User A ID', async () => {
    const res = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`
      },
      body: JSON.stringify({
        jobTitle: 'Senior Systems Architect',
        jobDescription: 'Distributed systems design in Python',
        candidateName: 'Candidate One',
        candidateProfile: 'Senior engineer',
        templateId: 'backend-systems-engineer',
        maxQuestions: 5
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.assessmentId);
    assessmentAId = data.assessmentId;

    // Verify stored document has user_id set to userAId
    const stored = await Assessment.findOne({ id: assessmentAId }).lean();
    assert.strictEqual(stored.user_id, userAId, 'Stored assessment must be owned by User A');
  });

  test('8. Register User B and verify cross-user access denial to Assessment A', async () => {
    // Register User B
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Candidate',
        email: 'bob@auth-test.proofpath.io',
        password: 'Password456!'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    userBToken = regData.token;
    userBId = regData.user.id;

    // User A can access Assessment A
    const userAAccess = await fetch(`${baseUrl}/assessments/${assessmentAId}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(userAAccess.status, 200);

    // User B CANNOT access Assessment A (403 Forbidden)
    const userBAccess = await fetch(`${baseUrl}/assessments/${assessmentAId}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(userBAccess.status, 403, 'User B must be denied access to User A assessment');

    // User B CANNOT submit answer to Assessment A (403 Forbidden)
    const userBSubmit = await fetch(`${baseUrl}/assessments/${assessmentAId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`
      },
      body: JSON.stringify({
        responseText: 'Hacking attempt answer',
        questionId: 'q_fake'
      })
    });
    assert.strictEqual(userBSubmit.status, 403, 'User B submit must be rejected with 403');

    // User B CANNOT view report of Assessment A (403 Forbidden)
    const userBReport = await fetch(`${baseUrl}/assessments/${assessmentAId}/report`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(userBReport.status, 403, 'User B report view must be rejected with 403');

    // User B CANNOT delete Assessment A (403 Forbidden)
    const userBDelete = await fetch(`${baseUrl}/assessments/${assessmentAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(userBDelete.status, 403, 'User B delete must be rejected with 403');
  });

  test('9. User B listing GET /assessments only returns assessments owned by User B, not User A', async () => {
    // User A should see Assessment A
    const userAList = await fetch(`${baseUrl}/assessments`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(userAList.status, 200);
    const userAData = await userAList.json();
    assert.ok(userAData.assessments.some(a => a.id === assessmentAId));

    // User B should NOT see Assessment A
    const userBList = await fetch(`${baseUrl}/assessments`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    assert.strictEqual(userBList.status, 200);
    const userBData = await userBList.json();
    assert.strictEqual(userBData.assessments.length, 0, 'User B should see 0 assessments');
  });

  test('10. Unassigned legacy assessments (user_id: null) are not exposed to normal users', async () => {
    // Create an unassigned legacy assessment directly in DB
    legacyAssessmentId = 'asmt_test_legacy_123';
    await Assessment.create({
      id: legacyAssessmentId,
      user_id: null,
      title: 'Legacy Assessment Without Owner',
      job_title: 'Legacy Engineer',
      job_description: 'Legacy description',
      candidate_name: 'Legacy Candidate',
      candidate_profile: 'Legacy profile',
      status: 'in_progress',
      max_questions: 5,
      current_question_index: 0,
      ai_mode: 'deterministic_demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Neither User A nor User B can directly access the legacy assessment
    const resA = await fetch(`${baseUrl}/assessments/${legacyAssessmentId}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert.strictEqual(resA.status, 403, 'User A should receive 403 on unassigned legacy assessment');

    // Legacy assessment is not returned in User A or User B assessment lists
    const listA = await fetch(`${baseUrl}/assessments`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const listAData = await listA.json();
    assert.ok(!listAData.assessments.some(a => a.id === legacyAssessmentId));
  });
});
