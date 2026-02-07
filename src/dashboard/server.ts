/**
 * SolArb Dashboard Server
 * 
 * Real-time web dashboard for monitoring funding rates and positions.
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { Connection } from '@solana/web3.js';
import { DriftProtocol } from '../protocols/drift';
import { PnLTracker } from '../core/pnl-tracker';
import path from 'path';

const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize services
const connection = new Connection(RPC_URL, 'confirmed');
const drift = new DriftProtocol(connection);
const pnlTracker = new PnLTracker();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/funding-rates', async (req, res) => {
  try {
    const rates = await drift.getFundingRates();
    res.json({ success: true, rates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/markets', async (req, res) => {
  try {
    const markets = await drift.getMarkets();
    res.json({ success: true, markets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/pnl', (req, res) => {
  try {
    const stats = pnlTracker.getStats();
    const recent = pnlTracker.getRecentTrades(20);
    res.json({ success: true, stats, recentTrades: recent });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: {
      uptime: process.uptime(),
      rpc: RPC_URL.slice(0, 30) + '...',
      timestamp: Date.now()
    }
  });
});

// Serve main dashboard
app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Dashboard client connected');
  
  // Send initial data
  sendUpdate(ws);
  
  // Send updates every 30 seconds
  const interval = setInterval(() => sendUpdate(ws), 30000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Dashboard client disconnected');
  });
});

async function sendUpdate(ws: WebSocket) {
  try {
    const rates = await drift.getFundingRates();
    const stats = pnlTracker.getStats();
    
    ws.send(JSON.stringify({
      type: 'update',
      data: { rates: rates.slice(0, 15), stats }
    }));
  } catch (error) {
    // Ignore errors
  }
}

function getDashboardHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolArb - Funding Rate Arbitrage</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: #e0e0e0;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    
    header {
      text-align: center;
      padding: 40px 20px;
      border-bottom: 1px solid #333;
    }
    header h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #00d4ff, #7b2cbf);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    header p { color: #888; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-card h3 { color: #888; font-size: 0.9rem; margin-bottom: 10px; }
    .stat-card .value { font-size: 2rem; font-weight: bold; }
    .stat-card .value.positive { color: #00ff88; }
    .stat-card .value.negative { color: #ff4444; }
    
    .section { margin: 40px 0; }
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #7b2cbf;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
      overflow: hidden;
    }
    th, td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #333;
    }
    th { background: rgba(123, 44, 191, 0.2); color: #7b2cbf; }
    tr:hover { background: rgba(255,255,255,0.05); }
    
    .positive { color: #00ff88; }
    .negative { color: #ff4444; }
    .neutral { color: #888; }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .badge.long { background: rgba(0, 255, 136, 0.2); color: #00ff88; }
    .badge.short { background: rgba(255, 68, 68, 0.2); color: #ff4444; }
    
    .opportunity {
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 44, 191, 0.1));
      border: 1px solid #7b2cbf;
    }
    
    #loading {
      text-align: center;
      padding: 40px;
      color: #888;
    }
    
    .refresh-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: rgba(0,0,0,0.8);
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .refresh-indicator.connected { color: #00ff88; }
    .refresh-indicator.disconnected { color: #ff4444; }
    
    footer {
      text-align: center;
      padding: 40px;
      color: #666;
      border-top: 1px solid #333;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="refresh-indicator" id="status">Connecting...</div>
  
  <header>
    <h1>⚡ SolArb</h1>
    <p>Funding Rate Arbitrage Agent for Solana</p>
  </header>
  
  <div class="container">
    <div class="stats-grid" id="stats">
      <div class="stat-card">
        <h3>Daily P&L</h3>
        <div class="value" id="daily-pnl">$0.00</div>
      </div>
      <div class="stat-card">
        <h3>Weekly P&L</h3>
        <div class="value" id="weekly-pnl">$0.00</div>
      </div>
      <div class="stat-card">
        <h3>Monthly P&L</h3>
        <div class="value" id="monthly-pnl">$0.00</div>
      </div>
      <div class="stat-card">
        <h3>Total Trades</h3>
        <div class="value" id="total-trades">0</div>
      </div>
    </div>
    
    <div class="section">
      <h2>🎯 Funding Rate Opportunities</h2>
      <div id="loading">Loading funding rates...</div>
      <table id="rates-table" style="display:none;">
        <thead>
          <tr>
            <th>Market</th>
            <th>Funding Rate</th>
            <th>APY</th>
            <th>Direction</th>
            <th>Strategy</th>
            <th>Daily ($1K)</th>
          </tr>
        </thead>
        <tbody id="rates-body"></tbody>
      </table>
    </div>
  </div>
  
  <footer>
    <p>Built for Colosseum Agent Hackathon 2026</p>
    <p style="margin-top: 10px;">
      <a href="https://github.com/Zedit42/solarb" style="color: #7b2cbf;">GitHub</a> •
      <a href="https://drift.trade" style="color: #7b2cbf;">Drift Protocol</a>
    </p>
  </footer>
  
  <script>
    const ws = new WebSocket(\`ws://\${window.location.host}\`);
    const statusEl = document.getElementById('status');
    
    ws.onopen = () => {
      statusEl.textContent = '🟢 Live';
      statusEl.className = 'refresh-indicator connected';
    };
    
    ws.onclose = () => {
      statusEl.textContent = '🔴 Disconnected';
      statusEl.className = 'refresh-indicator disconnected';
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'update') {
        updateDashboard(msg.data);
      }
    };
    
    function updateDashboard(data) {
      // Update stats
      if (data.stats) {
        updateStat('daily-pnl', data.stats.daily.profitUsd);
        updateStat('weekly-pnl', data.stats.weekly.profitUsd);
        updateStat('monthly-pnl', data.stats.monthly.profitUsd);
        document.getElementById('total-trades').textContent = data.stats.allTime.trades;
      }
      
      // Update rates table
      if (data.rates && data.rates.length > 0) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('rates-table').style.display = 'table';
        
        const tbody = document.getElementById('rates-body');
        tbody.innerHTML = data.rates.map(rate => {
          const isOpportunity = Math.abs(rate.fundingRateApy) >= 20;
          const strategy = rate.longPayShort ? 'SHORT perp + LONG spot' : 'LONG perp + SHORT spot';
          const daily1k = Math.abs(rate.fundingRateApy / 365 * 10).toFixed(2);
          
          return \`
            <tr class="\${isOpportunity ? 'opportunity' : ''}">
              <td><strong>\${rate.market}</strong></td>
              <td>\${(rate.fundingRate * 100).toFixed(4)}%/hr</td>
              <td class="\${rate.fundingRateApy > 0 ? 'positive' : 'negative'}">
                \${rate.fundingRateApy > 0 ? '+' : ''}\${rate.fundingRateApy.toFixed(1)}%
              </td>
              <td>
                <span class="badge \${rate.longPayShort ? 'short' : 'long'}">
                  \${rate.longPayShort ? 'L→S' : 'S→L'}
                </span>
              </td>
              <td>\${isOpportunity ? strategy : '-'}</td>
              <td>\${isOpportunity ? '$' + daily1k : '-'}</td>
            </tr>
          \`;
        }).join('');
      }
    }
    
    function updateStat(id, value) {
      const el = document.getElementById(id);
      const formatted = value >= 0 ? '+$' + value.toFixed(2) : '-$' + Math.abs(value).toFixed(2);
      el.textContent = formatted;
      el.className = 'value ' + (value >= 0 ? 'positive' : 'negative');
    }
    
    // Initial fetch
    fetch('/api/funding-rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          updateDashboard({ rates: data.rates, stats: { daily: {profitUsd: 0}, weekly: {profitUsd: 0}, monthly: {profitUsd: 0}, allTime: {trades: 0} } });
        }
      });
  </script>
</body>
</html>
  `;
}

// Start server
server.listen(PORT, () => {
  console.log(\`
╔══════════════════════════════════════════════════════════╗
║           SolArb Dashboard Server                        ║
╠══════════════════════════════════════════════════════════╣
║  🌐 Dashboard: http://localhost:\${PORT}                    ║
║  📡 WebSocket: ws://localhost:\${PORT}                      ║
║  📊 API: http://localhost:\${PORT}/api/funding-rates        ║
╚══════════════════════════════════════════════════════════╝
  \`);
});
