import React, { useState } from 'react';
import {
  LandingSliderField,
  LandingSegmentedToggle,
  LandingChipGroup
} from '../primitives/index.js';

export interface MerchantCommerceShowcaseStageProps {
  initialBaseAmount?: number;
  initialGstRate?: number;
  initialInterState?: boolean;
}

export const MerchantCommerceShowcaseStage: React.FC<MerchantCommerceShowcaseStageProps> = ({
  initialBaseAmount = 65000,
  initialGstRate = 18,
  initialInterState = false
}) => {
  const [invoiceBaseAmount, setInvoiceBaseAmount] = useState<number>(initialBaseAmount);
  const [gstRate, setGstRate] = useState<number>(initialGstRate);
  const [isInterState, setIsInterState] = useState<boolean>(initialInterState);

  // GST calculation helpers
  const gstTaxAmount = Math.round(invoiceBaseAmount * (gstRate / 100));
  const totalInvoiceAmount = invoiceBaseAmount + gstTaxAmount;
  const cgstAmount = Math.round(gstTaxAmount / 2);
  const sgstAmount = Math.round(gstTaxAmount / 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Corridor & GST Rate Selector */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <LandingSegmentedToggle
          value={isInterState}
          onChange={setIsInterState}
          options={[
            { value: false, label: 'Intra-State (CGST+SGST)' },
            { value: true, label: 'Inter-State (IGST)' }
          ]}
          ariaLabel="GST Supply Corridor"
          style={{ flex: 1 }}
        />

        {/* GST Rate Chips */}
        <LandingChipGroup
          value={gstRate}
          onChange={setGstRate}
          options={[
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' }
          ]}
          ariaLabel="GST Tax Rate"
        />
      </div>

      {/* Base Invoicing Amount Slider */}
      <LandingSliderField
        id="invoice-base-slider"
        label="Taxable Supply Value (HSN 998311)"
        value={invoiceBaseAmount}
        displayValue={`₹${invoiceBaseAmount.toLocaleString('en-IN')}`}
        min={10000}
        max={500000}
        step={5000}
        accentColor="#06b6d4"
        onChange={setInvoiceBaseAmount}
      />

      {/* Live GST Tax Invoice Breakdown Card */}
      <div
        style={{
          background: 'linear-gradient(150deg, rgba(14, 18, 30, 0.95) 0%, rgba(8, 10, 16, 0.98) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '14px',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 12px 35px rgba(0,0,0,0.7)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#67e8f9', fontWeight: 800 }}>
              B2B TAX INVOICE PREVIEW
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--l-text-muted, #94a3b8)' }}>
              GSTIN: 27AABCM8921R1ZX • QR Authenticated
            </div>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontWeight: 700
            }}
          >
            READY TO ISSUE
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.82))' }}>
            <span>Taxable Base Value</span>
            <span className="l-num" style={{ color: '#ffffff', fontWeight: 700 }}>
              ₹{invoiceBaseAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {!isInterState ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-muted, #94a3b8)' }}>
                <span>Central GST (CGST @ {gstRate / 2}%)</span>
                <span className="l-num" style={{ color: '#67e8f9', fontWeight: 600 }}>
                  +₹{cgstAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-muted, #94a3b8)' }}>
                <span>State GST (SGST @ {gstRate / 2}%)</span>
                <span className="l-num" style={{ color: '#67e8f9', fontWeight: 600 }}>
                  +₹{sgstAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--l-text-muted, #94a3b8)' }}>
              <span>Integrated GST (IGST @ {gstRate}%)</span>
              <span className="l-num" style={{ color: '#67e8f9', fontWeight: 600 }}>
                +₹{gstTaxAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '0.5rem',
              marginTop: '0.3rem',
              borderTop: '1px dashed rgba(255, 255, 255, 0.1)'
            }}
          >
            <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.84rem' }}>Total Invoice Amount</span>
            <span className="l-num" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
              ₹{totalInvoiceAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
