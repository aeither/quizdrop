// Uniswap V4 + Zora Coins Integration Script
// Handles: Swapping, Minting Positions, Adding Liquidity
// Compatible with Base network and Zora coins created via QuizDrop

import {
    Ether,
    Percent,
    Token
} from '@uniswap/sdk-core';
import {
    CommandType,
    RoutePlanner
} from '@uniswap/universal-router-sdk';
import {
    Actions,
    Pool,
    Position,
    V4Planner,
    V4PositionManager,
} from '@uniswap/v4-sdk';
import { DeployCurrency, createCoin, setApiKey } from '@zoralabs/coins-sdk';
import 'dotenv/config';
import {
    createPublicClient,
    createWalletClient,
    http,
    parseEther,
    type Address,
    type Hex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

function nearestUsableTick(tick: number, tickSpacing: number): number {
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    // Clamp to min/max tick if needed, based on your context
    return rounded;
}

// Contract addresses (Base network)
const CONTRACTS = {
  UNIVERSAL_ROUTER: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Base Universal Router
  POSITION_MANAGER: '0x03a520b32C04BF3bEEf7BF5d6dAf8Cf68E8A0BfB', // Base Position Manager
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Canonical Permit2
  STATE_VIEW: '0x50b4B32d21fa3a7b8080b97e8C1faacb9C42D8F6', // Base StateView (example)
};

// ABIs (simplified for key functions)
const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "poolKey",
        type: "tuple"
      },
      { name: "zeroForOne", type: "bool" },
      { name: "exactAmount", type: "uint256" },
      { name: "hookData", type: "bytes" },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const STATE_VIEW_ABI = [
  {
    inputs: [{ name: "poolId", type: "bytes32" }],
    name: "getSlot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "poolId", type: "bytes32" }],
    name: "getLiquidity",
    outputs: [{ name: "liquidity", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
];

const PERMIT2_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Types
interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  amountOutMinimum: string;
  fee: number;
  recipient: Address;
}

interface QuoteParams {
  poolKey: {
    currency0: Address;
    currency1: Address;
    fee: number;
    tickSpacing: number;
    hooks: Address;
  };
  zeroForOne: boolean;
  exactAmount: string;
  hookData: string;
}

interface MintPositionParams {
  token0: Token | Ether;
  token1: Token;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string;
  amount1Desired: string;
  recipient: Address;
  slippageTolerance: number;
}

interface PoolInfo {
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
}

// Setup clients
function setupClients() {
  const rpcUrl = process.env.VITE_RPC_URL || 'https://mainnet.base.org';
  const privateKey = process.env.VITE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('VITE_PRIVATE_KEY environment variable is required');
  }

  const account = privateKeyToAccount(privateKey as Hex);
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  return { publicClient, walletClient, account };
}

// Create a Zora coin with Uniswap V4 integration
export async function createZoraQuizCoin(
  name: string,
  symbol: string,
  description?: string
): Promise<{
  coinAddress: Address;
  txHash: string;
  creator: Address;
}> {
  const { publicClient, walletClient, account } = setupClients();
  
  // Set Zora API key
  const zoraApiKey = process.env.VITE_ZORA_API_KEY;
  if (!zoraApiKey) {
    throw new Error('VITE_ZORA_API_KEY environment variable is required');
  }
  setApiKey(zoraApiKey);

  const payoutRecipient = process.env.VITE_PAYOUT_RECIPIENT as Address;
  if (!payoutRecipient) {
    throw new Error('VITE_PAYOUT_RECIPIENT environment variable is required');
  }

  const coinParams = {
    name,
    symbol,
    uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy",
    payoutRecipient,
    chainId: base.id,
    currency: DeployCurrency.ZORA,
  };

  console.log(`🪙 Creating Zora coin: ${name} (${symbol})`);
  
  const result = await createCoin(
    coinParams,
    walletClient,
    publicClient,
    { gasMultiplier: 120 }
  );

  console.log(`✅ Coin created at: ${result.address}`);
  
  return {
    coinAddress: result.address,
    txHash: result.hash,
    creator: account.address,
  };
}

// Get pool information from StateView contract
export async function getPoolInfo(
  token0: Address,
  token1: Address,
  fee: number,
  tickSpacing: number,
  hooks: Address = '0x0000000000000000000000000000000000000000'
): Promise<PoolInfo> {
  const { publicClient } = setupClients();

  // Create poolId (this is a simplified version - actual implementation may vary)
  const poolId = Pool.getPoolId(
    new Token(base.id, token0, 18, 'T0'),
    new Token(base.id, token1, 18, 'T1'),
    fee,
    tickSpacing,
    hooks
  );

  const [slot0, liquidity] = await Promise.all([
    publicClient.readContract({
      address: CONTRACTS.STATE_VIEW,
      abi: STATE_VIEW_ABI,
      functionName: 'getSlot0',
      args: [poolId as `0x${string}`],
    }),
    publicClient.readContract({
      address: CONTRACTS.STATE_VIEW,
      abi: STATE_VIEW_ABI,
      functionName: 'getLiquidity',
      args: [poolId as `0x${string}`],
    }),
  ]);

  return {
    sqrtPriceX96: slot0[0] as bigint,
    tick: slot0[1] as number,
    liquidity: liquidity as bigint,
  };
}

// Get a quote for a swap
export async function getSwapQuote(params: QuoteParams): Promise<{
  amountOut: string;
  gasEstimate: string;
}> {
  const { publicClient } = setupClients();

  const quoterAddress = '0x...' as Address; // Replace with actual Quoter address on Base
  
  const result = await publicClient.readContract({
    address: quoterAddress,
    abi: QUOTER_ABI,
    functionName: 'quoteExactInputSingle',
    args: [params.poolKey, params.zeroForOne, params.exactAmount, params.hookData],
  });

  return {
    amountOut: result[0].toString(),
    gasEstimate: result[1].toString(),
  };
}

// Execute a swap using Universal Router
export async function executeSwap(params: SwapParams): Promise<string> {
  const { walletClient, account } = setupClients();

  const v4Planner = new V4Planner();
  const routePlanner = new RoutePlanner();

  // Set deadline (20 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 1200;

  // Configure swap parameters
  const swapConfig = {
    poolKey: {
      currency0: params.tokenIn,
      currency1: params.tokenOut,
      fee: params.fee,
      tickSpacing: 10, // Standard for 0.05% fee
      hooks: '0x0000000000000000000000000000000000000000' as Address,
    },
    zeroForOne: true, // Adjust based on token order
    amountIn: params.amountIn,
    amountOutMinimum: params.amountOutMinimum,
    hookData: '0x',
  };

  // Plan the swap actions
  v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [swapConfig]);
  v4Planner.addAction(Actions.SETTLE_ALL, [params.tokenIn, params.amountIn]);
  v4Planner.addAction(Actions.TAKE_ALL, [params.tokenOut, params.amountOutMinimum]);

  const encodedActions = v4Planner.finalize();
  
  // Add to route planner
  routePlanner.addCommand(CommandType.V4_SWAP, [v4Planner.actions, v4Planner.params]);

  // Execute transaction
  const txOptions: any = {};
  
  // Add value if swapping with native ETH
  if (params.tokenIn === '0x0000000000000000000000000000000000000000') {
    txOptions.value = BigInt(params.amountIn);
  }

  const txHash = await walletClient.writeContract({
    account,
    address: CONTRACTS.UNIVERSAL_ROUTER,
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: 'execute',
    args: [routePlanner.commands, [encodedActions], deadline],
    ...txOptions,
  });

  console.log(`🔄 Swap executed: ${txHash}`);
  return txHash;
}

// Mint a new liquidity position
export async function mintLiquidityPosition(params: MintPositionParams): Promise<string> {
  const { publicClient, walletClient, account } = setupClients();

  // Get pool info
  const poolInfo = await getPoolInfo(
    params.token0.isNative ? '0x0000000000000000000000000000000000000000' as Address : (params.token0 as Token).address,
    params.token1.address,
    params.fee,
    10 // Standard tick spacing for 0.05% fee
  );

  // Create Pool instance
  const pool = new Pool(
    params.token0,
    params.token1,
    params.fee,
    10, // tickSpacing
    '0x0000000000000000000000000000000000000000' as Address, // hooks
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  // Create Position
  const position = Position.fromAmounts({
    pool,
    tickLower: params.tickLower,
    tickUpper: params.tickUpper,
    amount0: params.amount0Desired,
    amount1: params.amount1Desired,
    useFullPrecision: true,
  });

  // Setup mint options
  const slippagePct = new Percent(Math.floor(params.slippageTolerance * 100), 10_000);
  const deadline = Math.floor(Date.now() / 1000) + 1200;

  const mintOptions = {
    recipient: params.recipient,
    slippageTolerance: slippagePct,
    deadline: deadline.toString(),
    useNative: params.token0.isNative ? Ether.onChain(base.id) : undefined,
    hookData: '0x',
  };

  // Generate transaction data
  const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);

  // Execute transaction
  const txHash = await walletClient.writeContract({
    account,
    address: CONTRACTS.POSITION_MANAGER,
    abi: [
      {
        inputs: [{ name: "data", type: "bytes[]" }],
        name: "multicall",
        outputs: [{ name: "results", type: "bytes[]" }],
        stateMutability: "payable",
        type: "function",
      },
    ],
    functionName: 'multicall',
    args: [[calldata]],
    value: BigInt(value),
  });

  console.log(`💧 Liquidity position minted: ${txHash}`);
  return txHash;
}

// Create a full-range liquidity position for a new coin
export async function createInitialLiquidity(
  coinAddress: Address,
  ethAmount: string, // Amount of ETH to pair
  slippageTolerance = 0.05
): Promise<string> {
  const { account } = setupClients();

  const ethToken = Ether.onChain(base.id);
  const quizCoin = new Token(base.id, coinAddress, 18, 'QUIZ', 'Quiz Coin');

  // Calculate tick range for full-range position
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  const tickSpacing = 10;

  const tickLower = nearestUsableTick(MIN_TICK, tickSpacing);
  const tickUpper = nearestUsableTick(MAX_TICK, tickSpacing);

  const params: MintPositionParams = {
    token0: ethToken,
    token1: quizCoin,
    fee: 500, // 0.05% fee tier
    tickLower,
    tickUpper,
    amount0Desired: parseEther(ethAmount).toString(),
    amount1Desired: '1000000000000000000000', // 1000 quiz coins
    recipient: account.address,
    slippageTolerance,
  };

  return await mintLiquidityPosition(params);
}

// Utility function to swap ETH for quiz coins
export async function swapETHForQuizCoin(
  quizCoinAddress: Address,
  ethAmountIn: string,
  minQuizCoinsOut = '0'
): Promise<string> {
  const { account } = setupClients();

  const params: SwapParams = {
    tokenIn: '0x0000000000000000000000000000000000000000' as Address, // ETH
    tokenOut: quizCoinAddress,
    amountIn: parseEther(ethAmountIn).toString(),
    amountOutMinimum: minQuizCoinsOut,
    fee: 500, // 0.05% fee tier
    recipient: account.address,
  };

  return await executeSwap(params);
}

// Utility function to swap quiz coins for ETH
export async function swapQuizCoinForETH(
  quizCoinAddress: Address,
  quizCoinAmountIn: string,
  minETHOut = '0'
): Promise<string> {
  const { account } = setupClients();

  const params: SwapParams = {
    tokenIn: quizCoinAddress,
    tokenOut: '0x0000000000000000000000000000000000000000' as Address, // ETH
    amountIn: quizCoinAmountIn,
    amountOutMinimum: minETHOut,
    fee: 500, // 0.05% fee tier
    recipient: account.address,
  };

  return await executeSwap(params);
}

// Example usage function
export async function demonstrateFullWorkflow() {
  try {
    console.log('🚀 Starting Uniswap V4 + Zora integration demo...');

    // 1. Create a new quiz coin
    const coinResult = await createZoraQuizCoin(
      'Demo Quiz Coin',
      'DEMO',
      'A demonstration quiz coin for testing'
    );

    console.log(`📅 Created coin: ${coinResult.coinAddress}`);

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 2. Create initial liquidity
    const liquidityTx = await createInitialLiquidity(
      coinResult.coinAddress,
      '0.01', // 0.01 ETH
      0.05 // 5% slippage
    );

    console.log(`💧 Added initial liquidity: ${liquidityTx}`);

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 3. Perform a test swap
    const swapTx = await swapETHForQuizCoin(
      coinResult.coinAddress,
      '0.001', // 0.001 ETH
      '0' // Accept any amount out
    );

    console.log(`🔄 Test swap completed: ${swapTx}`);

    return {
      coinAddress: coinResult.coinAddress,
      createTx: coinResult.txHash,
      liquidityTx,
      swapTx,
    };

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}
