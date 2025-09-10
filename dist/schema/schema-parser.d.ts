import { SchemaDefinition } from './schema-types';
export declare class SchemaParser {
    static parseSchemaFile(filePath: string): Promise<SchemaDefinition>;
    private static parseTypeScriptSchema;
    private static compileTypeScriptSchema;
    private static parseTypeScriptAsText;
    static saveSchema(schema: SchemaDefinition, filePath: string): void;
    static getPreviousSchema(schemaDir: string, version: number): SchemaDefinition | null;
    static findSchemaFile(): Promise<string>;
}
