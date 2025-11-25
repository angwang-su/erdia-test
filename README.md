<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository with TypeORM integration.

## Database Setup

이 프로젝트는 PostgreSQL과 TypeORM을 사용합니다.

### 1. 데이터베이스 시작

```bash
$ docker-compose up -d
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=54322
DB_USERNAME=erd-test
DB_PASSWORD=erd-test
DB_DATABASE=erd-test

# Application
PORT=3000
```

### 3. TypeORM 설정

TypeORM은 다음과 같이 설정되어 있습니다:

- **자동 스키마 동기화**: 개발 환경에서 `synchronize: true`로 설정되어 있어 엔티티 변경 시 자동으로 데이터베이스 스키마가 업데이트됩니다.
- **로깅**: SQL 쿼리 로깅이 활성화되어 있습니다.
- **엔티티 위치**: `src/entities/*.entity.ts`

### 4. 예제 엔티티

프로젝트에는 다음 예제 엔티티들이 포함되어 있습니다:

- **User**: 사용자 정보를 저장합니다.
- **Post**: 게시글 정보를 저장하며, User와 Many-to-One 관계입니다.
- **Category**: 카테고리 정보를 저장하며, Post와 Many-to-Many 관계입니다.

## ERD 생성

TypeORM 엔티티로부터 자동으로 ERD를 생성할 수 있습니다.

### DBML 생성 (추천!)

```bash
# DBML 파일 생성
$ yarn erd:generate

# 그 다음:
# 1. https://dbdiagram.io 접속
# 2. database.dbml 내용 복사/붙여넣기
# 3. 즉시 ERD 확인!
```

**장점:**
- ✅ 빠르고 간단
- ✅ 인터랙티브
- ✅ 무료
- ✅ 계정 불필요

### DBDocs (문서화용)

```bash
# dbdocs.io에 배포
$ yarn erd:push
```

> 📚 자세한 내용은 `ERD_GUIDE.md` 참고

### DBDocs 설정

`.dbdocsrc` 파일에서 dbdocs.io 설정을 관리합니다:

```json
{
  "project": "typeorm-erd",
  "username": "your-username",
  "autoPush": false
}
```

**설정 항목:**
- `project`: dbdocs.io 프로젝트 이름
- `username`: dbdocs.io 사용자명
- `autoPush`: `true`로 설정 시 앱 시작 시 자동 배포

### DBDocs 명령어

```bash
# DBML을 HTML 문서로 로컬 빌드
$ yarn erd:build

# DBDocs.io에 배포 (로그인 필요)
$ yarn erd:push

# DBDocs 로그인 (최초 1회)
$ dbdocs login
```

### dbdiagram.io에서 시각화

1. https://dbdiagram.io 접속
2. 생성된 `database.dbml` 파일 내용 복사
3. 에디터에 붙여넣기
4. 자동으로 ERD 다이어그램 생성

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
