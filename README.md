# 🎯 QuizDrop

Interactive quiz mini-app for Farcaster with real ERC-20 coin creation, trading, and liquidity provisioning on Base network.

## ✨ Features

- **🎮 Interactive Quizzes**: Take sample quizzes with real-time feedback
- **🪙 Coin Creation**: Create actual ERC-20 tokens using Zora's coins SDK
- **💧 Liquidity Pools**: Add liquidity to Uniswap V4 pools for your quiz coins
- **🔄 Token Trading**: Swap ETH for quiz coins and vice versa
- **🗃️ Database Storage**: Persistent storage with PostgreSQL via Drizzle ORM
- **🔐 Farcaster Auth**: Seamless authentication with Farcaster accounts
- **💳 Wallet Integration**: Connect with popular Web3 wallets via Wagmi
- **🌐 Base Network**: Built for Coinbase's Base Layer 2

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Farcaster account
- Base network wallet with ETH for gas fees
- Railway PostgreSQL database (or local PostgreSQL)

### 1. Install Dependencies

```bash
# Core dependencies
pnpm add drizzle-orm pg dotenv wagmi viem@2.x @tanstack/react-query
pnpm add -D drizzle-kit tsx @types/pg

# Uniswap V4 & Zora integration
pnpm add @uniswap/v4-sdk @uniswap/sdk-core @uniswap/universal-router-sdk @zoralabs/coins-sdk
```

### 2. Environment Setup

Create `.env.local` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:password@host:port/database

# Zora Coins SDK
VITE_ZORA_API_KEY=your_zora_api_key

# Blockchain
VITE_PRIVATE_KEY=your_private_key_for_coin_creation
VITE_RPC_URL=https://mainnet.base.org
VITE_PAYOUT_RECIPIENT=0x_your_wallet_address
```

### 3. Database Setup

```bash
# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push

# Initialize with sample data (optional)
pnpm tsx scripts/init-database.ts

# View database in browser (optional)
pnpm db:studio
```

### 4. Development

```bash
# Start development server
pnpm dev

# Create a test coin (optional)
pnpm tsx scripts/create-coin.ts

# Test Uniswap V4 operations (optional)
pnpm tsx scripts/uniswap-v4-operations.ts
```

## 🏗️ Architecture

### Database Schema (PostgreSQL + Drizzle ORM)

```sql
-- Deployed quiz coins
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    coin_address VARCHAR(42) UNIQUE NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    creator_address VARCHAR(42) NOT NULL,
    creator_fid BIGINT,
    created_at TIMESTAMP DEFAULT now()
);

-- Quiz questions (extensible)
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_idx INTEGER NOT NULL,
    explanation TEXT
);
```

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Web3**: Wagmi + Viem + Farcaster Frame SDK
- **Database**: PostgreSQL + Drizzle ORM
- **Blockchain**: Base Network (Coinbase Layer 2)
- **Coins**: Zora Coins SDK
- **Trading**: Uniswap V4 SDK
- **Styling**: Inline styles with modern design

## 📁 Project Structure

```
quizdrop/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   └── operations.ts       # Database CRUD operations
│   ├── main.tsx                # React entry point
│   └── wagmi.ts                # Wagmi configuration
├── scripts/
│   ├── create-coin.ts          # Coin creation utility
│   ├── init-database.ts        # Database initialization
│   ├── uniswap-v4-operations.ts # Trading & liquidity operations
│   └── viem-to-ethers.ts       # Viem/Ethers utilities
├── drizzle/                    # Migration files
├── drizzle.config.ts           # Drizzle configuration
└── package.json                # Dependencies & scripts
```

## 🛠️ Key Scripts

### Database Operations

```typescript
// Create a new quiz in database
import { createQuiz } from './src/db/operations';

const quiz = await createQuiz({
  coinAddress: '0x...',
  txHash: '0x...',
  name: 'My Quiz',
  symbol: 'QUIZ',
  description: 'A great quiz about...',
  creatorAddress: '0x...',
  creatorFid: 12345,
});
```

### Uniswap V4 Trading

```typescript
// Create Zora coin + add liquidity
import { createZoraQuizCoin, createInitialLiquidity } from './scripts/uniswap-v4-operations';

// 1. Create coin
const coin = await createZoraQuizCoin('My Quiz Coin', 'QUIZ');

// 2. Add liquidity
const liquidityTx = await createInitialLiquidity(
  coin.coinAddress,
  '0.01', // 0.01 ETH
  0.05    // 5% slippage
);

// 3. Trade tokens
const swapTx = await swapETHForQuizCoin(
  coin.coinAddress,
  '0.001', // 0.001 ETH
  '0'      // Min tokens out
);
```

## 🗄️ Database Operations

### Basic Queries

```typescript
// Get all quizzes
const allQuizzes = await getAllQuizzes();

// Get user's quizzes
const userQuizzes = await getQuizzesByCreatorFid(fid);

// Get quiz by coin address
const quiz = await getQuizByCoinAddress('0x...');

// Database statistics
const stats = await getQuizStats();
```

### Adding Questions

```typescript
// Add questions to a quiz
await createMultipleQuizQuestions(quizId, [
  {
    question: "What is Base?",
    options: ["Layer 1", "Layer 2", "Sidechain"],
    correctIdx: 1,
    explanation: "Base is a Layer 2 blockchain built on Ethereum"
  }
]);
```

## 🎯 Core Features

### 1. Quiz Creation & Coin Deployment
- Create interactive quizzes with custom questions
- Deploy real ERC-20 tokens using Zora's infrastructure
- Store quiz metadata in PostgreSQL database
- Track creators via Farcaster ID

### 2. Trading & Liquidity
- **Swap tokens**: ETH ↔ Quiz Coins via Uniswap V4
- **Add liquidity**: Create trading pairs for quiz coins
- **Price quotes**: Get real-time trading quotes
- **Position management**: Mint/manage liquidity positions

### 3. User Experience
- **Farcaster auth**: One-click authentication
- **Wallet integration**: Connect popular Web3 wallets
- **Real-time feedback**: Instant quiz results and explanations
- **Responsive design**: Works on mobile and desktop

## 🔧 Advanced Configuration

### Custom RPC Endpoints

```env
# Use custom Base RPC for better performance
VITE_RPC_URL=https://your-custom-base-rpc-endpoint.com
```

### Trading Configuration

```typescript
// Custom fee tiers and slippage
const tradingConfig = {
  fee: 500,              // 0.05% fee tier
  slippageTolerance: 0.05, // 5% slippage
  tickSpacing: 10,       // Standard tick spacing
};
```

### Database Connection Pooling

```typescript
// Custom pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🚨 Production Considerations

### Security
- ✅ Private keys in environment variables only
- ✅ Input validation for all user data
- ✅ SQL injection protection via Drizzle ORM
- ✅ Rate limiting for API endpoints (implement as needed)

### Performance
- ✅ Database connection pooling
- ✅ Efficient queries with proper indexing
- ✅ Lazy loading for large datasets
- ✅ Optimized bundle size

### Monitoring
- 📊 Database query performance
- 📊 Transaction success rates
- 📊 User engagement metrics
- 📊 Error tracking and alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Zora Coins SDK](https://github.com/ourzora/zora-protocol)
- [Uniswap V4 Documentation](https://docs.uniswap.org/contracts/v4/overview)
- [Base Network](https://base.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Wagmi Documentation](https://wagmi.sh/)

---

**Built with ❤️ for the Farcaster ecosystem**
