'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/Logo';
import {
    Shield,
    TrendingUp,
    Award,
    Fingerprint,
    ChevronRight,
    Users,
    Globe,
    Zap,
    ArrowRight,
    Check,
} from 'lucide-react';

/* ─── Animated number counter ────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const num = parseFloat(target.replace(/[^0-9.]/g, ''));
        if (isNaN(num)) { el.textContent = target + suffix; return; }
        const duration = 1800;
        const start = performance.now();
        function step(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const val = num * ease;
            el!.textContent = (target.includes('M') || target.includes('T') || target.includes('B'))
                ? `${val.toFixed(0)}${target.replace(/[0-9.]/g, '')}${suffix}`
                : `${val.toFixed(0)}${suffix}`;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }, [target, suffix]);
    return <span ref={ref}>{target}{suffix}</span>;
}

/* ─── Floating decorative circle card preview ───────────────────────────── */
function HeroPreviewCard() {
    return (
        <div className="float relative w-80 rounded-3xl border border-(--border-subtle) bg-white/90 p-5 shadow-xl backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="font-display font-bold text-(--text-primary) text-base">Lagos Traders Club</p>
                    <p className="text-xs text-(--text-muted) mt-0.5">120/120 members · Monthly</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>
            </div>

            {/* Contribution ring preview */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#EDE5D8" strokeWidth="10" />
                        <circle cx="40" cy="40" r="30" fill="none" stroke="#C4522A" strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 30 * 0.75} ${2 * Math.PI * 30 * 0.25}`}
                            strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-mono text-sm font-bold text-(--text-primary)">115/120</span>
                        <span className="text-[9px] text-(--text-muted)">paid</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs text-(--text-muted)">
                        <span>Cycle 45 of 120</span>
                        <span className="font-mono text-(--gold-dim)">+$2,100 yield</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-(--border-subtle) overflow-hidden">
                        <div className="h-full rounded-full bg-(--terracotta)" style={{ width: '75%' }} />
                    </div>
                    <div className="flex justify-between text-xs text-(--text-muted)">
                        <span>$60,000 collected</span>
                        <span>70,000 target</span>
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="flex items-center gap-1.5">
                {['AJ','BK','CL','DE','FA','GH'].map((init, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i < 6 ? 'bg-(--terracotta)' : 'bg-(--border-default)'}`}>
                        {init}
                    </div>
                ))}
                <div className="h-7 w-7 rounded-full bg-(--border-subtle) flex items-center justify-center text-[10px] text-(--text-muted) font-medium">+114</div>
            </div>

            {/* Yield badge */}
            <div className="absolute -top-3 -right-3 rounded-full bg-(--gold) px-3 py-1 text-xs font-semibold text-white shadow-md">
                3% APY
            </div>
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen gradient-hero">
            {/* ── Nav ──────────────────────────────────────────────────────── */}
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav shadow-sm' : 'bg-transparent'}`}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Logo size={32} wordmarkClassName="text-xl" />
            
                    <div className="flex items-center gap-3">
                        <Link href="/circles">
                            <Button variant="ghost" size="sm" className="hidden sm:flex">
                                Browse
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="sm">
                                Sign in <ChevronRight size={14} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                    {/* Left: copy */}
                    <div className="animate-fade-up">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-(--bg-surface) px-4 py-1.5 text-xs font-medium text-(--text-secondary) shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-(--success) inline-block" />
                            Live on Sui Testnet
        
                        </div>

                        <h1 className="font-display text-5xl font-bold leading-[1.08] text-(--text-primary) md:text-6xl lg:text-6xl xl:text-7xl">
                            The world&rsquo;s most used savings instrument,<br />
                            <span className="text-(--terracotta)">made trustless.</span>
                        </h1>

                        <p className="mt-6 text-lg text-(--text-secondary) leading-relaxed max-w-lg">
                            Informal rotational savings circles serve over 600 million people globally.
                            Today they run on trust.
                            <strong className="text-(--text-primary)"> Now they run on Sui.</strong>
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/login">
                                <Button size="lg" className="gap-2 shadow-md shadow-(--terracotta)/20">
                                    Start saving <ArrowRight size={16} />
                                </Button>
                            </Link>
                            <Link href="/circles">
                                <Button variant="outline" size="lg">
                                    Browse open circles
                                </Button>
                            </Link>
                        </div>

                    </div>

                    {/* Right: floating preview */}
                    <div className="flex justify-center lg:justify-end">
                        <div className="relative">
                            {/* Background glow */}
                            <div className="absolute -inset-8 rounded-full bg-(--terracotta)/8 blur-3xl" />
                            {/* Decorative ring */}
                            <div className="absolute -inset-4 rounded-full border-2 border-dashed border-(--terracotta)/15 spin-slow" />
                            <HeroPreviewCard />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <section ref={statsRef} className="border-y border-(--border-subtle) bg-(--bg-surface)/70 backdrop-blur-sm">
                <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-(--border-subtle) px-6 py-10">
                    {[
                        { value: '600', suffix: 'M+', label: 'Adults in ROSCAs globally' },
                        { value: '1', suffix: 'T+', label: 'In informal savings per year', prefix: '$' },
                        { value: '0', suffix: '', label: 'Trustless alternatives — until now' },
                    ].map(s => (
                        <div key={s.label} className="px-4 text-center sm:px-8">
                            <p className="font-display text-4xl font-bold text-(--terracotta) sm:text-5xl">
                                {s.prefix ?? ''}
                                {statsVisible ? <Counter target={s.value} suffix={s.suffix} /> : `${s.value}${s.suffix}`}
                            </p>
                            <p className="mt-2 text-xs text-(--text-muted) sm:text-sm">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works ─────────────────────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-6 py-24">
                <div className="text-center mb-14">
                    <p className="text-xs font-semibold uppercase tracking-widest text-(--terracotta) mb-3">How it works</p>
                    <h2 className="font-display text-3xl font-bold text-(--text-primary) sm:text-4xl">
                        Three steps to your first payout
                    </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { n: '01', title: 'Create or join a circle', body: 'Set your contribution amount, frequency, and member cap — or browse circles already forming near you.', icon: Users },
                        { n: '02', title: 'Contribute every cycle', body: 'Each period everyone sends their share. Funds are locked in a smart contract; no organizer can abscond.', icon: Zap },
                        { n: '03', title: 'Collect your pot + yield', body: 'When it\'s your turn, you receive the full pool plus interest earned while funds sat in Scallop.', icon: TrendingUp },
                    ].map(s => (
                        <div key={s.n} className="group relative rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-7 card-interactive overflow-hidden">
                            <div className="absolute top-4 right-4 font-mono text-5xl font-bold text-(--border-subtle) transition-colors group-hover:text-(--border-default)">
                                {s.n}
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-(--terracotta)/10 flex items-center justify-center mb-5">
                                <s.icon size={20} className="text-(--terracotta)" />
                            </div>
                            <h3 className="font-display text-lg font-semibold text-(--text-primary) mb-2">{s.title}</h3>
                            <p className="text-sm text-(--text-secondary) leading-relaxed">{s.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────────── */}
            <section className="border-t border-(--border-subtle) bg-(--bg-warm)/40">
                <div className="mx-auto max-w-6xl px-6 py-24">
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold uppercase tracking-widest text-(--terracotta) mb-3">What makes us different</p>
                        <h2 className="font-display text-3xl font-bold text-(--text-primary) sm:text-4xl">
                            Built for the world, not just the banked
                        </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Shield,
                                title: 'Trustless by design',
                                body: 'Smart contracts replace the group organizer. No one can abscond with the pot. Rules are enforced by code.',
                                color: 'bg-blue-50 text-blue-600',
                            },
                            {
                                icon: TrendingUp,
                                title: 'Idle funds earn yield',
                                body: 'Pool funds route to Scallop between cycles. Members earn ~3% APY on money that used to sit dormant.',
                                color: 'bg-(--gold)/10 text-(--gold-dim)',
                            },
                            {
                                icon: Award,
                                title: 'Portable credit history',
                                body: 'Every on-time contribution mints a verifiable badge on Sui. Your savings record becomes a financial passport.',
                                color: 'bg-(--terracotta)/10 text-(--terracotta)',
                            },
                            {
                                icon: Fingerprint,
                                title: 'Sign in with Google',
                                body: 'zkLogin removes seed phrases entirely. If you can log in to Gmail, you can join a circle in 30 seconds.',
                                color: 'bg-green-50 text-green-600',
                            },
                        ].map(f => (
                            <div key={f.title} className="rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-6 card-interactive">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                                    <f.icon size={20} />
                                </div>
                                <h3 className="font-display text-base font-semibold text-(--text-primary) mb-2">{f.title}</h3>
                                <p className="text-sm text-(--text-secondary) leading-relaxed">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Integrations ─────────────────────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="text-center mb-10">
                    <p className="text-sm text-(--text-muted)">Powered by world-class infrastructure</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {[
                        { name: 'Sui Network', color: '#4DA2FF', desc: 'L1 Blockchain' },
                        { name: 'Scallop', color: '#D4A017', desc: 'Yield · ~3% APY' },
                        { name: 'zkLogin', color: '#C4522A', desc: 'Passwordless auth' },
                        { name: 'Move VM', color: '#2D5016', desc: 'Smart contracts' },
                    ].map(int => (
                        <div key={int.name} className="flex items-center gap-3 rounded-full border border-(--border-subtle) bg-(--bg-surface) px-5 py-3 shadow-sm">
                            <div className="h-6 w-6 rounded-full" style={{ background: int.color }} />
                            <div>
                                <p className="text-sm font-semibold text-(--text-primary)">{int.name}</p>
                                <p className="text-xs text-(--text-muted)">{int.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-6 pb-24">
                <div className="relative overflow-hidden rounded-3xl bg-(--terracotta) px-8 py-14 text-center text-white shadow-xl">
                    {/* Background decoration */}
                    <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/5 float-b" />
                    <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/5 float" />
                    <div className="absolute top-4 right-1/4 h-8 w-8 rounded-full bg-(--gold)/40" />

                    <div className="relative">
                        <Globe size={40} className="mx-auto mb-5 text-white/70" />
                        <h2 className="font-display text-3xl font-bold sm:text-4xl">
                            Join the future of community savings
                        </h2>
                  
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link href="/login">
                                <Button variant="gold" size="xl" className="shadow-lg shadow-black/20">
                                    Get started — it&rsquo;s free
                                </Button>
                            </Link>
                            <Link href="/circles">
                                <Button size="xl" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                                    Browse circles
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-sm text-white/60">
                            Deployed on Sui Testnet · Open source on GitHub
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="border-t border-(--border-subtle) bg-(--bg-surface)/60 backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2">
                        <Logo size={24} showWordmark={false} />
                        <span className="font-display font-bold text-(--terracotta)">Susu Protocol</span>
                    </span>
                    <p className="text-xs text-(--text-muted)">
                        Built on Sui · Powered by zkLogin + Scallop
                    </p>
                    <div className="flex items-center gap-4 text-xs text-(--text-muted)">
                        <Link href="/circles" className="hover:text-(--text-primary) transition-colors">Circles</Link>
                        <Link href="/login" className="hover:text-(--text-primary) transition-colors">Sign in</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
