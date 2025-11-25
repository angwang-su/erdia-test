import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '54322'),
  username: process.env.DB_USERNAME || 'erd-test',
  password: process.env.DB_PASSWORD || 'erd-test',
  database: process.env.DB_DATABASE || 'erd-test',
  entities: [path.join(__dirname, 'entities', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
});

// erdia: 단일 default export만 허용
export default AppDataSource;
