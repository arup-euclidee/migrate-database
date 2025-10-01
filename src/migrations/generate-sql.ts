import { SchemaDefinition, TableDefinition, ColumnDefinition, MigrationStep } from '../schema/schema-types';
import * as fs from 'fs';
import * as path from 'path';

export class MigrationGenerator {
    static generateMigrationSQL(currentSchema: SchemaDefinition, previousSchema: SchemaDefinition | null): string {
        let sql = '-- Generated migration SQL\n';
        sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

        let relationsSql = '-- table relation\n'

        if (!previousSchema) {
            // Initial migration - create all tables
            // sql += this.generateCreateTablesSQL(currentSchema.tables);
            // sql += '\n-- Initial schema creation\n';
        } else {
            // Compare schemas and generate migration steps
            const record = this.compareSchemas(previousSchema, currentSchema);
            // remove tables 
            if (record?.removedTables?.length > 0) {
                // Option 1: One DROP TABLE per table
                record?.removedTables.forEach(t => {
                    sql += `DROP TABLE IF EXISTS "${t}";\n`;
                });
            }
            // create tables
            if (record?.newTables?.length > 0) {
                const { create_sql, create_relation_sql } = this.generateCreateTableSQL(record.newTables, currentSchema);
                sql += create_sql;
                relationsSql += create_relation_sql
            }
            // existing tables
            if (record?.existingCommonTables?.length > 0) {

            }
        }

        sql += relationsSql

        return sql;
    }

    private static compareSchemas(oldSchema: SchemaDefinition, newSchema: SchemaDefinition): {
        removedTables: string[];
        newTables: string[];
        existingCommonTables: string[];
    } {
        const existingTables = [...new Set(oldSchema?.tables?.map(t => t?.name))];
        const currentTables = [...new Set(newSchema?.tables?.map(t => t?.name))];

        // Convert arrays to Set for fast lookup
        const existingSet = new Set(existingTables);
        const currentSet = new Set(currentTables);

        // Removed: in existing but not in current
        const removedTables = existingTables.filter(t => !currentSet.has(t)) || [];

        // New: in current but not in existing
        const newTables = currentTables.filter(t => !existingSet.has(t)) || [];

        // Existing: in both
        const existingCommonTables = existingTables.filter(t => currentSet.has(t)) || [];

        return { removedTables, newTables, existingCommonTables };
    }

    private static generateCreateTableSQL(tables: string[], currentSchema: SchemaDefinition) {
        let create_sql = '';
        let create_relation_sql = '';
        const currentTables = new Map(currentSchema.tables.map(t => [t.name, t]));

        for (const table of tables) {
            const tableObj = currentTables.get(table) || { columns: [], indexes: [], relations: [] };
            create_sql += `-- Create table: ${table}\n`;
            create_sql += `CREATE TABLE ${table} (\n`;

            const columnDefinitions = tableObj.columns.map(col => {
                let definition = `  ${col.name} ${col.type}`;

                if (!col.nullable) definition += ' NOT NULL';
                if (col.primaryKey) definition += ' PRIMARY KEY';
                if (col.unique) definition += ' UNIQUE';
                if (col.defaultValue !== undefined) {
                    if (col.defaultValue === 'NOW') {
                        definition += ` DEFAULT NOW()`;
                    } else {
                        definition += ` DEFAULT ${this.formatDefaultValue(col.defaultValue)}`;
                    }
                }
                if (col.references) {
                    definition += ` REFERENCES ${col.references.table}(${col.references.column})`;
                }

                return definition;
            });

            create_sql += columnDefinitions.join(',\n');
            create_sql += '\n);\n\n';

            // Generate indexes
            if (tableObj?.indexes) {
                for (const index of tableObj.indexes) {
                    const unique = index.unique ? 'UNIQUE ' : '';
                    create_sql += `CREATE ${unique}INDEX ${index.name} ON ${table} (${index.columns.join(', ')});\n`;
                }
                create_sql += '\n';
            }

            if (tableObj?.relations) {
                create_relation_sql += `-- Create relations for table: ${table}\n`;

                for (const relation of tableObj.relations) {
                    const cols = relation.columns.join(', ');
                    const refCols = relation.reference.columns.join(', ');

                    // Generate a consistent FK name
                    const constraintName = relation.columns.length === 1
                        ? `fk_${table}_${relation.columns[0]}`
                        : `fk_${table}_${relation.reference.table}_composite`;

                    create_relation_sql += `ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${cols}) REFERENCES ${relation.reference.table} (${refCols});\n`;
                }

                create_relation_sql += '\n';
            }
        }
        return { create_sql, create_relation_sql };
    }

    private static formatDefaultValue(value: any): string {
        if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
        }
        if (value === null) {
            return 'NULL';
        }
        if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
        }
        return value.toString();
    }
}