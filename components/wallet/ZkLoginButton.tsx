'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createGoogleAuthURL } from '@/lib/sui/enoki';
import { AlertCircle } from 'lucide-react';

interface Props {
    onInitiated?: () => void;
    className?: string;
}

export function ZkLoginButton({ onInitiated, className }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleClick() {
        setLoading(true);
        setError('');
        try {
            // Enoki builds the OAuth URL: generates the ephemeral keypair,
            // fetches a nonce from its API, and constructs the Google redirect.
            const authUrl = await createGoogleAuthURL();
            onInitiated?.();
            window.location.href = authUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start sign-in');
            setLoading(false);
        }
    }

    return (
        <div className={className}>
            <Button
                size="lg"
                onClick={handleClick}
                disabled={loading}
                className="w-full"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Connecting…
                    </span>
                ) : (
                    <span className="flex items-center gap-2.5">
                        <GoogleIcon />
                        Continue with Google
                    </span>
                )}
            </Button>

            {error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle size={13} className="shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
    );
}
