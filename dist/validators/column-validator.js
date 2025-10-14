"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateColumns = validateColumns;
const validation_rules_1 = require("./validation-rules");
function validateColumns(columns, tableName, context) {
    const errors = [];
    const warnings = [];
    const columnNames = new Set();
    let primaryKeyCount = 0;
    columns.forEach((column, columnIndex) => {
        const columnPath = `table "${tableName}".columns[${columnIndex}] "${column.name || 'unnamed'}"`;
        // Basic structure validation
        if (!column.name) {
            errors.push(`${columnPath}: Column name is required`);
            return;
        }
        if (!column.type) {
            errors.push(`${columnPath}: Column type is required`);
            return;
        }
        // Name validation
        if (!validation_rules_1.NAME_PATTERN.test(column.name)) {
            errors.push(`${columnPath}: Column name must contain only letters, numbers, and underscores, starting with a letter or underscore`);
        }
        if (validation_rules_1.RESERVED_KEYWORDS.includes(column.name.toUpperCase())) {
            errors.push(`${columnPath}: Column name "${column.name}" is a reserved SQL keyword`);
        }
        if (columnNames.has(column.name)) {
            errors.push(`${columnPath}: Duplicate column name "${column.name}"`);
        }
        columnNames.add(column.name);
        // Type validation
        const baseType = column.type.split('(')[0].toUpperCase();
        const typeValidation = validateColumnType(column, baseType, columnPath);
        errors.push(...typeValidation.errors);
        warnings.push(...typeValidation.warnings);
        // Primary key validation
        if (column.primaryKey) {
            primaryKeyCount++;
            const pkValidation = validatePrimaryKey(column, baseType, columnPath);
            errors.push(...pkValidation.errors);
            warnings.push(...pkValidation.warnings);
        }
        // Default value validation
        if (column.defaultValue !== undefined) {
            const defaultValueValidation = validateDefaultValue(column, baseType, columnPath);
            errors.push(...defaultValueValidation.errors);
            warnings.push(...defaultValueValidation.warnings);
        }
        // Nullability validation
        if (column.nullable === false && column.defaultValue === undefined) {
            warnings.push(`${columnPath}: Non-nullable column without default value may cause insertion issues`);
        }
    });
    // Primary key count validation
    if (primaryKeyCount === 0) {
        warnings.push(`table "${tableName}": No primary key defined`);
    }
    else if (primaryKeyCount > 1) {
        warnings.push(`table "${tableName}": Multiple primary keys will create a composite primary key`);
    }
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: columns.length, indexes: 0, relations: 0, constraints: 0 }
    };
}
function validateColumnType(column, baseType, columnPath) {
    const errors = [];
    const warnings = [];
    if (!validation_rules_1.ALLOWED_TYPES.includes(baseType)) {
        errors.push(`${columnPath}: Invalid type "${column.type}". Allowed: ${validation_rules_1.ALLOWED_TYPES.join(', ')}`);
        return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
    }
    // Length requirement validation
    if (validation_rules_1.REQUIRES_LENGTH.includes(baseType)) {
        const match = column.type.match(/\((\d+)\)/);
        if (!match) {
            errors.push(`${columnPath}: Type "${baseType}" requires length specification (e.g., VARCHAR(255))`);
        }
        else {
            const length = parseInt(match[1]);
            if (length <= 0) {
                errors.push(`${columnPath}: Length must be positive`);
            }
        }
    }
    // Type-specific warnings
    if (baseType === 'SERIAL' && column.defaultValue) {
        warnings.push(`${columnPath}: SERIAL columns automatically generate values, default may be ignored`);
    }
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 }
    };
}
function validatePrimaryKey(column, baseType, columnPath) {
    const errors = [];
    const warnings = [];
    if (column.nullable === true) {
        errors.push(`${columnPath}: Primary key cannot be nullable`);
    }
    if (column.defaultValue && validation_rules_1.NO_DEFAULT_FOR_PK.includes(baseType)) {
        errors.push(`${columnPath}: Type "${baseType}" as primary key cannot have default value`);
    }
    if (baseType === 'TEXT' || baseType === 'JSON' || baseType === 'JSONB') {
        warnings.push(`${columnPath}: Using "${baseType}" as primary key may have performance implications`);
    }
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 }
    };
}
function validateDefaultValue(column, baseType, columnPath) {
    const errors = [];
    const warnings = [];
    // Type guard to ensure defaultValue is string
    if (typeof column.defaultValue !== 'string') {
        errors.push(`${columnPath}: Default value must be a string`);
        return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
    }
    const defaultValue = column.defaultValue;
    const defaultValueUpper = defaultValue.toUpperCase();
    const allowedDefaults = validation_rules_1.TYPE_DEFAULT_COMPATIBILITY[baseType] || [];
    // Check if default value is compatible with type
    let isCompatible = allowedDefaults.some(pattern => defaultValueUpper === pattern ||
        defaultValueUpper.startsWith(pattern + '(') ||
        /^-?\d+(\.\d+)?$/.test(defaultValue) || // Numbers
        /^'.*'$/.test(defaultValue) // Strings
    );
    if (!isCompatible) {
        warnings.push(`${columnPath}: Default value "${defaultValue}" may not be compatible with type "${baseType}"`);
    }
    // Specific validations
    if (baseType === 'BOOLEAN' && !['TRUE', 'FALSE', 'NULL'].includes(defaultValueUpper)) {
        errors.push(`${columnPath}: Boolean columns can only have TRUE, FALSE, or NULL as default`);
    }
    if ((baseType === 'SERIAL' || baseType === 'BIGSERIAL') && defaultValueUpper !== 'NULL') {
        warnings.push(`${columnPath}: ${baseType} columns usually don't need default values`);
    }
    return {
        errors,
        warnings,
        isValid: errors.length === 0,
        summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 }
    };
}
