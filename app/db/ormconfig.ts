import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Passkey } from "./entities/Passkey";

let dataSource: DataSource | null = null;

export async function getAppDataSource(): Promise<DataSource> {
  if (!dataSource) {
    const { DataSource } = await import("typeorm"); // Dynamic Import
    dataSource = new DataSource({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "ekt",
      password: "EarnKit304",
      database: "turnkey_auth",
      entities: [User, Passkey],
      migrations: ["app/db/migrations/*.js"],
      synchronize: false,
      migrationsTableName: "migrations",
      cache: true,
    });

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  }
  return dataSource;
}
