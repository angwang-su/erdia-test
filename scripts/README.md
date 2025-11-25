# TypeORM to DBML 변환 스크립트

이 폴더에는 TypeORM 엔티티를 DBML(Database Markup Language)로 자동 변환하는 스크립트들이 있습니다.

## 사용 가능한 스크립트

### 1. `generate-dbml-simple.ts` (추천)

데이터베이스 연결 없이 TypeORM 메타데이터만 사용하여 DBML을 생성합니다.

**실행 방법:**

```bash
yarn generate:dbml
# 또는
npm run generate:dbml
```

**특징:**

- 데이터베이스 연결 불필요
- 빠른 실행 속도
- 엔티티 정의만으로 스키마 생성

### 2. `generate-dbml.ts` (전체 버전)

데이터베이스에 연결하여 실제 스키마 정보를 기반으로 DBML을 생성합니다.

**실행 방법:**

```bash
yarn generate:dbml:full
# 또는
npm run generate:dbml:full
```

**특징:**

- 데이터베이스 연결 필요
- 실제 스키마 정보 활용
- 더 정확한 타입 정보

## 출력 결과

두 스크립트 모두 프로젝트 루트에 `database.dbml` 파일을 생성합니다.

## DBML 활용 방법

### 1. dbdiagram.io에서 ERD 시각화

1. https://dbdiagram.io 접속
2. 생성된 `database.dbml` 내용을 복사
3. 에디터에 붙여넣기
4. 자동으로 ERD 다이어그램 생성

### 2. dbdocs로 문서화

```bash
# 로컬에서 문서 생성
yarn dbdocs:build

# dbdocs.io에 배포 (계정 필요)
yarn dbdocs:push
```

### 3. SQL 생성

DBML에서 SQL을 생성하려면 `@dbml/cli` 패키지를 설치:

```bash
npm install -g @dbml/cli

# PostgreSQL SQL 생성
dbml2sql database.dbml --postgres -o schema.sql

# MySQL SQL 생성
dbml2sql database.dbml --mysql -o schema.sql
```

## 새 엔티티 추가 시

1. `src/entities/` 폴더에 새 엔티티 파일 생성
2. `src/entities/index.ts`에 export 추가
3. 각 스크립트 상단의 import 섹션에 새 엔티티 추가:

```typescript
import { YourNewEntity } from '../src/entities/your-new-entity.entity';
```

4. DataSource의 entities 배열에 추가:

```typescript
entities: [User, Post, Category, YourNewEntity],
```

5. 스크립트 재실행:

```bash
yarn generate:dbml
```

## 문제 해결

### ts-node를 찾을 수 없는 경우

```bash
npm install -D ts-node tsconfig-paths
```

### 엔티티를 찾을 수 없는 경우

- 엔티티 파일이 올바른 위치(`src/entities/`)에 있는지 확인
- 엔티티 파일이 올바른 데코레이터(`@Entity()`)를 사용하는지 확인
- 스크립트에서 엔티티를 import 했는지 확인

### 데이터베이스 연결 오류 (full 버전 사용 시)

- Docker가 실행 중인지 확인: `docker-compose ps`
- 데이터베이스가 실행 중인지 확인: `docker-compose up -d`
- 환경 변수가 올바른지 확인 (`.env` 파일)
