"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextMigrationNumber = getNextMigrationNumber;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("../schema");
const MIGRATION_FOLDER = path_1.default.join(schema_1.DEFAULT_SCHEMA_FOLDER_PATH, "migration");
function getNextMigrationNumber() {
    if (!fs_1.default.existsSync(MIGRATION_FOLDER)) {
        fs_1.default.mkdirSync(MIGRATION_FOLDER, { recursive: true });
        return "000001"; // first migration
    }
    const files = fs_1.default.readdirSync(MIGRATION_FOLDER);
    // Match files like '000001_*.sql'
    const numbers = files
        .map(f => f.match(/^(\d{6})_.*\.sql$/))
        .filter(Boolean)
        .map(m => parseInt(m[1], 10));
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return String(nextNumber).padStart(6, "0"); // always 6 digits
}
