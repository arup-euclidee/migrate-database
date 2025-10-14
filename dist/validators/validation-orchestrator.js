"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidator = void 0;
// validation-orchestrator.ts
const index_validator_1 = require("./index-validator");
const column_validator_1 = require("./column-validator");
const relation_validator_1 = require("./relation-validator");
const constraint_validator_1 = require("./constraint-validator");
const table_structure_validator_1 = require("./table-structure-validator");
const cross_table_validator_1 = require("./cross-table-validator");
class SchemaValidator {
    constructor(schema) {
        this.errors = [];
        this.warnings = [];
        this.context = {
            tableNames: new Set(),
            tableColumns: new Map(),
            tableIndexes: new Map(),
            tableRelations: new Map()
        };
        this.schema = schema;
    }
    validate() {
        this.collectContext();
        // Phase 1: Individual table validation
        this.schema.forEach((table, tableIndex) => {
            this.validateTable(table, tableIndex);
        });
        // Phase 2: Cross-table validation (only if no errors in phase 1)
        if (this.errors.length === 0) {
            this.validateCrossTableRelations();
        }
        return this.getResult();
    }
    collectContext() {
        this.schema.forEach((table) => {
            if (table.name) {
                this.context.tableNames.add(table.name);
                // Collect column info
                if (table.columns) {
                    const columnInfo = {};
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
    validateTable(table, tableIndex) {
        const tablePath = `tables[${tableIndex}] "${table.name}"`;
        // Validate table structure
        const tableResult = (0, table_structure_validator_1.validateTableStructure)(table, tableIndex);
        this.addResults(tableResult);
        // Validate columns
        if (table.columns) {
            const columnResult = (0, column_validator_1.validateColumns)(table.columns, table.name, this.context);
            this.addResults(columnResult);
        }
        // Validate indexes (optional)
        if (table.indexes) {
            const indexResult = (0, index_validator_1.validateIndexes)(table.indexes, table.name, this.context);
            this.addResults(indexResult);
        }
        // Validate constraints (optional)
        if (table.constraints) {
            const constraintResult = (0, constraint_validator_1.validateConstraints)(table.constraints, table.name, this.context);
            this.addResults(constraintResult);
        }
        // Validate relations (optional)
        if (table.relations) {
            const relationResult = (0, relation_validator_1.validateRelations)(table.relations, table.name, this.context);
            this.addResults(relationResult);
        }
    }
    validateCrossTableRelations() {
        const crossTableResult = (0, cross_table_validator_1.validateCrossTableRelations)(this.schema, this.context);
        this.addResults(crossTableResult);
    }
    addResults(result) {
        this.errors.push(...result.errors);
        this.warnings.push(...result.warnings);
    }
    getResult() {
        return {
            errors: [...new Set(this.errors)], // Remove duplicates
            warnings: [...new Set(this.warnings)],
            isValid: this.errors.length === 0,
            summary: {
                tables: this.schema.length,
                columns: this.schema.reduce((acc, table) => acc + (table.columns?.length || 0), 0),
                indexes: this.schema.reduce((acc, table) => acc + (table.indexes?.length || 0), 0),
                relations: this.schema.reduce((acc, table) => acc + (table.relations?.length || 0), 0),
                constraints: this.schema.reduce((acc, table) => acc + (table.constraints?.length || 0), 0)
            }
        };
    }
}
exports.SchemaValidator = SchemaValidator;
