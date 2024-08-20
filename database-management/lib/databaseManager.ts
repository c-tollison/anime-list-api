import { Client } from "pg";
import { DatabaseConfig } from "./configReader";

export enum MigrationType {
    MIGRATION = "migration",
    ROLLBACK = "rollback",
}

export interface MigrationEntity {
    id: number;
    name: string;
    applied_at: string;
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

    public async query(queryString: string, queryArray?: (string | number | boolean)[]) {
        try {
            return await this.client.query(queryString, queryArray);
        } catch (error) {
            throw new Error(`Failed to run query: ` + queryArray);
        }
    }

    public async runMigration(migrationName: string, sql: string, type: MigrationType): Promise<void> {
        try {
            await this.transaction(async () => {
                await this.client.query(sql);
                if (type === MigrationType.MIGRATION) {
                    await this.query("INSERT INTO migrations (name) VALUES ($1)", [migrationName]);
                } else {
                    await this.query("DELETE FROM migrations WHERE name = $1", [migrationName]);
                }
            });

            console.log("Successfully ran migration: ", migrationName);
        } catch (error) {
            throw new Error(`Failed to run migration ${migrationName}: ` + error);
        }
    }

    public async close() {
        await this.client.end();
    }
}
