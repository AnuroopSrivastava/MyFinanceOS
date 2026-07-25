import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheck, ArrowRight, Database, Network, PieChart, Lock, MessageSquare } from 'lucide-react';

interface LandingProps {
  onUnlock: () => void;
}

const DYNAMIC_WORDS = ["Wealth.", "Future.", "Investments.", "Taxes.", "Net Worth."];

// Utility hook for scroll animations
function useIntersectionObserver(ref: React.RefObject<Element>, options: IntersectionObserverInit = { threshold: 0.1 }) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.unobserve(entry.target);
      }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);
  return isIntersecting;
}

const Reveal = ({ children, delay = 0, style = {} }: { children: React.ReactNode, delay?: number, style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref);
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      willChange: 'opacity, transform',
      width: '100%',
      ...style
    }}>
      {children}
    </div>
  );
};

// 3D Tilt Card Component
const TiltCard = ({ children, delay }: { children: React.ReactNode, delay: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const isVisible = useIntersectionObserver(cardRef);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setRotation({ x: rotateX, y: rotateY });
  };

  return (
    <div
      ref={cardRef}
      className="glass-panel feature-card"
      style={{
        padding: '2.5rem 2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem',
        transition: `transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        cursor: 'default',
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(-8px)`
          : (isVisible ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)' : 'translateY(40px)'),
        opacity: isVisible ? 1 : 0,
        boxShadow: isHovered ? 'var(--shadow-glow)' : 'var(--shadow-md)',
        borderColor: isHovered ? 'var(--accent-1)' : 'var(--border-color)',
        transformStyle: 'preserve-3d', willChange: 'transform'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
    >
      <div style={{ transform: 'translateZ(30px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
};

// FAQ Accordion Component
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}
      >
        {question}
        <span style={{
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease',
          color: 'var(--accent-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? '200px' : '0',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isOpen ? 1 : 0,
      }}>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6, marginBottom: 0 }}>
          {answer}
        </p>
      </div>
    </div>
  )
}

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    try {
      // Using Web3Forms for free, backendless email forwarding.
      // NOTE: Replace 'YOUR_ACCESS_KEY_HERE' with a free access key from https://web3forms.com
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '0c19adce-e009-4488-80f6-ca979a99aa35',
          subject: 'New Feedback for MyFinanceOS',
          message: feedbackText
        })
      });
      if (response.ok) {
        setFeedbackSent(true);
        setFeedbackText('');
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      alert('An error occurred while sending feedback.');
    } finally {
      setIsSendingFeedback(false);
    }
  };
  const [isAnimatingText, setIsAnimatingText] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);

    const interval = setInterval(() => {
      setIsAnimatingText(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % DYNAMIC_WORDS.length);
        setIsAnimatingText(false);
      }, 500);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      clearInterval(interval);
    };
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        authSession.login(tokenResponse.access_token, userInfo);
        const success = await dbService.unlock();
        if (success) {
          onUnlock();
        } else {
          setError('Failed to load database from Google Drive.');
        }
      } catch (err) {
        setError('Error authenticating with Google.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
    scope: 'https://www.googleapis.com/auth/drive.appdata profile email',
  });

  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i, size: Math.random() * 60 + 20, left: Math.random() * 100, top: Math.random() * 100,
    duration: Math.random() * 20 + 15, delay: Math.random() * -20,
  }));

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient Mouse Tracker Glow */}
      <div style={{
        position: 'fixed', top: mousePos.y, left: mousePos.x, width: '600px', height: '600px',
        background: 'radial-gradient(circle, hsla(186, 100%, 50%, 0.05) 0%, transparent 60%)',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0, transition: 'opacity 0.3s ease',
      }} />

      {/* Floating Particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px`,
            background: 'linear-gradient(135deg, hsla(203, 100%, 50%, 0.1), hsla(186, 100%, 45%, 0.1))',
            borderRadius: '50%', filter: 'blur(20px)',
            animation: `float-particle ${p.duration}s infinite ease-in-out alternate`, animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>

      {/* Animated Background Gradients */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, hsla(203, 100%, 50%, 0.1) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 8s infinite alternate'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, hsla(186, 100%, 45%, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 10s infinite alternate-reverse'
      }} />

      {/* Navigation Bar */}
      <nav className="animate-fade-in" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.5rem 3rem', borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)',
        position: 'relative', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--accent-grad)', padding: '2px', borderRadius: '50%', display: 'flex' }}>
            <img src="/logo.png" alt="MyFinanceOS Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--bg-primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            MyFinanceOS
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="/about.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>About</a>
          <a href="/privacy.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Privacy</a>
          <a href="/terms.html" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Terms</a>
          <button onClick={() => login()} className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', borderRadius: '2rem' }} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '6rem 2rem 4rem', textAlign: 'center', position: 'relative', zIndex: 1
      }}>

        <Reveal delay={0.1}>
          <div className="privacy-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'linear-gradient(90deg, hsla(186, 100%, 50%, 0.1) 0%, hsla(203, 100%, 50%, 0.1) 100%)',
            padding: '0.6rem 1.5rem', borderRadius: '3rem',
            border: '1px solid hsla(186, 100%, 50%, 0.4)',
            marginBottom: '2.5rem', fontSize: '0.9rem', color: 'var(--accent-1)', fontWeight: 600,
            boxShadow: '0 0 20px hsla(186, 100%, 50%, 0.15)',
            animation: 'pulse-badge 3s infinite alternate'
          }}>
            <ShieldCheck size={18} style={{ filter: 'drop-shadow(0 0 5px var(--accent-1))' }} />
            <span style={{ letterSpacing: '0.5px' }}>100% Local-First Architecture & Strict Privacy</span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h2 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Your <span style={{
              background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block', minWidth: '280px', textAlign: 'left',
              transition: 'opacity 0.4s ease, transform 0.4s ease', opacity: isAnimatingText ? 0 : 1,
              transform: isAnimatingText ? 'translateY(10px) rotateX(-15deg)' : 'translateY(0) rotateX(0deg)'
            }}>
              {DYNAMIC_WORDS[wordIndex]}
            </span><br />
            Your Operating System.
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '650px', margin: '0 auto 3.5rem', lineHeight: 1.7 }}>
            <strong>Purpose of the Application:</strong> MyFinanceOS is a comprehensive personal finance tracker designed to help you manage your income, expenses, and investments. It acts as a highly secure, private operating system for your wealth that syncs directly to your own Google Drive. We don't store your data on our servers—you own everything.
          </p>
        </Reveal>

        {error && (
          <Reveal delay={0.4}>
            <div style={{ color: 'var(--error)', fontSize: '0.95rem', marginBottom: '2rem', background: 'var(--error-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', maxWidth: '450px', margin: '0 auto 2rem', border: '1px solid var(--error)' }}>
              {error}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.4}>
          <button
            onClick={() => login()}
            className="btn btn-primary shimmer-btn"
            style={{ padding: '1.1rem 3rem', fontSize: '1.15rem', borderRadius: '3rem', gap: '0.75rem', boxShadow: '0 10px 30px hsla(203, 100%, 50%, 0.3)', transition: 'all 0.3s ease', transform: isLoading ? 'scale(0.98)' : 'scale(1)', position: 'relative', overflow: 'hidden' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Connecting to Vault...
              </div>
            ) : (
              <>
                Get Started with Google
                <ArrowRight size={22} />
              </>
            )}
          </button>
        </Reveal>

        {/* Feature Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1100px', width: '100%', marginTop: '6rem', position: 'relative', zIndex: 1
        }}>
          {[
            { icon: <Database size={28} />, title: "Your Private Vault", desc: "Data is stored strictly in your personal Google Drive 'appDataFolder'. We have no access to it." },
            { icon: <Network size={28} />, title: "Full Ledger System", desc: "Track accounts, income, and expenses with a robust double-entry accounting foundation." },
            { icon: <PieChart size={28} />, title: "Investment Planning", desc: "Advanced tools to track stocks, mutual funds, and plot your path to financial independence." }
          ].map((feature, i) => (
            <TiltCard key={i} delay={i * 0.1}>
              <div style={{
                background: 'var(--bg-secondary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-1)', border: '1px solid var(--border-color)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{feature.desc}</p>
            </TiltCard>
          ))}
        </div>

        {/* Data Usage Transparency Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel feature-card" style={{
            marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '2.5rem',
            background: 'linear-gradient(180deg, hsla(224, 20%, 14%, 0.4) 0%, hsla(224, 20%, 8%, 0.8) 100%)',
            borderTop: '1px solid hsla(186, 100%, 50%, 0.4)', textAlign: 'left',
            zIndex: 1, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
          }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.borderTopColor = 'hsla(186, 100%, 50%, 0.4)';
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent-grad)', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
              <Lock size={24} color="var(--accent-1)" style={{ filter: 'drop-shadow(0 0 8px hsla(186, 100%, 50%, 0.5))' }} />
              Privacy & Security Guarantee
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong>Zero Server Storage:</strong> Your financial data is never stored on our servers. You retain 100% ownership and control over your information at all times.</li>
              <li><strong>Google Drive Sync:</strong> We request the restricted <code>drive.appdata</code> scope solely to create and sync a hidden <code>financeos_db.json</code> file directly inside your personal Google Drive.</li>
              <li><strong>Isolated Access:</strong> Our application can only access its own specific configuration file. We physically cannot see, read, or modify any of your other personal Google Drive files.</li>
            </ul>
          </div>
        </Reveal>

        {/* FAQ Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%', marginTop: '8rem', textAlign: 'left', zIndex: 1, position: 'relative' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
            <div className="glass-panel" style={{ padding: '0 2rem' }}>
              <FaqItem
                question="Is MyFinanceOS free to use?"
                answer="Yes! Because we don't host your data on our servers, our infrastructure costs are extremely low, allowing us to provide this tool to you completely free of charge."
              />
              <FaqItem
                question="What happens if I lose access to my Google account?"
                answer="Since your data is stored exclusively in your Google Drive, your financial data is tied to your Google Account. We recommend ensuring you have proper recovery methods set up on your Google Account."
              />
              <FaqItem
                question="Can I export my data?"
                answer="Absolutely. You own your data. We provide built-in tools to easily export your entire financial history to standard formats like CSV and JSON."
              />
            </div>
          </div>
        </Reveal>

        {/* Help & Feedback Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{
            marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '2.5rem',
            background: 'linear-gradient(180deg, hsla(224, 20%, 14%, 0.4) 0%, hsla(224, 20%, 10%, 0.7) 100%)',
            textAlign: 'center', zIndex: 1, position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <MessageSquare size={24} color="var(--accent-1)" />
              Help & Feedback
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Have a question or a feature request? Let us know!
            </p>

            {feedbackSent ? (
              <div className="animate-fade-in" style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', display: 'inline-block' }}>
                Thanks! Your feedback has been securely submitted.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
                <textarea
                  className="form-input"
                  placeholder="How can we help you improve MyFinanceOS?"
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{ resize: 'vertical' }}
                  disabled={isSendingFeedback}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleFeedbackSubmit}
                  style={{ alignSelf: 'flex-end' }}
                  disabled={isSendingFeedback || !feedbackText.trim()}
                >
                  {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            )}
          </div>
        </Reveal>

      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.9rem',
        position: 'relative', zIndex: 10, marginTop: '4rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <a href="/about.html" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>About Us</a>
          <a href="/privacy.html" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Privacy Policy</a>
          <a href="/terms.html" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>Terms of Service</a>
        </div>
        © {new Date().getFullYear()} MyFinanceOS. All rights reserved.
      </footer>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          100% { transform: scale(1.1) translate(20px, 20px); opacity: 1; }
        }
        @keyframes pulse-badge { 
          0% { box-shadow: 0 0 10px hsla(186, 100%, 50%, 0.15); border-color: hsla(186, 100%, 50%, 0.3); } 
          100% { box-shadow: 0 0 30px hsla(186, 100%, 50%, 0.5); border-color: hsla(186, 100%, 50%, 0.8); } 
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-100px) translateX(50px) rotate(180deg); opacity: 0.2; }
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg); animation: shimmer 4s infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};
