# Erdia - TypeORM Entity to ERD 자동 생성

## 📌 개요

**Erdia**는 TypeORM 엔티티를 분석하여 자동으로 ERD(Entity Relationship Diagram)를 생성해주는 도구입니다.

### 주요 특징

- ✅ TypeORM 엔티티에서 자동 ERD 생성
- ✅ HTML, SVG, Markdown, PDF 등 다양한 출력 형식 지원
- ✅ Mermaid.js 기반의 인터랙티브 다이어그램
- ✅ CI/CD 파이프라인 통합 가능
- ✅ GitHub Pages로 자동 배포 가능

---

## 🛠️ 설치

### 프로젝트에 설치

```bash
# yarn
yarn add -D erdia

# npm
npm install -D erdia
```

### 필수 의존성

```bash
yarn add typeorm @nestjs/typeorm pg
yarn add -D dotenv
```

---

## ⚙️ 설정

### 1. DataSource 파일 생성

```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'mydb',
  entities: [path.join(__dirname, 'entities', '**', '*.entity{.ts,.js}')],
  synchronize: process.env.NODE_ENV !== 'production',
});

// ⚠️ 중요: erdia는 단일 default export만 허용
export default AppDataSource;
```

### 2. tsconfig 설정

erdia는 **CommonJS**로 컴파일된 파일을 필요로 합니다.

`tsconfig.erdia.json` (별도 생성):

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "outDir": "./dist",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 3. Erdia 설정 파일 (선택)

`.erdiarc`:

```json
{
  "dataSource": "./dist/src/data-source.js",
  "output": "./erd-output"
}
```

### 4. package.json 스크립트

```json
{
  "scripts": {
    "erdia:build": "tsc --project tsconfig.erdia.json && erdia build -d dist/src/data-source.js -o erd-output",
    "erdia:build:md": "tsc --project tsconfig.erdia.json && erdia build -d dist/src/data-source.js -o erd-output --format md",
    "erdia:clean": "rm -rf erd-output"
  }
}
```

---

## 🚀 사용법

### 기본 사용

```bash
# ERD 생성 (HTML + SVG)
yarn erdia:build

# Markdown 형식으로 생성
yarn erdia:build:md

# 결과물 확인
open erd-output/index.html
```

### 출력 파일

```
erd-output/
├── index.html          # 메인 HTML (인터랙티브 ERD)
├── mermaid.html        # Mermaid.js 다이어그램
└── <project-name>.svg  # SVG 이미지
```

## 🔄 CI/CD 자동화

### GitHub Actions 설정

`.github/workflows/generate-erd.yml`:

```yaml
name: Generate ERD

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/entities/**' # 엔티티 변경 시에만 실행
  pull_request:
    branches: [main, develop]
    paths:
      - 'src/entities/**'
  workflow_dispatch: # 수동 실행 가능

jobs:
  generate-erd:
    runs-on: ubuntu-latest

    # PostgreSQL 서비스 (erdia는 DB 연결 필요)
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: erd-test
          POSTGRES_PASSWORD: erd-test
          POSTGRES_DB: erd-test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DB_HOST: localhost
      DB_PORT: 5432
      DB_USERNAME: erd-test
      DB_PASSWORD: erd-test
      DB_DATABASE: erd-test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install

      - name: Build TypeScript
        run: yarn build

      - name: Generate ERD
        run: npx erdia build -d dist/src/data-source.js -o erd-output

      - name: Upload ERD artifacts
        uses: actions/upload-artifact@v4
        with:
          name: erd-output
          path: erd-output/
          retention-days: 30

  # GitHub Pages 배포 (main 브랜치만)
  deploy-erd:
    needs: generate-erd
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Download ERD artifacts
        uses: actions/download-artifact@v4
        with:
          name: erd-output
          path: erd-output

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload to Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: erd-output

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### GitHub Pages 활성화

1. GitHub 레포지토리 → **Settings**
2. 왼쪽 메뉴 → **Pages**
3. Source → **GitHub Actions** 선택
4. Save

### 배포 URL

| 레포지토리 유형 | URL 형식                               |
| --------------- | -------------------------------------- |
| 개인            | `https://<username>.github.io/<repo>/` |
| Organization    | `https://<org>.github.io/<repo>/`      |

예시: `https://aaant.github.io/scholar/`

---

## ⚠️ 주의사항

### 1. DataSource Export

```typescript
// ❌ 잘못된 예 (두 개의 export)
export const AppDataSource = new DataSource({...});
export default AppDataSource;

// ✅ 올바른 예 (단일 export)
const AppDataSource = new DataSource({...});
export default AppDataSource;
```

### 2. CommonJS 컴파일 필요

erdia는 CommonJS 모듈만 지원합니다. ES Module 사용 시 별도의 `tsconfig.erdia.json` 필요.

### 3. 데이터베이스 연결 필요

erdia는 DataSource를 초기화할 때 실제 DB 연결이 필요합니다. CI 환경에서는 PostgreSQL 서비스 컨테이너를 사용해야 합니다.

### 4. 경로 주의

```bash
# 컴파일 후 파일 구조
dist/
└── src/
    └── data-source.js  # ← erdia는 이 경로 사용

# erdia 명령어
erdia build -d dist/src/data-source.js -o erd-output
```

---

## 🔧 트러블슈팅

### "Cannot found dataSource" 에러

```bash
# dist 폴더 확인
ls dist/src/

# 없으면 빌드 실행
yarn build
```

### "\_\_dirname is not defined" 에러

→ `tsconfig.erdia.json`에서 `module`이 `commonjs`인지 확인

### "Given data source file must contain only one export" 에러

→ DataSource 파일에서 `export default`만 사용

### CI에서 DB 연결 실패

→ `services.postgres` 설정과 환경변수 확인

---

## 📚 참고 자료

- [Erdia GitHub](https://github.com/imjuni/erdia)
- [TypeORM 공식 문서](https://typeorm.io/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
