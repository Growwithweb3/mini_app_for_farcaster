// API Route for SBT Minting
// This route handles server-side minting using a private key from environment variables

import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { SBT_CONFIG } from '@/config/sbt-config';

interface MintRequest {
  address: string;
}

interface MintResponse {
  success: boolean;
  message?: string;
  txHash?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MintResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validate request body
    const { address }: MintRequest = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    // Check if contract address is configured
    if (!SBT_CONFIG.CONTRACT_ADDRESS || SBT_CONFIG.CONTRACT_ADDRESS === '') {
      return res.status(500).json({
        success: false,
        error: 'SBT contract address not configured. Please set CONTRACT_ADDRESS in config/sbt-config.ts',
      });
    }

    // Check if ABI is configured
    if (!SBT_CONFIG.CONTRACT_ABI || SBT_CONFIG.CONTRACT_ABI.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'SBT contract ABI not configured. Please set CONTRACT_ABI in config/sbt-config.ts',
      });
    }

    // Get private key from environment variable
    const privateKey = process.env.SBT_MINTER_PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Private key not set in environment variables',
      });
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SBT_CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create contract instance
    const contract = new ethers.Contract(
      SBT_CONFIG.CONTRACT_ADDRESS,
      SBT_CONFIG.CONTRACT_ABI,
      wallet
    );

    // Call mint function
    console.log(`Minting SBT to address: ${address}`);
    const tx = await contract.mint(address);

    // Wait for transaction confirmation
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      return res.status(200).json({
        success: true,
        message: 'SBT minted successfully!',
        txHash: tx.hash,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Transaction failed',
      });
    }
  } catch (error: any) {
    console.error('Error minting SBT:', error);
    
    // Handle specific error cases
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(500).json({
        success: false,
        error: 'Insufficient funds for transaction',
      });
    }

    if (error.message?.includes('user rejected')) {
      return res.status(400).json({
        success: false,
        error: 'Transaction was rejected',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to mint SBT',
    });
  }
}

