#!/usr/bin/env node

/**
 * TypeORM ERD 자동 생성 및 배포 스크립트 (Node.js 버전)
 * yarn start 시 자동으로 실행됩니다.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// .dbdocsrc 파일에서 설정 읽기
function loadConfig() {
  const configPath = path.join(__dirname, '..', '.dbdocsrc');
  const defaultConfig = {
    project: 'typeorm-erd',
    username: 'your-username',
    autoPush: false,
  };

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.log('⚠️  Could not read .dbdocsrc, using defaults');
  }

  return defaultConfig;
}

// 설정
const CONFIG = loadConfig();

function run(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    return true;
  } catch (error) {
    console.error(`❌ Error: ${description} failed`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting ERD generation process...\n');

  // 1. TypeScript 빌드
  if (!run('yarn build', '📦 Building TypeScript')) {
    process.exit(1);
  }

  // 2. DBML 생성
  if (!run('yarn generate:dbml', '📊 Generating DBML from TypeORM entities')) {
    process.exit(1);
  }

  // 3. DBML 파일 확인
  const dbmlPath = path.join(__dirname, '..', 'database.dbml');
  if (!fs.existsSync(dbmlPath)) {
    console.error('❌ Error: database.dbml not found!');
    process.exit(1);
  }

  console.log('✅ DBML generated successfully!');

  // 4. dbdocs 로컬 빌드
  console.log('\n📚 Building dbdocs locally...');
  const buildResult = run('dbdocs build database.dbml', '📚 Building dbdocs');

  if (buildResult) {
    console.log('✅ dbdocs built successfully!');
  } else {
    console.log('⚠️  dbdocs build skipped (dbdocs might not be installed)');
  }

  // 5. dbdocs.io 배포 (선택사항)
  if (CONFIG.autoPush) {
    console.log('\n🌐 Pushing to dbdocs.io...');
    const pushCmd = `dbdocs push database.dbml --project ${CONFIG.project}`;
    
    if (run(pushCmd, '🌐 Pushing to dbdocs.io')) {
      console.log(`✅ Deployed to: https://dbdocs.io/${CONFIG.username}/${CONFIG.project}`);
    } else {
      console.log('⚠️  dbdocs push failed. Make sure you are logged in (dbdocs login)');
    }
  }

  console.log('\n✅ All done! ERD documentation is ready.');
  
  if (!CONFIG.autoPush) {
    console.log('\n💡 To deploy to dbdocs.io, run:');
    console.log(`   dbdocs push database.dbml --project ${CONFIG.project}`);
    console.log(`   Or update .dbdocsrc with "autoPush": true`);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

