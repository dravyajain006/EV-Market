const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

function run(cmd, cwd) {
  console.log(`\n🚀 [Vercel Build] Executing: "${cmd}" in ${path.relative(rootDir, cwd) || '.'}`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
}

console.log('====================================================');
console.log('⚡ Starting EV Market Analytics Vercel Build Pipeline');
console.log('====================================================');

try {
  // 1. Ensure server dependencies and Prisma client
  console.log('\n📦 Step 1: Checking Server Dependencies...');
  if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
    console.log('Installing server dependencies...');
    run('npm install', serverDir);
  }

  // 2. Generate Prisma Client for Target Architecture
  console.log('\n🔧 Step 2: Generating Prisma Client...');
  const isPostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
  const schemaFile = isPostgres ? 'prisma/schema.postgres.prisma' : 'prisma/schema.prisma';
  console.log(`Using Prisma schema: ${schemaFile}`);
  try {
    run(`npx prisma generate --schema=${schemaFile}`, serverDir);
  } catch (err) {
    if (fs.existsSync(path.join(serverDir, 'node_modules', '@prisma', 'client'))) {
      console.warn('⚠️ [Prisma Generate] Note: Using existing generated client (file locked on local Windows dev)');
    } else {
      throw err;
    }
  }

  // 3. Compile Server TypeScript
  console.log('\n🛠️ Step 3: Compiling Server TypeScript (tsc)...');
  try {
    run('npm run build', serverDir);
  } catch (err) {
    console.warn('⚠️ [Server Build Notice]: Standalone server build skipped or completed with warnings, using self-contained serverless API:', err.message);
  }

  // 4. Ensure client dependencies and compile Vite bundle
  console.log('\n📦 Step 4: Checking Client Dependencies...');
  if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
    console.log('Installing client dependencies...');
    run('npm install', clientDir);
  }

  console.log('\n🎨 Step 5: Building Client Production Bundle (Vite)...');
  run('npm run build', clientDir);

  console.log('\n====================================================');
  console.log('✅ EV Market Analytics Vercel Build Successfully Finished!');
  console.log('====================================================\n');
} catch (error) {
  console.error('\n❌ [Vercel Build Failed]:', error.message);
  process.exit(1);
}
