// validators/table-structure-validator.ts
import { Table, ValidationResult } from './types/schema-types';
import { NAME_PATTERN, RESERVED_KEYWORDS } from './validation-rules';

export function validateTableStructure(table: Table, tableIndex: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tablePath = `tables[${tableIndex}] "${table.name || 'unnamed'}"`;

  // Required fields
  if (!table.name) {
    errors.push(`${tablePath}: Table name is required`);
    return { errors, warnings, isValid: false, summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 } };
  }

  // Name validation
  if (!NAME_PATTERN.test(table.name)) {
    errors.push(`${tablePath}: Table name must contain only letters, numbers, and underscores, starting with a letter or underscore`);
  }

  if (RESERVED_KEYWORDS.includes(table.name.toUpperCase() as any)) {
    errors.push(`${tablePath}: Table name "${table.name}" is a reserved SQL keyword`);
  }

  if (table.name.length > 63) {
    warnings.push(`${tablePath}: Table name exceeds 63 characters (PostgreSQL limit)`);
  }

  // Structure validation
  if (!table.columns || !Array.isArray(table.columns)) {
    errors.push(`${tablePath}: Table must have a "columns" array`);
  } else if (table.columns.length === 0) {
    warnings.push(`${tablePath}: Table has no columns`);
  }

  // Validate optional arrays
  (['indexes', 'relations', 'constraints'] as const).forEach((prop: keyof Table) => {
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