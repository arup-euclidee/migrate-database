// validators/index-validator.ts
import { Index, ValidationContext, ValidationResult, ColumnInfo } from './types/schema-types';
import { NAME_PATTERN, RESERVED_KEYWORDS } from './validation-rules';

export function validateIndexes(
  indexes: Index[], 
  tableName: string, 
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const indexNames = new Set<string>();
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

  indexes.forEach((index: Index, indexIndex: number) => {
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
    if (!NAME_PATTERN.test(index.name)) {
      errors.push(`${indexPath}: Index name must contain only letters, numbers, and underscores`);
    }

    if (RESERVED_KEYWORDS.includes(index.name.toUpperCase() as any)) {
      warnings.push(`${indexPath}: Index name "${index.name}" is a reserved SQL keyword`);
    }

    if (indexNames.has(index.name)) {
      errors.push(`${indexPath}: Duplicate index name "${index.name}"`);
    }
    indexNames.add(index.name);

    // Column validation
    index.columns.forEach((columnName: string) => {
      if (!tableColumns[columnName]) {
        errors.push(`${indexPath}: Column "${columnName}" does not exist in table`);
      } else {
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
      } else {
        warnings.push(`${indexPath}: Partial index with condition: ${index.where}`);
      }
    }

    // Unique index validation
    if (index.unique) {
      index.columns.forEach((columnName: string) => {
        const column = tableColumns[columnName] as ColumnInfo;
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