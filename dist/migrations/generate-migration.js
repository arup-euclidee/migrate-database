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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigration = generateMigration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_1 = require("../schema");
const chalk_1 = __importDefault(require("chalk"));
const schema_parser_1 = require("../schema/schema-parser");
const init_1 = require("../init");
const generate_sql_1 = require("./generate-sql");
const next_migration_file_1 = require("../utils/next-migration-file");
async function generateMigration() {
    try {
        const schemaExists = fs.existsSync(schema_1.DEFAULT_SCHEMA_FILE);
        if (!schemaExists) {
            const msg = "Schema file not found. Please run 'init' command first.";
            console.log(chalk_1.default.red(msg));
            return { success: false, message: msg };
        }
        // Parse current schema
        let currentSchema;
        try {
            currentSchema = await schema_parser_1.SchemaParser.parseSchemaFile(schema_1.DEFAULT_SCHEMA_FILE);
        }
        catch (err) {
            throw new Error(`Failed to parse current schema: ${err.message}`);
        }
        // Load previous schema if available
        const prevSchemaPath = path.join(schema_1.DEFAULT_SCHEMA_FOLDER_PATH, "generate", "previousSchema.ts");
        const existsPrevSchema = fs.existsSync(prevSchemaPath);
        let previousSchema = { tables: [], timestamp: "" };
        if (existsPrevSchema) {
            try {
                previousSchema = await schema_parser_1.SchemaParser.parseSchemaFile(prevSchemaPath);
            }
            catch (err) {
                console.warn(chalk_1.default.yellow(`⚠️ Failed to parse previous schema, ignoring. Error: ${err.message}`));
            }
        }
        // Generate migration SQL
        const sql = generate_sql_1.MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);
        // Ensure migration folder exists
        const migrationDir = path.join(schema_1.DEFAULT_SCHEMA_FOLDER_PATH, "migration");
        if (!fs.existsSync(migrationDir)) {
            fs.mkdirSync(migrationDir, { recursive: true });
        }
        // Get next migration file number
        const nextMigrationNumber = (0, next_migration_file_1.getNextMigrationNumber)();
        const migrationFile = path.join(migrationDir, `${nextMigrationNumber}_migration.sql`);
        try {
            init_1.FileUtils.writeFile(migrationFile, sql);
        }
        catch (err) {
            throw new Error(`Failed to write migration file: ${err.message}`);
        }
        // Save snapshot of current schema for future comparisons
        try {
            const prevSchemaJson = path.join(schema_1.DEFAULT_SCHEMA_FOLDER_PATH, "generate", "previousSchema.ts");
            const fileContent = `const schema = ${JSON.stringify(currentSchema?.tables, null, 2)};\n export default schema;`;
            // Format the content using Prettier
            // const formattedContent = prettier.format(fileContent, {
            //     parser: "typescript",
            //     singleQuote: true, // optional
            //     trailingComma: "all", // optional
            //     tabWidth: 2, // optional
            // });
            init_1.FileUtils.writeFile(prevSchemaJson, fileContent);
        }
        catch (err) {
            console.warn(chalk_1.default.yellow(`Failed to save previous schema snapshot: ${err.message}`));
        }
        const successMsg = `Migration file generated successfully:`;
        console.log(chalk_1.default.green(successMsg));
        return { success: true, message: successMsg };
    }
    catch (err) {
        const errorMsg = `Migration generation failed: ${err.message}`;
        console.error(chalk_1.default.red(errorMsg));
        return { success: false, message: errorMsg };
    }
}
