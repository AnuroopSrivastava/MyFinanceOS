import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, createPinHash, verifyPin } from '@financeos/shared';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PinDots, NumberPad, Button } from '@financeos/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface PinGuardProps {
  profile: UserProfile;
  onSuccess: () => void;
  overrideVerify?: (pin: string) => Promise<boolean>;
}

export const PinGuard: React.FC<PinGuardProps> = ({ profile, onSuccess, overrideVerify }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'setup' | 'verify'>(overrideVerify || profile.pinHash ? 'verify' : 'setup');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(overrideVerify || profile.pinHash ? 'verify': 'setup');
    setPin('');
    setError('');
    setHasError(false);
  }, [profile, overrideVerify]);

  // Shake + red dots on wrong pin, then clear
  const triggerError = (msg: string) => {
    setError(msg);
    setHasError(true);
    setTimeout(() => {
      setPin('');
      setHasError(false);
    }, 600);
  };

  const verifyOrSetup = async (currentPin: string) => {
    if (currentPin.length !== 4) return;
    setIsSubmitting(true);

    if (overrideVerify) {
      try {
        const success = await overrideVerify(currentPin);
        setIsSubmitting(false);
        if (!success) {
          triggerError('Incorrect PIN. Please try again.');
          return;
        }
        setTimeout(() => onSuccess(), 300);
      } catch (err) {
        setIsSubmitting(false);
        triggerError('Failed to unlock vault. Please check your PIN.');
      }
      return;
    }

    if (mode === 'setup') {
      try {
        const hashedPin = await createPinHash(currentPin);
        try {
          await dbService.updateProfile(profile.id, { pinHash: hashedPin });
        } catch { /* DB might be locked or uninitialized */ }
        authSession.setSessionPin(currentPin);
        setTimeout(() => onSuccess(), 500);
      } catch (err: any) {
        triggerError('Could not save PIN. Please try again or contact support if this persists.');
        setIsSubmitting(false);
      }
    } else {
      const { ok } = await verifyPin(currentPin, profile.pinHash || '');
      setIsSubmitting(false);
      if (!ok) {
        triggerError('Incorrect PIN. Please try again.');
        return;
      }
      authSession.setSessionPin(currentPin);
      setTimeout(() => onSuccess(), 300);
    }
  };

  const appendDigit = (d: string) => {
    if (pin.length >= 4 || isSubmitting || hasError) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      // slight delay so user sees 4th dot fill
      setTimeout(() => verifyOrSetup(next), 80);
    }
  };

  const deleteDigit = () => {
    if (hasError) return;
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const handleForgotPin = async () => {
    setShowForgotModal(false);
    dbService.purgeLocalDatabase();
    await authSession.logout();
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'hsl(222,10%,6%)',
      backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(6,182,212,0.14) 0%, transparent 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>

      {/* Forgot PIN confirmation modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'var(--overlay-scrim)',
              backdropFilter: 'blur(8px)', zIndex: 10001,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-15)'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                background: 'hsl(222,10%,12%)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-2)', maxWidth: '360px', width: '100%',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-1)' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--error-bg)', border: '1px solid var(--error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle size={20} color="var(--error)" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--font-display)', fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: '-0.02em', color: 'hsl(0,0%,98%)' }}>
                    Reset & Sign Out?
                  </h3>
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--font-base)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, maxWidth: '55ch' }}>
                    You will be signed out and your local session will be cleared. If you have not exported a backup or enabled cloud sync, your local data cannot be decrypted without your PIN.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-075)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    flex: 1, padding: 'var(--spacing-075)', fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)',
                    background: 'var(--border-subtle)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.8)'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleForgotPin}
                  style={{
                    flex: 1, padding: 'var(--spacing-075)', fontSize: 'var(--font-base)', fontWeight: 'var(--fw-heavy)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  Reset & Sign Out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '340px', padding: '0 1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-2)'
        }}
      >
        {/* Icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-1)', textAlign: 'center' }}>
          <motion.div
            animate={{ rotate: hasError ? [-4, 4, -4, 4, 0] : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: mode === 'verify'
                ? 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.04) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: mode === 'verify' ? '1px solid rgba(6,182,212,0.25)' : '1px solid rgba(16,185,129,0.3)',
              boxShadow: mode === 'verify' ? '0 8px 24px rgba(6,182,212,0.15)' : '0 8px 24px rgba(16,185,129,0.15)'
            }}
          >
            {mode === 'verify'
              ? <Lock size={26} color="var(--accent-1)" />
              : <ShieldCheck size={26} color="var(--success)" />
            }
          </motion.div>

          <div>
            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-heavy)', fontFamily: 'var(--font-display)', margin: '0 0 0.35rem', color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {mode === 'verify' ? 'Unlock Vault' : 'Secure your Vault'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', fontSize: 'var(--font-base)', margin: 0, lineHeight: 1.5 }}>
              {mode === 'verify'
                ? <>Welcome back, <strong style={{ color: 'hsl(0,0%,98%)' }}>{profile.name}</strong></>
                : <>Hi <strong style={{ color: 'hsl(0,0%,98%)' }}>{profile.name}</strong>, create a 4-digit PIN</>
              }
            </p>
          </div>
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-05)', width: '100%' }}>
          <motion.div
            animate={{ x: hasError ? [-8, 8, -6, 6, -4, 4, 0] : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <PinDots filled={pin.length} hasError={hasError} />
          </motion.div>
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--error)', fontWeight: 'var(--fw-medium)' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden input to capture keyboard on desktop */}
        <input
          ref={hiddenInputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            if (val.length > pin.length) {
              // digit added
              appendDigit(val[val.length - 1]);
            } else {
              // digit deleted
              deleteDigit();
            }
          }}
          style={{
            position: 'absolute', opacity: 0, pointerEvents: 'none',
            width: '1px', height: '1px', top: 0, left: 0
          }}
          aria-label="PIN entry"
        />

        {/* Number pad */}
        <div onClick={() => hiddenInputRef.current?.focus()}>
          <NumberPad
            onDigit={appendDigit}
            onDelete={deleteDigit}
            disabled={isSubmitting}
            deleteDisabled={pin.length === 0}
          />
        </div>

        {/* Forgot PIN */}
        {mode === 'verify' && (
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
              fontSize: 'var(--font-sm)', cursor: 'pointer', padding: 'var(--spacing-025) var(--spacing-05)',
              transition: 'color 0.15s', borderRadius: 'var(--radius-xs)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            Forgot PIN?
          </button>
        )}
      </motion.div>
    </div>
  );
};
