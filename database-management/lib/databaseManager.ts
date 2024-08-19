import { Client } from "pg";
import { DatabaseConfig } from "./configReader";

export class DatabaseManager {
    private client: Client;

    constructor(config: DatabaseConfig) {
        this.client = new Client(config);
    }

    public async runMigration() {
        this.client;
    }

    public async runAllMigrations() {
        this.client;
    }

    public async getDiff() {
        this.client;
    }

    public async close() {
        await this.client.end();
    }
}
