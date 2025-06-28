# 🎯 QuizDrop

Interactive quiz mini app for Farcaster with Base network integration.

This is a [Vite](https://vitejs.dev) project bootstrapped with [`@farcaster/create-mini-app`](https://github.com/farcasterxyz/frames/tree/main/packages/create-mini-app).

## Description

QuizDrop is a decentralized quiz application built for the Farcaster ecosystem. Users can create, participate in, and earn rewards from interactive quizzes using Base network integration. The app provides a seamless social experience where users can challenge friends, track their performance, and earn cryptocurrency rewards for their knowledge.

## Features

### 🎮 Take Quizzes
- Interactive quiz interface with multiple-choice questions
- Real-time feedback and scoring
- Progress tracking and results

### 🪙 Create Quiz Coins
- Create unique coins for your quizzes using Zora's Coins SDK
- Players earn coins by participating and answering correctly
- Coin creators earn from trading fees
- Full blockchain integration with Base network

### 🔗 Wallet Integration
- Connect with any Ethereum wallet
- Sign messages and transactions
- View coin balances and transaction history

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **For coin creation (optional):**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your actual values:
   # ZORA_API_KEY=your_zora_api_key
   # PRIVATE_KEY=your_private_key_without_0x
   # RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-key
   # PAYOUT_RECIPIENT=0xYourEthereumAddress
   
   # For frontend coin creation, also add to .env.local:
   # VITE_ZORA_API_KEY=your_zora_api_key
   ```

## Coin Creation Scripts

### Create a Quiz Coin
```bash
pnpm create-coin
```

### Query User's Coin Balances
```bash
pnpm get-coins <wallet_address>
```

## Environment Variables

For production coin creation, you'll need:

**Backend Scripts (.env):**
- `ZORA_API_KEY`: Get from [Zora](https://zora.co/)
- `PRIVATE_KEY`: Your wallet's private key (without 0x prefix)
- `RPC_URL`: Base network RPC endpoint
- `PAYOUT_RECIPIENT`: Address to receive creator fees

**Frontend Coin Creation (.env.local):**
- `VITE_ZORA_API_KEY`: Same Zora API key for frontend use

## Development vs Production

### Development Mode
- Quiz creation uses simulated transactions
- No real coins are created
- Perfect for testing the UI/UX

### Production Mode
- Real coin creation using Zora's protocol
- Actual blockchain transactions
- Requires valid environment variables and gas fees

To enable production mode, set up your `.env` file and replace the simulated coin creation in `src/App.tsx` with real API calls to your backend.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

## `farcaster.json`

The `/.well-known/farcaster.json` is served from the [public
directory](https://vite.dev/guide/assets) and can be updated by editing
`./public/.well-known/farcaster.json`.

You can also use the `public` directory to serve a static image for `splashBackgroundImageUrl`.

## Frame Embed

Add a the `fc:frame` in `index.html` to make your root app URL sharable in feeds:

```html
  <head>
    <!--- other tags --->
    <meta name="fc:frame" content='{"version":"next","imageUrl":"https://placehold.co/900x600.png?text=Frame%20Image","button":{"title":"Open","action":{"type":"launch_frame","name":"App Name","url":"https://app.com"}}}' /> 
  </head>
```
