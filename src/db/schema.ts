// Drizzle ORM Schema for QuizDrop
// Tables: quizzes (deployed quiz coins) and quiz_questions (extensible)

import { bigint, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Table: quizzes (deployed quiz coins)
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  coinAddress: varchar("coin_address", { length: 42 }).notNull().unique(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  description: text("description"),
  creatorAddress: varchar("creator_address", { length: 42 }).notNull(),
  creatorFid: bigint("creator_fid", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

// Table: quiz_questions (optional, extensible)
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctIdx: integer("correct_idx").notNull(),
  explanation: text("explanation"),
});

// Export types for TypeScript
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;