const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const app = require('../../src/app');
const { connectDb, closeDb } = require('../../src/db/connection');
const { User } = require('../../src/models');

describe('Resume Parser Endpoint Tests (POST /api/resumes/parse)', () => {
  let server;
  let baseUrl;
  let authToken;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDb();

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });

    const userEmail = 'resumetest@resume-test.proofpath.io';
    await User.deleteOne({ email: userEmail });

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Resume Test Candidate',
        email: userEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    authToken = regData.token;
  });

  after(async () => {
    await User.deleteOne({ email: 'resumetest@resume-test.proofpath.io' });
    await new Promise((resolve) => {
      server.close(async () => {
        await closeDb();
        resolve();
      });
    });
  });

  test('1. Rejects unauthenticated upload with 401 Unauthorized', async () => {
    const formData = new FormData();
    const blob = new Blob(['Alex Developer - 5 years of Python'], { type: 'text/plain' });
    formData.append('resume', blob, 'resume.txt');

    const res = await fetch(`${baseUrl}/resumes/parse`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 401);
  });

  test('2. Successfully parses text/plain resume with authentication', async () => {
    const resumeContent = 'Jane Developer\nSkills: Python, Django, PostgreSQL, Docker\nExperience: 4 years backend development.';
    const formData = new FormData();
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    formData.append('resume', blob, 'candidate_resume.txt');

    const res = await fetch(`${baseUrl}/resumes/parse`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.filename, 'candidate_resume.txt');
    assert.ok(data.text.includes('Python, Django, PostgreSQL'));
    assert.ok(data.wordCount > 5);
  });

  test('2b. Successfully parses application/pdf resume with authentication', async () => {
    const validPdf =
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Senior Software Engineer Resume) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000323 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n417\n%%EOF';

    const formData = new FormData();
    const blob = new Blob([Buffer.from(validPdf)], { type: 'application/pdf' });
    formData.append('resume', blob, 'resume_sample.pdf');

    const res = await fetch(`${baseUrl}/resumes/parse`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.filename, 'resume_sample.pdf');
    assert.ok(data.text.includes('Senior Software Engineer Resume'));
    assert.ok(data.wordCount >= 4);
  });

  test('3. Rejects unsupported file extensions (e.g. .exe or .png) with 400 Bad Request', async () => {
    const formData = new FormData();
    const blob = new Blob(['not an allowed document'], { type: 'image/png' });
    formData.append('resume', blob, 'malicious.png');

    const res = await fetch(`${baseUrl}/resumes/parse`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('Only PDF and TXT'));
  });

  test('4. Rejects resume files exceeding the 5MB size limit with 400 Bad Request', async () => {
    const largeBuffer = new Uint8Array(5.2 * 1024 * 1024); // 5.2MB
    const formData = new FormData();
    const blob = new Blob([largeBuffer], { type: 'text/plain' });
    formData.append('resume', blob, 'oversized_resume.txt');

    const res = await fetch(`${baseUrl}/resumes/parse`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('5MB size limit'));
  });

  test('5. Persists resume metadata to assessment and protects resume data from cross-user access', async () => {
    const { Assessment } = require('../../src/models');
    // Create assessment with resume
    const createRes = await fetch(`${baseUrl}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        jobTitle: 'Distributed Systems Architect',
        candidateName: 'Jane Developer',
        candidateProfile: 'Senior Architect with high-throughput distributed systems experience',
        resumeFilename: 'candidate_resume.txt',
        resumeText: 'Jane Developer - 6 years Distributed Systems, Kafka, Go, Python'
      })
    });

    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    const assessmentId = createData.assessmentId;

    // Retrieve as owner
    const ownerRes = await fetch(`${baseUrl}/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(ownerRes.status, 200);
    const ownerData = await ownerRes.json();
    assert.strictEqual(ownerData.assessment.resume_filename, 'candidate_resume.txt');
    assert.ok(ownerData.assessment.resume_text.includes('Jane Developer'));

    // Register a second user
    const otherEmail = 'otheruser@resume-test.proofpath.io';
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Candidate',
        email: otherEmail,
        password: 'Password123!'
      })
    });
    const regData2 = await regRes2.json();
    const otherToken = regData2.token;

    // Attempt access as second user - must be 403 Forbidden
    const otherRes = await fetch(`${baseUrl}/assessments/${assessmentId}`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    assert.strictEqual(otherRes.status, 403);

    // Clean up
    await Assessment.deleteOne({ id: assessmentId });
    await User.deleteOne({ email: otherEmail });
  });
});
