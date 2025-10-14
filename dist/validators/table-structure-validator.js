"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTableStructure = validateTableStructure;
const validation_rules_1 = require("./validation-rules");
function validateTableStructure(table, tableIndex) {
    const errors = [];
    const warnings = [];
    const tablePath = `tables[${tableIndex}] "${table.name || 'unnamed'}"`;
    // Required fields
    if (!table.name) {
        errors.push(`${tablePath}: Table name is required`);
        return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
    }
    // Name validation
    if (!validation_rules_1.NAME_PATTERN.test(table.name)) {
        errors.push(`${tablePath}: Table name must contain only letters, numbers, and underscores, starting with a letter or underscore`);
    }
    if (validation_rules_1.RESERVED_KEYWORDS.includes(table.name.toUpperCase())) {
        errors.push(`${tablePath}: Table name "${table.name}" is a reserved SQL keyword`);
    }
    if (table.name.length > 63) {
        warnings.push(`${tablePath}: Table name exceeds 63 characters (PostgreSQL limit)`);
    }
    // Structure validation
    if (!table.columns || !Array.isArray(table.columns)) {
        errors.push(`${tablePath}: Table must have a "columns" array`);
    }
    else if (table.columns.length === 0) {
        warnings.push(`${tablePath}: Table has no columns`);
    }
    // Validate optional arrays
    ['indexes', 'relations', 'constraints'].forEach((prop) => {
        if (table[prop] && !Array.isArray(table[prop])) {
            errors.push(`${tablePath}: "${prop}" must be an array if provided`);
        }
    });
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 }
    };
}
