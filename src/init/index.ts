
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_SCHEMA_FILE } from '../schema';

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


export class FileUtils {
    static ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    static writeFile(filePath: string, content: string): void {
        const dir = path.dirname(filePath);
        this.ensureDirectoryExists(dir);
        fs.writeFileSync(filePath, content);
    }

    static readFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf-8');
    }

    static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    static getFilesInDirectory(dirPath: string): string[] {
        if (!fs.existsSync(dirPath)) {
            return [];
        }
        return fs.readdirSync(dirPath);
    }
}
export function initMigration(): { success?: boolean; warning?: boolean; message: string } {
    if (FileUtils.fileExists(DEFAULT_SCHEMA_FILE)) {
        return { warning: true, message: "schema.ts already exists" };
    }

    try {
        FileUtils.writeFile(DEFAULT_SCHEMA_FILE, schemaContent);
        return { success: true, message: "Created schema.ts file" };
    } catch (err: any) {
        return { success: false, message: `Failed to create schema.ts: ${err.message}` };
    }
}