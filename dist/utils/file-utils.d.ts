export declare class FileUtils {
    static ensureDirectoryExists(dirPath: string): void;
    static writeFile(filePath: string, content: string): void;
    static readFile(filePath: string): string;
    static fileExists(filePath: string): boolean;
    static getLatestMigrationVersion(migrationsDir: string): number;
}
