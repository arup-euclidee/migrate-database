import { SchemaDefinition } from '../schema/schema-types';
export declare class MigrationGenerator {
    static generateMigrationSQL(currentSchema: SchemaDefinition, previousSchema: SchemaDefinition | null): string;
    private static generateCreateTablesSQL;
    private static compareSchemas;
    private static compareColumns;
    private static generateStepsSQL;
    private static generateCreateTableSQL;
    private static generateAddColumnSQL;
    private static generateModifyColumnSQL;
    private static formatDefaultValue;
}
