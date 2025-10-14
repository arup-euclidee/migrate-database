// validation-orchestrator.ts
import { validateIndexes } from './index-validator';
import { validateColumns } from './column-validator';
import { validateRelations } from './relation-validator';
import { validateConstraints } from './constraint-validator';
import { validateTableStructure } from './table-structure-validator';
import { validateCrossTableRelations } from './cross-table-validator';
import { DatabaseSchema, Table, ValidationContext, ValidationResult } from './types/schema-types';

export class SchemaValidator {
    private schema: DatabaseSchema;
    private errors: string[] = [];
    private warnings: string[] = [];
    private context: ValidationContext = {
        tableNames: new Set(),
        tableColumns: new Map(),
        tableIndexes: new Map(),
        tableRelations: new Map()
    };

    constructor(schema: DatabaseSchema) {
        this.schema = schema;
    }

    validate(): ValidationResult {
        this.collectContext();

        // Phase 1: Individual table validation
        this.schema.forEach((table: Table, tableIndex: number) => {
            this.validateTable(table, tableIndex);
        });

        // Phase 2: Cross-table validation (only if no errors in phase 1)
        if (this.errors.length === 0) {
            this.validateCrossTableRelations();
        }

        return this.getResult();
    }

    private collectContext(): void {
        this.schema.forEach((table: Table) => {
            if (table.name) {
                this.context.tableNames.add(table.name);

                // Collect column info
                if (table.columns) {
                    const columnInfo: Record<string, any> = {};
                    table.columns.forEach(col => {
                        columnInfo[col.name] = {
                            type: col.type,
                            primaryKey: !!col.primaryKey,
                            nullable: col.nullable !== false,
                            defaultValue: col.defaultValue,
                            unique: false
                        };
                    });
                    this.context.tableColumns.set(table.name, columnInfo);
                }

                // Collect indexes
                if (table.indexes) {
                    this.context.tableIndexes.set(table.name, table.indexes);
                }

                // Collect relations
                if (table.relations) {
                    this.context.tableRelations.set(table.name, table.relations);
                }
            }
        });
    }

    private validateTable(table: Table, tableIndex: number): void {
        const tablePath = `tables[${tableIndex}] "${table.name}"`;

        // Validate table structure
        const tableResult = validateTableStructure(table, tableIndex);
        this.addResults(tableResult);

        // Validate columns
        if (table.columns) {
            const columnResult = validateColumns(table.columns, table.name, this.context);
            this.addResults(columnResult);
        }

        // Validate indexes (optional)
        if (table.indexes) {
            const indexResult = validateIndexes(table.indexes, table.name, this.context);
            this.addResults(indexResult);
        }

        // Validate constraints (optional)
        if (table.constraints) {
            const constraintResult = validateConstraints(table.constraints, table.name, this.context);
            this.addResults(constraintResult);
        }

        // Validate relations (optional)
        if (table.relations) {
            const relationResult = validateRelations(table.relations, table.name, this.context);
            this.addResults(relationResult);
        }
    }

    private validateCrossTableRelations(): void {
        const crossTableResult = validateCrossTableRelations(this.schema, this.context);
        this.addResults(crossTableResult);
    }

    private addResults(result: ValidationResult): void {
        this.errors.push(...result.errors);
        this.warnings.push(...result.warnings);
    }

    private getResult(): ValidationResult {
        return {
            errors: [...new Set(this.errors)], // Remove duplicates
            warnings: [...new Set(this.warnings)],
            isValid: this.errors.length === 0,
            summary: {
                tables: this.schema.length,
                columns: this.schema.reduce((acc: number, table: Table) => acc + (table.columns?.length || 0), 0),
                indexes: this.schema.reduce((acc: number, table: Table) => acc + (table.indexes?.length || 0), 0),
                relations: this.schema.reduce((acc: number, table: Table) => acc + (table.relations?.length || 0), 0),
                constraints: this.schema.reduce((acc: number, table: Table) => acc + (table.constraints?.length || 0), 0)
            }
        };
    }
}