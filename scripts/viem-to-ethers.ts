// Utility to convert a Viem Wallet Client to an Ethers.js Signer (Ethers v6)
// Useful for interoperability between Viem and Ethers.js-based libraries/APIs
//
// NOTE: Make sure to install 'ethers' and '@wagmi/core' in your project:
//   pnpm add ethers @wagmi/core

import { getWalletClient } from '@wagmi/core';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'viem';

/**
 * Converts a Viem WalletClient to an Ethers.js JsonRpcSigner (Ethers v6)
 * @param walletClient Viem WalletClient instance
 * @returns Ethers.js JsonRpcSigner
 */
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  if (!account) throw new Error('WalletClient missing account');
  if (!chain) throw new Error('WalletClient missing chain');
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

/**
 * Helper to get an Ethers.js Signer from Wagmi's WalletClient
 * @param opts Optional: { chainId }
 * @returns Ethers.js JsonRpcSigner or undefined
 */
export async function getEthersSigner({ chainId }: { chainId?: number } = {}) {
  const client = await getWalletClient({ chainId });
  if (!client) return undefined;
  return walletClientToSigner(client);
} 