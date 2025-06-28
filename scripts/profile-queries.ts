import 'dotenv/config';
import { getProfileBalances } from '@zoralabs/coins-sdk';
import { isAddress } from 'viem';
import { setApiKey } from '@zoralabs/coins-sdk';

// Set API key if available (optional for profile queries)
if (process.env.VITE_ZORA_API_KEY) {
  setApiKey(process.env.VITE_ZORA_API_KEY);
}

// Get wallet address from command line
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('❌ Please provide a wallet address: npm run get-coins <address>');
  process.exit(1);
}

if (!isAddress(walletAddress)) {
  console.error('❌ Invalid wallet address format');
  process.exit(1);
}

async function fetchCoinBalances(address: string) {
  try {
    console.log(`🔍 Fetching coin balances for ${address}...`);
    
    const response = await getProfileBalances({
      identifier: address,
      count: 100
    });

    const balances = response.data?.profile?.coinBalances?.edges || [];
    
    if (balances.length === 0) {
      console.log('💸 No coins found for this address');
      return;
    }

    console.log(`\n💰 Found ${balances.length} coin holdings:`);
    console.log('='.repeat(60));
    
    balances.forEach(({ node }, index) => {
      // Corrected field names based on API response
      const coinName = node.coin?.name || 'Unknown Coin';
      const symbol = node.coin?.symbol || '???';
      const contract = node.coin?.address || 'No contract';
      const chainId = node.coin?.chainId || 'N/A';
      
      // Get decimals - default to 18 if unavailable
      const decimals = node.coin?.poolCurrencyToken?.decimals || 18;
      
      // Convert raw balance to decimal format
      const rawBalance = node.balance || '0';
      const balanceDecimal = parseFloat(rawBalance) / Math.pow(10, decimals);
      
      console.log(
        `#${index + 1}: ${coinName} (${symbol})\n` +
        `   Balance: ${balanceDecimal.toFixed(4)}\n` +
        `   Contract: ${contract}\n` +
        `   Chain ID: ${chainId}\n` +
        '-'.repeat(60)
      );
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch balances:', 
      error instanceof Error ? error.message : error
    );
  }
}

fetchCoinBalances(walletAddress);
