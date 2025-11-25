#!/bin/bash

# TypeORM ERD 자동 생성 및 배포 스크립트

echo "🚀 Starting ERD generation process..."

# 설정 변수
DBDOCS_PROJECT_NAME="typeorm-erd"

# 1. TypeScript 빌드
echo "📦 Building TypeScript..."
yarn build

# 2. DBML 생성
echo "📊 Generating DBML from TypeORM entities..."
yarn generate:dbml

# 3. DBML 파일 존재 확인
if [ ! -f "database.dbml" ]; then
  echo "❌ Error: database.dbml not found!"
  exit 1
fi

echo "✅ DBML generated successfully!"

# 4. dbdocs 로컬 빌드
echo "📚 Building dbdocs locally..."
dbdocs build database.dbml

# 5. dbdocs 배포 (선택사항 - 주석 해제하여 사용)
# echo "🌐 Pushing to dbdocs.io..."
# dbdocs push database.dbml --project "$DBDOCS_PROJECT_NAME"

echo "✅ All done! ERD documentation is ready."
echo "💡 You can view it at: https://dbdocs.io/your-username/$DBDOCS_PROJECT_NAME"

