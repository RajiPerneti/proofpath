const { test, describe } = require('node:test');
const assert = require('node:assert');
const { User, Assessment } = require('../../src/models');

describe('Step 1 Verification: User & Assessment Models', () => {
  test('User model hashes password and compares correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await User.hashPassword(rawPassword);

    assert.ok(hash, 'Hash should be generated');
    assert.notStrictEqual(hash, rawPassword, 'Hash should not match raw password');

    const user = new User({
      id: 'usr_test123',
      name: 'Test Candidate',
      email: 'candidate@proofpath.io',
      password_hash: hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    assert.strictEqual(user.role, 'user', 'Default role must strictly be user');

    const isValid = await user.comparePassword(rawPassword);
    assert.strictEqual(isValid, true, 'comparePassword should return true for correct password');

    const isInvalid = await user.comparePassword('WrongPassword');
    assert.strictEqual(isInvalid, false, 'comparePassword should return false for incorrect password');
  });

  test('User model validates email format', () => {
    const userBadEmail = new User({
      id: 'usr_test456',
      name: 'Bad Email User',
      email: 'not-an-email',
      password_hash: 'somehash',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const error = userBadEmail.validateSync();
    assert.ok(error, 'Validation error should be thrown for malformed email');
    assert.ok(error.errors.email, 'Error on email field expected');
  });

  test('Assessment model supports user_id and resume fields with null defaults', () => {
    const assessment = new Assessment({
      id: 'asmt_test_fields',
      title: 'Backend Test',
      job_title: 'Backend Engineer',
      job_description: 'Test job description',
      candidate_name: 'Test Candidate',
      candidate_profile: 'Test Profile',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    assert.strictEqual(assessment.user_id, null, 'user_id should default to null for legacy compatibility');
    assert.strictEqual(assessment.resume_filename, null, 'resume_filename should default to null');
    assert.strictEqual(assessment.resume_text, null, 'resume_text should default to null');
  });

  test('Database connection strictly uses MONGODB_TEST_URI or proofpath_test in test mode, never MONGODB_URI', () => {
    const { getMongoUri } = require('../../src/db/connection');
    const origNodeEnv = process.env.NODE_ENV;
    const origMongoUri = process.env.MONGODB_URI;
    const origTestUri = process.env.MONGODB_TEST_URI;

    try {
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_URI = 'mongodb://production-cluster:27017/production_proofpath';
      delete process.env.MONGODB_TEST_URI;

      // In test mode without MONGODB_TEST_URI, must resolve to proofpath_test and NEVER production MONGODB_URI
      const resolvedDefaultTest = getMongoUri();
      assert.strictEqual(resolvedDefaultTest, 'mongodb://127.0.0.1:27017/proofpath_test');
      assert.notStrictEqual(resolvedDefaultTest, process.env.MONGODB_URI);

      // In test mode with explicit MONGODB_TEST_URI, must resolve to that test URI
      process.env.MONGODB_TEST_URI = 'mongodb://isolated-test-cluster:27017/custom_test_db';
      const resolvedExplicitTest = getMongoUri();
      assert.strictEqual(resolvedExplicitTest, 'mongodb://isolated-test-cluster:27017/custom_test_db');
      assert.notStrictEqual(resolvedExplicitTest, process.env.MONGODB_URI);
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      if (origMongoUri !== undefined) process.env.MONGODB_URI = origMongoUri; else delete process.env.MONGODB_URI;
      if (origTestUri !== undefined) process.env.MONGODB_TEST_URI = origTestUri; else delete process.env.MONGODB_TEST_URI;
    }
  });
});
