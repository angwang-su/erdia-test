/**
 * PlantUML 생성 스크립트
 * TypeORM 메타데이터를 사용하여 PlantUML 생성
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface PumlColumn {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
}

interface PumlTable {
  name: string;
  columns: PumlColumn[];
}

interface PumlRelation {
  from: string;
  to: string;
  label?: string;
  // PlantUML relation styles:
  // ||--|| : One to One
  // ||--|{ : One to Many
  // }|--|| : Many to One
  // }|--|{ : Many to Many
  type: string; 
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

// TypeORM 타입을 PlantUML 타입으로 변환 (간소화)
function getPumlType(column: any): string {
  let typeStr = '';
  
  if (column.databaseType) {
    typeStr = String(column.databaseType).toLowerCase();
  } else if (typeof column.type === 'function') {
    const typeName = column.type.name.toLowerCase();
    typeStr = typeName === 'number' ? 'integer' : typeName;
  } else {
    typeStr = String(column.type).toLowerCase();
  }

  // 매핑이 필요한 경우 추가
  if (typeStr.includes('timestamp')) return 'timestamp';
  if (typeStr.includes('varchar')) return 'varchar';
  
  return typeStr;
}

async function generatePlantUML(): Promise<void> {
  console.log('🔍 Loading entities for PlantUML...');
  const entities = loadAllEntities();
  
  if (entities.length === 0) {
    console.error('❌ No entities found!');
    process.exit(1);
  }

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

    let puml = '@startuml\n';
    puml += '!theme plain\n'; // 깔끔한 테마
    puml += 'hide circle\n'; // 클래스 아이콘 숨김
    puml += 'skinparam linetype ortho\n\n'; // 직각 선

    const entityMetadatas = dataSource.entityMetadatas;
    const tables: PumlTable[] = [];
    const relations: PumlRelation[] = [];
    const processedJunctionTables = new Set<string>();

    // 1. 테이블 수집
    for (const metadata of entityMetadatas) {
      const columns: PumlColumn[] = [];

      for (const column of metadata.columns) {
        columns.push({
          name: column.databaseName,
          type: getPumlType(column),
          isPrimary: column.isPrimary,
          isNullable: column.isNullable,
        });
      }

      tables.push({
        name: metadata.tableName,
        columns,
      });
    }

    // 2. 관계 수집
    for (const metadata of entityMetadatas) {
      for (const relation of metadata.relations) {
        // Many-to-One
        if (
          relation.relationType === 'many-to-one' &&
          relation.joinColumns.length > 0
        ) {
          const fromTable = metadata.tableName;
          const toTable = relation.inverseEntityMetadata.tableName;
          
          relations.push({
            from: toTable,
            to: fromTable,
            type: '||..o{', // One to Many (optional)
            label: relation.propertyName
          });
        }

        // One-to-One
        if (
          relation.relationType === 'one-to-one' &&
          relation.isOwning
        ) {
          const fromTable = metadata.tableName;
          const toTable = relation.inverseEntityMetadata.tableName;
          
          relations.push({
            from: fromTable,
            to: toTable,
            type: '||..||', // One to One
            label: relation.propertyName
          });
        }
        
        // Many-to-Many
        if (
          relation.relationType === 'many-to-many' &&
          relation.isOwning
        ) {
           // PlantUML에서 M:N은 직접 표현하거나 중간 테이블 표현 가능
           // 여기서는 직접 표현
           const fromTable = metadata.tableName;
           const toTable = relation.inverseEntityMetadata.tableName;
           
           relations.push({
             from: fromTable,
             to: toTable,
             type: '}o..o{', // Many to Many
             label: relation.propertyName
           });
        }
      }
    }

    // 3. PlantUML 작성
    for (const table of tables) {
      puml += `entity "${table.name}" as ${table.name} {\n`;
      for (const column of table.columns) {
        const marker = column.isPrimary ? '*' : (column.isNullable ? ' ' : '*');
        const bold = column.isPrimary ? '**' : '';
        puml += `  ${marker}${bold}${column.name}${bold} : ${column.type}\n`;
      }
      puml += '}\n\n';
    }

    for (const relation of relations) {
      puml += `${relation.from} ${relation.type} ${relation.to}`;
      if (relation.label) {
        puml += ` : ${relation.label}`;
      }
      puml += '\n';
    }

    puml += '@enduml\n';

    // 파일 저장
    // erd-output 폴더가 없으면 생성
    const outputDir = path.join(__dirname, '..', 'erd-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'erd.puml');
    fs.writeFileSync(outputPath, puml, 'utf-8');

    console.log('✅ PlantUML file generated successfully!');
    console.log('📁 Output file:', outputPath);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating PlantUML:', error);
    process.exit(1);
  }
}

void generatePlantUML();

