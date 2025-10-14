"use strict";
// types/schema-types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isColumnType = isColumnType;
exports.isRelationType = isRelationType;
exports.isActionType = isActionType;
exports.isConstraintType = isConstraintType;
// Type guards for runtime type checking
function isColumnType(type) {
    const allowedTypes = [
        'SERIAL', 'BIGSERIAL', 'INT', 'BIGINT', 'SMALLINT', 'INTEGER',
        'VARCHAR', 'CHAR', 'TEXT', 'UUID',
        'BOOLEAN', 'BOOL',
        'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
        'TIMESTAMP', 'TIMESTAMPTZ', 'DATE', 'TIME', 'INTERVAL',
        'JSON', 'JSONB', 'BYTEA'
    ];
    return allowedTypes.includes(type.toUpperCase());
}
function isRelationType(type) {
    const validTypes = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];
    return validTypes.includes(type);
}
function isActionType(type) {
    const validActions = ['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'];
    return validActions.includes(type);
}
function isConstraintType(type) {
    const validTypes = ['UNIQUE', 'CHECK', 'FOREIGN KEY', 'PRIMARY KEY'];
    return validTypes.includes(type);
}
