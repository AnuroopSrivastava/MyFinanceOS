import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '@financeos/database';
import { authSession } from '@financeos/auth';
import { useGoogleLogin } from '@react-oauth/google';
import {
  ShieldCheck, ArrowRight, Database, Network, PieChart, Lock, MessageSquare,
  LayoutDashboard, Receipt, Calculator, Building2, GitFork, Target, Bot, Settings
} from 'lucide-react';

interface LandingProps {
  onUnlock: () => void;
}

// Replaced dynamic text based on specs

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
        boxShadow: isHovered ? '0 10px 40px -10px rgba(59, 130, 246, 0.15)' : 'var(--shadow-sm)',
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
  );
};

const FEATURE_BLOCKS = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={24} />,
    title: 'Command Center Dashboard',
    desc: 'Get an instant, high-level overview of your entire financial universe. Our intelligent dashboard aggregates data from all modules to give you actionable insights at a glance.',
    bullets: [
      'Real-time Net Worth calculation',
      'Interactive asset allocation charts',
      '30-day quick expense tracking',
      'Upcoming bill reminders'
    ],
    demo: (
      <div className="bar-chart">
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    )
  },
  {
    id: 'ledger',
    icon: <Receipt size={24} />,
    title: 'Banking & Core Ledger',
    desc: 'The heart of your financial OS. A powerful, double-entry capable ledger that tracks every rupee with absolute precision and military-grade encryption.',
    bullets: [
      'Multi-account syncing & tracking',
      'Automated categorization engine',
      'Advanced filtering and search',
      'Split transactions capabilities'
    ],
    demo: (
      <div className="ledger-list">
        <div className="ledger-row">
          <span>Salary Credit</span>
          <span className="amount-pos">+ ₹85,000</span>
        </div>
        <div className="ledger-row">
          <span>Grocery Store</span>
          <span className="amount-neg">- ₹2,400</span>
        </div>
        <div className="ledger-row">
          <span>Dividend Payout</span>
          <span className="amount-pos">+ ₹1,200</span>
        </div>
      </div>
    )
  },
  {
    id: 'investments',
    icon: <PieChart size={24} />,
    title: 'Investments Portfolio',
    desc: 'Track all your equities, mutual funds, and crypto in one place. Monitor real-time updates and allocation breakdowns across your entire portfolio.',
    bullets: [
      'Consolidated asset tracking',
      'Current vs invested value visualization',
      'Diversification metrics',
      'Dividend tracking'
    ],
    demo: (
      <div className="matrix-grid">
        <div className="matrix-cell cell-1">Equities<br /><span>45%</span></div>
        <div className="matrix-cell cell-2">Bonds<br /><span>20%</span></div>
        <div className="matrix-cell cell-3">Crypto<br /><span>10%</span></div>
        <div className="matrix-cell cell-4">Real Est.<br /><span>15%</span></div>
        <div className="matrix-cell cell-5">Cash<br /><span>5%</span></div>
        <div className="matrix-cell cell-6">Gold<br /><span>5%</span></div>
      </div>
    )
  },
  {
    id: 'tax',
    icon: <Calculator size={24} />,
    title: 'Indian Tax Engine',
    desc: 'Stay ahead of tax season with real-time tax liability forecasting. Our engine automatically calculates your expected tax based on the latest Indian tax slabs (Old & New regime).',
    bullets: [
      'Real-time Old vs New Regime comparison',
      '80C, 80D, & standard deduction tracking',
      'Capital Gains tax estimates',
      'Advance tax payment reminders'
    ],
    demo: (
      <div className="tax-card">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Optimizing Tax Liability...</div>
        <div className="tax-number"></div>
        <div style={{ color: '#00ffcc', fontSize: '0.85rem', fontWeight: 600 }}>Optimal Regime Detected</div>
      </div>
    )
  },
  {
    id: 'business',
    icon: <Building2 size={24} />,
    title: 'Business Slabs',
    desc: 'Manage multiple business entities, track corporate tax slabs, and seamlessly categorize business versus personal expenses.',
    bullets: [
      'Multi-entity accounting',
      'Corporate tax tier tracking',
      'Expense separation',
      'Automated P&L generation'
    ],
    demo: (
      <div className="slab-container">
        <div className="slab-layer tier-1">Tier 1: Up to ₹5L</div>
        <div className="slab-layer tier-2">Tier 2: ₹5L - ₹10L</div>
        <div className="slab-layer tier-3">Tier 3: Above ₹10L</div>
      </div>
    )
  },
  {
    id: 'sankey',
    icon: <GitFork size={24} />,
    title: 'Sankey Cash Flow',
    desc: 'Visualize your money in motion. Sankey diagrams beautifully illustrate exactly how your income flows into different expense categories, investments, and savings.',
    bullets: [
      'Dynamic visual flow tracing',
      'Identify money leaks instantly',
      'Customizable node grouping',
      'Exportable high-res diagrams'
    ],
    demo: (
      <svg className="sankey-svg" viewBox="0 0 200 200" preserveAspectRatio="none">
        <path className="sankey-line" d="M 0,100 C 100,100 100,50 200,50" />
        <path className="sankey-line" d="M 0,100 C 100,100 100,150 200,150" />
        <path className="sankey-line" d="M 0,100 C 100,100 150,180 200,180" />
      </svg>
    )
  },
  {
    id: 'planner',
    icon: <Target size={24} />,
    title: 'Investment Planner',
    desc: 'Plot your path to financial independence (FIRE). Set long-term goals and let our compounding calculators show you exactly what it takes to reach them.',
    bullets: [
      'FIRE (Financial Independence) calculators',
      'Future value projections',
      'Dividend yield projections',
      'Goal-based timeline mapping'
    ],
    demo: (
      <svg className="invest-graph" viewBox="0 0 200 100" preserveAspectRatio="none">
        <path className="invest-axis" d="M 10 10 L 10 90 L 190 90" />
        <path className="invest-curve" d="M 10 90 Q 100 85, 140 50 T 190 10" />
      </svg>
    )
  },
  {
    id: 'ai',
    icon: <Bot size={24} />,
    title: 'AI Financial Assistant',
    desc: 'Your personal wealth advisor, running securely. Ask questions about your spending habits, request deep-dive analyses, or get smart categorization suggestions.',
    bullets: [
      'Natural language query processing',
      'Automated anomaly detection',
      'Personalized saving insights',
      'Privacy-first local processing'
    ],
    demo: (
      <div className="chat-bubble">
        <strong style={{ color: 'var(--accent-1)' }}>Finance AI:</strong><br />
        <span style={{ fontSize: '0.9rem' }}>You saved 15% more on groceries this month compared to last! Keep it up. 🚀</span>
      </div>
    )
  },
  {
    id: 'settings',
    icon: <Settings size={24} />,
    title: 'Advanced Settings',
    desc: 'Total control over your data. Configure local storage options, manage export formats, and customize your theme and preferences.',
    bullets: [
      'Google Drive sync configuration',
      'Complete JSON/CSV data export',
      'Theme customization',
      'Vault encryption management'
    ],
    demo: (
      <div className="gears-container">
        <div className="gear gear-large"></div>
        <div className="gear gear-small"></div>
      </div>
    )
  }
];

export const Landing: React.FC<LandingProps> = ({ onUnlock }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    try {
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
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);


    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
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

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

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
        position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, hsla(203, 100%, 50%, 0.1) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 8s infinite alternate'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%',
        background: 'radial-gradient(circle, hsla(186, 100%, 45%, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'pulse 10s infinite alternate-reverse'
      }} />

      {/* Navigation Bar */}
      <nav className="animate-fade-in responsive-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
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
        <div className="responsive-flex-wrap" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#how-it-works" onClick={scrollToHowItWorks} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>How It Works</a>
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
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '0.6rem 1.5rem', borderRadius: '3rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '2.5rem', fontSize: '0.9rem', color: 'var(--accent-1)', fontWeight: 600,
          }}>
            <ShieldCheck size={18} />
            <span style={{ letterSpacing: '0.5px' }}>Privacy-First Finance System for India 🇮🇳</span>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <h2 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            All Your Money.<br />
            <span style={{
              background: 'var(--accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              One Secure Workspace.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.3}>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3.5rem', lineHeight: 1.6 }}>
            A comprehensive, local-first operating system for your wealth. 
            Track income, expenses, taxes, and investments with absolute privacy—syncing directly to your personal Drive. We never see your data.
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

        {/* Trust Section */}
        <Reveal delay={0.5}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2.5rem', marginTop: '3.5rem',
            color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-1)" /> 100% Local-First
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--accent-1)" /> AES-256 Encryption
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="var(--accent-1)" /> India-Ready Tax & SIP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--accent-1)" /> Personal + Business
            </div>
          </div>
        </Reveal>

        {/* Feature Grid Highlights */}
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
                background: 'rgba(59, 130, 246, 0.05)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-1)', border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>{feature.desc}</p>
            </TiltCard>
          ))}
        </div>

        {/* Comprehensive How It Works & Core Features Section (Merged from About Page) */}
        <section id="how-it-works" style={{ width: '100%', maxWidth: '1200px', margin: '8rem auto 0', textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <Reveal delay={0.1}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                How It Works
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.7 }}>
                Dive deep into the core features of MyFinanceOS. See exactly how our powerful, local-first tools work together to give you complete control over your wealth.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            {FEATURE_BLOCKS.map((block, i) => (
              <Reveal key={block.id} delay={0.1}>
                <div className="glass-panel feature-block-card" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '3.5rem',
                  alignItems: 'center',
                  padding: '3rem',
                  borderRadius: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                    e.currentTarget.style.borderColor = 'var(--accent-1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div className="feature-text-content" style={{ order: i % 2 === 0 ? 1 : 2, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        background: 'var(--bg-secondary)', width: '48px', height: '48px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-1)',
                        border: '1px solid var(--border-color)', flexShrink: 0
                      }}>
                        {block.icon}
                      </div>
                      <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-1)', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {block.title}
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, margin: 0 }}>
                      {block.desc}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {block.bullets.map((bullet, idx) => (
                        <li key={idx} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.98rem' }}>
                          <span style={{ color: 'var(--accent-1)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="feature-demo-content" style={{ order: i % 2 === 0 ? 2 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="demo-container">
                      {block.demo}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Data Usage Transparency Section */}
        <Reveal style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel feature-card" style={{
            marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '2.5rem',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-color)', textAlign: 'left',
            zIndex: 1, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s ease, border-color 0.3s ease'
          }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.borderTopColor = 'var(--border-color)';
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
          <a href="#how-it-works" onClick={scrollToHowItWorks} style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>How It Works</a>
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

        /* Responsive Overrides */
        .responsive-nav {
          padding: 1.5rem 3rem;
        }
        .responsive-flex-wrap {
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .responsive-nav {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
            justify-content: center !important;
          }
          .responsive-flex-wrap {
            gap: 1rem;
            justify-content: center;
          }
          .feature-text-content {
            order: 1 !important;
          }
          .feature-demo-content {
            order: 2 !important;
          }
        }

        /* Feature Block Demos CSS */
        .demo-container {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          width: 100%;
          max-width: 450px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        /* Dashboard Animation */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 15px;
          height: 150px;
        }
        .bar {
          width: 36px;
          background: linear-gradient(0deg, var(--accent-1) 0%, #00ffcc 100%);
          border-radius: 4px 4px 0 0;
          animation: grow-bar 3s ease-in-out infinite alternate;
        }
        .bar:nth-child(1) { height: 20%; animation-delay: 0s; }
        .bar:nth-child(2) { height: 50%; animation-delay: 0.2s; }
        .bar:nth-child(3) { height: 80%; animation-delay: 0.4s; }
        .bar:nth-child(4) { height: 40%; animation-delay: 0.6s; }
        .bar:nth-child(5) { height: 100%; animation-delay: 0.8s; }

        @keyframes grow-bar {
          0% { transform: scaleY(0.2); transform-origin: bottom; opacity: 0.5; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }

        /* Ledger Animation */
        .ledger-list {
          width: 85%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ledger-row {
          background: rgba(255,255,255,0.05);
          padding: 14px 18px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slide-in 4s infinite;
          opacity: 0;
          transform: translateX(50px);
          font-size: 0.95rem;
        }
        .ledger-row:nth-child(1) { animation-delay: 0s; }
        .ledger-row:nth-child(2) { animation-delay: 1.5s; }
        .ledger-row:nth-child(3) { animation-delay: 3s; }
        .amount-pos { color: #00ffcc; font-weight: bold; }
        .amount-neg { color: #ff4a4a; font-weight: bold; }

        @keyframes slide-in {
          0% { opacity: 0; transform: translateX(50px); }
          20%, 80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-50px); }
        }

        /* Investments Animation: Diversification Matrix */
        .matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 240px;
        }
        .matrix-cell {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px 5px;
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-secondary);
          position: relative;
          overflow: hidden;
          animation: matrix-pulse 6s infinite alternate;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .matrix-cell span {
          font-size: 1rem;
          font-weight: 700;
        }
        .matrix-cell.cell-1 { border-color: var(--accent-1); color: var(--accent-1); animation-delay: 0s; }
        .matrix-cell.cell-2 { border-color: #00ffcc; color: #00ffcc; animation-delay: 0.5s; }
        .matrix-cell.cell-3 { border-color: #a855f7; color: #a855f7; animation-delay: 1s; }
        .matrix-cell.cell-4 { border-color: #fbbf24; color: #fbbf24; animation-delay: 1.5s; }
        .matrix-cell.cell-5 { border-color: #f43f5e; color: #f43f5e; animation-delay: 2s; }
        .matrix-cell.cell-6 { border-color: #3b82f6; color: #3b82f6; animation-delay: 2.5s; }

        @keyframes matrix-pulse {
          0%, 40% { transform: scale(1); box-shadow: 0 0 0 transparent; opacity: 0.6; }
          50% { transform: scale(1.08); box-shadow: inset 0 0 15px currentColor; opacity: 1; text-shadow: 0 0 8px currentColor; }
          60%, 100% { transform: scale(1); box-shadow: 0 0 0 transparent; opacity: 0.6; }
        }

        /* Tax Engine Animation */
        .tax-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
          padding: 2rem;
          border-radius: 1rem;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.2);
          animation: float 4s ease-in-out infinite;
        }
        .tax-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--accent-1);
          margin: 1rem 0;
        }
        .tax-number::after {
          content: '₹0';
          animation: count-up 3s ease-out infinite;
        }

        @keyframes count-up {
          0% { content: '₹12,450'; opacity: 0.5; }
          50% { content: '₹9,200'; }
          100% { content: '₹4,100'; color: #00ffcc; text-shadow: 0 0 10px #00ffcc; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Business Slabs Animation */
        .slab-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          perspective: 1000px;
          align-items: center;
        }
        .slab-layer {
          padding: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
          transform: rotateX(25deg);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          animation: float-slab 4s ease-in-out infinite alternate;
          backdrop-filter: blur(4px);
        }
        .slab-layer.tier-1 { border: 1px solid rgba(255,255,255,0.2); animation-delay: 0s; width: 140px; }
        .slab-layer.tier-2 { border: 1px solid var(--accent-1); animation-delay: 0.3s; width: 170px; }
        .slab-layer.tier-3 { border: 1px solid #00ffcc; animation-delay: 0.6s; width: 200px; }

        @keyframes float-slab {
          0% { transform: rotateX(25deg) translateY(0) scale(1); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
          100% { transform: rotateX(10deg) translateY(-15px) scale(1.05); box-shadow: 0 20px 35px rgba(0,255,204,0.2); border-color: #00ffcc; color: #00ffcc; }
        }

        /* Sankey Animation */
        .sankey-svg {
          width: 100%;
          height: 100%;
        }
        .sankey-line {
          fill: none;
          stroke: var(--accent-1);
          stroke-width: 4;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: flow 3s linear infinite;
          opacity: 0.6;
        }
        .sankey-line:nth-child(2) { stroke: #00ffcc; animation-delay: -1s; }
        .sankey-line:nth-child(3) { stroke: #ff4a4a; animation-delay: -2s; }

        @keyframes flow {
          to { stroke-dashoffset: 0; opacity: 1; }
        }

        /* Investment Animation */
        .invest-graph {
          width: 90%;
          height: 70%;
        }
        .invest-axis {
          fill: none;
          stroke: var(--border-color);
          stroke-width: 2;
        }
        .invest-curve {
          fill: none;
          stroke: var(--accent-1);
          stroke-width: 4;
          stroke-linecap: round;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw-curve 4s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(0,255,204,0.5));
        }
        @keyframes draw-curve {
          0% { stroke-dashoffset: 400; }
          50%, 100% { stroke-dashoffset: 0; }
        }

        /* AI Animation */
        .chat-bubble {
          background: var(--bg-primary);
          border: 1px solid var(--accent-1);
          padding: 1rem 1.5rem;
          border-radius: 1.5rem 1.5rem 1.5rem 0;
          box-shadow: 0 10px 20px rgba(0,255,204,0.1);
          animation: pop-in 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate;
        }
        @keyframes pop-in {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Settings Animation */
        .gears-container {
          position: relative;
          width: 130px;
          height: 130px;
        }
        .gear {
          border-radius: 50%;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gear-large {
          width: 70px;
          height: 70px;
          border: 12px dashed var(--accent-1);
          top: 10px;
          left: 10px;
          animation: spin-gear 8s linear infinite;
        }
        .gear-small {
          width: 45px;
          height: 45px;
          border: 8px dashed var(--text-secondary);
          bottom: 15px;
          right: 15px;
          animation: spin-gear-reverse 6s linear infinite;
        }
        .gear::after {
          content: '';
          position: absolute;
          background: var(--bg-secondary);
          border: 4px solid var(--accent-1);
          border-radius: 50%;
        }
        .gear-large::after { width: 28px; height: 28px; }
        .gear-small::after { width: 18px; height: 18px; border-color: var(--text-secondary); }

        @keyframes spin-gear {
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-gear-reverse {
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};
