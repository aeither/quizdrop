import 'dotenv/config';
import { setApiKey, createCoin, DeployCurrency } from '@zoralabs/coins-sdk';
import { createWalletClient, createPublicClient, http, Hex, Address, isAddress } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Validate environment variables
const requiredEnvVars = {
  VITE_ZORA_API_KEY: process.env.VITE_ZORA_API_KEY,
  VITE_PRIVATE_KEY: process.env.VITE_PRIVATE_KEY,
  VITE_RPC_URL: process.env.VITE_RPC_URL,
  VITE_PAYOUT_RECIPIENT: process.env.VITE_PAYOUT_RECIPIENT,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Create a .env file with:');
  console.error('VITE_ZORA_API_KEY=your_zora_key');
  console.error('VITE_PRIVATE_KEY=your_private_key'); // Without 0x prefix
  console.error('VITE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-key'); // Base Sepolia RPC
  console.error('VITE_PAYOUT_RECIPIENT=0xValidEthereumAddress'); // Must start with 0x
  process.exit(1);
}

// Validate payout address format
if (!isAddress(process.env.VITE_PAYOUT_RECIPIENT!)) {
  console.error('❌ Invalid VITE_PAYOUT_RECIPIENT: Must be a valid Ethereum address');
  process.exit(1);
}

// Ensure private key has 0x prefix
const privateKey = process.env.VITE_PRIVATE_KEY!.startsWith('0x') 
  ? process.env.VITE_PRIVATE_KEY! as Hex
  : (`0x${process.env.VITE_PRIVATE_KEY}` as Hex);

setApiKey(process.env.VITE_ZORA_API_KEY!);

// Initialize clients with Base Sepolia
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.VITE_RPC_URL!),
});

const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.VITE_RPC_URL!),
});

// Define coin parameters
const coinParams = {
  name: "QuizDrop Coin",
  symbol: "QUIZ",
  uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy" as const,
  payoutRecipient: process.env.VITE_PAYOUT_RECIPIENT! as Address,
  chainId: base.id,
  currency: DeployCurrency.ZORA,
};

async function createMyCoin() {
  try {
    console.log('🚀 Creating coin...');
    const result = await createCoin(
      coinParams,
      walletClient,
      publicClient,
      { gasMultiplier: 120 }
    );
    console.log("✅ Coin created!\nTx hash:", result.hash);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createMyCoin();
