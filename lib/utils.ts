import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Reads a cookie by name on the client. Returns '' if absent or run on the server. */
export function getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
}

export function shortenAddress(address: string, chars = 4): string {
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatUSDC(amount: bigint, decimals = 6): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const frac = (amount % divisor).toString().padStart(decimals, '0').slice(0, 2);
    return `$${whole}.${frac}`;
}

export function formatSUI(amount: bigint, decimals = 9): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const frac = (amount % divisor).toString().padStart(decimals, '0').slice(0, 4);
    return `${whole}.${frac} SUI`;
}

export function msToCountdown(targetMs: bigint): string {
    const diff = Number(targetMs) - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export function cycleFrequencyLabel(ms: bigint): string {
    const days = Number(ms) / 86_400_000;
    if (days <= 7) return 'Weekly';
    if (days <= 14) return 'Bi-weekly';
    if (days <= 31) return 'Monthly';
    return `Every ${Math.round(days)} days`;
}

export function explorerUrl(type: 'object' | 'tx' | 'address', id: string): string {
    const network = process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet';
    const base = network === 'mainnet'
        ? 'https://suiscan.xyz'
        : 'https://suiscan.xyz/testnet';
    return `${base}/${type}/${id}`;
}
