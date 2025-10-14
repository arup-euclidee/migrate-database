// validators/cross-table-validator.ts
import { DatabaseSchema, Table, ValidationContext, ValidationResult, ColumnInfo } from './types/schema-types';
import { TYPE_COMPATIBILITY } from './validation-rules';

export function validateCrossTableRelations(
  schema: DatabaseSchema, 
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  schema.forEach((table: Table) => {
    if (!table.relations) return;

    table.relations.forEach((relation, relationIndex: number) => {
      const relationPath = `table "${table.name}".relations[${relationIndex}]`;
      const { reference } = relation;

      // Check if referenced table exists
      if (!context.tableNames.has(reference.table)) {
        errors.push(`${relationPath}: Referenced table "${reference.table}" does not exist`);
        return;
      }

      const sourceColumns = context.tableColumns.get(table.name);
      const targetColumns = context.tableColumns.get(reference.table);

      if (!sourceColumns || !targetColumns) return;

      // Validate column compatibility
      for (let i = 0; i < relation.columns.length; i++) {
        const sourceCol = relation.columns[i];
        const targetCol = reference.columns[i];

        if (!sourceColumns[sourceCol]) continue;
        if (!targetColumns[targetCol]) continue;

        const sourceType = sourceColumns[sourceCol].type.split('(')[0].toUpperCase();
        const targetType = targetColumns[targetCol].type.split('(')[0].toUpperCase();

        // Type compatibility check
        if (!areTypesCompatible(sourceType, targetType)) {
          errors.push(`${relationPath}: Type mismatch - "${sourceCol}" (${sourceType}) vs "${targetCol}" (${targetType})`);
        }

        // Size compatibility check
        const sourceSize = extractSize(sourceColumns[sourceCol].type);
        const targetSize = extractSize(targetColumns[targetCol].type);
        
        if (sourceSize && targetSize && sourceSize > targetSize) {
          warnings.push(`${relationPath}: Size mismatch - "${sourceCol}" (${sourceSize}) may be larger than "${targetCol}" (${targetSize})`);
        }
      }

      // Check if referenced columns form a key
      const isTargetPrimaryKey = reference.columns.every(col => {
        const column = targetColumns[col] as ColumnInfo;
        return column && column.primaryKey;
      });
      
      if (!isTargetPrimaryKey) {
        warnings.push(`${relationPath}: Referenced columns [${reference.columns.join(', ')}] in table "${reference.table}" are not a primary key`);
      }
    });
  });

  // Check for circular dependencies
  const circularErrors = findCircularDependencies(schema, context);
  errors.push(...circularErrors);

  return { 
    errors, 
    warnings, 
    isValid: errors.length === 0,
    summary: { tables: 0, columns: 0, indexes: 0, relations: 0, constraints: 0 }
  };
}

function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === targetType) return true;
  
  const compatibleTypes = TYPE_COMPATIBILITY[sourceType] || [];
  return compatibleTypes.includes(targetType as any);
}

function extractSize(typeString: string): number | null {
  const match = typeString.match(/\((\d+)\)/);
  return match ? parseInt(match[1]) : null;
}

function findCircularDependencies(schema: DatabaseSchema, context: ValidationContext): string[] {
  const errors: string[] = [];
  const graph = new Map<string, Set<string>>();

  // Build dependency graph
  schema.forEach((table: Table) => {
    graph.set(table.name, new Set());
    if (table.relations) {
      table.relations.forEach(relation => {
        graph.get(table.name)!.add(relation.reference.table);
      });
    }
  });

  // Check for cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(tableName: string): boolean {
    if (recursionStack.has(tableName)) return true;
    if (visited.has(tableName)) return false;

    visited.add(tableName);
    recursionStack.add(tableName);

    const dependencies = graph.get(tableName);
    if (dependencies) {
      for (const dep of dependencies) {
        if (detectCycle(dep)) {
          errors.push(`Circular dependency detected involving tables: ${Array.from(recursionStack).join(' -> ')} -> ${dep}`);
          return true;
        }
      }
    }

    recursionStack.delete(tableName);
    return false;
  }

  for (const tableName of graph.keys()) {
    detectCycle(tableName);
  }

  return errors;
}