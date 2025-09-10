import * as fs from 'fs';
import * as path from 'path';

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

    static getLatestMigrationVersion(migrationsDir: string): number {
        if (!fs.existsSync(migrationsDir)) {
            return 0;
        }

        const files = fs.readdirSync(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.sql'));

        if (migrationFiles.length === 0) {
            return 0;
        }

        const versions = migrationFiles.map(f => {
            const match = f.match(/^(\d+)_.+\.sql$/);
            return match ? parseInt(match[1]) : 0;
        });

        return Math.max(...versions);
    }
}