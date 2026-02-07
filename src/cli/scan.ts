/**
 * SolArb Scanner CLI
 * 
 * Scan for arbitrage opportunities without executing.
 */

import { Connection } from '@solana/web3.js';
import { JupiterDex } from '../dex/jupiter';
import { RaydiumDex } from '../dex/raydium';
import { OrcaDex } from '../dex/orca';
import { MeteoraDex } from '../dex/meteora';
import { PriceQuote } from '../types';
import { logger } from '../utils/logger';

const RPC_URL = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const PAIRS = ['SOL/USDC', 'RAY/USDC', 'ORCA/USDC', 'JUP/USDC'];
const AMOUNT_USD = 100;

interface ArbitrageResult {
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitBps: number;
  profitUsd: number;
}

async function scan() {
  console.log(`
╔══════════════════════════════════════════════════╗
║           SolArb Arbitrage Scanner               ║
╠══════════════════════════════════════════════════╣
║  Scanning ${PAIRS.length} pairs across 4 DEXes...             ║
╚══════════════════════════════════════════════════╝
  `);

  const connection = new Connection(RPC_URL, 'confirmed');
  
  const dexes = [
    new JupiterDex(connection),
    new RaydiumDex(connection),
    new OrcaDex(connection),
    new MeteoraDex(connection)
  ];

  const opportunities: ArbitrageResult[] = [];

  for (const pair of PAIRS) {
    const [baseToken, quoteToken] = pair.split('/');
    console.log(`\n🔍 Scanning ${pair}...`);
    
    const quotes: Map<string, PriceQuote> = new Map();
    
    // Get quotes from all DEXes
    for (const dex of dexes) {
      try {
        const quote = await dex.getQuote(baseToken, quoteToken, AMOUNT_USD);
        if (quote) {
          quotes.set(dex.name, quote);
          console.log(`   ${dex.name.padEnd(10)} Buy: $${quote.buyPrice.toFixed(6)} | Sell: $${quote.sellPrice.toFixed(6)}`);
        }
      } catch (error) {
        // Skip failed quotes
      }
    }

    // Find arbitrage
    if (quotes.size >= 2) {
      let bestBuy: { dex: string; quote: PriceQuote } | null = null;
      let bestSell: { dex: string; quote: PriceQuote } | null = null;

      for (const [dex, quote] of quotes.entries()) {
        if (!bestBuy || quote.buyPrice < bestBuy.quote.buyPrice) {
          bestBuy = { dex, quote };
        }
        if (!bestSell || quote.sellPrice > bestSell.quote.sellPrice) {
          bestSell = { dex, quote };
        }
      }

      if (bestBuy && bestSell && bestBuy.dex !== bestSell.dex) {
        const profitBps = Math.floor(
          ((bestSell.quote.sellPrice - bestBuy.quote.buyPrice) / bestBuy.quote.buyPrice) * 10000
        );
        
        if (profitBps > 0) {
          opportunities.push({
            pair,
            buyDex: bestBuy.dex,
            sellDex: bestSell.dex,
            buyPrice: bestBuy.quote.buyPrice,
            sellPrice: bestSell.quote.sellPrice,
            profitBps,
            profitUsd: (profitBps / 10000) * AMOUNT_USD
          });
        }
      }
    }
  }

  // Print results
  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('                 SCAN RESULTS                       ');
  console.log('═══════════════════════════════════════════════════');

  if (opportunities.length === 0) {
    console.log('\n❌ No arbitrage opportunities found');
    console.log('   Market is efficient right now. Keep scanning!\n');
  } else {
    opportunities.sort((a, b) => b.profitBps - a.profitBps);
    
    console.log(`\n✅ Found ${opportunities.length} opportunities:\n`);
    
    for (const opp of opportunities) {
      const status = opp.profitBps >= 10 ? '🎯 EXECUTABLE' : '⚠️  Low profit';
      console.log(`   ${opp.pair}`);
      console.log(`   Buy on ${opp.buyDex} @ $${opp.buyPrice.toFixed(6)}`);
      console.log(`   Sell on ${opp.sellDex} @ $${opp.sellPrice.toFixed(6)}`);
      console.log(`   Profit: ${opp.profitBps} bps ($${opp.profitUsd.toFixed(2)}) ${status}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
}

scan().catch(error => {
  logger.error('Scan failed:', error);
  process.exit(1);
});
