function generateMigrationSQL(diff: any) {
    const sql: string[] = [];

    // --- Drop tables
    for (const table of diff.removedTables) {
        sql.push(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
    }

    // --- Add tables
    for (const table of diff.addedTables) {
        sql.push(`-- TODO: CREATE TABLE "${table}" (define columns etc.)`);
        // You can reuse schema definition here to generate full CREATE TABLE
    }

    // --- Modified tables
    for (const [table, changes] of Object.entries(diff.modifiedTables)) {
        // Columns
        for (const col of changes.addedColumns) {
            const newDef = changes.changedColumns.find((c: any) => c.name === col)?.newDef;
            if (newDef) {
                sql.push(
                    `ALTER TABLE "${table}" ADD COLUMN "${newDef.name}" ${newDef.type}${newDef.nullable === false ? " NOT NULL" : ""}${newDef.defaultValue ? ` DEFAULT ${newDef.defaultValue}` : ""};`
                );
            }
        }

        for (const col of changes.removedColumns) {
            sql.push(`ALTER TABLE "${table}" DROP COLUMN "${col}";`);
        }

        for (const colChange of changes.changedColumns) {
            sql.push(
                `ALTER TABLE "${table}" ALTER COLUMN "${colChange.name}" TYPE ${colChange.newDef.type};`
            );
            if (colChange.oldDef.nullable !== colChange.newDef.nullable) {
                if (colChange.newDef.nullable === false) {
                    sql.push(`ALTER TABLE "${table}" ALTER COLUMN "${colChange.name}" SET NOT NULL;`);
                } else {
                    sql.push(`ALTER TABLE "${table}" ALTER COLUMN "${colChange.name}" DROP NOT NULL;`);
                }
            }
            if (colChange.oldDef.defaultValue !== colChange.newDef.defaultValue) {
                if (colChange.newDef.defaultValue) {
                    sql.push(
                        `ALTER TABLE "${table}" ALTER COLUMN "${colChange.name}" SET DEFAULT ${colChange.newDef.defaultValue};`
                    );
                } else {
                    sql.push(`ALTER TABLE "${table}" ALTER COLUMN "${colChange.name}" DROP DEFAULT;`);
                }
            }
        }

        // Indexes
        for (const idx of changes.removedIndexes) {
            sql.push(`DROP INDEX IF EXISTS "${idx.name}";`);
        }
        for (const idx of changes.addedIndexes) {
            sql.push(
                `CREATE ${idx.unique ? "UNIQUE " : ""}INDEX "${idx.name}" ON "${table}" (${idx.columns
                    .map(c => `"${c}"`)
                    .join(", ")});`
            );
        }
        for (const idx of changes.changedIndexes) {
            sql.push(`DROP INDEX IF EXISTS "${idx.oldDef.name}";`);
            sql.push(
                `CREATE ${idx.newDef.unique ? "UNIQUE " : ""}INDEX "${idx.newDef.name}" ON "${table}" (${idx.newDef.columns
                    .map(c => `"${c}"`)
                    .join(", ")});`
            );
        }

        // Constraints
        for (const c of changes.removedConstraints) {
            sql.push(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${c.name}";`);
        }
        for (const c of changes.addedConstraints) {
            if (c.type === "unique") {
                sql.push(
                    `ALTER TABLE "${table}" ADD CONSTRAINT "${c.name}" UNIQUE (${c.columns
                        .map(c => `"${c}"`)
                        .join(", ")});`
                );
            } else if (c.type === "primary") {
                sql.push(
                    `ALTER TABLE "${table}" ADD CONSTRAINT "${c.name}" PRIMARY KEY (${c.columns
                        .map(c => `"${c}"`)
                        .join(", ")});`
                );
            }
        }
        for (const c of changes.changedConstraints) {
            sql.push(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${c.oldDef.name}";`);
            if (c.newDef.type === "unique") {
                sql.push(
                    `ALTER TABLE "${table}" ADD CONSTRAINT "${c.newDef.name}" UNIQUE (${c.newDef.columns
                        .map(c => `"${c}"`)
                        .join(", ")});`
                );
            }
        }

        // Relations (foreign keys)
        for (const rel of changes.removedRelations) {
            const fkName = `fk_${table}_${rel.columns.join("_")}`;
            sql.push(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${fkName}";`);
        }
        for (const rel of changes.addedRelations) {
            const fkName = `fk_${table}_${rel.columns.join("_")}`;
            sql.push(
                `ALTER TABLE "${table}" ADD CONSTRAINT "${fkName}" FOREIGN KEY (${rel.columns
                    .map(c => `"${c}"`)
                    .join(", ")}) REFERENCES "${rel.reference.table}" (${rel.reference.columns
                        .map(c => `"${c}"`)
                        .join(", ")});`
            );
        }
    }

    return sql.join("\n");
}
