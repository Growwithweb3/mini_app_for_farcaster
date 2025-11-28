import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Farcaster Mini App SDK
    if (typeof window !== 'undefined') {
      import('@farcaster/miniapp-sdk').then((module) => {
        const sdk = module.default || module;
        if (sdk?.actions?.ready) {
          sdk.actions.ready();
        }
      }).catch((err) => {
        // SDK not available in non-Farcaster environments - this is expected
        console.warn('Farcaster SDK not available (running outside Farcaster):', err);
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

