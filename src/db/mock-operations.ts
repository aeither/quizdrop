// Mock database operations for browser environment
// This file provides fallback implementations when the real database is not available

// Mock types to match database schema
export interface Quiz {
  id: number;
  name: string;
  symbol: string;
  description?: string;
  coinAddress: string;
  txHash: string;
  creatorAddress: string;
  creatorFid?: number;
  createdAt: Date;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
}

// Mock database storage
let mockQuizzes: Quiz[] = [
  {
    id: 1,
    name: "Crypto Basics",
    symbol: "CRYPTO",
    description: "Test your knowledge of cryptocurrency fundamentals",
    coinAddress: "0x1234567890123456789012345678901234567890",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    creatorAddress: "0x1234567890123456789012345678901234567890",
    creatorFid: 12345,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: "Web3 Knowledge",
    symbol: "WEB3",
    description: "Explore the decentralized web",
    coinAddress: "0x9876543210987654321098765432109876543210",
    txHash: "0x123456789abcdef0123456789abcdef0123456789",
    creatorAddress: "0x9876543210987654321098765432109876543210",
    creatorFid: 67890,
    createdAt: new Date('2024-01-02'),
  }
];

let mockQuestions: QuizQuestion[] = [];
let nextQuizId = 3;
let nextQuestionId = 1;

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
  const quiz: Quiz = {
    id: nextQuizId++,
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    coinAddress: input.coinAddress,
    txHash: input.txHash,
    creatorAddress: input.creatorAddress,
    creatorFid: input.creatorFid,
    createdAt: new Date(),
  };

  mockQuizzes.push(quiz);
  console.log('Mock quiz created:', quiz);
  
  return quiz;
}

/**
 * Get all quizzes ordered by creation date (newest first)
 */
export async function getAllQuizzes(): Promise<Quiz[]> {
  return [...mockQuizzes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get quizzes created by a specific Farcaster user
 */
export async function getQuizzesByCreatorFid(creatorFid: number): Promise<Quiz[]> {
  return mockQuizzes
    .filter(quiz => quiz.creatorFid === creatorFid)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get quizzes created by a specific wallet address
 */
export async function getQuizzesByCreatorAddress(creatorAddress: string): Promise<Quiz[]> {
  return mockQuizzes
    .filter(quiz => quiz.creatorAddress === creatorAddress)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get a quiz by its coin address
 */
export async function getQuizByCoinAddress(coinAddress: string): Promise<Quiz | null> {
  return mockQuizzes.find(quiz => quiz.coinAddress === coinAddress) || null;
}

/**
 * Get a quiz by its ID
 */
export async function getQuizById(id: number): Promise<Quiz | null> {
  return mockQuizzes.find(quiz => quiz.id === id) || null;
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
  const question: QuizQuestion = {
    id: nextQuestionId++,
    quizId: input.quizId,
    question: input.question,
    options: input.options,
    correctIdx: input.correctIdx,
    explanation: input.explanation,
  };

  mockQuestions.push(question);
  return question;
}

/**
 * Get all questions for a specific quiz
 */
export async function getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
  return mockQuestions
    .filter(question => question.quizId === quizId)
    .sort((a, b) => a.id - b.id);
}