import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.VITE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("VITE_DATABASE_URL environment variable is not set");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});