'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { usdcToDisplay } from '@/lib/scallop/yield';

interface DataPoint {
    cycle: number;
    yield: bigint;
    cumulative: bigint;
}

interface Props {
    data: DataPoint[];
}

export function YieldAccrualChart({ data }: Props) {
    const chartData = data.map(d => ({
        cycle: `Cycle ${d.cycle + 1}`,
        yield: Number(d.yield) / 1_000_000,
        cumulative: Number(d.cumulative) / 1_000_000,
    }));

    if (chartData.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-(--text-muted)">
                Yield data will appear after the first cycle completes.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--terracotta)" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis
                    dataKey="cycle"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v.toFixed(2)}`}
                />
                <Tooltip
                    contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        fontSize: 12,
                    }}
                    formatter={(value: unknown) => [`$${Number(value).toFixed(4)}`, 'Yield']}
                />
                <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    fill="url(#yieldGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
