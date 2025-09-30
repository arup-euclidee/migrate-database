"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
exports.initMigration = initMigration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_1 = require("../schema");
const schemaContent = `// schema.ts - Database schema definition
const schema = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'SERIAL', primaryKey: true },
        { name: 'email', type: 'VARCHAR(255)', unique: true, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', nullable: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'NOW()' }
      ]
    }
  ]
};

export default schema;
`;
class FileUtils {
    static ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    static writeFile(filePath, content) {
        const dir = path.dirname(filePath);
        this.ensureDirectoryExists(dir);
        fs.writeFileSync(filePath, content);
    }
    static readFile(filePath) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    static fileExists(filePath) {
        return fs.existsSync(filePath);
    }
    static getFilesInDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        return fs.readdirSync(dirPath);
    }
}
exports.FileUtils = FileUtils;
function initMigration() {
    if (FileUtils.fileExists(schema_1.DEFAULT_SCHEMA_FILE)) {
        return { warning: true, message: "schema.ts already exists" };
    }
    try {
        FileUtils.writeFile(schema_1.DEFAULT_SCHEMA_FILE, schemaContent);
        return { success: true, message: "Created schema.ts file" };
    }
    catch (err) {
        return { success: false, message: `Failed to create schema.ts: ${err.message}` };
    }
}
