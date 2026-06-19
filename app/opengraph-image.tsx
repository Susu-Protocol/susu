import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Susu Protocol — Trustless Rotating Savings on Sui';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const markPng = await readFile(join(process.cwd(), 'public/icons/icon-512.png'));
    const markDataUri = `data:image/png;base64,${markPng.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FAF7F2',
                    backgroundImage:
                        'radial-gradient(circle at 18% 20%, rgba(196,82,42,0.18) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(212,160,23,0.14) 0%, transparent 55%)',
                }}
            >
                <img src={markDataUri} width={140} height={140} style={{ borderRadius: 30 }} />
                <div
                    style={{
                        marginTop: 36,
                        fontSize: 88,
                        fontWeight: 700,
                        color: '#1A1208',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Susu Protocol
                </div>
                <div
                    style={{
                        marginTop: 18,
                        fontSize: 32,
                        color: '#5C4A32',
                        maxWidth: 820,
                        textAlign: 'center',
                    }}
                >
                    The world&rsquo;s most used savings instrument, made trustless on Sui.
                </div>
            </div>
        ),
        { ...size },
    );
}
