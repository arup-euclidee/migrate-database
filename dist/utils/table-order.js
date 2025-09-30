"use strict";
function getCreateOrder(schema) {
    // Build dependency graph
    const graph = {};
    const indegree = {};
    schema.forEach(table => {
        graph[table.name] = [];
        indegree[table.name] = 0;
    });
    schema.forEach(table => {
        (table.relations || []).forEach(rel => {
            const parent = rel.reference.table; // depends on this table
            graph[parent].push(table.name);
            indegree[table.name] = (indegree[table.name] || 0) + 1;
        });
    });
    // Topological sort (Kahn's algorithm)
    const queue = Object.keys(indegree).filter(t => indegree[t] === 0);
    const order = [];
    while (queue.length > 0) {
        const node = queue.shift();
        order.push(node);
        graph[node].forEach(child => {
            indegree[child]--;
            if (indegree[child] === 0)
                queue.push(child);
        });
    }
    if (order.length !== schema.length) {
        throw new Error("Cycle detected in schema relations");
    }
    return order;
}
