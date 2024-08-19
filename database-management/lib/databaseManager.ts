import { Client } from "pg";
import { DatabaseConfig } from "./configReader";
import { readFileSync } from "fs";
import { MIGRATION_FILE_NAME, ROLLBACK_FILE_NAME } from "./config";
import path from "path";

export enum MigrationType {
    MIGRATION = "migration",
    ROLLBACK = "rollback",
}

export class DatabaseManager {
    private client: Client;

    constructor(config: DatabaseConfig) {
        this.client = new Client(config);
    }

    private async transaction<T>(closure: () => Promise<T>): Promise<T> {
        await this.client.query("BEGIN");

        try {
            const result = await closure();
            await this.client.query("COMMIT");
            return result;
        } catch (error) {
            await this.client.query("ROLLBACK");
            throw error;
        }
    }

    public async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error) {
            throw new Error(`Failed to connect to database: ` + error);
        }
    }

    public async runMigration(migration: string, type: MigrationType): Promise<void> {
        try {
            const migrationsName = migration.split("/")[2];
            const filePath = path.join(
                migration,
                type === MigrationType.MIGRATION ? MIGRATION_FILE_NAME : ROLLBACK_FILE_NAME,
            );
            const sql = readFileSync(filePath, "utf8");

            await this.transaction(async () => {
                await this.client.query(sql);
                if (type === MigrationType.MIGRATION) {
                    await this.client.query("INSERT INTO migrations (name) VALUES ($1)", [migrationsName]);
                } else {
                    await this.client.query("DELETE FROM migrations WHERE name = $1", [migrationsName]);
                }
            });

            console.log("Successfully ran migration: ", filePath);
        } catch (error) {
            throw new Error(`Failed to run migration ${migration}: ` + error);
        }
    }

    public async runAllMigrations(migrations: string[]) {
        for (const migration of migrations) {
            await this.runMigration(migration, MigrationType.MIGRATION);
        }
    }

    public async getDiff() {
        this.client;
    }

    public async close() {
        await this.client.end();
    }
}
