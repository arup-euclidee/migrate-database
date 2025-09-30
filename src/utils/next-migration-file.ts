import fs from "fs";
import path from "path";
import { DEFAULT_SCHEMA_FOLDER_PATH } from "../schema";

const MIGRATION_FOLDER = path.join(DEFAULT_SCHEMA_FOLDER_PATH, "migration");

export function getNextMigrationNumber(): string {
    if (!fs.existsSync(MIGRATION_FOLDER)) {
        fs.mkdirSync(MIGRATION_FOLDER, { recursive: true });
        return "000001"; // first migration
    }

    const files = fs.readdirSync(MIGRATION_FOLDER);
    // Match files like '000001_*.sql'
    const numbers = files
        .map(f => f.match(/^(\d{6})_.*\.sql$/))
        .filter(Boolean)
        .map(m => parseInt(m![1], 10));

    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return String(nextNumber).padStart(6, "0"); // always 6 digits
}
