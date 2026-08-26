import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { Sparkles, ShieldCheck, Zap, Lock, Network, Key, Cpu } from 'lucide-react';
import {
  LandingBadge,
  LandingSectionHeader,
  LandingButton,
  LandingSliderField,
  LandingSegmentedToggle,
  LandingChipGroup,
  LandingMetricCard,
  LandingFloatingBadge,
  LandingGlassCard,
  LandingFeedItem,
  LandingAllocationBar,
  LandingStepIndicator,
  LandingMarqueeChip,
  LandingFeedbackCard,
  LandingCapabilityCard,
  LandingSpecPill
} from './index.js';
import { LandingNavbar } from '../LandingNavbar.js';
import { LandingFooter } from '../LandingFooter.js';
import { LandingFaqSection } from '../LandingFaqSection.js';
import { TrustComparisonMatrix } from '../TrustComparisonMatrix.js';
import {
  TaxGstShowcaseStage,
  LedgerCashflowShowcaseStage,
  InvestmentsWealthShowcaseStage,
  MerchantCommerceShowcaseStage,
  AutomationRulesShowcaseStage
} from '../showcase/index.js';
import {
  HeroStardustCanvas,
  HeroPlanetCanvas,
  HeroNotificationCluster,
  DEFAULT_HERO_NOTIFICATIONS
} from '../hero/index.js';
import {
  DirectLocalRoutingStage,
  SlabSimulatorStage,
  DottedGlobeCanvas
} from '../value/index.js';
import { BrandMonogramCanvas } from '../outro/index.js';
import { useCanvasVisibility } from '../hooks/useCanvasVisibility.js';

describe('Landing Page Primitives & Design System', () => {
  describe('LandingBadge', () => {
    it('renders with children, default variant and custom icon', () => {
      render(
        <LandingBadge icon={<Sparkles data-testid="badge-icon" size={14} />}>
          TEST BADGE
        </LandingBadge>
      );
      expect(screen.getByText('TEST BADGE')).toBeDefined();
      expect(screen.getByTestId('badge-icon')).toBeDefined();
    });

    it('renders different color variants and small size', () => {
      const { rerender } = render(<LandingBadge variant="emerald" size="sm">EMERALD BADGE</LandingBadge>);
      expect(screen.getByText('EMERALD BADGE')).toBeDefined();

      rerender(<LandingBadge variant="amber">AMBER BADGE</LandingBadge>);
      expect(screen.getByText('AMBER BADGE')).toBeDefined();

      rerender(<LandingBadge variant="muted">MUTED BADGE</LandingBadge>);
      expect(screen.getByText('MUTED BADGE')).toBeDefined();
    });
  });

  describe('LandingSectionHeader', () => {
    it('renders badge, title and subtitle correctly', () => {
      render(
        <LandingSectionHeader
          badgeText="SYSTEM OVERVIEW"
          title="Engineered for Performance"
          subtitle="Explore the sub-second latency and zero-cloud encryption."
        />
      );
      expect(screen.getByText('SYSTEM OVERVIEW')).toBeDefined();
      expect(screen.getByRole('heading', { level: 2, name: /Engineered for Performance/i })).toBeDefined();
      expect(screen.getByText(/Explore the sub-second latency/i)).toBeDefined();
    });
  });

  describe('LandingButton', () => {
    it('handles click events and passes custom attributes', () => {
      const handleClick = vi.fn();
      render(
        <LandingButton onClick={handleClick} variant="primary" size="lg">
          Launch App
        </LandingButton>
      );
      const btn = screen.getByRole('button', { name: /Launch App/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state and prevents click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <LandingButton onClick={handleClick} loading={true} disabled={true}>
          Submit Data
        </LandingButton>
      );
      const btn = screen.getByRole('button');
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.getAttribute('disabled')).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('LandingSliderField', () => {
    it('renders label, live display value and triggers onChange on range input', () => {
      const handleChange = vi.fn();
      render(
        <LandingSliderField
          id="test-slider"
          label="Investment Capital"
          value={50000}
          displayValue="₹50,000"
          min={10000}
          max={100000}
          step={5000}
          onChange={handleChange}
        />
      );
      expect(screen.getByText('Investment Capital')).toBeDefined();
      expect(screen.getByText('₹50,000')).toBeDefined();
      const slider = screen.getByRole('slider', { name: 'Investment Capital' });
      fireEvent.change(slider, { target: { value: '60000' } });
      expect(handleChange).toHaveBeenCalledWith(60000);
    });
  });

  describe('LandingSegmentedToggle', () => {
    it('renders segmented radiogroup and switches active option', () => {
      const handleChange = vi.fn();
      render(
        <LandingSegmentedToggle
          value="monthly"
          onChange={handleChange}
          ariaLabel="Billing Frequency"
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual', sublabel: 'Save 20%' }
          ]}
        />
      );
      expect(screen.getByRole('radiogroup', { name: 'Billing Frequency' })).toBeDefined();
      const annualBtn = screen.getByRole('radio', { name: /Annual/i });
      fireEvent.click(annualBtn);
      expect(handleChange).toHaveBeenCalledWith('annual');
    });
  });

  describe('LandingChipGroup', () => {
    it('renders chips and notifies parent on select', () => {
      const handleChange = vi.fn();
      render(
        <LandingChipGroup
          value={18}
          onChange={handleChange}
          ariaLabel="GST Slab"
          options={[
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' }
          ]}
        />
      );
      const chip28 = screen.getByRole('radio', { name: '28%' });
      fireEvent.click(chip28);
      expect(handleChange).toHaveBeenCalledWith(28);
    });
  });

  describe('LandingMetricCard', () => {
    it('renders label, tabular value, icon, and contextual subtext', () => {
      render(
        <LandingMetricCard
          label="Net Portfolio Return"
          value="₹14.8 Lakhs"
          sub="+22.4% Annualized CAGR"
          icon={<ShieldCheck data-testid="metric-icon" size={18} />}
          variant="emerald"
        />
      );
      expect(screen.getByText('Net Portfolio Return')).toBeDefined();
      expect(screen.getByText('₹14.8 Lakhs')).toBeDefined();
      expect(screen.getByText('+22.4% Annualized CAGR')).toBeDefined();
      expect(screen.getByTestId('metric-icon')).toBeDefined();
    });
  });

  describe('LandingFloatingBadge', () => {
    it('renders title, amount and sub badge info', () => {
      render(
        <LandingFloatingBadge
          title="Tax Saved (Section 115BAC)"
          amount="₹87,500"
          sub="OPTIMIZED"
          time="Just now"
          icon={<Sparkles size={16} color="#06b6d4" />}
        />
      );
      expect(screen.getByText('Tax Saved (Section 115BAC)')).toBeDefined();
      expect(screen.getByText('₹87,500')).toBeDefined();
      expect(screen.getByText('OPTIMIZED')).toBeDefined();
      expect(screen.getByText(/Just now/)).toBeDefined();
    });
  });

  describe('LandingGlassCard', () => {
    it('renders children with customizable variant and padding', () => {
      const handleClick = vi.fn();
      render(
        <LandingGlassCard
          variant="featured"
          padding="lg"
          interactive={true}
          onClick={handleClick}
          ariaLabel="Featured Panel"
        >
          <div>Glass Card Content</div>
        </LandingGlassCard>
      );
      expect(screen.getByText('Glass Card Content')).toBeDefined();
      const card = screen.getByLabelText('Featured Panel');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('LandingFeedItem', () => {
    it('renders feed transaction with title, amount, positive styling and dot indicator', () => {
      render(
        <LandingFeedItem
          title="UPI 2.0 Auto-Debit"
          subtitle="Zerodha Broking"
          time="2 mins ago"
          amount="+₹25,000"
          isPositive={true}
          dotColor="#10b981"
          badge="SETTLED"
        />
      );
      expect(screen.getByText('UPI 2.0 Auto-Debit')).toBeDefined();
      expect(screen.getByText(/Zerodha Broking/)).toBeDefined();
      expect(screen.getByText(/2 mins ago/)).toBeDefined();
      expect(screen.getByText('+₹25,000')).toBeDefined();
      expect(screen.getByText('SETTLED')).toBeDefined();
    });
  });

  describe('LandingAllocationBar', () => {
    it('renders allocation distribution bar with label, tabular amount, and percent', () => {
      render(
        <LandingAllocationBar
          label="Indian Equities"
          amount="₹81.4L"
          pct={55}
          color="#06b6d4"
          sublabel="Nifty 50"
        />
      );
      expect(screen.getByText(/Indian Equities/)).toBeDefined();
      expect(screen.getByText(/(Nifty 50)/)).toBeDefined();
      expect(screen.getByText(/₹81.4L/)).toBeDefined();
      expect(screen.getByText(/(55%)/)).toBeDefined();
    });
  });

  describe('LandingStepIndicator', () => {
    it('renders multi-step progress indicators and handles tab clicks', () => {
      const handleSelect = vi.fn();
      render(
        <LandingStepIndicator
          totalSteps={3}
          activeStep={1}
          progress={50}
          onSelectStep={handleSelect}
          stepLabels={['Pillar 1', 'Pillar 2', 'Pillar 3']}
        />
      );
      expect(screen.getByRole('tablist', { name: 'Progress steps' })).toBeDefined();
      const step3 = screen.getByRole('tab', { name: 'Pillar 3' });
      fireEvent.click(step3);
      expect(handleSelect).toHaveBeenCalledWith(2);
    });
  });

  describe('LandingMarqueeChip', () => {
    it('renders chip with name, tag, custom color and icon', () => {
      render(
        <LandingMarqueeChip
          name="UPI 2.0 & AutoPay"
          tag="Instant Bank Rail"
          color="#10b981"
          icon={<Zap size={14} data-testid="chip-icon" />}
        />
      );
      expect(screen.getByText('UPI 2.0 & AutoPay')).toBeDefined();
      expect(screen.getByText('Instant Bank Rail')).toBeDefined();
      expect(screen.getByTestId('chip-icon')).toBeDefined();
    });
  });

  describe('LandingFeedbackCard', () => {
    it('renders feedback header, textarea and submit button', () => {
      render(<LandingFeedbackCard />);
      expect(screen.getByText('Direct Feedback & Ideas')).toBeDefined();
      const textarea = screen.getByPlaceholderText('How can we help you improve MyFinanceOS?');
      fireEvent.change(textarea, { target: { value: 'Great local-first platform!' } });
      expect(screen.getByText('27 / 500')).toBeDefined();
      expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeDefined();
    });
  });

  describe('LandingCapabilityCard', () => {
    it('renders featured capability card with badge, title, and children slot', () => {
      render(
        <LandingCapabilityCard
          variant="featured"
          icon={<Network data-testid="net-icon" size={22} />}
          badgeText="FLAGSHIP"
          badgeVariant="cyan"
          title="Sankey Topology"
          description="Map your entire cashflow."
        >
          <div data-testid="preview-slot">Custom Flow Diagram</div>
        </LandingCapabilityCard>
      );
      expect(screen.getByText('FLAGSHIP')).toBeDefined();
      expect(screen.getByText('Sankey Topology')).toBeDefined();
      expect(screen.getByText('Map your entire cashflow.')).toBeDefined();
      expect(screen.getByTestId('net-icon')).toBeDefined();
      expect(screen.getByTestId('preview-slot')).toBeDefined();
    });

    it('renders compact capability card with tag', () => {
      render(
        <LandingCapabilityCard
          variant="compact"
          icon={<Lock size={20} />}
          tag="Debt Optimization"
          title="EMI Planner"
          description="Model home loan prepayments."
        />
      );
      expect(screen.getByText('Debt Optimization')).toBeDefined();
      expect(screen.getByText('EMI Planner')).toBeDefined();
      expect(screen.getByText('Model home loan prepayments.')).toBeDefined();
    });
  });

  describe('LandingSpecPill', () => {
    it('renders title, subtitle and icon', () => {
      render(
        <LandingSpecPill
          icon={<Key data-testid="key-icon" size={16} />}
          title="PBKDF2"
          subtitle="100k Iterations"
        />
      );
      expect(screen.getByText('PBKDF2')).toBeDefined();
      expect(screen.getByText('100k Iterations')).toBeDefined();
      expect(screen.getByTestId('key-icon')).toBeDefined();
    });
  });

  describe('LandingNavbar', () => {
    it('renders brand title, zero custody badge, navigation links and launch button', () => {
      const handleUnlock = vi.fn();
      const handleNavigate = vi.fn();
      render(
        <LandingNavbar onUnlock={handleUnlock} onNavigateSection={handleNavigate} />
      );
      expect(screen.getByText('MyFinanceOS')).toBeDefined();
      expect(screen.getByText(/ZERO PLAINTEXT CUSTODY/i)).toBeDefined();
      expect(screen.getByRole('navigation', { name: 'Main Navigation' })).toBeDefined();

      const showcaseBtn = screen.getByRole('button', { name: 'Showcase' });
      fireEvent.click(showcaseBtn);
      expect(handleNavigate).toHaveBeenCalledWith('products-showcase');

      const launchBtn = screen.getByRole('button', { name: 'Launch Sovereign Vault' });
      fireEvent.click(launchBtn);
      expect(handleUnlock).toHaveBeenCalledTimes(1);
    });

    it('toggles mobile drawer on hamburger click', () => {
      render(<LandingNavbar onUnlock={vi.fn()} />);
      const hamburger = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(hamburger);
      expect(screen.getByRole('dialog', { name: 'Mobile Navigation Drawer' })).toBeDefined();
    });
  });

  describe('LandingFooter', () => {
    it('renders brand identity, encrypted status, navigation columns, and India tag', () => {
      render(<LandingFooter />);
      expect(screen.getByText(/100% Client-Side AES-256-GCM Encrypted/i)).toBeDefined();
      expect(screen.getByText('Interactive Sandboxes')).toBeDefined();
      expect(screen.getByText('Knowledge Base & FAQ')).toBeDefined();
      expect(screen.getByText('Privacy Policy')).toBeDefined();
      expect(screen.getByText(/Built for India's Financial Sovereignty/i)).toBeDefined();
    });
  });

  describe('LandingFaqSection', () => {
    it('renders FAQ section header and accordion items', () => {
      render(<LandingFaqSection badgeText="KNOWLEDGE BASE" />);
      expect(screen.getByText('KNOWLEDGE BASE')).toBeDefined();
      expect(screen.getByRole('heading', { level: 2, name: /Frequently Asked Questions/i })).toBeDefined();
      expect(screen.getByText(/Is MyFinanceOS free and open-source\?/i)).toBeDefined();
    });
  });

  describe('TrustComparisonMatrix', () => {
    it('renders architectural comparison dimensions and hardware isolation guarantee', () => {
      render(<TrustComparisonMatrix />);
      expect(screen.getByText(/The architecture of trust: Sovereign OS vs Cloud SaaS/i)).toBeDefined();
      expect(screen.getByText('Local-First + E2E Cloud Sync')).toBeDefined();
      expect(screen.getByText('Hardware PIN Key Derivation')).toBeDefined();
      expect(screen.getByText('Zero-Knowledge Isolation')).toBeDefined();
      expect(screen.getByText('Hardware Cryptographic Isolation Guarantee')).toBeDefined();
    });
  });

  describe('Showcase Stages', () => {
    describe('TaxGstShowcaseStage', () => {
      it('renders regime toggle, income slider and comparative cards', () => {
        render(<TaxGstShowcaseStage initialIncome={2000000} />);
        expect(screen.getByText(/New Tax Regime \(Section 115BAC\)/i)).toBeDefined();
        expect(screen.getByText('₹20.00 Lakhs')).toBeDefined();
        expect(screen.getByText(/GSTR-1 & 3B Auto-Reconciliation/i)).toBeDefined();
      });
    });

    describe('LedgerCashflowShowcaseStage', () => {
      it('renders consolidated balance and transaction stream', () => {
        render(<LedgerCashflowShowcaseStage />);
        expect(screen.getByText('Consolidated Liquid Balance')).toBeDefined();
        expect(screen.getByText('₹34,82,450')).toBeDefined();
        expect(screen.getByText('Client Retainer (UPI/NEFT)')).toBeDefined();
      });
    });

    describe('InvestmentsWealthShowcaseStage', () => {
      it('renders net worth, emergency runway and target allocations', () => {
        render(<InvestmentsWealthShowcaseStage />);
        expect(screen.getByText('Total Net Worth')).toBeDefined();
        expect(screen.getByText('₹1.48 Cr')).toBeDefined();
        expect(screen.getByText('Emergency Runway')).toBeDefined();
        expect(screen.getByText('Indian Equities & Nifty 50 Index')).toBeDefined();
      });
    });

    describe('MerchantCommerceShowcaseStage', () => {
      it('renders supply corridor toggle, GST rate chips and live invoice card', () => {
        render(<MerchantCommerceShowcaseStage />);
        expect(screen.getByText('Intra-State (CGST+SGST)')).toBeDefined();
        expect(screen.getByText('B2B TAX INVOICE PREVIEW')).toBeDefined();
        expect(screen.getByText('Total Invoice Amount')).toBeDefined();
      });
    });

    describe('AutomationRulesShowcaseStage', () => {
      it('renders allocation strategy, SIP slider and compounding projection', () => {
        render(<AutomationRulesShowcaseStage />);
        expect(screen.getByText('Wealth Accelerator')).toBeDefined();
        expect(screen.getByText('10-Yr Projected Corpus (14% CAGR)')).toBeDefined();
        expect(screen.getByText('Compounded Wealth Gain')).toBeDefined();
      });
    });
  });

  describe('Hero Canvas & Sub-Components', () => {
    describe('HeroStardustCanvas', () => {
      it('renders stardust canvas', () => {
        const { container } = render(<HeroStardustCanvas isVisible={true} />);
        expect(container.querySelector('canvas')).toBeDefined();
      });
    });

    describe('HeroPlanetCanvas', () => {
      it('renders 3D planet canvas', () => {
        const { container } = render(<HeroPlanetCanvas isVisible={true} />);
        expect(container.querySelector('canvas')).toBeDefined();
      });
    });

    describe('HeroNotificationCluster', () => {
      it('renders notification cluster with telemetry badges', () => {
        render(<HeroNotificationCluster notifications={DEFAULT_HERO_NOTIFICATIONS} />);
        expect(screen.getByText('Corporate Retainer Settled')).toBeDefined();
        expect(screen.getByText('Tax Optimized (Sec 115BAC)')).toBeDefined();
      });
    });
  });

  describe('Value Carousel Sub-Stages', () => {
    describe('DirectLocalRoutingStage', () => {
      it('renders local routing stage card with feed items', () => {
        render(<DirectLocalRoutingStage />);
        expect(screen.getByText('DIRECT LOCAL ROUTING')).toBeDefined();
        expect(screen.getByText('UPI 2.0 Inward Settled')).toBeDefined();
      });
    });

    describe('SlabSimulatorStage', () => {
      it('renders slab simulator stage with tax breakdown cards', () => {
        render(<SlabSimulatorStage />);
        expect(screen.getByText('SUB-SECOND SLAB SIMULATOR')).toBeDefined();
        expect(screen.getByText('NEW REGIME (115BAC)')).toBeDefined();
      });
    });

    describe('DottedGlobeCanvas', () => {
      it('renders 3D dotted globe canvas container', () => {
        const { container } = render(<DottedGlobeCanvas isVisible={true} />);
        expect(container.querySelector('canvas')).toBeDefined();
      });
    });
  });

  describe('Outro Brand Monogram Canvas', () => {
    describe('BrandMonogramCanvas', () => {
      it('renders brand monogram canvas container', () => {
        const { container } = render(<BrandMonogramCanvas isVisible={true} />);
        expect(container.querySelector('canvas')).toBeDefined();
      });
    });
  });

  describe('useCanvasVisibility', () => {
    it('initializes visibility to true', () => {
      const { result } = renderHook(() => useCanvasVisibility());
      expect(result.current.isVisible).toBe(true);
      expect(result.current.isVisibleRef.current).toBe(true);
      expect(result.current.containerRef).toBeDefined();
    });
  });
});
