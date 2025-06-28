import 'dotenv/config';
import { setApiKey, createCoin, DeployCurrency } from '@zoralabs/coins-sdk';
import { createWalletClient, createPublicClient, http, Hex, Address, isAddress } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Validate environment variables
const requiredEnvVars = {
  ZORA_API_KEY: process.env.ZORA_API_KEY,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL,
  PAYOUT_RECIPIENT: process.env.PAYOUT_RECIPIENT,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n📝 Create a .env file with:');
  console.error('ZORA_API_KEY=your_zora_key');
  console.error('PRIVATE_KEY=your_private_key'); // Without 0x prefix
  console.error('RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-key'); // Base Sepolia RPC
  console.error('PAYOUT_RECIPIENT=0xValidEthereumAddress'); // Must start with 0x
  process.exit(1);
}

// Validate payout address format
if (!isAddress(process.env.PAYOUT_RECIPIENT!)) {
  console.error('❌ Invalid PAYOUT_RECIPIENT: Must be a valid Ethereum address');
  process.exit(1);
}

// Ensure private key has 0x prefix
const privateKey = process.env.PRIVATE_KEY!.startsWith('0x') 
  ? process.env.PRIVATE_KEY! as Hex
  : (`0x${process.env.PRIVATE_KEY}` as Hex);

setApiKey(process.env.ZORA_API_KEY!);

// Initialize clients with Base Sepolia
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL!),
});

const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(process.env.RPC_URL!),
});

// Define coin parameters
const coinParams = {
  name: "QuizDrop Coin",
  symbol: "QUIZ",
  uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy",
  payoutRecipient: process.env.PAYOUT_RECIPIENT! as Address,
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
