#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const generate_migration_1 = require("./migrations/generate-migration");
const init_1 = require("./init");
const chalk_1 = __importDefault(require("chalk"));
const program = new commander_1.Command();
program
    .name('pg-migrate')
    .description('PostgreSQL migration tool')
    .version('1.0.0');
program
    .command('init')
    .description('Initialize a new schema.ts file')
    .action(() => {
    const result = (0, init_1.initMigration)();
    if (result.success) {
        console.log(chalk_1.default.green(`SUCCESS: ${result.message}`));
    }
    else if (result.warning) {
        console.log(chalk_1.default.yellow(`WARNING: ${result.message}`));
    }
    else {
        console.error(chalk_1.default.red(`ERROR: ${result.message}`));
    }
});
program
    .command('generate')
    .description('Generate migration SQL from schema file')
    .action(async () => {
    try {
        const result = await (0, generate_migration_1.generateMigration)();
        console.log(chalk_1.default.green(`SUCCESS: ${result.message}`));
        process.exit(0);
    }
    catch (error) {
        console.log(chalk_1.default.red(`ERROR: ${error.message}`));
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
