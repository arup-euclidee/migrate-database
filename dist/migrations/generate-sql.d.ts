import { SchemaDefinition } from '../schema/schema-types';
export declare class MigrationGenerator {
    static generateMigrationSQL(currentSchema: SchemaDefinition, previousSchema: SchemaDefinition | null): string;
    private static compareSchemas;
}
