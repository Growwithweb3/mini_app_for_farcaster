import Head from 'next/head';
import { Game } from '@/components/Game';

export default function Home() {
  return (
    <>
      <Head>
        <title>Base the Shooter - Farcaster Mini App</title>
        <meta name="description" content="Base the Shooter - A 2D shooter game on Base chain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
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

