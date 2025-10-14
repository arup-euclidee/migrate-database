"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIndexes = validateIndexes;
const validation_rules_1 = require("./validation-rules");
function validateIndexes(indexes, tableName, context) {
    const errors = [];
    const warnings = [];
    const indexNames = new Set();
    const tableColumns = context.tableColumns.get(tableName) || {};
    if (!Array.isArray(indexes)) {
        errors.push(`table "${tableName}": Indexes must be an array`);
        return {
            errors,
            warnings,
            isValid: false,
            summary: { tables: 0, columns: 0, indexes: indexes.length, relations: 0, constraints: 0 }
        };
    }
    indexes.forEach((index, indexIndex) => {
        const indexPath = `table "${tableName}".indexes[${indexIndex}]`;
        // Basic validation
        if (!index.name) {
            errors.push(`${indexPath}: Index name is required`);
            return;
        }
        if (!index.columns || !Array.isArray(index.columns) || index.columns.length === 0) {
            errors.push(`${indexPath}: Index must have at least one column`);
            return;
        }
        // Name validation
        if (!validation_rules_1.NAME_PATTERN.test(index.name)) {
            errors.push(`${indexPath}: Index name must contain only letters, numbers, and underscores`);
        }
        if (validation_rules_1.RESERVED_KEYWORDS.includes(index.name.toUpperCase())) {
            warnings.push(`${indexPath}: Index name "${index.name}" is a reserved SQL keyword`);
        }
        if (indexNames.has(index.name)) {
            errors.push(`${indexPath}: Duplicate index name "${index.name}"`);
        }
        indexNames.add(index.name);
        // Column validation
        index.columns.forEach((columnName) => {
            if (!tableColumns[columnName]) {
                errors.push(`${indexPath}: Column "${columnName}" does not exist in table`);
            }
            else {
                // Type-specific index warnings
                const columnType = tableColumns[columnName].type.toUpperCase();
                if (columnType.includes('TEXT') && !index.unique) {
                    warnings.push(`${indexPath}: Indexing TEXT column "${columnName}" may have performance implications`);
                }
                if (columnType.includes('JSON')) {
                    warnings.push(`${indexPath}: Consider using JSONB and GIN indexes for JSON column "${columnName}"`);
                }
            }
        });
        // Multi-column index validation
        if (index.columns.length > 1) {
            warnings.push(`${indexPath}: Multi-column index on [${index.columns.join(', ')}] - consider column order for query performance`);
        }
        // Partial index validation
        if (index.where) {
            if (typeof index.where !== 'string') {
                errors.push(`${indexPath}: Partial index "where" condition must be a string`);
            }
            else {
                warnings.push(`${indexPath}: Partial index with condition: ${index.where}`);
            }
        }
        // Unique index validation
        if (index.unique) {
            index.columns.forEach((columnName) => {
                const column = tableColumns[columnName];
                if (column && column.nullable) {
                    warnings.push(`${indexPath}: Unique index on nullable column "${columnName}" - multiple NULL values are allowed`);
                }
            });
        }
    });
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: indexes.length, relations: 0, constraints: 0 }
    };
}
