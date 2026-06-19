'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ZkLoginButton } from '@/components/wallet/ZkLoginButton';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand/Logo';

export default function LoginPage() {
    const [explainerOpen, setExplainerOpen] = useState(false);

    return (
        <div className="pattern-bg min-h-screen flex flex-col">
            <nav className="px-6 py-5">
                <Link href="/">
                    <Logo size={28} wordmarkClassName="text-2xl" />
                </Link>
            </nav>

            <main className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="rounded-3xl border border-(--border-subtle) bg-(--bg-surface) p-8 shadow-sm">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl overflow-hidden">
                                <LogoMark size={56} />
                            </div>
                            <h1 className="font-display text-2xl font-bold text-(--text-primary)">
                                Join your circle
                            </h1>
                            <p className="mt-2 text-sm text-(--text-muted)">
                                Sign in to start saving with your community
                            </p>
                        </div>

                        {/* zkLogin button */}
                        <ZkLoginButton className="w-full" />

                        <p className="mt-4 text-center text-xs text-(--text-muted)">
                            No wallet needed. No seed phrase. Just your Google account.
                        </p>

                        {/* Explainer */}
                        <div className="mt-6 rounded-xl border border-(--border-subtle) overflow-hidden">
                            <button
                                onClick={() => setExplainerOpen(o => !o)}
                                className="flex w-full items-center justify-between px-4 py-3 text-sm text-(--text-secondary) hover:bg-(--bg-warm) transition-colors"
                            >
                                <span>What is Susu Protocol?</span>
                                {explainerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {explainerOpen && (
                                <div className="border-t border-(--border-subtle) bg-(--bg-warm) px-4 py-4 text-sm text-(--text-secondary) space-y-2 leading-relaxed">
                                    <p>
                                        A Susu circle is a group savings system where members contribute regularly, and each cycle one member receives the entire pool.
                                    </p>
                                    <p>
                                        Susu Protocol puts this on the Sui blockchain — so the rules are enforced by code, not trust. Your contributions are locked in a smart contract that automatically pays the right person at the right time.
                                    </p>
                                    <p>
                                        Between cycles, your pooled funds earn interest in a lending protocol — money that used to sit idle now works for you.
                                    </p>
                                    <p>
                                        Every on-time contribution builds a verified savings record on the blockchain that you own and can share — your financial reputation, made portable.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-(--text-muted)">
                        By signing in you agree to the{' '}
                        <span className="text-(--terracotta) cursor-pointer hover:underline">Terms of Service</span>
                    </p>
                </div>
            </main>
        </div>
    );
}
