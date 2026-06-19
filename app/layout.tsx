import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Source_Sans_3, DM_Mono } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
});

const sourceSans = Source_Sans_3({
    subsets: ['latin'],
    variable: '--font-source-sans',
    display: 'swap',
});

const dmMono = DM_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-dm-mono',
    display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Susu Protocol — Trustless Rotating Savings on Sui',
        template: '%s · Susu Protocol',
    },
    description:
        "Join a savings circle, contribute each cycle, and earn yield while you wait. The world's most used savings instrument, made trustless.",
    keywords: ['ROSCA', 'savings circle', 'Sui', 'DeFi', 'zkLogin', 'Scallop', 'rotating savings'],
    manifest: '/manifest.webmanifest',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        apple: '/apple-icon.png',
    },
    openGraph: {
        title: 'Susu Protocol — Trustless Rotating Savings on Sui',
        description:
            "Join a savings circle, contribute each cycle, and earn yield while you wait. The world's most used savings instrument, made trustless.",
        url: siteUrl,
        siteName: 'Susu Protocol',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Susu Protocol — Trustless Rotating Savings on Sui',
        description: "The world's most used savings instrument, made trustless on Sui.",
    },
};

export const viewport: Viewport = {
    themeColor: '#C4522A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            className={`${playfair.variable} ${sourceSans.variable} ${dmMono.variable} h-full antialiased`}
        >
            <body className="min-h-full bg-(--bg-cream) text-(--text-primary)">
                {children}
            </body>
        </html>
    );
}
