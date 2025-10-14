"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRelations = validateRelations;
const validation_rules_1 = require("./validation-rules");
function validateRelations(relations, tableName, context) {
    const errors = [];
    const warnings = [];
    const tableColumns = context.tableColumns.get(tableName) || {};
    if (!Array.isArray(relations)) {
        errors.push(`table "${tableName}": Relations must be an array`);
        return {
            errors,
            warnings,
            isValid: false,
            summary: { tables: 0, columns: 0, indexes: 0, relations: relations.length, constraints: 0 }
        };
    }
    relations.forEach((relation, relationIndex) => {
        const relationPath = `table "${tableName}".relations[${relationIndex}]`;
        // Basic structure validation
        if (!relation.type) {
            errors.push(`${relationPath}: Relation type is required`);
            return;
        }
        if (!relation.columns || !Array.isArray(relation.columns) || relation.columns.length === 0) {
            errors.push(`${relationPath}: Relation must specify columns`);
            return;
        }
        if (!relation.reference) {
            errors.push(`${relationPath}: Relation must specify reference`);
            return;
        }
        const { reference } = relation;
        if (!reference.table) {
            errors.push(`${relationPath}: Reference table is required`);
            return;
        }
        if (!reference.columns || !Array.isArray(reference.columns) || reference.columns.length === 0) {
            errors.push(`${relationPath}: Reference columns are required`);
            return;
        }
        // Type validation
        if (!validation_rules_1.VALID_RELATION_TYPES.includes(relation.type)) {
            errors.push(`${relationPath}: Invalid relation type "${relation.type}". Valid types: ${validation_rules_1.VALID_RELATION_TYPES.join(', ')}`);
        }
        // Action validation
        if (relation.onDelete && !validation_rules_1.VALID_ACTIONS.includes(relation.onDelete)) {
            errors.push(`${relationPath}: Invalid onDelete action "${relation.onDelete}". Valid actions: ${validation_rules_1.VALID_ACTIONS.join(', ')}`);
        }
        if (relation.onUpdate && !validation_rules_1.VALID_ACTIONS.includes(relation.onUpdate)) {
            errors.push(`${relationPath}: Invalid onUpdate action "${relation.onUpdate}". Valid actions: ${validation_rules_1.VALID_ACTIONS.join(', ')}`);
        }
        // Column existence validation
        relation.columns.forEach((columnName) => {
            if (!tableColumns[columnName]) {
                errors.push(`${relationPath}: Column "${columnName}" does not exist in table "${tableName}"`);
            }
        });
        // SET NULL validation
        if ((relation.onDelete === 'SET NULL' || relation.onUpdate === 'SET NULL')) {
            relation.columns.forEach((columnName) => {
                const column = tableColumns[columnName];
                if (column && !column.nullable) {
                    errors.push(`${relationPath}: Column "${columnName}" must be nullable for SET NULL action`);
                }
            });
        }
        // CASCADE warning
        if (relation.onDelete === 'CASCADE') {
            warnings.push(`${relationPath}: CASCADE delete may lead to unexpected data loss`);
        }
        // Column count matching
        if (relation.columns.length !== reference.columns.length) {
            errors.push(`${relationPath}: Number of local columns (${relation.columns.length}) must match number of reference columns (${reference.columns.length})`);
        }
    });
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: relations.length, constraints: 0 }
    };
}
