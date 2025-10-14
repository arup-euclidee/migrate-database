// validators/constraint-validator.ts
import { Constraint, ValidationContext, ValidationResult, ColumnInfo } from './types/schema-types';
import { NAME_PATTERN, VALID_CONSTRAINT_TYPES } from './validation-rules';

export function validateConstraints(
  constraints: Constraint[],
  tableName: string,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tableColumns = context.tableColumns.get(tableName) || {};
  const constraintNames = new Set<string>();

  if (!Array.isArray(constraints)) {
    errors.push(`table "${tableName}": Constraints must be an array`);
    return createValidationResult(errors, warnings, 0, 0, 0, 0, constraints?.length || 0);
  }

  constraints.forEach((constraint: Constraint, constraintIndex: number) => {
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
    if (!VALID_CONSTRAINT_TYPES.includes(constraint.type)) {
      errors.push(`${constraintPath}: Invalid constraint type "${constraint.type}". Valid types: ${VALID_CONSTRAINT_TYPES.join(', ')}`);
    }

    // Name validation
    if (constraint.name) {
      if (!NAME_PATTERN.test(constraint.name)) {
        errors.push(`${constraintPath}: Constraint name must contain only letters, numbers, and underscores`);
      }

      if (constraintNames.has(constraint.name)) {
        errors.push(`${constraintPath}: Duplicate constraint name "${constraint.name}"`);
      }
      constraintNames.add(constraint.name);
    }

    // Column existence validation
    constraint.columns.forEach((columnName: string) => {
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
        const column = tableColumns[col] as ColumnInfo;
        return column && column.nullable;
      });
      if (nullableColumns.length > 0) {
        warnings.push(`${constraintPath}: UNIQUE constraint on nullable columns [${nullableColumns.join(', ')}] - multiple NULL values are allowed`);
      }
    }
  });

  return createValidationResult(errors, warnings, 0, 0, 0, 0, constraints.length);
}

// Helper function to create consistent validation results
function createValidationResult(
  errors: string[],
  warnings: string[],
  tables: number,
  columns: number,
  indexes: number,
  relations: number,
  constraints: number
): ValidationResult {
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    summary: { tables, columns, indexes, relations, constraints }
  };
}