import { open } from "fs";
import { readConfig } from "./lib/configReader";
import { DatabaseManager } from "./lib/databaseManager";
import { input, select } from "@inquirer/prompts";

type UserAction = "new" | "diff" | "run-one" | "run-all" | "quit" | null;
const CONFIG_FILE_PATH = "./.dbenv";
const MIGRATIONS_FILE_PATH = "./migrations";

async function connectToDatabase(): Promise<DatabaseManager> {
    try {
        const config = await readConfig(CONFIG_FILE_PATH);
        return new DatabaseManager(config);
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

async function getUserAction(): Promise<UserAction> {
    return await select({
        message: "Select an action",
        choices: [
            {
                name: "New migration",
                value: "new",
                description: "Creates a new timestamped file ready for migration code",
            },
            {
                name: "Migrations diff",
                value: "diff",
                description: "Lists all migrations that have not been ran on database",
            },
            {
                name: "Run one migration",
                value: "run-one",
                description: "Runs specified migration",
            },
            {
                name: "Run all migrations",
                value: "run-all",
                description: "Runs all migrations from diff",
            },
            {
                name: "Quit",
                value: "quit",
            },
        ],
    });
}

async function createMigrationFile() {
    return new Promise<void>(async (resolve, reject) => {
        const fileDescription = await input({
            message: "Enter a description of the file (Spaces get joined with a '-')",
        });
        const fileName = `${Math.floor(Date.now() / 1000)}-${fileDescription.split(" ").join("-")}.sql`;

        try {
            open(`${MIGRATIONS_FILE_PATH}/${fileName}`, "w", (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log("Created file: " + fileName);
                    resolve();
                }
            });
        } catch (error) {
            reject("Failed to create new migration file: " + error);
        }
    });
}

async function databaseManagement() {
    const client = await connectToDatabase();

    try {
        let action: UserAction = null;

        while (action !== "quit") {
            action = await getUserAction();

            switch (action) {
                case "new":
                    await createMigrationFile();
                    break;
                case "diff":
                    await client.getDiff();
                    break;
                case "run-one":
                    await client.runMigration();
                    break;
                case "run-all":
                    await client.runAllMigrations();
                    break;
                case "quit":
                    break;
                default:
                    console.error("No choice was made");
            }
        }
    } catch (error) {
        console.error("Error during database management: " + error);
    } finally {
        await client.close();
    }
}

databaseManagement().catch(console.error);
