#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const schema_parser_1 = require("./schema/schema-parser");
const migration_generator_1 = require("./migration/migration-generator");
const file_utils_1 = require("./utils/file-utils");
const schema_types_1 = require("./schema/schema-types");
const path = __importStar(require("path"));
const program = new commander_1.Command();
program
    .name('pg-migrate')
    .description('PostgreSQL migration tool')
    .version('1.0.0');
program
    .command('generate')
    .description('Generate migration SQL from schema file')
    .option('-s, --schema <path>', 'Path to schema file (default: auto-detect)')
    .option('-o, --output <path>', 'Output directory for migrations', schema_types_1.DEFAULT_MIGRATIONS_DIR)
    .option('--schema-dir <path>', 'Directory to store schema versions', schema_types_1.DEFAULT_SCHEMA_DIR)
    .action(async (options) => {
    try {
        await generateMigration(options.schema, options.output, options.schemaDir);
        console.log('Migration generated successfully!');
    }
    catch (error) {
        console.error('Error generating migration:');
        if (error instanceof Error) {
            console.error(error.message);
        }
        else {
            console.error('An unknown error occurred');
        }
        process.exit(1);
    }
});
async function generateMigration(schemaPath, outputDir, schemaDir) {
    // Auto-detect schema file if not provided
    const actualSchemaPath = schemaPath || await schema_parser_1.SchemaParser.findSchemaFile();
    console.log(`Using schema file: ${actualSchemaPath}`);
    // Parse current schema
    const currentSchema = await schema_parser_1.SchemaParser.parseSchemaFile(actualSchemaPath);
    // Ensure directories exist
    file_utils_1.FileUtils.ensureDirectoryExists(outputDir);
    file_utils_1.FileUtils.ensureDirectoryExists(schemaDir);
    // Get previous schema
    const previousSchema = schema_parser_1.SchemaParser.getPreviousSchema(schemaDir, currentSchema.version);
    if (previousSchema) {
        console.log(`Found previous schema version: ${previousSchema.version}`);
    }
    else {
        console.log('No previous schema found - generating initial migration');
    }
    // Generate migration SQL
    const sql = migration_generator_1.MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);
    // Generate migration filename
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const migrationName = `migration_${timestamp}`;
    const migrationFile = path.join(outputDir, `${currentSchema.version}_${migrationName}.sql`);
    // Save migration file
    file_utils_1.FileUtils.writeFile(migrationFile, sql);
    // Save current schema as reference
    const schemaFile = path.join(schemaDir, `schema_v${currentSchema.version}.json`);
    schema_parser_1.SchemaParser.saveSchema(currentSchema, schemaFile);
    console.log(`Migration saved to: ${migrationFile}`);
    console.log(`Schema version ${currentSchema.version} saved to: ${schemaFile}`);
}
program.parse(process.argv);
