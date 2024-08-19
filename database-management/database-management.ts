import { readConfig } from "./lib/configReader";
import { DatabaseManager, MigrationType } from "./lib/databaseManager";
import { input, select } from "@inquirer/prompts";
import { mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { CONFIG_FILE_PATH, MIGRATIONS_FILE_PATH, MIGRATION_FILE_NAME, ROLLBACK_FILE_NAME } from "./lib/config";

enum UserAction {
    NEW = "new",
    RUN_ONE_MIGRATION = "run-one-migration",
    RUN_ONE_ROLLBACK = "run-one-rollback",
    RUN_ALL = "run-all",
    QUIT = "quit",
}

type UserActionType = UserAction | null;

async function getDatabaseManager(): Promise<DatabaseManager> {
    try {
        const config = await readConfig(CONFIG_FILE_PATH);
        return new DatabaseManager(config);
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

async function getUserAction(): Promise<UserActionType> {
    console.log();
    return await select({
        message: "Select an action",
        choices: [
            {
                name: "New migration",
                value: UserAction.NEW,
                description: "Creates a new timestamped file ready for migration code",
            },
            {
                name: "Run one migration",
                value: UserAction.RUN_ONE_MIGRATION,
                description: "Runs specified migration",
            },
            {
                name: "Run one rollback",
                value: UserAction.RUN_ONE_ROLLBACK,
                description: "Runs specified rollback",
            },
            {
                name: "Run all migrations",
                value: UserAction.RUN_ALL,
                description: "Runs all migrations from diff",
            },
            {
                name: "Quit",
                value: UserAction.QUIT,
            },
        ],
    });
}

async function createMigrationFile() {
    try {
        const fileDescription = await input({
            message: "Enter a description of the migration (Spaces will be replaced with '-')",
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const migrationFolder = `${timestamp}-${fileDescription.replace(/\s+/g, "-")}`;
        const migrationPath = path.join(MIGRATIONS_FILE_PATH, migrationFolder);

        await mkdir(migrationPath, { recursive: true });

        const migrationFilePath = path.join(migrationPath, MIGRATION_FILE_NAME);
        const rollbackFilePath = path.join(migrationPath, ROLLBACK_FILE_NAME);

        await writeFile(migrationFilePath, "");
        await writeFile(rollbackFilePath, "");

        console.log(`Created migration files in folder: ${migrationFolder}`);
        console.log(`  - ${MIGRATION_FILE_NAME}`);
        console.log(`  - ${ROLLBACK_FILE_NAME}`);
    } catch (error) {
        console.error("Failed to create new migration files:", error);
        throw error;
    }
}

async function readMigrations(): Promise<string[]> {
    try {
        const folders = await readdir(MIGRATIONS_FILE_PATH);
        folders.sort((a, b) => {
            const firstTime = Number(a.slice(0, 10));
            const secondTime = Number(b.slice(0, 10));

            if (firstTime > secondTime) {
                return 1;
            } else if (secondTime > firstTime) {
                return -1;
            } else {
                return 0;
            }
        });

        return folders;
    } catch (error) {
        throw new Error(`Failed to read from ${MIGRATIONS_FILE_PATH}`);
    }
}

async function chooseMigration(migrations: string[]): Promise<string> {
    console.log();
    try {
        const selection = await select({
            message: "Choose migration: ",
            choices: migrations.map((migration) => {
                return {
                    name: migration,
                    value: migration,
                };
            }),
        });

        return `${MIGRATIONS_FILE_PATH}/${selection}`;
    } catch (error) {
        throw new Error("Failed to choose migration");
    }
}

async function databaseManagement() {
    const client = await getDatabaseManager();
    await client.connect();

    try {
        let action: UserActionType = null;

        while (action !== UserAction.QUIT) {
            action = await getUserAction();
            const migrations = await readMigrations();

            switch (action) {
                case UserAction.NEW:
                    await createMigrationFile();
                    break;
                case UserAction.RUN_ONE_MIGRATION:
                case UserAction.RUN_ONE_ROLLBACK:
                    const migration = await chooseMigration(migrations);
                    const direction =
                        action === UserAction.RUN_ONE_MIGRATION ? MigrationType.MIGRATION : MigrationType.ROLLBACK;
                    await client.runMigration(migration, direction);
                    break;
                case UserAction.RUN_ALL:
                    await client.runAllMigrations(migrations);
                    break;
                case UserAction.QUIT:
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

databaseManagement();
