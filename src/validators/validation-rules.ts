// constants/validation-rules.ts
export const NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const RESERVED_KEYWORDS = [
    'USER', 'TABLE', 'DATABASE', 'SCHEMA', 'COLUMN', 'INDEX',
    'PRIMARY', 'FOREIGN', 'KEY', 'SELECT', 'INSERT', 'UPDATE',
    'DELETE', 'DROP', 'CREATE', 'ALTER', 'REFERENCES', 'CONSTRAINT'
] as const;

export const ALLOWED_TYPES = [
    'SERIAL', 'BIGSERIAL', 'INT', 'BIGINT', 'SMALLINT', 'INTEGER',
    'VARCHAR', 'CHAR', 'TEXT', 'UUID',
    'BOOLEAN', 'BOOL',
    'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'INTERVAL',
    'JSON', 'JSONB', 'BYTEA'
] as const;

export const NO_DEFAULT_FOR_PK = ['SERIAL', 'BIGSERIAL'] as const;
export const REQUIRES_LENGTH = ['VARCHAR', 'CHAR'] as const;

export const TYPE_DEFAULT_COMPATIBILITY: Record<string, readonly string[]> = {
    'SERIAL': ['NULL'],
    'INT': ['NULL', '0', '1', '-1'],
    'VARCHAR': ['NULL', 'EMPTY_STRING'],
    'BOOLEAN': ['TRUE', 'FALSE', 'NULL'],
    'TIMESTAMP': ['NOW', 'CURRENT_TIMESTAMP', 'NULL'],
    'UUID': ['NULL', 'UUID_GENERATE_V4']
} as const;

export const VALID_RELATION_TYPES = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'] as const;
export const VALID_ACTIONS = ['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'] as const;
export const VALID_CONSTRAINT_TYPES = ['UNIQUE', 'CHECK', 'FOREIGN KEY', 'PRIMARY KEY'] as const;

export const TYPE_COMPATIBILITY: Record<string, readonly string[]> = {
    'INT': ['SERIAL', 'BIGINT', 'INTEGER'],
    'SERIAL': ['INT', 'BIGINT'],
    'UUID': ['UUID'],
    'VARCHAR': ['TEXT', 'CHAR', 'VARCHAR'],
    'CHAR': ['VARCHAR', 'CHAR', 'TEXT']
} as const;