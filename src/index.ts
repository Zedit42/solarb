/**
 * SolArb - Cross-DEX Arbitrage Agent for Solana
 * 
 * Entry point for the arbitrage bot.
 */

import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { ArbitrageEngine, ArbitrageConfig } from './core/arbitrage';
import { logger } from './utils/logger';

// Load configuration
function loadConfig(): ArbitrageConfig {
  const configPath = process.env.CONFIG_PATH || path.join(__dirname, '../config/default.json');
  
  if (!fs.existsSync(configPath)) {
    logger.error(`Config file not found: ${configPath}`);
    logger.info('Copy config/default.example.json to config/default.json and configure');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Load wallet
  let wallet: Keypair;
  if (config.walletPath) {
    const walletData = JSON.parse(fs.readFileSync(config.walletPath, 'utf-8'));
    wallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
  } else if (process.env.WALLET_PRIVATE_KEY) {
    wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY))
    );
  } else {
    logger.error('No wallet configured. Set walletPath in config or WALLET_PRIVATE_KEY env var');
    process.exit(1);
  }

  return {
    rpcUrl: config.rpc || process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    wallet,
    minProfitBps: config.minProfitBps || 10,
    maxSlippageBps: config.maxSlippageBps || 50,
    maxPositionUsd: config.maxPositionUsd || 100,
    pairs: config.pairs || ['SOL/USDC'],
    scanIntervalMs: config.scanIntervalMs || 1000
  };
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███████╗ ██████╗ ██╗      █████╗ ██████╗ ██████╗   ║
║   ██╔════╝██╔═══██╗██║     ██╔══██╗██╔══██╗██╔══██╗  ║
║   ███████╗██║   ██║██║     ███████║██████╔╝██████╔╝  ║
║   ╚════██║██║   ██║██║     ██╔══██║██╔══██╗██╔══██╗  ║
║   ███████║╚██████╔╝███████╗██║  ██║██║  ██║██████╔╝  ║
║   ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝   ║
║                                                       ║
║         Cross-DEX Arbitrage Agent for Solana          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  const config = loadConfig();
  
  logger.info(`Wallet: ${config.wallet.publicKey.toBase58().slice(0, 8)}...`);
  logger.info(`RPC: ${config.rpcUrl.slice(0, 30)}...`);
  logger.info(`Pairs: ${config.pairs.join(', ')}`);
  logger.info(`Min Profit: ${config.minProfitBps} bps (${config.minProfitBps / 100}%)`);
  logger.info(`Max Position: $${config.maxPositionUsd}`);
  
  const engine = new ArbitrageEngine(config);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    engine.stop();
    
    // Print final stats
    const stats = engine.getPnLStats();
    logger.info('Final P&L:', stats);
    
    process.exit(0);
  });

  // Start the engine
  await engine.start();
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
