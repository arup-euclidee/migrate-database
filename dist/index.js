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
    .option('-s, --schema <path>', 'Path to schema file (default: auto-detect)', schema_types_1.DEFAULT_SCHEMA_FILE)
    .option('-o, --output <path>', 'Output directory for migrations', schema_types_1.DEFAULT_MIGRATIONS_DIR)
    .option('-r, --reference <path>', 'Path to reference schema file', schema_types_1.DEFAULT_REFERENCE_SCHEMA)
    .action(async (options) => {
    try {
        await generateMigration(options.schema, options.output, options.reference);
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
program
    .command('init')
    .description('Initialize a new schema.ts file')
    .action(() => {
    initSchemaFile();
});
async function generateMigration(schemaPath, outputDir, referencePath) {
    // Auto-detect schema file if default path doesn't exist
    let actualSchemaPath = schemaPath;
    if (schemaPath === schema_types_1.DEFAULT_SCHEMA_FILE && !file_utils_1.FileUtils.fileExists(schemaPath)) {
        try {
            actualSchemaPath = await schema_parser_1.SchemaParser.findSchemaFile();
        }
        catch {
            // Use default path if auto-detection fails
            actualSchemaPath = schema_types_1.DEFAULT_SCHEMA_FILE;
        }
    }
    console.log(`Using schema file: ${actualSchemaPath}`);
    // Parse current schema
    const currentSchema = await schema_parser_1.SchemaParser.parseSchemaFile(actualSchemaPath);
    // Ensure directories exist
    file_utils_1.FileUtils.ensureDirectoryExists(outputDir);
    // Get reference schema (previous version)
    const previousSchema = schema_parser_1.SchemaParser.getReferenceSchema(referencePath);
    if (previousSchema) {
        console.log('Found reference schema - comparing changes');
    }
    else {
        console.log('No reference schema found - generating initial migration');
    }
    // Generate migration SQL
    const sql = migration_generator_1.MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);
    // Generate migration filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const migrationFile = path.join(outputDir, `migration_${timestamp}.sql`);
    // Save migration file
    file_utils_1.FileUtils.writeFile(migrationFile, sql);
    // Save current schema as reference for future comparisons
    schema_parser_1.SchemaParser.saveSchema(currentSchema, referencePath);
    console.log(`Migration saved to: ${migrationFile}`);
    console.log(`Reference schema saved to: ${referencePath}`);
}
function initSchemaFile() {
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
    if (file_utils_1.FileUtils.fileExists(schema_types_1.DEFAULT_SCHEMA_FILE)) {
        console.log('schema.ts already exists');
        return;
    }
    file_utils_1.FileUtils.writeFile(schema_types_1.DEFAULT_SCHEMA_FILE, schemaContent);
    console.log('Created schema.ts file');
}
program.parse(process.argv);
