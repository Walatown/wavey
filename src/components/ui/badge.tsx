import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide',
  {
    variants: {
      variant: {
        good:    'border border-[#51cf66]/30 bg-[#51cf66]/10 text-[#51cf66]',
        fair:    'border border-[#ffd43b]/30 bg-[#ffd43b]/10 text-[#ffd43b]',
        poor:    'border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 text-[#ff6b6b]',
        ocean:   'border border-white/20 bg-white/10 text-white',
        default: 'border border-white/10 bg-white/5 text-white/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
