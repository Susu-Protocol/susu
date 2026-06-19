'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default:
                    'bg-(--terracotta) text-white hover:bg-(--terracotta-dim) focus-visible:ring-(--terracotta)',
                gold:
                    'bg-(--gold) text-(--text-primary) hover:bg-(--gold-dim) hover:text-white focus-visible:ring-(--gold)',
                outline:
                    'border border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-warm)',
                ghost:
                    'bg-transparent text-(--text-secondary) hover:bg-(--bg-warm) hover:text-(--text-primary)',
                danger:
                    'bg-(--danger) text-white hover:opacity-90',
                forest:
                    'bg-(--forest) text-white hover:bg-(--forest-light)',
            },
            size: {
                sm: 'h-8 px-3 text-sm',
                md: 'h-11 px-5 text-sm',
                lg: 'h-14 px-6 text-base',
                xl: 'h-16 px-8 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: { variant: 'default', size: 'md' },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
