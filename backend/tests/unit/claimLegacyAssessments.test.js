const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { connectDb, closeDb } = require('../../src/db/connection');
const { User, Assessment } = require('../../src/models');
const { claimLegacyAssessments } = require('../../src/scripts/claimLegacyAssessments');

describe('Legacy Assessment Claim CLI Tests', () => {
  let adminUser;
  let regularUser;
  let targetUser;
  let legacyAsmtId = 'asmt_legacy_test_001';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDb();

    // Create test accounts
    const now = new Date().toISOString();
    const adminPasswordHash = await User.hashPassword('AdminPassword123!');
    const userPasswordHash = await User.hashPassword('UserPassword123!');

    await Promise.all([
      User.deleteMany({ email: { $regex: /@cli-test\.proofpath\.io$/i } }),
      Assessment.deleteOne({ id: legacyAsmtId })
    ]);

    adminUser = await User.create({
      id: 'usr_admin_cli',
      name: 'Admin Boss',
      email: 'admin@cli-test.proofpath.io',
      password_hash: adminPasswordHash,
      role: 'admin',
      created_at: now,
      updated_at: now
    });

    regularUser = await User.create({
      id: 'usr_regular_cli',
      name: 'Regular Guy',
      email: 'regular@cli-test.proofpath.io',
      password_hash: userPasswordHash,
      role: 'user',
      created_at: now,
      updated_at: now
    });

    targetUser = await User.create({
      id: 'usr_target_cli',
      name: 'Target Recipient',
      email: 'target@cli-test.proofpath.io',
      password_hash: userPasswordHash,
      role: 'user',
      created_at: now,
      updated_at: now
    });

    // Create unassigned legacy assessment
    await Assessment.create({
      id: legacyAsmtId,
      user_id: null,
      title: 'Legacy Python Assessment',
      job_title: 'Python Developer',
      job_description: 'Backend Python service development',
      candidate_name: 'Legacy Applicant',
      candidate_profile: '5 years Python experience',
      status: 'in_progress',
      max_questions: 5,
      current_question_index: 0,
      ai_mode: 'deterministic_demo',
      created_at: now,
      updated_at: now
    });
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@cli-test\.proofpath\.io$/i } }),
      Assessment.deleteOne({ id: legacyAsmtId })
    ]);
    await closeDb();
  });

  test('1. Fails when a non-admin attempts to claim legacy assessments', async () => {
    await assert.rejects(
      claimLegacyAssessments({
        adminEmail: regularUser.email,
        adminPassword: 'UserPassword123!',
        targetUserEmail: targetUser.email,
        assessmentId: legacyAsmtId,
        dryRun: true
      }),
      /Authorization failed: User "regular@cli-test\.proofpath\.io" has role "user", but role "admin" is required/
    );
  });

  test('2. Fails when admin password is invalid', async () => {
    await assert.rejects(
      claimLegacyAssessments({
        adminEmail: adminUser.email,
        adminPassword: 'WrongPassword!',
        targetUserEmail: targetUser.email,
        assessmentId: legacyAsmtId,
        dryRun: true
      }),
      /Authentication failed: Invalid admin password/
    );
  });

  test('3. Fails when target user email does not exist', async () => {
    await assert.rejects(
      claimLegacyAssessments({
        adminEmail: adminUser.email,
        adminPassword: 'AdminPassword123!',
        targetUserEmail: 'ghost@cli-test.proofpath.io',
        assessmentId: legacyAsmtId,
        dryRun: true
      }),
      /Target user not found for email/
    );
  });

  test('4. Dry run preview returns eligible assessments without modifying the database', async () => {
    const preview = await claimLegacyAssessments({
      adminEmail: adminUser.email,
      adminPassword: 'AdminPassword123!',
      targetUserEmail: targetUser.email,
      assessmentId: legacyAsmtId,
      dryRun: true
    });

    assert.strictEqual(preview.success, true);
    assert.strictEqual(preview.dryRun, true);
    assert.strictEqual(preview.count, 1);
    assert.strictEqual(preview.preview[0].id, legacyAsmtId);

    // Verify still unassigned in DB
    const doc = await Assessment.findOne({ id: legacyAsmtId }).lean();
    assert.strictEqual(doc.user_id, null, 'Must still be null after dry run');
  });

  test('5. Rejects execution when confirmed flag is not provided', async () => {
    await assert.rejects(
      claimLegacyAssessments({
        adminEmail: adminUser.email,
        adminPassword: 'AdminPassword123!',
        targetUserEmail: targetUser.email,
        assessmentId: legacyAsmtId,
        dryRun: false,
        confirmed: false
      }),
      /Explicit confirmation is required/
    );
  });

  test('6. Successfully claims legacy assessment when admin credentials and confirmation are provided', async () => {
    const result = await claimLegacyAssessments({
      adminEmail: adminUser.email,
      adminPassword: 'AdminPassword123!',
      targetUserEmail: targetUser.email,
      assessmentId: legacyAsmtId,
      dryRun: false,
      confirmed: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.modifiedCount, 1);

    // Verify ownership in DB is now updated to targetUser.id
    const updated = await Assessment.findOne({ id: legacyAsmtId }).lean();
    assert.strictEqual(updated.user_id, targetUser.id, 'user_id must now be targetUser.id');
  });

  test('7. Fails when attempting to claim an assessment that is already owned by a user', async () => {
    await assert.rejects(
      claimLegacyAssessments({
        adminEmail: adminUser.email,
        adminPassword: 'AdminPassword123!',
        targetUserEmail: regularUser.email,
        assessmentId: legacyAsmtId,
        dryRun: true
      }),
      /Cannot claim owned assessment/
    );
  });
});
