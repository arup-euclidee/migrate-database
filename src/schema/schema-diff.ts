type Column = {
    name: string;
    type: string;
    primaryKey?: boolean;
    nullable?: boolean;
    defaultValue?: string;
};

type Index = {
    name: string;
    columns: string[];
    unique?: boolean;
};

type Relation = {
    type: 'many-to-one' | 'one-to-many' | 'one-to-one';
    columns: string[];
    reference: { table: string; columns: string[] };
};

type Constraint = {
    type: 'unique' | 'primary' | 'check' | 'foreign';
    name: string;
    columns: string[];
};

type Table = {
    name: string;
    columns: Column[];
    indexes?: Index[];
    relations?: Relation[];
    constraints?: Constraint[];
};

type Schema = Table[];

function diffSchemas(oldSchema: Schema, newSchema: Schema) {
    const changes: any = {
        addedTables: [] as string[],
        removedTables: [] as string[],
        modifiedTables: {} as Record<
            string,
            {
                addedColumns: string[];
                removedColumns: string[];
                changedColumns: { name: string; oldDef: Column; newDef: Column }[];
                addedIndexes: Index[];
                removedIndexes: Index[];
                changedIndexes: { oldDef: Index; newDef: Index }[];
                addedRelations: Relation[];
                removedRelations: Relation[];
                addedConstraints: Constraint[];
                removedConstraints: Constraint[];
                changedConstraints: { oldDef: Constraint; newDef: Constraint }[];
            }
        >
    };

    const oldTables = new Map(oldSchema.map(t => [t.name, t]));
    const newTables = new Map(newSchema.map(t => [t.name, t]));

    // --- Tables added/removed
    for (const [name] of newTables) {
        if (!oldTables.has(name)) changes.addedTables.push(name);
    }
    for (const [name] of oldTables) {
        if (!newTables.has(name)) changes.removedTables.push(name);
    }

    // --- Compare tables
    for (const [name, oldTable] of oldTables) {
        if (!newTables.has(name)) continue;
        const newTable = newTables.get(name)!;

        // --- Columns
        const oldCols = new Map(oldTable.columns.map(c => [c.name, c]));
        const newCols = new Map(newTable.columns.map(c => [c.name, c]));

        const addedColumns = [...newCols.keys()].filter(c => !oldCols.has(c));
        const removedColumns = [...oldCols.keys()].filter(c => !newCols.has(c));

        const changedColumns: { name: string; oldDef: Column; newDef: Column }[] = [];
        for (const [colName, oldDef] of oldCols) {
            if (newCols.has(colName)) {
                const newDef = newCols.get(colName)!;
                if (
                    oldDef.type !== newDef.type ||
                    oldDef.nullable !== newDef.nullable ||
                    oldDef.defaultValue !== newDef.defaultValue ||
                    !!oldDef.primaryKey !== !!newDef.primaryKey
                ) {
                    changedColumns.push({ name: colName, oldDef, newDef });
                }
            }
        }

        // --- Indexes
        const oldIdx = new Map((oldTable.indexes || []).map(i => [i.name, i]));
        const newIdx = new Map((newTable.indexes || []).map(i => [i.name, i]));

        const addedIndexes = [...newIdx.values()].filter(i => !oldIdx.has(i.name));
        const removedIndexes = [...oldIdx.values()].filter(i => !newIdx.has(i.name));

        const changedIndexes: { oldDef: Index; newDef: Index }[] = [];
        for (const [idxName, oldDef] of oldIdx) {
            if (newIdx.has(idxName)) {
                const newDef = newIdx.get(idxName)!;
                if (
                    oldDef.unique !== newDef.unique ||
                    oldDef.columns.join(',') !== newDef.columns.join(',')
                ) {
                    changedIndexes.push({ oldDef, newDef });
                }
            }
        }

        // --- Relations
        const relKey = (r: Relation) => `${r.type}:${r.columns.join(',')}:${r.reference.table}:${r.reference.columns.join(',')}`;
        const oldRel = new Map((oldTable.relations || []).map(r => [relKey(r), r]));
        const newRel = new Map((newTable.relations || []).map(r => [relKey(r), r]));

        const addedRelations = [...newRel.values()].filter(r => !oldRel.has(relKey(r)));
        const removedRelations = [...oldRel.values()].filter(r => !newRel.has(relKey(r)));

        // --- Constraints
        const consKey = (c: Constraint) => `${c.type}:${c.name}:${c.columns.join(',')}`;
        const oldCons = new Map((oldTable.constraints || []).map(c => [consKey(c), c]));
        const newCons = new Map((newTable.constraints || []).map(c => [consKey(c), c]));

        const addedConstraints = [...newCons.values()].filter(c => !oldCons.has(consKey(c)));
        const removedConstraints = [...oldCons.values()].filter(c => !newCons.has(consKey(c)));

        const changedConstraints: { oldDef: Constraint; newDef: Constraint }[] = [];
        for (const [cKey, oldDef] of oldCons) {
            if (newCons.has(cKey)) {
                const newDef = newCons.get(cKey)!;
                if (JSON.stringify(oldDef) !== JSON.stringify(newDef)) {
                    changedConstraints.push({ oldDef, newDef });
                }
            }
        }

        if (
            addedColumns.length ||
            removedColumns.length ||
            changedColumns.length ||
            addedIndexes.length ||
            removedIndexes.length ||
            changedIndexes.length ||
            addedRelations.length ||
            removedRelations.length ||
            addedConstraints.length ||
            removedConstraints.length ||
            changedConstraints.length
        ) {
            changes.modifiedTables[name] = {
                addedColumns,
                removedColumns,
                changedColumns,
                addedIndexes,
                removedIndexes,
                changedIndexes,
                addedRelations,
                removedRelations,
                addedConstraints,
                removedConstraints,
                changedConstraints
            };
        }
    }

    return changes;
}
