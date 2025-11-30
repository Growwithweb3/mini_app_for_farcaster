import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import Game component with SSR disabled
// This prevents server-side rendering issues with browser APIs (Image, Canvas, etc.)
const Game = dynamic(() => import('@/components/Game').then((mod) => ({ default: mod.Game })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">Loading Base the Shooter...</div>
        <div className="text-gray-400">Preparing your game</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Base the Shooter - Farcaster Mini App</title>
        <meta name="description" content="Base the Shooter - A 2D shooter game on Base chain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Favicon - optional, won't cause 404 if missing */}
        
        {/* Farcaster Mini App Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:miniapp" content="https://baseshooter.xyz" />
        <meta property="og:title" content="Base the Shooter" />
        <meta property="og:description" content="A 2D shooter game on Base chain" />
        <meta property="og:image" content="https://baseshooter.xyz/splash.png" />
        <meta property="og:type" content="website" />
      </Head>
      <main>
        <Game />
      </main>
    </>
  );
}

