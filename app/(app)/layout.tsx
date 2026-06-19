import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Circle, PlusCircle, Wallet } from 'lucide-react';
import { NavUserChip } from '@/components/wallet/NavUserChip';
import { NavCurrencyWidget } from '@/components/fiat/NavCurrencyWidget';
import { Logo } from '@/components/brand/Logo';
import { ComingSoonBanner } from '@/components/ui/ComingSoonBanner';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/circles', label: 'Circles',  icon: Circle },
    { href: '/wallet',  label: 'Wallet',   icon: Wallet },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const address = cookieStore.get('susu_address')?.value;

    if (!address) redirect('/login');

    return (
        <div className="min-h-screen bg-(--bg-cream)">
            {/* ── Top nav ──────────────────────────────────────────────────── */}
            <nav className="glass-nav sticky top-0 z-40">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center group">
                        <Logo
                            size={32}
                            wordmarkClassName="text-lg hidden sm:block"
                            className="transition-transform group-hover:scale-105"
                        />
                    </Link>

                    {/* Center links */}
                    <div className="flex items-center gap-1">
                        {NAV_LINKS.map(l => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary) transition-all"
                            >
                                <l.icon size={15} />
                                <span className="hidden sm:block">{l.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right: currency + create + user */}
                    <div className="flex items-center gap-2">
                        <NavCurrencyWidget />
                        <Link
                            href="/circles/create"
                            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-(--border-subtle) bg-(--terracotta) px-3.5 py-2 text-sm font-medium text-white hover:bg-(--terracotta-dim) transition-colors shadow-sm"
                        >
                            <PlusCircle size={15} />
                            Create circle
                        </Link>
                        <NavUserChip address={address} />
                    </div>
                </div>
            </nav>

            <ComingSoonBanner />

            {/* ── Page content ─────────────────────────────────────────────── */}
            <main className="mx-auto max-w-6xl px-5 py-8">
                {children}
            </main>
        </div>
    );
}
