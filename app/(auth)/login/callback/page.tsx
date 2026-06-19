'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleEnokiCallback } from '@/lib/sui/enoki';
import { Suspense } from 'react';

function CallbackHandler() {
    const router = useRouter();
    const [error, setError] = useState('');

    useEffect(() => {
        // Enoki reads window.location.hash internally — just pass the raw hash string.
        const hash = window.location.hash;
        if (!hash) {
            setError('No authentication token received. Please try again.');
            return;
        }

        handleEnokiCallback(hash)
            .then(address => {
                if (!address) {
                    setError('Could not derive your Sui address. Please try again.');
                    return;
                }
                // Persist address in a cookie so server components can read it.
                document.cookie = `susu_address=${address}; path=/; max-age=86400; SameSite=Strict`;
                router.replace('/dashboard');
            })
            .catch(err => {
                setError(err instanceof Error ? err.message : 'Authentication failed');
            });
    }, [router]);

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 pattern-bg">
                <div className="w-full max-w-sm rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-red-100 flex items-center justify-center">
                        <span className="text-xl text-red-500">✕</span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-(--text-primary)">Sign-in failed</h2>
                    <p className="mt-2 text-sm text-(--text-muted)">{error}</p>
                    <button
                        onClick={() => router.replace('/login')}
                        className="mt-6 rounded-xl bg-(--terracotta) px-5 py-2.5 text-sm text-white hover:bg-(--terracotta-dim) transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 pattern-bg">
            <div className="w-full max-w-sm rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-(--terracotta)/20 border-t-(--terracotta) animate-spin" />
                <h2 className="font-display text-xl font-semibold text-(--text-primary)">
                    Setting up your account...
                </h2>
                <p className="mt-2 text-sm text-(--text-muted)">
                    Fetching your zero-knowledge proof via Enoki.
                </p>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense>
            <CallbackHandler />
        </Suspense>
    );
}
