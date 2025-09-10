"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationGenerator = void 0;
class MigrationGenerator {
    static generateMigrationSQL(currentSchema, previousSchema) {
        let sql = '-- Generated migration SQL\n\n';
        if (!previousSchema) {
            // Initial migration - create all tables
            sql += this.generateCreateTablesSQL(currentSchema.tables);
        }
        else {
            // Compare schemas and generate migration steps
            const steps = this.compareSchemas(previousSchema, currentSchema);
            sql += this.generateStepsSQL(steps);
        }
        return sql;
    }
    static generateCreateTablesSQL(tables) {
        let sql = '';
        for (const table of tables) {
            sql += `CREATE TABLE ${table.name} (\n`;
            const columnDefinitions = table.columns.map(col => {
                let definition = `  ${col.name} ${col.type}`;
                if (!col.nullable)
                    definition += ' NOT NULL';
                if (col.primaryKey)
                    definition += ' PRIMARY KEY';
                if (col.unique)
                    definition += ' UNIQUE';
                if (col.defaultValue !== undefined) {
                    definition += ` DEFAULT ${this.formatDefaultValue(col.defaultValue)}`;
                }
                if (col.references) {
                    definition += ` REFERENCES ${col.references.table}(${col.references.column})`;
                }
                return definition;
            });
            sql += columnDefinitions.join(',\n');
            sql += '\n);\n\n';
            // Generate indexes
            if (table.indexes) {
                for (const index of table.indexes) {
                    const unique = index.unique ? 'UNIQUE ' : '';
                    sql += `CREATE ${unique}INDEX ${index.name} ON ${table.name} (${index.columns.join(', ')});\n`;
                }
                sql += '\n';
            }
        }
        return sql;
    }
    static compareSchemas(oldSchema, newSchema) {
        const steps = [];
        const oldTables = new Map(oldSchema.tables.map(t => [t.name, t]));
        const newTables = new Map(newSchema.tables.map(t => [t.name, t]));
        // Check for new tables
        for (const [tableName, newTable] of newTables) {
            if (!oldTables.has(tableName)) {
                steps.push({ type: 'create_table', table: tableName, definition: newTable });
            }
        }
        // Check for dropped tables
        for (const [tableName, oldTable] of oldTables) {
            if (!newTables.has(tableName)) {
                steps.push({ type: 'drop_table', table: tableName });
            }
        }
        // Check for table modifications
        for (const [tableName, newTable] of newTables) {
            const oldTable = oldTables.get(tableName);
            if (oldTable) {
                const columnSteps = this.compareColumns(oldTable, newTable);
                steps.push(...columnSteps);
            }
        }
        return steps;
    }
    static compareColumns(oldTable, newTable) {
        const steps = [];
        const oldColumns = new Map(oldTable.columns.map(c => [c.name, c]));
        const newColumns = new Map(newTable.columns.map(c => [c.name, c]));
        // Check for new columns
        for (const [columnName, newColumn] of newColumns) {
            if (!oldColumns.has(columnName)) {
                steps.push({ type: 'add_column', table: oldTable.name, column: columnName, definition: newColumn });
            }
        }
        // Check for dropped columns
        for (const [columnName, oldColumn] of oldColumns) {
            if (!newColumns.has(columnName)) {
                steps.push({ type: 'drop_column', table: oldTable.name, column: columnName });
            }
        }
        // Check for modified columns (simplified comparison)
        for (const [columnName, newColumn] of newColumns) {
            const oldColumn = oldColumns.get(columnName);
            if (oldColumn && JSON.stringify(oldColumn) !== JSON.stringify(newColumn)) {
                steps.push({ type: 'modify_column', table: oldTable.name, column: columnName, definition: newColumn });
            }
        }
        return steps;
    }
    static generateStepsSQL(steps) {
        let sql = '';
        for (const step of steps) {
            switch (step.type) {
                case 'create_table':
                    sql += this.generateCreateTableSQL(step.definition);
                    break;
                case 'drop_table':
                    sql += `DROP TABLE IF EXISTS ${step.table} CASCADE;\n`;
                    break;
                case 'add_column':
                    sql += this.generateAddColumnSQL(step.table, step.definition);
                    break;
                case 'drop_column':
                    sql += `ALTER TABLE ${step.table} DROP COLUMN IF EXISTS ${step.column};\n`;
                    break;
                case 'modify_column':
                    sql += this.generateModifyColumnSQL(step.table, step.definition);
                    break;
            }
            sql += '\n';
        }
        return sql;
    }
    static generateCreateTableSQL(table) {
        return this.generateCreateTablesSQL([table]);
    }
    static generateAddColumnSQL(table, column) {
        let sql = `ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.type}`;
        if (!column.nullable)
            sql += ' NOT NULL';
        if (column.unique)
            sql += ' UNIQUE';
        if (column.defaultValue !== undefined) {
            sql += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`;
        }
        if (column.references) {
            sql += ` REFERENCES ${column.references.table}(${column.references.column})`;
        }
        return sql + ';';
    }
    static generateModifyColumnSQL(table, column) {
        // PostgreSQL doesn't support direct MODIFY COLUMN, so we use a series of statements
        let sql = '';
        // Drop and recreate the column (simplified approach)
        sql += `ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column.name};\n`;
        sql += this.generateAddColumnSQL(table, column);
        return sql;
    }
    static formatDefaultValue(value) {
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
exports.MigrationGenerator = MigrationGenerator;
