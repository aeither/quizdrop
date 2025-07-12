# About QuizDrop

## What it does

QuizDrop is a Farcaster mini-app that transforms quizzes into tradeable assets. Users can create quizzes that automatically deploy real ERC-20 coins on the Base network using Zora's Coins SDK. Each quiz gets its own unique token that anyone can buy and sell, creating real economic value for knowledge sharing.

## The problem it solves

Traditional quiz and educational platforms offer meaningless points, badges, or virtual rewards with zero real-world value. This creates low long-term engagement, no sustainable incentive for quality content creation, and makes educational gamification feel hollow. QuizDrop solves this by creating lasting economic incentives for both quiz creators and participants through real cryptocurrency rewards.

## Challenges I ran into

- **SDK Integration Complexity**: Integrating Zora Coins SDK with Farcaster Frame SDK required careful state management and error handling
- **Gas Optimization**: Ensuring coin creation and trading operations remain affordable on Base network
- **User Experience**: Making complex DeFi operations feel like simple social interactions
- **Cross-Platform Integration**: Seamlessly connecting Farcaster social features with blockchain functionality
- **Database Design**: Creating a scalable schema that links quiz metadata with on-chain coin data

## Technologies I used

- **Frontend**: React + TypeScript + Vite
- **Web3**: Wagmi + Viem for Base network integration
- **Coins**: Zora Coins SDK for token creation and trading
- **Auth**: Farcaster Frame SDK for user management
- **Database**: PostgreSQL + Drizzle ORM
- **Network**: Base (Coinbase L2) for low-cost transactions
- **Deployment**: ngrok for Farcaster Frame hosting

## How we built it

1. **Quiz Creation Flow**: Users create quizzes through a simple form, which triggers Zora Coins SDK to deploy a new ERC-20 token on Base network
2. **Farcaster Integration**: Seamless authentication using Farcaster Frame SDK, linking quiz creators to their Farcaster profiles
3. **Database Architecture**: PostgreSQL stores quiz metadata and links it to on-chain coin addresses for persistence
4. **Trading Infrastructure**: Zora's trading system enables users to buy/sell quiz coins with ETH
5. **Social Features**: Native Farcaster integration allows for viral sharing and social verification of achievements

## What we learned

- **SDK Synergy**: The combination of Zora Coins SDK and Farcaster Frame SDK creates powerful social-finance applications
- **User Experience**: Complex blockchain operations can be abstracted into simple, intuitive interfaces
- **Economic Incentives**: Real cryptocurrency rewards create much stronger engagement than virtual points
- **Cross-Platform Development**: Building for Farcaster's ecosystem requires careful consideration of Frame lifecycle and user context
- **Gas Optimization**: Base network provides excellent cost-effectiveness for frequent transactions

## What's next for QuizDrop

- **Uniswap V4 Integration**: Automated liquidity pool creation for every quiz coin
- **Advanced Quiz Types**: Multiple choice, true/false, and open-ended questions
- **Creator Analytics**: Dashboard with revenue tracking and engagement metrics
- **Coin-Gated Access**: Hold specific coins to participate in premium quizzes
- **Cross-Chain Deployment**: Expand to Ethereum mainnet and Polygon
- **Social Features**: Leaderboards, achievements, and community challenges
- **Mobile Optimization**: Enhanced mobile wallet connection experience 