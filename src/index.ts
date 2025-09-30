#!/usr/bin/env node

import { Command } from 'commander';
// import { SchemaParser } from '../extra/schema/schema-parser';
// import { MigrationGenerator } from './migration/migration-generator';
// import { FileUtils } from '../extra/utils/file-utils';
// import { DEFAULT_MIGRATIONS_DIR, DEFAULT_REFERENCE_SCHEMA, DEFAULT_SCHEMA_FILE } from '../extra/schema/schema-types';
import * as path from 'path';
import { generateMigration } from './migrations/generate-migration';
import { initMigration } from './init';
import chalk from "chalk";


const program = new Command();

program
  .name('pg-migrate')
  .description('PostgreSQL migration tool')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new schema.ts file')
  .action(() => {
    const result = initMigration();
    if (result.success) {
      console.log(chalk.green(`SUCCESS: ${result.message}`));
    } else if (result.warning) {
      console.log(chalk.yellow(`WARNING: ${result.message}`));
    } else {
      console.error(chalk.red(`ERROR: ${result.message}`));
    }
  });

program
  .command('generate')
  .description('Generate migration SQL from schema file')
  .action(async () => {
    try {
      const result = await generateMigration();
      console.log(chalk.green(`SUCCESS: ${result.message}`));
      process.exit(0);
    } catch (error: any) {
      console.log(chalk.red(`ERROR: ${error.message}`));
      process.exit(1);
    }
  });

// program
//   .command('generate')
//   .description('Generate migration SQL from schema file')
//   .option('-s, --schema <path>', 'Path to schema file (default: auto-detect)', DEFAULT_SCHEMA_FILE)
//   .option('-o, --output <path>', 'Output directory for migrations', DEFAULT_MIGRATIONS_DIR)
//   .option('-r, --reference <path>', 'Path to reference schema file', DEFAULT_REFERENCE_SCHEMA)
//   .action(async (options) => {
//     try {
//       await generateMigration(options.schema, options.output, options.reference);
//       console.log('Migration generated successfully!');
//     } catch (error) {
//       console.error('Error generating migration:');

//       if (error instanceof Error) {
//         console.error(error.message);
//       } else {
//         console.error('An unknown error occurred');
//       }
//       process.exit(1);
//     }
//   });



// async function generateMigration(
//   schemaPath: string,
//   outputDir: string,
//   referencePath: string
// ): Promise<void> {
//   // Auto-detect schema file if default path doesn't exist
//   let actualSchemaPath = schemaPath;
//   if (schemaPath === DEFAULT_SCHEMA_FILE && !FileUtils.fileExists(schemaPath)) {
//     try {
//       actualSchemaPath = await SchemaParser.findSchemaFile();
//     } catch {
//       // Use default path if auto-detection fails
//       actualSchemaPath = DEFAULT_SCHEMA_FILE;
//     }
//   }

//   console.log(`Using schema file: ${actualSchemaPath}`);

//   // Parse current schema
//   const currentSchema = await SchemaParser.parseSchemaFile(actualSchemaPath);

//   // Ensure directories exist
//   FileUtils.ensureDirectoryExists(outputDir);

//   // Get reference schema (previous version)
//   const previousSchema = SchemaParser.getReferenceSchema(referencePath);

//   if (previousSchema) {
//     console.log('Found reference schema - comparing changes');
//   } else {
//     console.log('No reference schema found - generating initial migration');
//   }

//   // Generate migration SQL
//   const sql = MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);

//   // Generate migration filename with timestamp
//   const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
//   const migrationFile = path.join(outputDir, `migration_${timestamp}.sql`);

//   // Save migration file
//   FileUtils.writeFile(migrationFile, sql);

//   // Save current schema as reference for future comparisons
//   SchemaParser.saveSchema(currentSchema, referencePath);

//   console.log(`Migration saved to: ${migrationFile}`);
//   console.log(`Reference schema saved to: ${referencePath}`);
// }


program.parse(process.argv);
