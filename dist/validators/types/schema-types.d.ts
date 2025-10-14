export type ColumnType = 'SERIAL' | 'BIGSERIAL' | 'INT' | 'BIGINT' | 'SMALLINT' | 'INTEGER' | 'VARCHAR' | 'CHAR' | 'TEXT' | 'UUID' | 'BOOLEAN' | 'BOOL' | 'DECIMAL' | 'NUMERIC' | 'REAL' | 'DOUBLE PRECISION' | 'TIMESTAMP' | 'TIMESTAMPTZ' | 'DATE' | 'TIME' | 'INTERVAL' | 'JSON' | 'JSONB' | 'BYTEA';
export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
export type ActionType = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
export type ConstraintType = 'UNIQUE' | 'CHECK' | 'FOREIGN KEY' | 'PRIMARY KEY';
export interface Column {
    name: string;
    type: string;
    primaryKey?: boolean;
    nullable?: boolean;
    defaultValue?: string;
}
export interface Index {
    name: string;
    columns: string[];
    unique?: boolean;
    where?: string;
}
export interface RelationReference {
    table: string;
    columns: string[];
}
export interface Relation {
    type: RelationType;
    columns: string[];
    reference: RelationReference;
    onDelete?: ActionType;
    onUpdate?: ActionType;
}
export interface Constraint {
    type: ConstraintType;
    name?: string;
    columns: string[];
    condition?: string;
    reference?: RelationReference;
}
export interface Table {
    name: string;
    columns: Column[];
    indexes?: Index[];
    relations?: Relation[];
    constraints?: Constraint[];
}
export type DatabaseSchema = Table[];
export interface ValidationContext {
    tableNames: Set<string>;
    tableColumns: Map<string, Record<string, ColumnInfo>>;
    tableIndexes: Map<string, Index[]>;
    tableRelations: Map<string, Relation[]>;
}
export interface ColumnInfo {
    type: string;
    primaryKey: boolean;
    nullable: boolean;
    defaultValue?: string;
    unique?: boolean;
}
export interface ValidationResult {
    errors: string[];
    warnings: string[];
    isValid: boolean;
    summary: ValidationSummary;
}
export interface ValidationSummary {
    tables: number;
    columns: number;
    indexes: number;
    relations: number;
    constraints: number;
}
export declare function isColumnType(type: string): type is ColumnType;
export declare function isRelationType(type: string): type is RelationType;
export declare function isActionType(type: string): type is ActionType;
export declare function isConstraintType(type: string): type is ConstraintType;
