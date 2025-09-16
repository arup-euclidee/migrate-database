#!/usr/bin/env node

import { Command } from 'commander';
import { SchemaParser } from './schema/schema-parser';
import { MigrationGenerator } from './migration/migration-generator';
import { FileUtils } from './utils/file-utils';
import { DEFAULT_MIGRATIONS_DIR, DEFAULT_REFERENCE_SCHEMA, DEFAULT_SCHEMA_FILE } from './schema/schema-types';
import * as path from 'path';

const program = new Command();

program
  .name('pg-migrate')
  .description('PostgreSQL migration tool')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate migration SQL from schema file')
  .option('-s, --schema <path>', 'Path to schema file (default: auto-detect)', DEFAULT_SCHEMA_FILE)
  .option('-o, --output <path>', 'Output directory for migrations', DEFAULT_MIGRATIONS_DIR)
  .option('-r, --reference <path>', 'Path to reference schema file', DEFAULT_REFERENCE_SCHEMA)
  .action(async (options) => {
    try {
      await generateMigration(options.schema, options.output, options.reference);
      console.log('Migration generated successfully!');
    } catch (error) {
      console.error('Error generating migration:');
      
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred');
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new schema.ts file')
  .action(() => {
    initSchemaFile();
  });

async function generateMigration(
  schemaPath: string, 
  outputDir: string, 
  referencePath: string
): Promise<void> {
  // Auto-detect schema file if default path doesn't exist
  let actualSchemaPath = schemaPath;
  if (schemaPath === DEFAULT_SCHEMA_FILE && !FileUtils.fileExists(schemaPath)) {
    try {
      actualSchemaPath = await SchemaParser.findSchemaFile();
    } catch {
      // Use default path if auto-detection fails
      actualSchemaPath = DEFAULT_SCHEMA_FILE;
    }
  }

  console.log(`Using schema file: ${actualSchemaPath}`);
  
  // Parse current schema
  const currentSchema = await SchemaParser.parseSchemaFile(actualSchemaPath);
  
  // Ensure directories exist
  FileUtils.ensureDirectoryExists(outputDir);
  
  // Get reference schema (previous version)
  const previousSchema = SchemaParser.getReferenceSchema(referencePath);
  
  if (previousSchema) {
    console.log('Found reference schema - comparing changes');
  } else {
    console.log('No reference schema found - generating initial migration');
  }
  
  // Generate migration SQL
  const sql = MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);
  
  // Generate migration filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
  const migrationFile = path.join(outputDir, `migration_${timestamp}.sql`);
  
  // Save migration file
  FileUtils.writeFile(migrationFile, sql);
  
  // Save current schema as reference for future comparisons
  SchemaParser.saveSchema(currentSchema, referencePath);
  
  console.log(`Migration saved to: ${migrationFile}`);
  console.log(`Reference schema saved to: ${referencePath}`);
}

function initSchemaFile(): void {
  const schemaContent = `// schema.ts - Database schema definition
const schema = {
  tables: [
    {
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'SERIAL',
          primaryKey: true
        },
        {
          name: 'email',
          type: 'VARCHAR(255)',
          unique: true,
          nullable: false
        },
        {
          name: 'name',
          type: 'VARCHAR(255)',
          nullable: false
        },
        {
          name: 'created_at',
          type: 'TIMESTAMP',
          nullable: false,
          defaultValue: 'NOW()'
        }
      ]
    }
  ]
};

export default schema;
`;

  if (FileUtils.fileExists(DEFAULT_SCHEMA_FILE)) {
    console.log('schema.ts already exists');
    return;
  }

  FileUtils.writeFile(DEFAULT_SCHEMA_FILE, schemaContent);
  console.log('Created schema.ts file');
}

program.parse(process.argv);