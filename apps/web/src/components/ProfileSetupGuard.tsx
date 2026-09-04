import React, { useState, useRef } from 'react';
import { dbService } from '@financeos/database';
import { createPinHash } from '@financeos/shared';
import { ShieldCheck, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react';
import { Button, PinDots, NumberPad } from '@financeos/ui';
import { authSession } from '@financeos/auth';
import { motion, AnimatePresence } from 'framer-motion';

// Step progress dots
const StepDots: React.FC<{ current: 1 | 2 }> = ({ current }) => (
  <div style={{ display: 'flex', gap: 'var(--spacing-05)', justifyContent: 'center', alignItems: 'center' }}>
    {[1, 2].map(s => (
      <motion.div
        key={s}
        animate={{
          width: current === s ? '24px' : '8px',
          background: current === s ? 'var(--accent-1)' : 'rgba(255,255,255,0.2)',
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ height: '8px', borderRadius: '9999px' }}
      />
    ))}
  </div>
);

export const ProfileSetupGuard: React.FC<{ onComplete: (profileId: string) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to continue');
      return;
    }
    setError('');
    setStep(2);
  };

  const triggerPinError = (msg: string) => {
    setError(msg);
    setHasError(true);
    setTimeout(() => {
      setPin('');
      setHasError(false);
    }, 600);
  };

  const appendDigit = (d: string) => {
    if (pin.length >= 4 || isSubmitting || hasError) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => submitWithPin(next), 80);
    }
  };

  const deleteDigit = () => {
    if (hasError) return;
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const submitWithPin = async (currentPin: string) => {
    if (currentPin.length !== 4) {
      triggerPinError('Please enter a complete 4-digit PIN');
      return;
    }
    setIsSubmitting(true);
    try {
      const hashedPin = await createPinHash(currentPin);
      const profile = await dbService.addProfile({
        name: name.trim(),
        role: 'Admin',
        isNomineeProvided: false,
        relationship: 'Self',
        pinHash: hashedPin
      });
      authSession.setSessionPin(currentPin);
      setTimeout(() => onComplete(profile.id), 600);
    } catch (err: any) {
      triggerPinError('Could not create your profile. Please try again or contact support if this persists.');
      setIsSubmitting(false);
    }
  };

  // Step 1 slides out to the LEFT when going forward (exit x: -60)
  // Step 2 enters from the RIGHT (initial x: 60)
  // Going back: step 2 exits to the RIGHT, step 1 enters from the LEFT
  const variants = {
    enterForward:  { opacity: 0, x: 60 },
    enterBackward: { opacity: 0, x: -60 },
    center:        { opacity: 1, x: 0 },
    exitForward:   { opacity: 0, x: -60 },
    exitBackward:  { opacity: 0, x: 60 },
  };

  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const goBack = () => {
    setDirection('backward');
    setPin('');
    setError('');
    setHasError(false);
    setStep(1);
  };

  const goForward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name to continue'); return; }
    setError('');
    setDirection('forward');
    setStep(2);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'hsl(222,10%,6%)',
      backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(6,182,212,0.12) 0%, transparent 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass-panel"
        style={{
          padding: 'var(--spacing-25)',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Ambient blob */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 180, height: 180,
          background: step === 1 ? 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
          filter: 'blur(50px)', opacity: 0.4, transition: 'background 0.8s ease', pointerEvents: 'none'
        }} />

        {/* Step progress indicator */}
        <StepDots current={step} />

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial={direction === 'backward' ? 'enterBackward' : 'enterForward'}
              animate="center"
              exit={direction === 'backward' ? 'exitBackward' : 'exitForward'}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-075)' }}>
                <motion.div
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.08 }}
                  style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.04) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(6,182,212,0.2)',
                    boxShadow: '0 8px 20px rgba(6,182,212,0.12)'
                  }}
                >
                  <Sparkles size={24} color="var(--accent-1)" />
                </motion.div>
                <div>
                  <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-heavy)', fontFamily: 'var(--font-display)', margin: '0 0 0.35rem 0', color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Welcome to MyFinanceOS.
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', fontSize: 'var(--font-base)', margin: 0, lineHeight: 1.5, maxWidth: '50ch' }}>
                    Let's set up your secure vault. What should we call you?
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={goForward} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                  style={{
                    fontSize: 'var(--font-lg)', padding: 'var(--spacing-09) var(--spacing-1)',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)'
                  }}
                />
                {error && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ margin: 0, color: 'var(--error)', fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-medium)' }}
                  >{error}</motion.p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  style={{
                    width: '100%', padding: 'var(--spacing-09)', fontSize: 'var(--font-base)',
                    display: 'flex', justifyContent: 'center', gap: 'var(--spacing-05)',
                    borderRadius: 'var(--radius-md)', background: 'hsl(0,0%,98%)', color: '#000',
                    fontWeight: 'var(--fw-heavy)', border: 'none', boxShadow: '0 4px 15px rgba(255,255,255,0.12)'
                  }}
                >
                  Continue <ArrowRight size={18} />
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial={direction === 'forward' ? 'enterForward' : 'enterBackward'}
              animate="center"
              exit={direction === 'forward' ? 'exitForward' : 'exitBackward'}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-15)', alignItems: 'center' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-075)', width: '100%' }}>
                <button
                  type="button"
                  onClick={goBack}
                  style={{
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', padding: 0,
                    cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'hsl(0,0%,98%)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <motion.div
                  initial={{ rotate: 15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.08 }}
                  style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 8px 20px rgba(16,185,129,0.15)'
                  }}
                >
                  <ShieldCheck size={24} color="var(--success)" />
                </motion.div>
                <div>
                  <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-heavy)', fontFamily: 'var(--font-display)', margin: '0 0 0.35rem 0', color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    Secure your Vault
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', fontSize: 'var(--font-base)', margin: 0, lineHeight: 1.5, maxWidth: '50ch' }}>
                    Hi <strong style={{ color: 'hsl(0,0%,98%)' }}>{name}</strong>, set a 4-digit PIN to encrypt your data.
                  </p>
                </div>
              </div>

              {/* Dot indicators + shake */}
              <motion.div
                animate={{ x: hasError ? [-8, 8, -6, 6, -3, 3, 0] : 0 }}
                transition={{ duration: 0.4 }}
              >
                <PinDots filled={pin.length} hasError={hasError} />
              </motion.div>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    key={error}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ margin: '-0.75rem 0 0', fontSize: 'var(--font-sm)', color: 'var(--error)', fontWeight: 'var(--fw-medium)' }}
                  >{error}</motion.p>
                )}
              </AnimatePresence>

              {/* Hidden keyboard input for desktop */}
              <input
                ref={hiddenInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length > pin.length) appendDigit(val[val.length - 1]);
                  else deleteDigit();
                }}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px', top: 0, left: 0 }}
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

              {isSubmitting && (
                <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'rgba(255,255,255,0.5)' }}>Securing vault...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
