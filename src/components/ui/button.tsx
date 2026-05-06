import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:  'bg-white text-black hover:bg-neutral-200 shadow-sm',
        ocean:    'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm',
        inverted: 'border border-white/10 bg-white text-black hover:bg-neutral-200 shadow-sm',
        outlined: 'border border-white/20 bg-transparent text-white hover:border-white/40 hover:text-white',
        ghost:    'bg-transparent text-white/70 hover:text-white',
        'ghost-light': 'bg-transparent text-white/70 hover:text-white',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-sm tracking-wide',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
