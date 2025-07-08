// Initialize database for QuizDrop
// Run migrations and optionally add sample data

import 'dotenv/config';
import { createQuiz, getAllQuizzes, getQuizStats } from '../src/db/operations';

async function initializeDatabase() {
  try {
    console.log('🗃️  Initializing QuizDrop database...');

    // Check current state
    const stats = await getQuizStats();
    console.log('📊 Current database stats:', stats);

    const allQuizzes = await getAllQuizzes();
    console.log(`📋 Found ${allQuizzes.length} existing quizzes`);

    // Add sample quiz if database is empty
    if (allQuizzes.length === 0) {
      console.log('🎯 Adding sample quiz data...');

      const sampleQuiz = await createQuiz({
        coinAddress: '0x742d35Cc6635C0532925a3b8D186698F6Da89b0F', // Example address
        txHash: '0x123...abc', // Example transaction hash
        name: 'Farcaster Knowledge Quiz',
        symbol: 'QUIZ',
        description: 'Test your knowledge about Farcaster and Base network!',
        creatorAddress: '0x742d35Cc6635C0532925a3b8D186698F6Da89b0F',
        creatorFid: 12345,
      });

      console.log('✅ Sample quiz created:', sampleQuiz);
    }

    // Final stats
    const finalStats = await getQuizStats();
    console.log('🎉 Database initialization complete!');
    console.log('📊 Final stats:', finalStats);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('\n💡 Make sure your DATABASE_URL is correct in .env');
        console.log('💡 Railway connection string format:');
        console.log('   postgresql://postgres:<password>@<host>:<port>/<database>');
      }
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
