"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE_COMPATIBILITY = exports.VALID_CONSTRAINT_TYPES = exports.VALID_ACTIONS = exports.VALID_RELATION_TYPES = exports.TYPE_DEFAULT_COMPATIBILITY = exports.REQUIRES_LENGTH = exports.NO_DEFAULT_FOR_PK = exports.ALLOWED_TYPES = exports.RESERVED_KEYWORDS = exports.NAME_PATTERN = void 0;
// constants/validation-rules.ts
exports.NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
exports.RESERVED_KEYWORDS = [
    'USER', 'TABLE', 'DATABASE', 'SCHEMA', 'COLUMN', 'INDEX',
    'PRIMARY', 'FOREIGN', 'KEY', 'SELECT', 'INSERT', 'UPDATE',
    'DELETE', 'DROP', 'CREATE', 'ALTER', 'REFERENCES', 'CONSTRAINT'
];
exports.ALLOWED_TYPES = [
    'SERIAL', 'BIGSERIAL', 'INT', 'BIGINT', 'SMALLINT', 'INTEGER',
    'VARCHAR', 'CHAR', 'TEXT', 'UUID',
    'BOOLEAN', 'BOOL',
    'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'INTERVAL',
    'JSON', 'JSONB', 'BYTEA'
];
exports.NO_DEFAULT_FOR_PK = ['SERIAL', 'BIGSERIAL'];
exports.REQUIRES_LENGTH = ['VARCHAR', 'CHAR'];
exports.TYPE_DEFAULT_COMPATIBILITY = {
    'SERIAL': ['NULL'],
    'INT': ['NULL', '0', '1', '-1'],
    'VARCHAR': ['NULL', 'EMPTY_STRING'],
    'BOOLEAN': ['TRUE', 'FALSE', 'NULL'],
    'TIMESTAMP': ['NOW', 'CURRENT_TIMESTAMP', 'NULL'],
    'UUID': ['NULL', 'UUID_GENERATE_V4']
};
exports.VALID_RELATION_TYPES = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];
exports.VALID_ACTIONS = ['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'];
exports.VALID_CONSTRAINT_TYPES = ['UNIQUE', 'CHECK', 'FOREIGN KEY', 'PRIMARY KEY'];
exports.TYPE_COMPATIBILITY = {
    'INT': ['SERIAL', 'BIGINT', 'INTEGER'],
    'SERIAL': ['INT', 'BIGINT'],
    'UUID': ['UUID'],
    'VARCHAR': ['TEXT', 'CHAR', 'VARCHAR'],
    'CHAR': ['VARCHAR', 'CHAR', 'TEXT']
};
