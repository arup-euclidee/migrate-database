"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConstraints = validateConstraints;
const validation_rules_1 = require("./validation-rules");
function validateConstraints(constraints, tableName, context) {
    const errors = [];
    const warnings = [];
    const tableColumns = context.tableColumns.get(tableName) || {};
    const constraintNames = new Set();
    if (!Array.isArray(constraints)) {
        errors.push(`table "${tableName}": Constraints must be an array`);
        return {
            errors,
            warnings,
            isValid: false,
            summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: constraints?.length }
        };
    }
    constraints.forEach((constraint, constraintIndex) => {
        const constraintPath = `table "${tableName}".constraints[${constraintIndex}]`;
        // Basic validation
        if (!constraint.type) {
            errors.push(`${constraintPath}: Constraint type is required`);
            return;
        }
        if (!constraint.columns || !Array.isArray(constraint.columns) || constraint.columns.length === 0) {
            errors.push(`${constraintPath}: Constraint must specify columns`);
            return;
        }
        // Type validation
        if (!validation_rules_1.VALID_CONSTRAINT_TYPES.includes(constraint.type)) {
            errors.push(`${constraintPath}: Invalid constraint type "${constraint.type}". Valid types: ${validation_rules_1.VALID_CONSTRAINT_TYPES.join(', ')}`);
        }
        // Name validation
        if (constraint.name) {
            if (!validation_rules_1.NAME_PATTERN.test(constraint.name)) {
                errors.push(`${constraintPath}: Constraint name must contain only letters, numbers, and underscores`);
            }
            if (constraintNames.has(constraint.name)) {
                errors.push(`${constraintPath}: Duplicate constraint name "${constraint.name}"`);
            }
            constraintNames.add(constraint.name);
        }
        // Column existence validation
        constraint.columns.forEach((columnName) => {
            if (!tableColumns[columnName]) {
                errors.push(`${constraintPath}: Column "${columnName}" does not exist in table`);
            }
        });
        // Type-specific validation
        if (constraint.type === 'CHECK' && !constraint.condition) {
            errors.push(`${constraintPath}: CHECK constraint requires a condition`);
        }
        if (constraint.type === 'FOREIGN KEY' && !constraint.reference) {
            errors.push(`${constraintPath}: FOREIGN KEY constraint requires a reference`);
        }
        // Unique constraint on nullable columns
        if (constraint.type === 'UNIQUE') {
            const nullableColumns = constraint.columns.filter(col => {
                const column = tableColumns[col];
                return column && column.nullable;
            });
            if (nullableColumns.length > 0) {
                warnings.push(`${constraintPath}: UNIQUE constraint on nullable columns [${nullableColumns.join(', ')}] - multiple NULL values are allowed`);
            }
        }
    });
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: constraints.length }
    };
}
