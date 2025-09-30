"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationGenerator = void 0;
class MigrationGenerator {
    static generateMigrationSQL(currentSchema, previousSchema) {
        let sql = '-- Generated migration SQL\n';
        sql += `-- Generated at: ${new Date().toISOString()}\n\n`;
        if (!previousSchema) {
            // Initial migration - create all tables
            // sql += this.generateCreateTablesSQL(currentSchema.tables);
            // sql += '\n-- Initial schema creation\n';
        }
        else {
            // Compare schemas and generate migration steps
            const steps = this.compareSchemas(previousSchema, currentSchema);
            // if (steps.length === 0) {
            //     sql += '-- No changes detected\n';
            // } else {
            //     sql += this.generateStepsSQL(steps);
            //     sql += `\n-- ${steps.length} change(s) applied\n`;
            // }
        }
        return sql;
    }
    // private static generateCreateTablesSQL(tables: TableDefinition[]): string {
    //     let sql = '';
    //     for (const table of tables) {
    //         sql += `-- Create table: ${table.name}\n`;
    //         sql += `CREATE TABLE ${table.name} (\n`;
    //         const columnDefinitions = table.columns.map(col => {
    //             let definition = `  ${col.name} ${col.type}`;
    //             if (!col.nullable) definition += ' NOT NULL';
    //             if (col.primaryKey) definition += ' PRIMARY KEY';
    //             if (col.unique) definition += ' UNIQUE';
    //             if (col.defaultValue !== undefined) {
    //                 definition += ` DEFAULT ${this.formatDefaultValue(col.defaultValue)}`;
    //             }
    //             if (col.references) {
    //                 definition += ` REFERENCES ${col.references.table}(${col.references.column})`;
    //             }
    //             return definition;
    //         });
    //         sql += columnDefinitions.join(',\n');
    //         sql += '\n);\n\n';
    //         // Generate indexes
    //         if (table.indexes) {
    //             for (const index of table.indexes) {
    //                 const unique = index.unique ? 'UNIQUE ' : '';
    //                 sql += `CREATE ${unique}INDEX ${index.name} ON ${table.name} (${index.columns.join(', ')});\n`;
    //             }
    //             sql += '\n';
    //         }
    //     }
    //     return sql;
    // }
    static compareSchemas(oldSchema, newSchema) {
        const steps = [];
        const oldTables = new Map(oldSchema.tables.map(t => [t.name, t]));
        const newTables = new Map(newSchema.tables.map(t => [t.name, t]));
        const oldTableList = [...new Set(oldSchema?.tables?.map(t => t?.name))];
        const currentTableList = [...new Set(newSchema?.tables?.map(t => t?.name))];
        console.log('oldTables', oldTableList);
        console.log('newTables', currentTableList);
        // Check for new tables
        for (const [tableName, newTable] of newTables) {
            if (!oldTables.has(tableName)) {
                steps.push({ type: 'create_table', table: tableName, definition: newTable });
            }
        }
        // Check for dropped tables
        // for (const [tableName, oldTable] of oldTables) {
        //     if (!newTables.has(tableName)) {
        //         steps.push({ type: 'drop_table', table: tableName });
        //     }
        // }
        // Check for table modifications
        // for (const [tableName, newTable] of newTables) {
        //     const oldTable = oldTables.get(tableName);
        //     if (oldTable) {
        //         const columnSteps = this.compareColumns(oldTable, newTable);
        //         steps.push(...columnSteps);
        //         // Compare indexes
        //         const indexSteps = this.compareIndexes(oldTable, newTable);
        //         steps.push(...indexSteps);
        //     }
        // }
        return steps;
    }
}
exports.MigrationGenerator = MigrationGenerator;
