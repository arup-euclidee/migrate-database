// validators/column-validator.ts
import { Column, ColumnInfo, ValidationContext, ValidationResult } from './types/schema-types';
import { ALLOWED_TYPES, NAME_PATTERN, NO_DEFAULT_FOR_PK, REQUIRES_LENGTH, RESERVED_KEYWORDS, TYPE_DEFAULT_COMPATIBILITY } from './validation-rules';

export function validateColumns(
  columns: Column[],
  tableName: string,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const columnNames = new Set<string>();
  let primaryKeyCount = 0;

  columns.forEach((column: Column, columnIndex: number) => {
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
    if (!NAME_PATTERN.test(column.name)) {
      errors.push(`${columnPath}: Column name must contain only letters, numbers, and underscores, starting with a letter or underscore`);
    }

    if (RESERVED_KEYWORDS.includes(column.name.toUpperCase() as any)) {
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
  } else if (primaryKeyCount > 1) {
    warnings.push(`table "${tableName}": Multiple primary keys will create a composite primary key`);
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    summary: { tables: 0, columns: columns.length, indexes: 0, relations: 0, constraints: 0 }
  };
}

function validateColumnType(column: Column, baseType: string, columnPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ALLOWED_TYPES.includes(baseType as any)) {
    errors.push(`${columnPath}: Invalid type "${column.type}". Allowed: ${ALLOWED_TYPES.join(', ')}`);
    return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
  }

  // Length requirement validation
  if (REQUIRES_LENGTH.includes(baseType as any)) {
    const match = column.type.match(/\((\d+)\)/);
    if (!match) {
      errors.push(`${columnPath}: Type "${baseType}" requires length specification (e.g., VARCHAR(255))`);
    } else {
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

function validatePrimaryKey(column: Column, baseType: string, columnPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (column.nullable === true) {
    errors.push(`${columnPath}: Primary key cannot be nullable`);
  }

  if (column.defaultValue && NO_DEFAULT_FOR_PK.includes(baseType as any)) {
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

function validateDefaultValue(column: Column, baseType: string, columnPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type guard to ensure defaultValue is string
  if (typeof column.defaultValue !== 'string') {
    errors.push(`${columnPath}: Default value must be a string`);
    return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
  }

  const defaultValue = column.defaultValue;
  const defaultValueUpper = defaultValue.toUpperCase();
  const allowedDefaults = TYPE_DEFAULT_COMPATIBILITY[baseType] || [];

  // Check if default value is compatible with type
  let isCompatible = allowedDefaults.some(pattern =>
    defaultValueUpper === pattern ||
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