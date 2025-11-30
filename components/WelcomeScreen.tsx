// Welcome Screen component - handles wallet connection and sign-in

'use client';

import React, { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onPlayGame: (walletAddress: string) => void;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlayGame }) => {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    isLoading: false,
    error: null,
  });
  const [signedIn, setSignedIn] = useState(false);

  // Check if wallet is already connected
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check MetaMask or other Web3 providers first
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setWallet({
            connected: true,
            address: accounts[0],
            isLoading: false,
            error: null,
          });
          // Auto sign-in if already connected
          setSignedIn(true);
          return;
        }
      }
    } catch (error) {
      console.log('No existing connection found');
    }
  };

  const connectWallet = async () => {
    setWallet((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (typeof window === 'undefined') return;

      // Try Farcaster SDK first (if available)
      try {
        const sdkModule = await import('@farcaster/miniapp-sdk');
        const sdk = sdkModule.default || sdkModule;
        
        // Check if signIn action exists and call it
        if (sdk && typeof sdk === 'object' && 'actions' in sdk) {
          const actions = (sdk as any).actions;
          if (actions && typeof actions.signIn === 'function') {
            try {
              const result = await actions.signIn();
              // Handle different possible return types
              const address = result?.address || result?.user?.address || (result && typeof result === 'string' ? result : null);
              if (address) {
                setWallet({
                  connected: true,
                  address: address,
                  isLoading: false,
                  error: null,
                });
                setSignedIn(true);
                return;
              }
            } catch (fcSignInError) {
              console.log('Farcaster sign-in failed, trying Web3 wallet');
            }
          }
        }
      } catch (fcError) {
        console.log('Farcaster SDK not available, trying Web3 wallet');
      }

      // Fallback to MetaMask or other Web3 providers
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        // Switch to Base network (chain ID: 8453)
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base mainnet: 8453 = 0x2105
          });
        } catch (switchError: any) {
          // If Base network is not added, add it
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          }
        }

        // Sign message to verify ownership (optional but good for security)
        const message = 'Sign in to Base the Shooter';
        const signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]],
        });

        if (signature) {
          setWallet({
            connected: true,
            address: accounts[0],
            isLoading: false,
            error: null,
          });
          setSignedIn(true);
        }
      }
    } catch (error: any) {
      setWallet((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border-2 border-blue-500">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Base the Shooter</h1>
          <p className="text-gray-400">Farcaster Mini App</p>
        </div>

        {/* Main Message Box */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-center border-2 border-blue-400 shadow-lg">
          <p className="text-2xl font-bold text-white">
            Prove them Base is best L2
          </p>
        </div>

        {/* Wallet Connection Status */}
        {!wallet.connected ? (
          <div className="space-y-4">
            <button
              onClick={connectWallet}
              disabled={wallet.isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
            >
              {wallet.isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Connect Wallet & Sign In
                </>
              )}
            </button>
            
            {wallet.error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {wallet.error}
              </div>
            )}

            <p className="text-gray-400 text-sm text-center">
              Connect your MetaMask or Farcaster wallet to continue
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Status */}
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Wallet Connected</p>
                  <p className="text-white font-mono text-sm">{formatAddress(wallet.address)}</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {signedIn && (
              <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-200 text-sm text-center">✓ Signed In</p>
              </div>
            )}

            {/* Play Game Button */}
            {signedIn && wallet.address && (
              <button
                onClick={() => onPlayGame(wallet.address!)}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                🎮 Play Game
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Built on Base Network • Powered by Farcaster
          </p>
        </div>
      </div>
    </div>
  );
};

