import { DataSource } from "typeorm";
import { Account } from "./entities/Account";

let dataSource: DataSource | null = null;

export async function getAppDataSource(): Promise<DataSource> {
  if (!dataSource) {
    const { DataSource } = await import("typeorm"); // Dynamic Import
    dataSource = new DataSource({
      type: "postgres",
      host: process.env.NEXT_PUBLIC_DB_HOST,
      port: parseInt(process.env.NEXT_PUBLIC_DB_PORT as string),
      username: process.env.NEXT_PUBLIC_DB_USER,
      password: process.env.NEXT_PUBLIC_DB_PASSWORD,
      database: process.env.NEXT_PUBLIC_DB_NAME,
      entities: [Account],
      migrations: ["app/db/migrations/*.js"],
      synchronize: false,
      migrationsTableName: "migrations",
      cache: true,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  }
  return dataSource;
}
