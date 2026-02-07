# SolArb - Funding Rate Arbitrage Agent for Solana

🤖 Autonomous agent that captures funding rate arbitrage opportunities on Solana perp markets.

## What is Funding Rate Arbitrage?

Perpetual futures markets use **funding rates** to keep prices aligned with spot. When funding is positive, longs pay shorts. When negative, shorts pay longs.

**The Strategy:**
1. Open a perp position (long or short based on funding direction)
2. Hedge with opposite spot position (delta neutral)
3. Collect funding payments every hour
4. Close when funding normalizes

**Example:**
- Funding rate: +0.05% per hour (longs pay shorts)
- Open SHORT perp + buy SPOT (hedged)
- Collect 0.05% × 24 = 1.2% daily from funding
- Zero price risk (delta neutral)

## Features

- **Multi-Protocol Support**: Drift, Zeta, Mango
- **Real-time Funding Monitoring**: Track rates across all markets
- **Automatic Hedging**: Delta-neutral position management
- **P&L Tracking**: Daily, weekly, monthly statistics
- **Risk Management**: Position limits, auto-close thresholds
- **Dashboard**: Web UI for monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SolArb Funding Agent                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Drift    │  │    Zeta     │  │    Mango    │         │
│  │  Funding    │  │  Funding    │  │   Funding   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │   Funding Analyzer    │                      │
│              │   - Rate comparison   │                      │
│              │   - APY calculation   │                      │
│              │   - Entry signals     │                      │
│              └───────────┬───────────┘                      │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │   Position Manager    │                      │
│              │   - Perp positions    │                      │
│              │   - Spot hedges       │                      │
│              │   - Delta balancing   │                      │
│              └───────────┬───────────┘                      │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │      Dashboard        │                      │
│              │   - Funding rates     │                      │
│              │   - Open positions    │                      │
│              │   - P&L tracking      │                      │
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

# Scan funding rates
npm run scan

# Start the bot
npm start
```

## Configuration

```json
{
  "rpc": "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
  "wallet": "YOUR_WALLET_PATH",
  "markets": ["SOL-PERP", "BTC-PERP", "ETH-PERP"],
  "minFundingApy": 20,
  "maxPositionUsd": 1000,
  "protocols": ["drift", "zeta"]
}
```

## Supported Protocols

| Protocol | Status | Funding Interval |
|----------|--------|------------------|
| Drift | ✅ | Hourly |
| Zeta | ✅ | 8-hourly |
| Mango | 🔄 | Hourly |

## P&L Tracking

The dashboard shows:
- **Current Positions**: Open perp + hedge positions
- **Funding Earned**: Total funding collected
- **Daily/Weekly/Monthly APY**: Annualized returns
- **Position History**: All trades

## Risk Management

- **Delta Neutral**: Always hedged, no directional risk
- **Position Limits**: Max size per market
- **Auto-Close**: Exit when funding drops below threshold
- **Liquidation Buffer**: Maintain safe margin levels

## Hackathon

Built for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/) (Feb 2-12, 2026).

## License

MIT
