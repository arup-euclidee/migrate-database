#!/usr/bin/env node

import { Command } from 'commander';
import { SchemaParser } from './schema/schema-parser';
import { MigrationGenerator } from './migration/migration-generator';
import { FileUtils } from './utils/file-utils';
import { DEFAULT_MIGRATIONS_DIR, DEFAULT_SCHEMA_DIR } from './schema/schema-types';
import * as path from 'path';

const program = new Command();

program
  .name('pg-migrate')
  .description('PostgreSQL migration tool')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate migration SQL from schema file')
  .option('-s, --schema <path>', 'Path to schema file (default: auto-detect)')
  .option('-o, --output <path>', 'Output directory for migrations', DEFAULT_MIGRATIONS_DIR)
  .option('--schema-dir <path>', 'Directory to store schema versions', DEFAULT_SCHEMA_DIR)
  .action(async (options) => {
    try {
      await generateMigration(options.schema, options.output, options.schemaDir);
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

async function generateMigration(
  schemaPath: string | undefined, 
  outputDir: string, 
  schemaDir: string
): Promise<void> {
  // Auto-detect schema file if not provided
  const actualSchemaPath = schemaPath || await SchemaParser.findSchemaFile();
  console.log(`Using schema file: ${actualSchemaPath}`);
  
  // Parse current schema
  const currentSchema = await SchemaParser.parseSchemaFile(actualSchemaPath);
  
  // Ensure directories exist
  FileUtils.ensureDirectoryExists(outputDir);
  FileUtils.ensureDirectoryExists(schemaDir);
  
  // Get previous schema
  const previousSchema = SchemaParser.getPreviousSchema(schemaDir, currentSchema.version);
  
  if (previousSchema) {
    console.log(`Found previous schema version: ${previousSchema.version}`);
  } else {
    console.log('No previous schema found - generating initial migration');
  }
  
  // Generate migration SQL
  const sql = MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);
  
  // Generate migration filename
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
  const migrationName = `migration_${timestamp}`;
  const migrationFile = path.join(outputDir, `${currentSchema.version}_${migrationName}.sql`);
  
  // Save migration file
  FileUtils.writeFile(migrationFile, sql);
  
  // Save current schema as reference
  const schemaFile = path.join(schemaDir, `schema_v${currentSchema.version}.json`);
  SchemaParser.saveSchema(currentSchema, schemaFile);
  
  console.log(`Migration saved to: ${migrationFile}`);
  console.log(`Schema version ${currentSchema.version} saved to: ${schemaFile}`);
}

program.parse(process.argv);