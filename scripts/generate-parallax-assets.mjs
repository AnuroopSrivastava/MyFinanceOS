import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUTPUT_DIR = path.resolve(process.cwd(), 'apps/web/public/images/parallax');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const templates = [
  {
    filename: '01-dashboard-overview.jpg',
    tag: 'SOVEREIGN DASHBOARD',
    tagColor: '#06b6d4',
    accent: '#06b6d4',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #06b6d4;"></span>
          <span>SOVEREIGN CONSOLE</span>
        </div>
        <span class="status-pill" style="color: #34d399; background: rgba(16, 185, 129, 0.15);">● LIVE SYNC</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(6, 182, 212, 0.4); background: linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">TOTAL CONSOLIDATED NET WORTH</span>
        <div class="kpi-number"><span class="curr">₹</span>28,50,000<span class="cents">.00</span></div>
        <div class="kpi-growth" style="color: #34d399;">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 11l4-4 3 3 5-6M10 4h4v4"/></svg>
          <strong>+24.8% CAGR</strong>
          <span style="color: #94a3b8; font-weight: 500;">(₹5.65L Unrealized Gains)</span>
        </div>
      </div>

      <!-- Area Chart -->
      <div class="chart-container-card">
        <div class="chart-head-row">
          <span>PORTFOLIO GROWTH TRAJECTORY (6 MONTHS)</span>
          <span style="color: #06b6d4; font-weight: 800;">+₹7.8L Gain</span>
        </div>
        <svg viewBox="0 0 560 130" style="width: 100%; height: 110px; overflow: visible;">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <path d="M0,95 C70,85 140,90 210,65 C280,40 350,55 420,25 C490,-5 530,12 560,8 L560,130 L0,130 Z" fill="url(#g1)"/>
          <path d="M0,95 C70,85 140,90 210,65 C280,40 350,55 420,25 C490,-5 530,12 560,8" fill="none" stroke="#06b6d4" stroke-width="4"/>
          <circle cx="560" cy="8" r="6" fill="#38bdf8" stroke="#0d0e17" stroke-width="2.5"/>
        </svg>
      </div>

      <div class="card-section-label">ASSET CLASS ALLOCATION</div>
      <div class="dense-stack">
        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title"><i style="background: #06b6d4;"></i> Indian Equities &amp; Stocks</span>
            <b>₹12,82,500 <span class="pct">45.0%</span></b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 45%; background: linear-gradient(90deg, #06b6d4, #38bdf8);"></div></div>
        </div>

        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title"><i style="background: #8b5cf6;"></i> Mutual Fund Direct SIPs</span>
            <b>₹7,12,500 <span class="pct">25.0%</span></b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 25%; background: linear-gradient(90deg, #8b5cf6, #c084fc);"></div></div>
        </div>

        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title"><i style="background: #f59e0b;"></i> Sovereign Gold Bonds (SGB)</span>
            <b>₹4,27,500 <span class="pct">15.0%</span></b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 15%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div></div>
        </div>

        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title"><i style="background: #10b981;"></i> Fixed Deposits &amp; Liquid Cash</span>
            <b>₹4,27,500 <span class="pct">15.0%</span></b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 15%; background: linear-gradient(90deg, #10b981, #34d399);"></div></div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Monthly SIP Inflow</span>
          <strong class="m-val" style="color: #06b6d4;">+₹98,450</strong>
          <span class="m-sub" style="color: #34d399;">Active in 6 Direct Funds</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Annual Passive Yield</span>
          <strong class="m-val" style="color: #34d399;">+₹1,42,800</strong>
          <span class="m-sub" style="color: #94a3b8;">Dividends &amp; Bond Coupons</span>
        </div>
      </div>
    `
  },
  {
    filename: '02-smart-expenses.jpg',
    tag: 'DOUBLE-ENTRY LEDGER',
    tagColor: '#10b981',
    accent: '#10b981',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #10b981;"></span>
          <span>SOVEREIGN JOURNAL</span>
        </div>
        <span class="status-pill" style="color: #34d399; background: rgba(16, 185, 129, 0.15);">A = L + E VERIFIED</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">MONTHLY EXPENSES &amp; CASH OUTFLOW</span>
        <div class="kpi-number"><span class="curr">₹</span>42,850<span class="cents">.00</span></div>
        <div class="kpi-growth" style="color: #34d399;">
          <strong>↓ 14.8% Under Budget</strong>
          <span style="color: #94a3b8; font-weight: 500;">(Savings Rate: 42.6%)</span>
        </div>
      </div>

      <div class="chart-container-card">
        <div class="chart-head-row">
          <span>7-DAY SPENDING PATTERN</span>
          <span style="color: #10b981; font-weight: 800;">₹6.1K/day Avg</span>
        </div>
        <div class="chart-pillars-row" style="height: 100px;">
          <div class="p-col"><div class="p-bar" style="height: 48%;"></div><span>Mon</span></div>
          <div class="p-col"><div class="p-bar" style="height: 65%;"></div><span>Tue</span></div>
          <div class="p-col"><div class="p-bar" style="height: 50%;"></div><span>Wed</span></div>
          <div class="p-col is-highest"><div class="p-tag">₹1.8K</div><div class="p-bar" style="height: 94%; background: linear-gradient(180deg, #34d399, #10b981);"></div><span>Thu</span></div>
          <div class="p-col"><div class="p-bar" style="height: 44%;"></div><span>Fri</span></div>
          <div class="p-col"><div class="p-bar" style="height: 70%;"></div><span>Sat</span></div>
          <div class="p-col"><div class="p-bar" style="height: 38%;"></div><span>Sun</span></div>
        </div>
      </div>

      <div class="card-section-label">REAL-TIME DOUBLE-ENTRY TRANSACTIONS</div>
      <div class="tx-stream-list">
        <div class="tx-item-card">
          <div class="tx-icon-box" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">₹</div>
          <div class="tx-desc">
            <strong>Zerodha Broking Index SIP</strong>
            <span>Investments • Direct Auto-Debit</span>
          </div>
          <div class="tx-val neg">-₹25,000</div>
        </div>

        <div class="tx-item-card">
          <div class="tx-icon-box" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">↓</div>
          <div class="tx-desc">
            <strong>Apex Labs Tech Consulting</strong>
            <span>Business Inflow • Invoice #89</span>
          </div>
          <div class="tx-val pos">+₹1,45,000</div>
        </div>

        <div class="tx-item-card">
          <div class="tx-icon-box" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">⚡</div>
          <div class="tx-desc">
            <strong>Tata Power Electric Utility</strong>
            <span>Utilities • Verified UPI AutoPay</span>
          </div>
          <div class="tx-val neg">-₹3,420</div>
        </div>

        <div class="tx-item-card">
          <div class="tx-icon-box" style="background: rgba(236, 72, 153, 0.2); color: #f472b6;">🛒</div>
          <div class="tx-desc">
            <strong>Nature's Basket Grocery</strong>
            <span>Living Essentials • Dual Account</span>
          </div>
          <div class="tx-val neg">-₹4,180</div>
        </div>
      </div>
    `
  },
  {
    filename: '03-tax-planning.jpg',
    tag: 'INDIAN TAX ENGINE',
    tagColor: '#f59e0b',
    accent: '#f59e0b',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #f59e0b;"></span>
          <span>TAX OPTIMIZER FY 26-27</span>
        </div>
        <span class="status-pill" style="color: #fbbf24; background: rgba(245, 158, 11, 0.15);">AY 2027-28</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">NET ANNUAL TAX SAVED</span>
        <div class="kpi-number" style="color: #fbbf24;"><span class="curr">₹</span>48,200<span class="cents">.00</span></div>
        <div class="kpi-growth" style="color: #fbbf24;">
          <strong>Optimal Choice: New Regime</strong>
          <span style="color: #94a3b8; font-weight: 500;">+ 80CCD(1B) NPS booster</span>
        </div>
      </div>

      <div class="regime-grid-row">
        <div class="regime-box">
          <span class="r-label">OLD TAX REGIME</span>
          <strong class="r-figure">₹1,42,000</strong>
          <span class="r-detail">With 80C, 80D &amp; HRA</span>
        </div>
        <div class="regime-box is-highlight">
          <span class="r-winner-tag">RECOMMENDED</span>
          <span class="r-label" style="color: #34d399;">NEW TAX REGIME</span>
          <strong class="r-figure" style="color: #34d399;">₹1,08,000</strong>
          <span class="r-detail" style="color: #6ee7b7;">Save ₹34,000 net</span>
        </div>
      </div>

      <div class="card-section-label">ACTIVE DEDUCTIONS CLAIMED</div>
      <div class="deductions-2x2">
        <div class="deduct-card">
          <span>Section 80C (PPF/ELSS)</span>
          <strong style="color: #fff;">₹1.50L Max</strong>
        </div>
        <div class="deduct-card">
          <span>Section 80D (Health)</span>
          <strong style="color: #fff;">₹50,000</strong>
        </div>
        <div class="deduct-card">
          <span>Section 80CCD(1B)</span>
          <strong style="color: #fbbf24;">₹50,000 Extra</strong>
        </div>
        <div class="deduct-card">
          <span>HRA Exemption</span>
          <strong style="color: #fff;">₹1.20L</strong>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Advance Tax Q4</span>
          <strong class="m-val" style="color: #34d399;">₹27,000</strong>
          <span class="m-sub" style="color: #94a3b8;">Challan 280 Verified</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Effective Tax Rate</span>
          <strong class="m-val" style="color: #fbbf24;">11.8%</strong>
          <span class="m-sub" style="color: #34d399;">Slab Optimized</span>
        </div>
      </div>

      <div class="dense-card">
        <div class="dense-header" style="margin-bottom: 0;">
          <span class="d-title"><i style="background: #f59e0b;"></i> ITD JSON Export Ready</span>
          <b style="color: #34d399;">ITR-2 / ITR-3 COMPATIBLE</b>
        </div>
      </div>
    `
  },
  {
    filename: '04-gst-invoicing.jpg',
    tag: 'GST INVOICING SUITE',
    tagColor: '#3b82f6',
    accent: '#3b82f6',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #3b82f6;"></span>
          <span>B2B GST INVOICING</span>
        </div>
        <span class="status-pill" style="color: #60a5fa; background: rgba(59, 130, 246, 0.15);">100% COMPLIANT</span>
      </div>

      <div class="invoice-full-card">
        <div class="inv-head-split">
          <div>
            <span class="inv-kicker">TAX INVOICE</span>
            <h2 class="inv-title">INV-2026-0089</h2>
            <span class="inv-sub">Client: Vertex Cloud Labs Pvt Ltd</span>
          </div>
          <div class="inv-tag-stack">
            <span class="paid-badge">PAID • VERIFIED</span>
            <span class="gstin-txt">GSTIN: 27AAACF1234F1Z5</span>
          </div>
        </div>

        <div class="inv-rows-list">
          <div class="inv-line header">
            <span>Description</span>
            <span>SAC</span>
            <span>Tax</span>
            <span>Amount</span>
          </div>
          <div class="inv-line item">
            <span>Enterprise AI Architecture</span>
            <span>998313</span>
            <span>18%</span>
            <b>₹1,25,000</b>
          </div>
          <div class="inv-line tax">
            <span>CGST (Central Tax) @ 9%</span>
            <span>—</span>
            <span>9%</span>
            <span>₹11,250</span>
          </div>
          <div class="inv-line tax">
            <span>SGST (State Tax) @ 9%</span>
            <span>—</span>
            <span>9%</span>
            <span>₹11,250</span>
          </div>
        </div>

        <div class="inv-bottom-total">
          <div>
            <span class="lbl">Total Invoice Value (INR)</span>
            <span class="sub" style="color: #34d399;">IRN QR Generated &amp; Verified</span>
          </div>
          <strong class="total-number">₹1,47,500.00</strong>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Input Tax Credit (ITC)</span>
          <strong class="m-val" style="color: #60a5fa;">₹22,500</strong>
          <span class="m-sub" style="color: #94a3b8;">GSTR-2B Reconciled</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Filing Status</span>
          <strong class="m-val" style="color: #34d399;">GSTR-1 Ready</strong>
          <span class="m-sub" style="color: #94a3b8;">Export JSON / PDF</span>
        </div>
      </div>

      <div class="dense-card">
        <div class="dense-header" style="margin-bottom: 0;">
          <span class="d-title"><i style="background: #3b82f6;"></i> E-Way Bill &amp; QR Code Hash</span>
          <b style="color: #34d399;">NIC PORTAL VERIFIED</b>
        </div>
      </div>
    `
  },
  {
    filename: '05-wealth-tracking.jpg',
    tag: 'WEALTH ANALYTICS',
    tagColor: '#8b5cf6',
    accent: '#8b5cf6',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #8b5cf6;"></span>
          <span>PORTFOLIO XIRR</span>
        </div>
        <span class="status-pill" style="color: #c4b5fd; background: rgba(139, 92, 246, 0.15);">XIRR +24.8%</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(139, 92, 246, 0.4); background: linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">ANNUALIZED COMPOUND RETURN</span>
        <div class="kpi-number" style="color: #c4b5fd;">24.8% <span class="cents" style="color: #a78bfa; font-size: 22px;">XIRR</span></div>
        <div class="kpi-growth" style="color: #34d399;">
          <strong>▲ +6.4% Alpha</strong>
          <span style="color: #94a3b8; font-weight: 500;">vs Nifty 50 TRI Benchmark</span>
        </div>
      </div>

      <div class="donut-display-card">
        <div class="conic-ring">
          <div class="conic-center">
            <strong>₹28.5L</strong>
            <span>TOTAL</span>
          </div>
        </div>
        <div class="donut-items">
          <div class="d-item"><span class="d-blob" style="background: #06b6d4;"></span><span>Indian Equities</span><b>45%</b></div>
          <div class="d-item"><span class="d-blob" style="background: #8b5cf6;"></span><span>Flexi-Cap SIPs</span><b>25%</b></div>
          <div class="d-item"><span class="d-blob" style="background: #f59e0b;"></span><span>SGB 24K Gold</span><b>15%</b></div>
          <div class="d-item"><span class="d-blob" style="background: #10b981;"></span><span>Liquid / Debt</span><b>15%</b></div>
        </div>
      </div>

      <div class="card-section-label">TOP PERFORMING HOLDINGS</div>
      <div class="dense-stack">
        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title">Parag Parikh Flexi Cap Fund</span>
            <b style="color: #34d399;">+28.4% CAGR</b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 78%; background: linear-gradient(90deg, #8b5cf6, #34d399);"></div></div>
        </div>
        <div class="dense-card">
          <div class="dense-header">
            <span class="d-title">Sovereign Gold Bond 2023-24 Series</span>
            <b style="color: #fbbf24;">+19.2% Return</b>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: 62%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div></div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Sharpe Ratio</span>
          <strong class="m-val" style="color: #34d399;">2.14</strong>
          <span class="m-sub" style="color: #94a3b8;">High Risk-Adjusted</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Portfolio Beta</span>
          <strong class="m-val" style="color: #c4b5fd;">0.82</strong>
          <span class="m-sub" style="color: #34d399;">Defensive Alpha</span>
        </div>
      </div>
    `
  },
  {
    filename: '06-fire-planning.jpg',
    tag: 'FIRE PLANNER',
    tagColor: '#ec4899',
    accent: '#ec4899',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #ec4899;"></span>
          <span>FIRE RETIREMENT ROADMAP</span>
        </div>
        <span class="status-pill" style="color: #f472b6; background: rgba(236, 72, 153, 0.15);">TARGET: AGE 42</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(236, 72, 153, 0.4); background: linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">TARGET RETIREMENT CORPUS</span>
        <div class="kpi-number" style="color: #f472b6;"><span class="curr">₹</span>3,50,00,000</div>
        <div class="kpi-growth" style="color: #34d399;">
          <strong>64.2% Funded</strong>
          <span style="color: #94a3b8; font-weight: 500;">(Projected FIRE: March 2034)</span>
        </div>
      </div>

      <div class="progress-box-card">
        <div class="pb-header">
          <span>CORPUS ACCUMULATION PROGRESS</span>
          <strong style="color: #f472b6;">₹2.25 Cr / ₹3.50 Cr</strong>
        </div>
        <div class="pb-track" style="height: 9px;">
          <div class="pb-fill" style="width: 64.2%; background: linear-gradient(90deg, #ec4899, #34d399);"></div>
        </div>
      </div>

      <div class="trio-grid">
        <div class="t-card">
          <span class="lbl">Safe Withdrawal</span>
          <strong class="val" style="color: #f472b6;">3.25%</strong>
          <span class="sub">Perpetual SWR</span>
        </div>
        <div class="t-card">
          <span class="lbl">Monthly Runway</span>
          <strong class="val" style="color: #fff;">₹95,000</strong>
          <span class="sub">Inflation Adjusted</span>
        </div>
        <div class="t-card">
          <span class="lbl">SIP Step-Up</span>
          <strong class="val" style="color: #34d399;">+15%/yr</strong>
          <span class="sub">Accelerated</span>
        </div>
      </div>

      <div class="card-section-label">FIRE MILESTONE STATUS</div>
      <div class="dense-stack">
        <div class="dense-card">
          <div class="dense-header" style="margin-bottom: 0;">
            <span class="d-title">Lean FIRE Milestone (₹1.80 Cr)</span>
            <b style="color: #34d399;">✓ ACHIEVED (2025)</b>
          </div>
        </div>
        <div class="dense-card">
          <div class="dense-header" style="margin-bottom: 0;">
            <span class="d-title">Fat FIRE Milestone (₹5.00 Cr)</span>
            <b style="color: #f472b6;">ON TRACK (2037)</b>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: '07-sankey-cashflow.jpg',
    tag: 'SANKEY CASH FLOW',
    tagColor: '#6366f1',
    accent: '#6366f1',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #6366f1;"></span>
          <span>SANKEY CASH DYNAMICS</span>
        </div>
        <span class="status-pill" style="color: #a5b4fc; background: rgba(99, 102, 241, 0.15);">FUND ROUTING</span>
      </div>

      <div class="sankey-stage-card">
        <div class="sankey-stream left">
          <div class="s-pill src">Salary ₹2.40L</div>
          <div class="s-pill src">Consulting ₹45K</div>
          <div class="s-pill src">Yield ₹15K</div>
        </div>

        <div class="sankey-stream center">
          <div class="s-core-hub">
            <span class="hub-tag">TOTAL INFLOW</span>
            <strong class="hub-val">₹3,00,000</strong>
            <span class="hub-sub">Monthly Run</span>
          </div>
        </div>

        <div class="sankey-stream right">
          <div class="s-pill dest" style="border-left-color: #10b981;">SIPs ₹1.10L</div>
          <div class="s-pill dest" style="border-left-color: #f59e0b;">Tax ₹48.2K</div>
          <div class="s-pill dest" style="border-left-color: #ec4899;">Living ₹65K</div>
          <div class="s-pill dest" style="border-left-color: #06b6d4;">Buffer ₹76.8K</div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Investment Rate</span>
          <strong class="m-val" style="color: #10b981;">36.6%</strong>
          <span class="m-sub" style="color: #94a3b8;">₹1.10L / Month</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Tax Provision</span>
          <strong class="m-val" style="color: #f59e0b;">16.0%</strong>
          <span class="m-sub" style="color: #94a3b8;">₹48.2K / Month</span>
        </div>
      </div>

      <div class="card-section-label">FLOW PHYSICS INTEGRITY</div>
      <div class="dense-stack">
        <div class="dense-card">
          <div class="dense-header" style="margin-bottom: 0;">
            <span class="d-title">Deterministic Flow Physics</span>
            <b style="color: #818cf8;">0 DATA LEAKAGE</b>
          </div>
        </div>
        <div class="dense-card">
          <div class="dense-header" style="margin-bottom: 0;">
            <span class="d-title">Zero Unassigned Capital</span>
            <b style="color: #34d399;">100% ACCOUNTED</b>
          </div>
        </div>
      </div>
    `
  },
  {
    filename: '08-emi-calculator.jpg',
    tag: 'EMI ACCELERATOR',
    tagColor: '#0284c7',
    accent: '#0284c7',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #0284c7;"></span>
          <span>LOAN AMORTIZATION</span>
        </div>
        <span class="status-pill" style="color: #38bdf8; background: rgba(2, 132, 199, 0.15);">HOME LOAN 8.45%</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(2, 132, 199, 0.4); background: linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">TOTAL INTEREST SAVED</span>
        <div class="kpi-number" style="color: #38bdf8;"><span class="curr">₹</span>14,82,400</div>
        <div class="kpi-growth" style="color: #34d399;">
          <strong>Tenure Slashed by 6.8 Years</strong>
          <span style="color: #94a3b8; font-weight: 500;">(20 Yrs → 13.2 Yrs)</span>
        </div>
      </div>

      <div class="emi-breakdown-card">
        <div class="emi-item-row"><span>Original Principal</span><b>₹50,00,000 (20 Years)</b></div>
        <div class="emi-item-row"><span>Base Monthly EMI</span><b>₹43,246/month</b></div>
        <div class="emi-item-row is-booster">
          <span style="color: #38bdf8; font-weight: 800;">+ Prepayment Accelerator</span>
          <strong style="color: #38bdf8;">+₹5,000/mo Extra</strong>
        </div>
      </div>

      <div class="card-section-label">PRINCIPAL VS INTEREST SPLIT</div>
      <div class="split-bar-display">
        <div class="s-bar" style="width: 53.8%; background: #0284c7;">Principal 53.8%</div>
        <div class="s-bar" style="width: 46.2%; background: #475569;">Interest 46.2%</div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Total Outflow</span>
          <strong class="m-val" style="color: #fff;">₹89.2L</strong>
          <span class="m-sub" style="color: #34d399;">Down from ₹1.04 Cr</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Payoff Date</span>
          <strong class="m-val" style="color: #34d399;">May 2039</strong>
          <span class="m-sub" style="color: #94a3b8;">Original: Feb 2046</span>
        </div>
      </div>
    `
  },
  {
    filename: '09-document-vault.jpg',
    tag: 'ARGON2ID VAULT',
    tagColor: '#ef4444',
    accent: '#ef4444',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #ef4444;"></span>
          <span>ZERO-KNOWLEDGE VAULT</span>
        </div>
        <span class="status-pill" style="color: #f87171; background: rgba(239, 68, 68, 0.15);">ARGON2ID + AES-256</span>
      </div>

      <div class="hero-kpi-block" style="border-color: rgba(239, 68, 68, 0.4); background: linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%);">
        <span class="kpi-eyebrow">ENCRYPTED ARTIFACTS IN VAULT</span>
        <div class="kpi-number">18 <span class="cents" style="color: #f87171; font-size: 22px;">DOCUMENTS</span></div>
        <div class="kpi-growth" style="color: #34d399;">
          <strong>0 Bytes Uploaded to Web</strong>
          <span style="color: #94a3b8; font-weight: 500;">(Local OPFS Storage)</span>
        </div>
      </div>

      <div class="card-section-label">ENCRYPTED VAULT TILES</div>
      <div class="vault-grid-2x2">
        <div class="v-card">
          <div class="v-icon">🔒</div>
          <div class="v-info">
            <strong>PAN_Card_Auth.enc</strong>
            <span>Argon2id PIN Cipher</span>
          </div>
        </div>

        <div class="v-card">
          <div class="v-icon">🔒</div>
          <div class="v-info">
            <strong>ITR_V_AY2026_27.enc</strong>
            <span>Tax Acknowledgment</span>
          </div>
        </div>

        <div class="v-card">
          <div class="v-icon">🔒</div>
          <div class="v-info">
            <strong>CAMS_CAS_Consolidated.enc</strong>
            <span>MF Statements</span>
          </div>
        </div>

        <div class="v-card">
          <div class="v-icon">🔒</div>
          <div class="v-info">
            <strong>Property_Deed_Registry.enc</strong>
            <span>Master Key Authenticated</span>
          </div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Memory Hardness</span>
          <strong class="m-val" style="color: #f87171;">64 MB RAM</strong>
          <span class="m-sub" style="color: #94a3b8;">Argon2id Parameters</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Integrity Status</span>
          <strong class="m-val" style="color: #34d399;">GCM Auth Tag</strong>
          <span class="m-sub" style="color: #94a3b8;">Zero Tampering</span>
        </div>
      </div>
    `
  },
  {
    filename: '10-local-ai.jpg',
    tag: 'PRIVATE LOCAL AI',
    tagColor: '#a855f7',
    accent: '#a855f7',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #a855f7;"></span>
          <span>SOVEREIGN LOCAL AI</span>
        </div>
        <span class="status-pill" style="color: #c084fc; background: rgba(168, 85, 247, 0.15);">ZERO TELEMETRY</span>
      </div>

      <div class="chat-thread-container">
        <div class="msg-bubble user-bubble">
          <span>"How will contributing an extra ₹50,000 into 80CCD(1B) NPS affect my tax slab and FIRE date?"</span>
        </div>

        <div class="msg-bubble ai-bubble">
          <div class="ai-avatar-pill">AI</div>
          <div class="ai-body">
            <strong style="color: #c084fc; font-size: 13.5px;">Tax Savings: ₹15,600 in 30% Slab</strong>
            <p style="margin-top: 5px; font-size: 12px; color: #cbd5e1; line-height: 1.45;">
              Reinvesting that tax relief into Nifty 50 Index at 12% CAGR accelerates your FIRE milestone by <strong>4.2 months</strong>.
            </p>
          </div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Execution Environment</span>
          <strong class="m-val" style="color: #c084fc;">Local WASM</strong>
          <span class="m-sub" style="color: #34d399;">On-Device Weights</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Network Calls</span>
          <strong class="m-val" style="color: #34d399;">0 Packets</strong>
          <span class="m-sub" style="color: #94a3b8;">100% Air-Gapped</span>
        </div>
      </div>

      <div class="dense-card">
        <div class="dense-header" style="margin-bottom: 0;">
          <span class="d-title">Tax • Portfolio • Cash Flow Inference Engine</span>
          <b style="color: #34d399;">ACTIVE</b>
        </div>
      </div>
    `
  },
  {
    filename: '11-automation-rules.jpg',
    tag: 'AUTOMATION PIPELINE',
    tagColor: '#14b8a6',
    accent: '#14b8a6',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #14b8a6;"></span>
          <span>AUTOMATION WORKFLOWS</span>
        </div>
        <span class="status-pill" style="color: #2dd4bf; background: rgba(20, 184, 166, 0.15);">3 RULES ACTIVE</span>
      </div>

      <div class="wf-visual-card">
        <div class="wf-node-step trigger">
          <span class="wf-node-label" style="color: #2dd4bf;">01 • TRIGGER</span>
          <strong>WHEN Salary Inflow > ₹1,50,000 Credited</strong>
        </div>

        <div class="wf-arrow-link">↓</div>

        <div class="wf-node-step condition">
          <span class="wf-node-label" style="color: #fbbf24;">02 • CONDITION</span>
          <strong>IF Emergency Reserve >= 6 Months</strong>
        </div>

        <div class="wf-arrow-link">↓</div>

        <div class="wf-action-triplet">
          <div class="wf-act-item">
            <span style="color: #2dd4bf; font-weight: 800; font-size: 10px;">ROUTE 35%</span>
            <strong>Nifty 50 SIP</strong>
          </div>
          <div class="wf-act-item">
            <span style="color: #f59e0b; font-weight: 800; font-size: 10px;">ROUTE 15%</span>
            <strong>SGB 24K Gold</strong>
          </div>
          <div class="wf-act-item">
            <span style="color: #3b82f6; font-weight: 800; font-size: 10px;">LOCK 10%</span>
            <strong>Tax Provision</strong>
          </div>
        </div>
      </div>

      <div class="kpi-grid-2">
        <div class="kpi-mini-box">
          <span class="m-label">Execution Health</span>
          <strong class="m-val" style="color: #2dd4bf;">100% Success</strong>
          <span class="m-sub" style="color: #94a3b8;">12 Runs this year</span>
        </div>
        <div class="kpi-mini-box">
          <span class="m-label">Next Trigger</span>
          <strong class="m-val" style="color: #fff;">1st of Month</strong>
          <span class="m-sub" style="color: #34d399;">Scheduled</span>
        </div>
      </div>

      <div class="dense-card">
        <div class="dense-header" style="margin-bottom: 0;">
          <span class="d-title">Zero Cloud Dependency • Client Evaluation</span>
          <b style="color: #2dd4bf;">ENABLED</b>
        </div>
      </div>
    `
  },
  {
    filename: '12-offline-security.jpg',
    tag: 'SOVEREIGN ARCHITECTURE',
    tagColor: '#6366f1',
    accent: '#6366f1',
    body: `
      <div class="top-nav-bar">
        <div class="brand-pill">
          <span class="live-dot" style="background: #6366f1;"></span>
          <span>SOVEREIGN ARCHITECTURE</span>
        </div>
        <span class="status-pill" style="color: #818cf8; background: rgba(99, 102, 241, 0.15);">100% OFFLINE</span>
      </div>

      <div class="shield-center-card">
        <div class="shield-circle-ring">
          <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#818cf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="pin-dots-row">
          <span class="p-circ is-lit"></span>
          <span class="p-circ is-lit"></span>
          <span class="p-circ is-lit"></span>
          <span class="p-circ is-lit"></span>
        </div>
        <strong style="color: #fff; font-size: 14.5px;">PIN Master Key Derived Client-Side</strong>
        <span style="color: #94a3b8; font-size: 12px;">PBKDF2-SHA256 with 100,000 iterations</span>
      </div>

      <div class="card-section-label">CORE SECURITY MATRIX</div>
      <div class="specs-data-list">
        <div class="spec-entry">
          <span>Key Derivation</span>
          <b>PBKDF2-SHA256 (100k)</b>
        </div>
        <div class="spec-entry">
          <span>Local Engine</span>
          <b>SQLite WASM (OPFS)</b>
        </div>
        <div class="spec-entry">
          <span>Telemetry</span>
          <b style="color: #34d399;">0 Trackers • 100% Sovereign</b>
        </div>
      </div>
    `
  }
];

function buildUltraHtml(t) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 640px;
      height: 880px;
      background: #0b0c16;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 22px;
      overflow: hidden;
      position: relative;
    }

    /* Ambient background glows */
    .glow-top-right {
      position: absolute;
      top: -60px;
      right: -60px;
      width: 320px;
      height: 320px;
      background: ${t.accent};
      opacity: 0.24;
      filter: blur(75px);
      border-radius: 50%;
      pointer-events: none;
    }

    .glow-bottom-left {
      position: absolute;
      bottom: -60px;
      left: -60px;
      width: 280px;
      height: 280px;
      background: ${t.accent};
      opacity: 0.18;
      filter: blur(70px);
      border-radius: 50%;
      pointer-events: none;
    }

    /* Top Bar */
    .top-nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      border: 1px solid ${t.tagColor}40;
      background: rgba(255, 255, 255, 0.04);
      color: ${t.tagColor};
      text-transform: uppercase;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      box-shadow: 0 0 8px ${t.tagColor};
    }

    .status-pill {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Hero KPI block */
    .hero-kpi-block {
      border: 1px solid;
      border-radius: 18px;
      padding: 18px 20px;
      z-index: 2;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 12px 28px rgba(0, 0, 0, 0.4);
    }

    .kpi-eyebrow {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #94a3b8;
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }

    .kpi-number {
      font-size: 36px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
    }

    .kpi-number .curr { font-size: 26px; opacity: 0.85; margin-right: 2px; }
    .kpi-number .cents { font-size: 22px; color: #94a3b8; }

    .kpi-growth {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      margin-top: 6px;
    }

    .card-section-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #94a3b8;
      text-transform: uppercase;
      z-index: 2;
    }

    /* Dense stack */
    .dense-stack { display: flex; flex-direction: column; gap: 8px; z-index: 2; }
    .dense-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 10px 13px;
    }
    .dense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
      color: #cbd5e1;
      margin-bottom: 5px;
    }
    .dense-header .d-title { display: flex; align-items: center; gap: 7px; }
    .dense-header .d-title i { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .dense-header .pct { color: #94a3b8; font-size: 11px; font-weight: normal; margin-left: 4px; }
    .progress-track { width: 100%; height: 5px; background: rgba(255, 255, 255, 0.08); border-radius: 99px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 99px; }

    /* KPI grid */
    .kpi-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; z-index: 2; }
    .kpi-mini-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 13px;
      padding: 12px 14px;
    }
    .m-label { font-size: 10.5px; color: #94a3b8; display: block; margin-bottom: 3px; }
    .m-val { font-size: 17px; font-weight: 800; display: block; font-variant-numeric: tabular-nums; }
    .m-sub { font-size: 10.5px; display: block; margin-top: 3px; }

    /* Chart box */
    .chart-container-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 14px 16px 10px;
      z-index: 2;
    }
    .chart-head-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
    .chart-pillars-row { display: flex; justify-content: space-between; align-items: flex-end; }
    .p-col { display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; position: relative; }
    .p-bar { width: 28px; background: rgba(255, 255, 255, 0.15); border-radius: 5px; }
    .p-col span { font-size: 11px; color: #94a3b8; font-weight: 600; }
    .p-tag { position: absolute; top: -16px; font-size: 9.5px; font-weight: 800; color: #34d399; background: rgba(16, 185, 129, 0.2); padding: 2px 5px; border-radius: 4px; }

    /* Transactions */
    .tx-stream-list { display: flex; flex-direction: column; gap: 7px; z-index: 2; }
    .tx-item-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 10px 13px;
    }
    .tx-icon-box { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
    .tx-desc strong { font-size: 12.5px; color: #fff; display: block; }
    .tx-desc span { font-size: 10.5px; color: #94a3b8; }
    .tx-val { margin-left: auto; font-weight: 800; font-size: 13.5px; font-variant-numeric: tabular-nums; }
    .tx-val.neg { color: #f87171; }
    .tx-val.pos { color: #34d399; }

    /* Regime grid */
    .regime-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; z-index: 2; }
    .regime-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 13px;
      padding: 13px;
      position: relative;
    }
    .regime-box.is-highlight { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.35); }
    .r-winner-tag { position: absolute; top: -9px; right: 8px; font-size: 8.5px; font-weight: 800; background: #10b981; color: #0d0e17; padding: 2px 7px; border-radius: 999px; }
    .r-label { font-size: 10.5px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 3px; }
    .r-figure { font-size: 21px; font-weight: 800; color: #fff; display: block; font-variant-numeric: tabular-nums; }
    .r-detail { font-size: 10.5px; color: #94a3b8; margin-top: 3px; display: block; }

    .deductions-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; z-index: 2; }
    .deduct-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 9px 11px;
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
    }
    .deduct-card span { color: #94a3b8; }

    /* Invoices */
    .invoice-full-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 16px 18px;
      z-index: 2;
    }
    .inv-head-split { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 10px; margin-bottom: 10px; }
    .inv-kicker { font-size: 10px; font-weight: 800; color: #60a5fa; letter-spacing: 0.1em; display: block; }
    .inv-title { font-size: 16px; font-weight: 800; color: #fff; }
    .inv-sub { font-size: 11px; color: #94a3b8; display: block; }
    .inv-tag-stack { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
    .paid-badge { font-size: 10px; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 3px 8px; border-radius: 999px; }
    .gstin-txt { font-size: 10px; color: #94a3b8; }

    .inv-rows-list { display: flex; flex-direction: column; gap: 5px; font-size: 12px; }
    .inv-line { display: grid; grid-template-columns: 2.2fr 1fr 1fr 1.2fr; color: #cbd5e1; }
    .inv-line.header { color: #94a3b8; font-size: 10.5px; font-weight: 700; margin-bottom: 3px; }
    .inv-line.tax { color: #94a3b8; font-size: 11px; }
    .inv-line span:last-child, .inv-line b:last-child { text-align: right; }

    .inv-bottom-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 9px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .inv-bottom-total .lbl { font-size: 11px; color: #94a3b8; display: block; }
    .inv-bottom-total .sub { font-size: 10px; display: block; }
    .total-number { font-size: 19px; font-weight: 800; color: #60a5fa; font-variant-numeric: tabular-nums; }

    /* Donut */
    .donut-display-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 15px;
      padding: 14px 16px;
      z-index: 2;
    }
    .conic-ring {
      width: 86px;
      height: 86px;
      border-radius: 50%;
      background: conic-gradient(#06b6d4 0% 45%, #8b5cf6 45% 70%, #f59e0b 70% 85%, #10b981 85% 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .conic-center { width: 60px; height: 60px; border-radius: 50%; background: #0b0c16; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .conic-center strong { font-size: 15px; color: #fff; }
    .conic-center span { font-size: 9px; color: #94a3b8; }
    .donut-items { display: flex; flex-direction: column; gap: 5px; font-size: 12px; width: 100%; }
    .d-item { display: flex; align-items: center; justify-content: space-between; color: #cbd5e1; }
    .d-blob { width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; display: inline-block; }

    /* Progress box */
    .progress-box-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 13px;
      padding: 13px 15px;
      z-index: 2;
    }
    .pb-header { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 6px; }
    .pb-track { width: 100%; background: rgba(255, 255, 255, 0.08); border-radius: 99px; overflow: hidden; }
    .pb-fill { height: 100%; border-radius: 99px; }

    .trio-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; z-index: 2; }
    .t-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 10px; text-align: center; }
    .t-card .lbl { font-size: 10px; color: #94a3b8; display: block; margin-bottom: 3px; }
    .t-card .val { font-size: 14.5px; font-weight: 800; display: block; }
    .t-card .sub { font-size: 9.5px; color: #94a3b8; display: block; }

    /* Sankey */
    .sankey-stage-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 16px 12px;
      z-index: 2;
    }
    .sankey-stream { display: flex; flex-direction: column; gap: 6px; }
    .s-pill { font-size: 11px; font-weight: 700; padding: 5px 8px; border-radius: 7px; background: rgba(255, 255, 255, 0.05); white-space: nowrap; }
    .s-pill.src { border-left: 3px solid #6366f1; color: #cbd5e1; }
    .s-pill.dest { border-left: 3px solid #10b981; color: #cbd5e1; }
    .s-core-hub { background: linear-gradient(140deg, #4f46e5, #3730a3); padding: 12px 9px; border-radius: 10px; text-align: center; box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35); }
    .hub-tag { font-size: 9.5px; color: #a5b4fc; font-weight: 800; display: block; }
    .hub-val { font-size: 16px; font-weight: 800; color: #fff; display: block; }
    .hub-sub { font-size: 9px; color: #c7d2fe; display: block; }

    /* EMI */
    .emi-breakdown-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 13px 15px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12.5px;
      z-index: 2;
    }
    .emi-item-row { display: flex; justify-content: space-between; color: #cbd5e1; }
    .emi-item-row.is-booster { padding-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.1); }
    .split-bar-display { display: flex; height: 26px; border-radius: 7px; overflow: hidden; font-size: 11px; font-weight: 700; color: #fff; text-align: center; line-height: 26px; z-index: 2; }

    /* Vault */
    .vault-grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; z-index: 2; }
    .v-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 11px;
      padding: 11px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .v-icon { font-size: 15px; }
    .v-info strong { font-size: 11.5px; color: #fff; display: block; word-break: break-all; }
    .v-info span { font-size: 9.5px; color: #94a3b8; }

    /* Chat */
    .chat-thread-container { display: flex; flex-direction: column; gap: 9px; z-index: 2; }
    .msg-bubble { padding: 12px 15px; border-radius: 13px; font-size: 12.5px; line-height: 1.45; }
    .msg-bubble.user-bubble { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #e2e8f0; align-self: flex-start; }
    .msg-bubble.ai-bubble { background: linear-gradient(140deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1)); border: 1px solid rgba(168, 85, 247, 0.3); display: flex; gap: 9px; }
    .ai-avatar-pill { width: 22px; height: 22px; border-radius: 6px; background: #a855f7; color: #fff; font-size: 9.5px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    /* Workflow */
    .wf-visual-card { display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2; }
    .wf-node-step { width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 8px 12px; font-size: 12px; }
    .wf-node-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.1em; display: block; margin-bottom: 2px; }
    .wf-arrow-link { font-size: 11px; color: rgba(255, 255, 255, 0.25); }
    .wf-action-triplet { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; width: 100%; }
    .wf-act-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 8px 9px; font-size: 10.5px; display: flex; flex-direction: column; gap: 2px; }

    /* Shield */
    .shield-center-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      z-index: 2;
    }
    .shield-circle-ring { width: 58px; height: 58px; border-radius: 50%; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; }
    .pin-dots-row { display: flex; gap: 8px; }
    .p-circ { width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); }
    .p-circ.is-lit { background: #818cf8; box-shadow: 0 0 8px #818cf8; }

    .specs-data-list { display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; z-index: 2; }
    .spec-entry { display: flex; justify-content: space-between; padding: 8px 10px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.04); }
    .spec-entry span { color: #94a3b8; }
    .spec-entry b { color: #818cf8; }
  </style>
</head>
<body>
  <div class="glow-top-right"></div>
  <div class="glow-bottom-left"></div>

  ${t.body}
</body>
</html>`;
}

(async () => {
  console.log('Rendering 12 high-density MyFinanceOS feature assets (640x880 @ 2x)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 640, height: 880 },
    deviceScaleFactor: 2,
  });

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const html = buildUltraHtml(t);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(80);

    const outPath = path.join(OUTPUT_DIR, t.filename);
    await page.screenshot({
      path: outPath,
      type: 'jpeg',
      quality: 95,
      fullPage: false,
    });
    console.log(`[${i + 1}/12] Rendered: ${t.filename}`);
  }

  await browser.close();
  console.log('All 12 assets rendered successfully!');
})();
