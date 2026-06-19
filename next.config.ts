import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: ['@mysten/sui', '@mysten/zklogin'],
    turbopack: {
        root: path.resolve(__dirname),
    },
};

export default nextConfig;
