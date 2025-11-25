/**
 * 간단한 DBML 생성 스크립트
 * TypeORM 메타데이터를 사용하여 DBML 생성
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface DbmlColumn {
  name: string;
  type: string;
  settings: string[];
}

interface DbmlTable {
  name: string;
  columns: DbmlColumn[];
}

interface DbmlRelation {
  from: string;
  to: string;
  type: string; // '>' for many-to-one, '-' for one-to-one, '<>' for many-to-many
}

// 모든 엔티티 파일 동적 로드
function loadAllEntities(): any[] {
  // dist 폴더 우선, 없으면 src 폴더에서 로드
  const distEntitiesDir = path.join(__dirname, '..', 'dist', 'entities');
  const srcEntitiesDir = path.join(__dirname, '..', 'src', 'entities');
  
  let entitiesDir: string;
  let fileExtension: string;
  
  if (fs.existsSync(distEntitiesDir)) {
    entitiesDir = distEntitiesDir;
    fileExtension = '.entity.js';
    console.log('📂 Loading from dist/entities/');
  } else if (fs.existsSync(srcEntitiesDir)) {
    entitiesDir = srcEntitiesDir;
    fileExtension = '.entity.ts';
    console.log('📂 Loading from src/entities/ (using ts-node)');
  } else {
    console.error('❌ Entities directory not found in dist or src.');
    process.exit(1);
  }

  const entityFiles = fs.readdirSync(entitiesDir).filter(file => 
    file.endsWith(fileExtension) && file !== 'base.entity.ts' && file !== 'base.entity.js'
  );
  
  const entities: any[] = [];

  for (const file of entityFiles) {
    try {
      const entityPath = path.join(entitiesDir, file);
      const entityModule = require(entityPath);
      
      // export된 클래스 찾기
      const entityClass = Object.values(entityModule).find(
        (exp: any) => typeof exp === 'function' && exp.prototype && exp.name !== 'BaseEntity'
      );
      
      if (entityClass) {
        entities.push(entityClass);
        console.log(`  ✓ ${file}`);
      }
    } catch (error) {
      console.warn(`  ⚠️  Warning: Could not load entity from ${file}`);
    }
  }

  return entities;
}

// TypeORM 타입을 DBML 타입으로 변환
function getDbmlType(column: any): string {
  // TypeORM은 여러 방식으로 타입을 저장할 수 있음
  let typeStr = '';
  
  // 1. databaseType이 있으면 우선 사용 (실제 DB 타입)
  if (column.databaseType) {
    typeStr = String(column.databaseType).toLowerCase();
  }
  // 2. type이 함수인 경우 (Number, String, Boolean 등)
  else if (typeof column.type === 'function') {
    const typeName = column.type.name.toLowerCase();
    if (typeName === 'number') {
      typeStr = 'integer';
    } else if (typeName === 'string') {
      typeStr = 'varchar';
    } else if (typeName === 'boolean') {
      typeStr = 'boolean';
    } else if (typeName === 'date') {
      typeStr = 'timestamp';
    } else {
      typeStr = String(column.type).toLowerCase();
    }
  }
  // 3. type이 문자열인 경우
  else {
    typeStr = String(column.type).toLowerCase();
  }

  // 기본 타입 매핑
  const typeMap: Record<string, string> = {
    int: 'integer',
    int2: 'integer',
    int4: 'integer',
    int8: 'bigint',
    integer: 'integer',
    bigint: 'bigint',
    varchar: 'varchar',
    'character varying': 'varchar',
    text: 'text',
    boolean: 'boolean',
    bool: 'boolean',
    timestamp: 'timestamp',
    'timestamp without time zone': 'timestamp',
    'timestamp with time zone': 'timestamptz',
    timestamptz: 'timestamptz',
    date: 'date',
    time: 'time',
    decimal: 'decimal',
    numeric: 'numeric',
    float: 'float',
    float4: 'float',
    float8: 'double',
    'double precision': 'double',
    double: 'double',
    real: 'float',
    json: 'json',
    jsonb: 'jsonb',
    uuid: 'uuid',
  };

  let dbmlType = typeMap[typeStr] || 'varchar';

  // 길이가 있는 경우 추가
  if (column.length && !['text', 'json', 'jsonb', 'uuid', 'integer', 'bigint', 'boolean', 'timestamp'].includes(dbmlType)) {
    dbmlType += `(${column.length})`;
  }

  return dbmlType;
}

async function generateDbml(): Promise<void> {
  console.log('🔍 Loading entities...');
  const entities = loadAllEntities();
  
  if (entities.length === 0) {
    console.error('❌ No entities found!');
    process.exit(1);
  }

  console.log(`✅ Found ${entities.length} entities`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '54322'),
    username: process.env.DB_USERNAME || 'erd-test',
    password: process.env.DB_PASSWORD || 'erd-test',
    database: process.env.DB_DATABASE || 'erd-test',
    entities: entities,
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();

    let dbml = '// Database Schema Generated from TypeORM Entities\n';
    dbml += `// Generated at: ${new Date().toISOString()}\n`;
    dbml += '// Project: typeorm-erd\n\n';

    const entityMetadatas = dataSource.entityMetadatas;
    const tables: DbmlTable[] = [];
    const relations: DbmlRelation[] = [];
    const processedJunctionTables = new Set<string>();

    // 1. 일반 테이블 수집
    for (const metadata of entityMetadatas) {
      const columns: DbmlColumn[] = [];

      for (const column of metadata.columns) {
        const settings: string[] = [];

        // Primary Key
        if (column.isPrimary) {
          settings.push('pk');
        }

        // Auto Increment
        if (column.isGenerated && column.generationStrategy === 'increment') {
          settings.push('increment');
        }

        // Not Null (primary key는 이미 not null이므로 제외)
        if (!column.isNullable && !column.isPrimary) {
          settings.push('not null');
        }

        // Default value
        if (column.default !== undefined && column.default !== null) {
          const defaultVal = column.default.toString();
          // TypeORM의 복잡한 default 함수는 스킵
          if (
            !defaultVal.includes('options.connection') &&
            !defaultVal.includes('=>') &&
            !defaultVal.includes('function')
          ) {
            // boolean, number는 그대로, string은 따옴표로 감싸기
            if (defaultVal === 'true' || defaultVal === 'false') {
              settings.push(`default: ${defaultVal}`);
            } else if (!isNaN(Number(defaultVal))) {
              settings.push(`default: ${defaultVal}`);
            } else if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) {
              settings.push(`default: ${defaultVal}`);
            } else {
              settings.push(`default: '${defaultVal}'`);
            }
          } else if (defaultVal.includes('now()') || defaultVal.includes('CURRENT_TIMESTAMP')) {
            settings.push(`default: \`now()\``);
          }
        }

        columns.push({
          name: column.databaseName,
          type: getDbmlType(column),
          settings,
        });
      }

      tables.push({
        name: metadata.tableName,
        columns,
      });
    }

    // 2. Many-to-Many 조인 테이블 수집
    const junctionTableNames = new Set<string>();
    for (const metadata of entityMetadatas) {
      for (const relation of metadata.relations) {
        if (
          relation.relationType === 'many-to-many' &&
          relation.isOwning &&
          relation.junctionEntityMetadata
        ) {
          const junctionMetadata = relation.junctionEntityMetadata;
          const tableName = junctionMetadata.tableName;
          
          // 이미 처리했거나 일반 테이블에 존재하는지 확인
          if (!processedJunctionTables.has(tableName) && !junctionTableNames.has(tableName)) {
            processedJunctionTables.add(tableName);
            junctionTableNames.add(tableName);

            const columns: DbmlColumn[] = [];
            for (const column of junctionMetadata.columns) {
              const settings: string[] = [];
              if (column.isPrimary) {
                settings.push('pk');
              }

              columns.push({
                name: column.databaseName,
                type: getDbmlType(column),
                settings,
              });
            }

            tables.push({
              name: tableName,
              columns,
            });
          }
        }
      }
    }

    // 3. 관계 수집
    for (const metadata of entityMetadatas) {
      for (const relation of metadata.relations) {
        // Many-to-One 관계
        if (
          relation.relationType === 'many-to-one' &&
          relation.joinColumns.length > 0
        ) {
          const fromColumn = relation.joinColumns[0].databaseName;
          const toColumn =
            relation.joinColumns[0].referencedColumn!.databaseName;

          relations.push({
            from: `${metadata.tableName}.${fromColumn}`,
            to: `${relation.inverseEntityMetadata.tableName}.${toColumn}`,
            type: '>',
          });
        }

        // Many-to-Many 관계 (Junction table을 통한 관계)
        if (
          relation.relationType === 'many-to-many' &&
          relation.isOwning &&
          relation.junctionEntityMetadata
        ) {
          const junctionMetadata = relation.junctionEntityMetadata;

          for (const fk of junctionMetadata.foreignKeys) {
            const fromColumn = fk.columnNames[0];
            const toColumn = fk.referencedColumnNames[0];
            const toTable = fk.referencedEntityMetadata.tableName;

            relations.push({
              from: `${junctionMetadata.tableName}.${fromColumn}`,
              to: `${toTable}.${toColumn}`,
              type: '>',
            });
          }
        }
      }
    }

    // 4. DBML 문자열 생성 (중복 제거)
    const uniqueTableNames = new Set<string>();
    for (const table of tables) {
      // 중복 테이블 스킵
      if (uniqueTableNames.has(table.name)) {
        continue;
      }
      uniqueTableNames.add(table.name);
      
      dbml += `Table ${table.name} {\n`;
      for (const column of table.columns) {
        const settingsStr =
          column.settings.length > 0 ? ` [${column.settings.join(', ')}]` : '';
        dbml += `  ${column.name} ${column.type}${settingsStr}\n`;
      }
      dbml += '}\n\n';
    }

    // 5. 관계 추가
    if (relations.length > 0) {
      dbml += '// Relationships\n';
      for (const relation of relations) {
        dbml += `Ref: ${relation.from} ${relation.type} ${relation.to}\n`;
      }
    }

    // 파일 저장
    const outputPath = path.join(__dirname, '..', 'database.dbml');
    fs.writeFileSync(outputPath, dbml, 'utf-8');

    console.log('✅ DBML file generated successfully!');
    console.log('📁 Output file:', outputPath);
    console.log(`📊 Generated ${tables.length} tables and ${relations.length} relationships`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating DBML:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// 스크립트 실행
void generateDbml();
