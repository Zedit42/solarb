# SolArb - Cross-DEX Arbitrage Agent for Solana

🤖 Autonomous arbitrage agent that finds and executes profitable trades across Solana DEXes.

## Features

- **Multi-DEX Support**: Jupiter, Raydium, Orca, Meteora
- **Real-time Price Monitoring**: Sub-second price feeds across all DEXes
- **Automatic Execution**: Instant arbitrage capture when profitable opportunities arise
- **P&L Tracking**: Daily, weekly, monthly profit/loss statistics
- **Risk Management**: Configurable slippage, max position size, and stop-loss
- **Dashboard**: Web UI for monitoring and configuration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SolArb Agent                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Jupiter   │  │   Raydium   │  │    Orca     │  ...    │
│  │    Feeds    │  │    Feeds    │  │   Feeds     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │   Arbitrage Engine    │                      │
│              │   - Price comparison  │                      │
│              │   - Profit calculator │                      │
│              │   - Risk checker      │                      │
│              └───────────┬───────────┘                      │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │   Execution Engine    │                      │
│              │   - Route optimizer   │                      │
│              │   - Transaction build │                      │
│              │   - Atomic execution  │                      │
│              └───────────┬───────────┘                      │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │      Dashboard        │                      │
│              │   - P&L tracking      │                      │
│              │   - Trade history     │                      │
│              │   - Configuration     │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Configure
cp config/default.example.json config/default.json
# Edit config with your settings

# Run
npm start
```

## Configuration

```json
{
  "rpc": "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
  "wallet": "YOUR_WALLET_PATH",
  "pairs": ["SOL/USDC", "RAY/USDC", "ORCA/USDC"],
  "minProfitBps": 10,
  "maxSlippageBps": 50,
  "maxPositionUsd": 1000,
  "dexes": ["jupiter", "raydium", "orca", "meteora"]
}
```

## Supported DEXes

| DEX | Status | Notes |
|-----|--------|-------|
| Jupiter | ✅ | Primary aggregator |
| Raydium | ✅ | AMM pools |
| Orca | ✅ | Whirlpools |
| Meteora | ✅ | DLMM pools |

## P&L Tracking

The dashboard shows:
- **Daily P&L**: Today's profit/loss
- **Weekly P&L**: Last 7 days
- **Monthly P&L**: Last 30 days
- **Trade History**: All executed trades
- **Success Rate**: Win/loss ratio

## Hackathon

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/) (Feb 2-12, 2026).

## License

MIT
