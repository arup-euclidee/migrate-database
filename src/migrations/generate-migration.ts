import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_SCHEMA_FILE, DEFAULT_SCHEMA_FOLDER_PATH } from '../schema';
import chalk from 'chalk';
import { SchemaParser } from '../schema/schema-parser';
import { FileUtils } from '../init';
import { MigrationGenerator } from './generate-sql';
import { getNextMigrationNumber } from '../utils/next-migration-file';
import { SchemaDefinition } from '../schema/schema-types';
import prettier from "prettier";

export async function generateMigration(): Promise<{ success: boolean; message: string }> {
    try {
        const schemaExists = fs.existsSync(DEFAULT_SCHEMA_FILE)
        if (!schemaExists) {
            const msg = "Schema file not found. Please run 'init' command first.";
            console.log(chalk.red(msg));
            return { success: false, message: msg };
        }

        // Parse current schema
        let currentSchema: SchemaDefinition;
        try {
            currentSchema = await SchemaParser.parseSchemaFile(DEFAULT_SCHEMA_FILE);
        } catch (err: any) {
            throw new Error(`Failed to parse current schema: ${err.message}`);
        }

        // Load previous schema if available
        const prevSchemaPath = path.join(DEFAULT_SCHEMA_FOLDER_PATH, "generate", "previousSchema.ts");
        const existsPrevSchema = fs.existsSync(prevSchemaPath);
        let previousSchema: SchemaDefinition = { tables: [], timestamp: "" };

        if (existsPrevSchema) {
            try {
                previousSchema = await SchemaParser.parseSchemaFile(prevSchemaPath);
            } catch (err: any) {
                console.warn(chalk.yellow(`⚠️ Failed to parse previous schema, ignoring. Error: ${err.message}`));
            }
        }

        // Generate migration SQL
        const sql = MigrationGenerator.generateMigrationSQL(currentSchema, previousSchema);

        // Ensure migration folder exists
        const migrationDir = path.join(DEFAULT_SCHEMA_FOLDER_PATH, "migration");
        if (!fs.existsSync(migrationDir)) {
            fs.mkdirSync(migrationDir, { recursive: true });
        }

        // Get next migration file number
        const nextMigrationNumber = getNextMigrationNumber();
        const migrationFile = path.join(migrationDir, `${nextMigrationNumber}_migration.sql`);

        try {
            FileUtils.writeFile(migrationFile, sql);
        } catch (err: any) {
            throw new Error(`Failed to write migration file: ${err.message}`);
        }

        // Save snapshot of current schema for future comparisons
        try {
            const prevSchemaJson = path.join(DEFAULT_SCHEMA_FOLDER_PATH, "generate", "previousSchema.ts");
            const fileContent = `const schema = ${JSON.stringify(currentSchema?.tables, null, 2)};\n export default schema;`;

            // Format the content using Prettier
            // const formattedContent = prettier.format(fileContent, {
            //     parser: "typescript",
            //     singleQuote: true, // optional
            //     trailingComma: "all", // optional
            //     tabWidth: 2, // optional
            // });

            FileUtils.writeFile(prevSchemaJson, fileContent);
        } catch (err: any) {
            console.warn(chalk.yellow(`Failed to save previous schema snapshot: ${err.message}`));
        }

        const successMsg = `Migration file generated successfully:`;
        console.log(chalk.green(successMsg));
        return { success: true, message: successMsg };
    } catch (err: any) {
        const errorMsg = `Migration generation failed: ${err.message}`;
        console.error(chalk.red(errorMsg));
        return { success: false, message: errorMsg };
    }
}
