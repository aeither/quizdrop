# 🎯 QuizDrop

Interactive quiz mini-app for **Farcaster** that creates **real ERC-20 coins** using Zora's Coins SDK and enables trading on Base network.

## ✨ Key Features

- **🎮 Quiz & Earn**: Take quizzes and interact with creator coins
- **🪙 Real Coin Creation**: Deploy actual ERC-20 tokens via Zora Coins SDK  
- **🔄 Live Trading**: Buy/sell quiz coins with ETH using Zora's trading infrastructure
- **🔐 Farcaster Native**: Seamless auth and user management via Farcaster Frame SDK
- **🌐 Base Network**: Built for Coinbase's L2 with optimized gas costs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Farcaster account  
- Base network wallet with ETH
- [Zora API key](https://docs.zora.co/docs/zora-network/api)

### Setup

```bash
# Install dependencies
pnpm install

# Environment setup
cp .env.example .env.local
```

**Required Environment Variables:**
```env
# Zora Coins SDK Integration
VITE_ZORA_API_KEY=your_zora_api_key

# Blockchain (Base Network)  
VITE_PRIVATE_KEY=your_private_key_for_coin_creation
VITE_RPC_URL=https://mainnet.base.org
VITE_PAYOUT_RECIPIENT=0x_your_wallet_address

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Run
```bash
# Development
pnpm dev

# Database setup  
pnpm db:push

# Production build
pnpm build
```

## 🏗️ Core Integrations

### 🪙 Zora Coins SDK Integration

**Real ERC-20 Coin Creation:**
```typescript
import { createCoin, DeployCurrency } from '@zoralabs/coins-sdk';

// Create quiz coin on Base network
const result = await createCoin(
  {
    name: "My Quiz Coin",
    symbol: "QUIZ", 
    uri: "ipfs://metadata-uri",
    payoutRecipient: "0x...",
    chainId: 8453, // Base
    currency: DeployCurrency.ZORA
  },
  walletClient,
  publicClient,
  { gasMultiplier: 120 }
);

// Returns: { address, hash, deployment }
```

**Trading with Zora's Infrastructure:**
```typescript
import { tradeCoin, TradeParameters } from '@zoralabs/coins-sdk';

// Buy quiz coin with ETH
const tradeParams: TradeParameters = {
  sell: { type: "eth" },
  buy: { type: "erc20", address: quizCoinAddress },
  amountIn: parseEther("0.001"), // 0.001 ETH
  slippage: 0.05, // 5% tolerance
  sender: userAddress,
};

const receipt = await tradeCoin({
  tradeParameters: tradeParams,
  walletClient,
  account,
  publicClient,
});
```

**Key Features:**
- ✅ **Real token deployment** on Base mainnet
- ✅ **Gasless approvals** via permit signatures  
- ✅ **Automatic routing** for optimal trades
- ✅ **Slippage protection** and parameter validation
- ✅ **Creator monetization** through trading fees

### 🔐 Farcaster Frame SDK Integration

**Authentication & User Management:**
```typescript
import { sdk } from "@farcaster/frame-sdk";

// Initialize Farcaster context
const context = await sdk.context;
if (context.user) {
  // Access user data: fid, displayName, username, pfpUrl
  const { fid, displayName, pfpUrl } = context.user;
  
  // Get auth token
  const { token } = await sdk.quickAuth.getToken();
}

// Sign in flow
await sdk.actions.signIn({
  nonce: crypto.randomUUID(),
  acceptAuthAddress: true,
});
```

**Frame-Ready Components:**
```typescript
// Frame lifecycle management
useEffect(() => {
  const initializeApp = async () => {
    // App initialization logic
    sdk.actions.ready(); // Signal frame is ready
  };
  initializeApp();
}, []);
```

**Key Features:**
- ✅ **One-click authentication** with Farcaster
- ✅ **Profile integration** (FID, name, avatar)
- ✅ **Token-based auth** for secure API calls
- ✅ **Frame lifecycle** management
- ✅ **Native UX** within Farcaster ecosystem

## 📊 Database Schema

```sql
-- Quiz coins storage
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    coin_address VARCHAR(42) UNIQUE NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    creator_address VARCHAR(42) NOT NULL,
    creator_fid BIGINT, -- Farcaster user ID
    created_at TIMESTAMP DEFAULT now()
);

-- Extensible quiz questions
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_idx INTEGER NOT NULL,
    explanation TEXT
);
```

## 🛠️ Key Scripts

```bash
# Database operations
pnpm db:generate      # Generate migrations
pnpm db:push         # Push schema to database  
pnpm db:studio       # Open database browser

# Coin utilities
pnpm create-coin     # Create test coin via Zora SDK
pnpm get-coins       # Query coin balances

# Development
pnpm dev            # Start dev server with ngrok
pnpm ngrok          # Expose local server for Farcaster testing
```

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Web3**: Wagmi + Viem for Base network integration
- **Coins**: Zora Coins SDK for token creation and trading
- **Auth**: Farcaster Frame SDK for user management  
- **Database**: PostgreSQL + Drizzle ORM
- **Network**: Base (Coinbase L2) for low-cost transactions

## 🌐 Production Deployment

**Environment Setup:**
- Base mainnet RPC endpoint
- PostgreSQL database (Railway recommended)
- Zora API key with appropriate limits
- Secure private key management
- ngrok domain for Farcaster Frame hosting

**Security Considerations:**
- Private keys in environment variables only
- Input validation for all user data  
- Rate limiting for coin creation endpoints
- Transaction validation and error handling

## 🏆 Zora Coins Implementation

### How We Used Zora Coins

**Core Integration:**
QuizDrop leverages Zora Coins SDK for two primary functions:

1. **Quiz Coin Creation**: When users create a quiz, we deploy a real ERC-20 token using `createCoin()` that represents their quiz. Each quiz becomes a tradeable creator coin on Base network.

2. **Live Trading System**: Users can buy/sell quiz coins with ETH using Zora's `tradeCoin()` function, creating a marketplace where successful quiz creators can monetize their content through coin appreciation.

**Technical Implementation:**
- **Real Token Deployment**: Creates actual ERC-20 contracts (not mock tokens) 
- **Gasless Trading**: Uses permit signatures for seamless user experience
- **Creator Monetization**: Quiz creators earn from trading fees automatically
- **Farcaster Integration**: Links coins to Farcaster user profiles (FID) for social discovery

**Business Model**: Transforms educational content into tradeable assets, allowing creators to build sustainable quiz businesses through coin mechanics.

### Technology Feedback & Experience

**✅ Zora Coins SDK - Excellent**
- **Documentation**: Comprehensive with clear examples for both coin creation and trading
- **Developer Experience**: Intuitive API design, TypeScript support is excellent
- **Reliability**: Consistent performance on Base mainnet, gas optimization works well
- **Integration**: Seamless with existing Web3 stack (Wagmi/Viem)

**✅ Farcaster Frame SDK - Outstanding**  
- **Authentication**: One-click auth flow is incredibly smooth
- **User Context**: Rich profile data (FID, username, avatar) readily available
- **Frame Lifecycle**: Clear state management for Frame readiness
- **Social Integration**: Natural fit for creator coin mechanics

**🔧 Areas for Future Improvement**
- **Zora SDK**: More granular fee configuration options for different creator tiers
- **Trading**: Additional token pair support beyond ETH (USDC, ZORA)
- **Analytics**: Built-in trading metrics and creator dashboard APIs
- **Mobile**: Enhanced mobile wallet connection experience

**Overall Assessment**: Both SDKs are production-ready with excellent documentation. The combination creates a powerful foundation for social-finance applications in the Farcaster ecosystem.

## 📖 Documentation

- [Zora Coins SDK Docs](https://docs.zora.co/docs/smart-contracts/creator-tools/collect-premints)
- [Farcaster Frame Docs](https://docs.farcaster.xyz/developers/frames/spec)
- [Base Network Docs](https://docs.base.org/)
- [Wagmi Docs](https://wagmi.sh/)

---

**Built for the Farcaster ecosystem with real Web3 functionality** 🚀