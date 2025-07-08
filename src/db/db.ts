import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle> | null = null;

export const getDb = async () => {
  if (!db) {
    const databaseUrl = import.meta.env.VITE_DATABASE_URL;
    
    if (!databaseUrl) {
      console.warn('Database URL not found. Using mock database operations.');
      // Return a mock database for development
      throw new Error('Database not configured');
    }
    
    const client = new Client({
      connectionString: databaseUrl,
    });

    await client.connect();
    db = drizzle(client, { schema });
  }
  return db;
};