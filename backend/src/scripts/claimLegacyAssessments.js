const readline = require('readline');
const { connectDb, closeDb } = require('../db/connection');
const { User, Assessment } = require('../models');

/**
 * Claims unassigned legacy assessments on behalf of an administrator.
 *
 * @param {Object} options
 * @param {string} options.adminEmail
 * @param {string} options.adminPassword
 * @param {string} options.targetUserEmail
 * @param {string} [options.assessmentId] - Specific assessment ID, or all unassigned if omitted
 * @param {boolean} [options.dryRun=false] - If true, only previews without mutating
 * @param {boolean} [options.confirmed=false] - If true, skips interactive confirmation prompt
 */
async function claimLegacyAssessments({
  adminEmail,
  adminPassword,
  targetUserEmail,
  assessmentId = null,
  dryRun = false,
  confirmed = false
}) {
  if (!adminEmail || !adminPassword) {
    throw new Error('Admin credentials (adminEmail and adminPassword) are strictly required.');
  }

  if (!targetUserEmail) {
    throw new Error('Target user email (targetUserEmail) is required.');
  }

  // 1. Authenticate and authorize the Administrator
  const admin = await User.findOne({ email: adminEmail.toLowerCase().trim() });
  if (!admin) {
    throw new Error(`Authentication failed: No user found for admin email "${adminEmail}".`);
  }

  const isPasswordValid = await admin.comparePassword(adminPassword);
  if (!isPasswordValid) {
    throw new Error('Authentication failed: Invalid admin password.');
  }

  if (admin.role !== 'admin') {
    throw new Error(
      `Authorization failed: User "${admin.email}" has role "${admin.role}", but role "admin" is required.`
    );
  }

  // 2. Validate Target User
  const targetUser = await User.findOne({ email: targetUserEmail.toLowerCase().trim() });
  if (!targetUser) {
    throw new Error(`Target user not found for email "${targetUserEmail}".`);
  }

  // 3. Find Unassigned Legacy Assessments
  const query = {
    $or: [{ user_id: null }, { user_id: { $exists: false } }]
  };

  if (assessmentId) {
    query.id = assessmentId;
    const existing = await Assessment.findOne({ id: assessmentId }).lean();
    if (!existing) {
      throw new Error(`Assessment with ID "${assessmentId}" does not exist.`);
    }
    if (existing.user_id) {
      throw new Error(
        `Assessment "${assessmentId}" is already assigned to user ID "${existing.user_id}". Cannot claim owned assessment.`
      );
    }
  }

  const unassigned = await Assessment.find(query).lean();

  // 4. Return preview if empty
  if (unassigned.length === 0) {
    return {
      success: true,
      message: 'No unassigned legacy assessments found matching query.',
      count: 0,
      preview: []
    };
  }

  const preview = unassigned.map(a => ({
    id: a.id,
    title: a.title,
    candidate_name: a.candidate_name,
    job_title: a.job_title,
    status: a.status,
    created_at: a.created_at
  }));

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `Preview: ${unassigned.length} legacy assessment(s) eligible for transfer to "${targetUser.email}".`,
      admin: { id: admin.id, email: admin.email },
      targetUser: { id: targetUser.id, email: targetUser.email },
      count: unassigned.length,
      preview
    };
  }

  if (!confirmed) {
    throw new Error(
      'Operation not confirmed. Explicit confirmation is required before modifying assessment ownership.'
    );
  }

  // 5. Execute ownership assignment
  const now = new Date().toISOString();
  const updateResult = await Assessment.updateMany(query, {
    $set: {
      user_id: targetUser.id,
      updated_at: now
    }
  });

  return {
    success: true,
    message: `Successfully transferred ${updateResult.modifiedCount} legacy assessment(s) to "${targetUser.email}".`,
    modifiedCount: updateResult.modifiedCount,
    targetUser: { id: targetUser.id, email: targetUser.email },
    claimedAssessments: preview.map(p => p.id)
  };
}

// CLI interactive runner
async function runCli() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };
  const hasFlag = (flag) => args.includes(flag);

  let adminEmail = getArg('--admin-email');
  let adminPassword = getArg('--admin-password');
  let targetUserEmail = getArg('--target-user');
  let assessmentId = getArg('--assessment-id');
  let isDryRun = hasFlag('--preview') || hasFlag('--dry-run');
  let isConfirmed = hasFlag('--confirm');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  try {
    await connectDb();

    console.log('==================================================================');
    console.log('  ProofPath Legacy Assessment Ownership Claim CLI');
    console.log('==================================================================\n');

    if (!adminEmail) adminEmail = await question('Admin Email: ');
    if (!adminPassword) adminPassword = await question('Admin Password: ');
    if (!targetUserEmail) targetUserEmail = await question('Target User Email: ');

    // First generate preview
    const previewResult = await claimLegacyAssessments({
      adminEmail,
      adminPassword,
      targetUserEmail,
      assessmentId,
      dryRun: true
    });

    console.log('\n--- PREVIEW OF ELIGIBLE ASSESSMENTS ---');
    console.log(`Administrator: ${adminEmail}`);
    console.log(`Target User:   ${targetUserEmail}`);
    console.log(`Count:         ${previewResult.count}`);
    console.table(previewResult.preview);

    if (previewResult.count === 0) {
      console.log('No unassigned assessments to claim.');
      rl.close();
      await closeDb();
      process.exit(0);
    }

    if (isDryRun) {
      console.log('\n[Dry Run] No changes written to database.');
      rl.close();
      await closeDb();
      process.exit(0);
    }

    if (!isConfirmed) {
      const confirmInput = await question(
        `\nAre you sure you want to transfer ownership of these ${previewResult.count} assessment(s) to "${targetUserEmail}"? (type 'yes' to confirm): `
      );
      if (confirmInput.trim().toLowerCase() !== 'yes') {
        console.log('Aborted. No changes made.');
        rl.close();
        await closeDb();
        process.exit(0);
      }
      isConfirmed = true;
    }

    const result = await claimLegacyAssessments({
      adminEmail,
      adminPassword,
      targetUserEmail,
      assessmentId,
      confirmed: isConfirmed
    });

    console.log('\nSUCCESS:', result.message);
  } catch (err) {
    console.error('\nERROR:', err.message);
    process.exit(1);
  } finally {
    rl.close();
    await closeDb();
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  claimLegacyAssessments
};
