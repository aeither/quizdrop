// Database operations for QuizDrop using Drizzle ORM
// CRUD operations for quizzes and quiz questions

import 'dotenv/config';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { type Quiz, type QuizQuestion, quizQuestions, quizzes } from './schema';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:gKsxEXYKBaTeTbIwtxZybQSsjXbKPxJJ@shortline.proxy.rlwy.net:15656/railway',
});

const db = drizzle(pool);

// Quiz operations
export interface CreateQuizInput {
  coinAddress: string;
  txHash: string;
  name: string;
  symbol: string;
  description?: string;
  creatorAddress: string;
  creatorFid?: number;
}

/**
 * Create a new quiz/coin in the database
 */
export async function createQuiz(input: CreateQuizInput): Promise<Quiz> {
  const [quiz] = await db
    .insert(quizzes)
    .values({
      coinAddress: input.coinAddress,
      txHash: input.txHash,
      name: input.name,
      symbol: input.symbol,
      description: input.description,
      creatorAddress: input.creatorAddress,
      creatorFid: input.creatorFid,
    })
    .returning();

  return quiz;
}

/**
 * Get all quizzes ordered by creation date (newest first)
 */
export async function getAllQuizzes(): Promise<Quiz[]> {
  return await db
    .select()
    .from(quizzes)
    .orderBy(desc(quizzes.createdAt));
}

/**
 * Get quizzes created by a specific Farcaster user
 */
export async function getQuizzesByCreatorFid(creatorFid: number): Promise<Quiz[]> {
  return await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.creatorFid, creatorFid))
    .orderBy(desc(quizzes.createdAt));
}

/**
 * Get quizzes created by a specific wallet address
 */
export async function getQuizzesByCreatorAddress(creatorAddress: string): Promise<Quiz[]> {
  return await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.creatorAddress, creatorAddress))
    .orderBy(desc(quizzes.createdAt));
}

/**
 * Get a quiz by its coin address
 */
export async function getQuizByCoinAddress(coinAddress: string): Promise<Quiz | null> {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.coinAddress, coinAddress))
    .limit(1);

  return quiz || null;
}

/**
 * Get a quiz by its ID
 */
export async function getQuizById(id: number): Promise<Quiz | null> {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);

  return quiz || null;
}

// Quiz Questions operations
export interface CreateQuizQuestionInput {
  quizId: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
}

/**
 * Add a question to a quiz
 */
export async function createQuizQuestion(input: CreateQuizQuestionInput): Promise<QuizQuestion> {
  const [question] = await db
    .insert(quizQuestions)
    .values({
      quizId: input.quizId,
      question: input.question,
      options: input.options,
      correctIdx: input.correctIdx,
      explanation: input.explanation,
    })
    .returning();

  return question;
}

/**
 * Get all questions for a specific quiz
 */
export async function getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
  return await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.id);
}

/**
 * Add multiple questions to a quiz
 */
export async function createMultipleQuizQuestions(
  quizId: number,
  questions: Omit<CreateQuizQuestionInput, 'quizId'>[]
): Promise<QuizQuestion[]> {
  const questionsWithQuizId = questions.map(q => ({
    ...q,
    quizId,
  }));

  return await db
    .insert(quizQuestions)
    .values(questionsWithQuizId)
    .returning();
}

/**
 * Delete a quiz and all its questions
 */
export async function deleteQuiz(id: number): Promise<void> {
  await db.delete(quizzes).where(eq(quizzes.id, id));
  // Questions will be automatically deleted due to CASCADE
}

/**
 * Update quiz description
 */
export async function updateQuizDescription(id: number, description: string): Promise<Quiz | null> {
  const [quiz] = await db
    .update(quizzes)
    .set({ description })
    .where(eq(quizzes.id, id))
    .returning();

  return quiz || null;
}

// Utility functions
/**
 * Get quiz statistics
 */
export async function getQuizStats(): Promise<{
  totalQuizzes: number;
  totalQuestions: number;
  uniqueCreators: number;
}> {
  try {
    const [quizCountResult, questionCountResult, creatorsResult] = await Promise.all([
      db.select().from(quizzes),
      db.select().from(quizQuestions),
      db.selectDistinct({ creatorAddress: quizzes.creatorAddress }).from(quizzes),
    ]);

    return {
      totalQuizzes: quizCountResult.length,
      totalQuestions: questionCountResult.length,
      uniqueCreators: creatorsResult.length,
    };
  } catch (error) {
    console.warn('Error getting quiz stats:', error);
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      uniqueCreators: 0,
    };
  }
}

/**
 * Search quizzes by name or symbol (case-insensitive)
 */
export async function searchQuizzes(searchTerm: string): Promise<Quiz[]> {
  // Note: Using PostgreSQL's ilike for case-insensitive search
  // This is a simplified implementation
  return await db
    .select()
    .from(quizzes)
    .orderBy(desc(quizzes.createdAt));
}

// Close database connection (for cleanup)
export async function closeDatabase(): Promise<void> {
  await pool.end();
}