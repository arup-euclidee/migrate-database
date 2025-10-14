// types/schema-types.ts

// Strict literal types for better TypeScript support
export type ColumnType = 
  | 'SERIAL' | 'BIGSERIAL' | 'INT' | 'BIGINT' | 'SMALLINT' | 'INTEGER'
  | 'VARCHAR' | 'CHAR' | 'TEXT' | 'UUID'
  | 'BOOLEAN' | 'BOOL'
  | 'DECIMAL' | 'NUMERIC' | 'REAL' | 'DOUBLE PRECISION'
  | 'TIMESTAMP' | 'TIMESTAMPTZ' | 'DATE' | 'TIME' | 'INTERVAL'
  | 'JSON' | 'JSONB' | 'BYTEA';

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
export type ActionType = 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION';
export type ConstraintType = 'UNIQUE' | 'CHECK' | 'FOREIGN KEY' | 'PRIMARY KEY';

// Column definition with strict types
export interface Column {
  name: string;
  type: string; // Contains type with optional length, e.g., "VARCHAR(255)"
  primaryKey?: boolean;
  nullable?: boolean;
  defaultValue?: string;
}

// Index definition
export interface Index {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string; // For partial indexes
}

// Relation reference
export interface RelationReference {
  table: string;
  columns: string[];
}

// Relation definition
export interface Relation {
  type: RelationType;
  columns: string[];
  reference: RelationReference;
  onDelete?: ActionType;
  onUpdate?: ActionType;
}

// Constraint definition
export interface Constraint {
  type: ConstraintType;
  name?: string;
  columns: string[];
  condition?: string; // For CHECK constraints
  reference?: RelationReference; // For FOREIGN KEY constraints
}

// Table definition
export interface Table {
  name: string;
  columns: Column[];
  indexes?: Index[];
  relations?: Relation[];
  constraints?: Constraint[];
}

// Complete schema
export type DatabaseSchema = Table[];

// Validation context with proper typing
export interface ValidationContext {
  tableNames: Set<string>;
  tableColumns: Map<string, Record<string, ColumnInfo>>;
  tableIndexes: Map<string, Index[]>;
  tableRelations: Map<string, Relation[]>;
}

// Column information for validation
export interface ColumnInfo {
  type: string;
  primaryKey: boolean;
  nullable: boolean;
  defaultValue?: string;
  unique?: boolean;
}

// Validation result
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

// Type guards for runtime type checking
export function isColumnType(type: string): type is ColumnType {
  const allowedTypes = [
    'SERIAL', 'BIGSERIAL', 'INT', 'BIGINT', 'SMALLINT', 'INTEGER',
    'VARCHAR', 'CHAR', 'TEXT', 'UUID',
    'BOOLEAN', 'BOOL',
    'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'INTERVAL',
    'JSON', 'JSONB', 'BYTEA'
  ];
  return allowedTypes.includes(type.toUpperCase() as ColumnType);
}

export function isRelationType(type: string): type is RelationType {
  const validTypes = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];
  return validTypes.includes(type);
}

export function isActionType(type: string): type is ActionType {
  const validActions = ['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'];
  return validActions.includes(type);
}

export function isConstraintType(type: string): type is ConstraintType {
  const validTypes = ['UNIQUE', 'CHECK', 'FOREIGN KEY', 'PRIMARY KEY'];
  return validTypes.includes(type);
}