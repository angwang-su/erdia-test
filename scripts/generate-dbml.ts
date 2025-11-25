import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

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
function typeormTypeToDbml(column: any): string {
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

  const typeMap: { [key: string]: string } = {
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
    decimal: 'decimal',
    numeric: 'numeric',
    float: 'float',
    float4: 'float',
    float8: 'double',
    'double precision': 'double',
    double: 'double',
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

async function generateDbml() {
  console.log('🔍 Loading entities...');
  const entities = loadAllEntities();
  
  if (entities.length === 0) {
    console.error('❌ No entities found!');
    process.exit(1);
  }

  console.log(`✅ Found ${entities.length} entities`);

  // DataSource 초기화
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '54322'),
    username: process.env.DB_USERNAME || 'erd-test',
    password: process.env.DB_PASSWORD || 'erd-test',
    database: process.env.DB_DATABASE || 'erd-test',
    entities: entities,
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();

    let dbml = '// Database Schema Generated from TypeORM\n';
    dbml += '// Generated at: ' + new Date().toISOString() + '\n\n';

    // 각 엔티티에 대해 DBML 생성
    const entityMetadatas = dataSource.entityMetadatas;

    for (const metadata of entityMetadatas) {
      dbml += `Table ${metadata.tableName} {\n`;

      // 컬럼 정의
      for (const column of metadata.columns) {
        const columnName = column.databaseName;
        const columnType = typeormTypeToDbml(column);

        const constraints: string[] = [];

        // Primary Key
        if (column.isPrimary) {
          constraints.push('pk');
        }

        // Auto Increment
        if (column.isGenerated && column.generationStrategy === 'increment') {
          constraints.push('increment');
        }

        // Not Null
        if (!column.isNullable && !column.isPrimary) {
          constraints.push('not null');
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
              constraints.push(`default: ${defaultVal}`);
            } else if (!isNaN(Number(defaultVal))) {
              constraints.push(`default: ${defaultVal}`);
            } else if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) {
              constraints.push(`default: ${defaultVal}`);
            } else {
              constraints.push(`default: '${defaultVal}'`);
            }
          } else if (defaultVal.includes('now()') || defaultVal.includes('CURRENT_TIMESTAMP')) {
            constraints.push(`default: \`now()\``);
          }
        }

        const constraintStr =
          constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
        dbml += `  ${columnName} ${columnType}${constraintStr}\n`;
      }

      // Note 추가 (있는 경우)
      if (metadata.comment) {
        dbml += `\n  Note: '${metadata.comment}'\n`;
      }

      dbml += '}\n\n';
    }

    // Relations (Foreign Keys) 추가
    const processedJunctionTables = new Set<string>();
    
    for (const metadata of entityMetadatas) {
      for (const relation of metadata.relations) {
        if (relation.foreignKeys && relation.foreignKeys.length > 0) {
          for (const fk of relation.foreignKeys) {
            const fromTable = metadata.tableName;
            const toTable = relation.inverseEntityMetadata.tableName;
            const fromColumn = fk.columnNames[0];
            const toColumn = fk.referencedColumnNames[0];

            // Many-to-One 관계
            if (relation.relationType === 'many-to-one') {
              dbml += `Ref: ${fromTable}.${fromColumn} > ${toTable}.${toColumn}\n`;
            }
            // One-to-Many는 반대편에서 처리됨
          }
        }
      }

      // Many-to-Many 관계 처리
      for (const relation of metadata.relations) {
        if (relation.relationType === 'many-to-many' && relation.isOwning) {
          const junctionTable = relation.junctionEntityMetadata;
          if (junctionTable && !processedJunctionTables.has(junctionTable.tableName)) {
            processedJunctionTables.add(junctionTable.tableName);
            
            dbml += `\n// Many-to-Many: ${metadata.tableName} <> ${relation.inverseEntityMetadata.tableName}\n`;
            dbml += `Table ${junctionTable.tableName} {\n`;

            for (const column of junctionTable.columns) {
              const columnName = column.databaseName;
              const columnType = typeormTypeToDbml(column);
              const constraints: string[] = [];

              if (column.isPrimary) {
                constraints.push('pk');
              }

              const constraintStr =
                constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
              dbml += `  ${columnName} ${columnType}${constraintStr}\n`;
            }

            dbml += '}\n\n';

            // Junction table의 foreign keys
            for (const fk of junctionTable.foreignKeys) {
              const fromTable = junctionTable.tableName;
              const toTable = fk.referencedEntityMetadata.tableName;
              const fromColumn = fk.columnNames[0];
              const toColumn = fk.referencedColumnNames[0];

              dbml += `Ref: ${fromTable}.${fromColumn} > ${toTable}.${toColumn}\n`;
            }
            dbml += '\n';
          }
        }
      }
    }

    // database.dbml 파일에 쓰기
    const outputPath = path.join(__dirname, '..', 'database.dbml');
    fs.writeFileSync(outputPath, dbml, 'utf-8');

    console.log('✅ DBML file generated successfully at:', outputPath);
    console.log('\n📊 Generated DBML:\n');
    console.log(dbml);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error generating DBML:', error);
    process.exit(1);
  }
}

// 스크립트 실행
generateDbml();
