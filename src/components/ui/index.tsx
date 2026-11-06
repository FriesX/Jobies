import * as React from 'react';
import { cn } from '@/lib/utils';

// BUTTON
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none';

    const variants = {
      default:
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20',
      glow:
        'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:brightness-105',
      destructive:
        'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground',
      outline:
        'border border-border/80 bg-background/60 backdrop-blur-sm shadow-xs hover:bg-secondary hover:border-border hover:text-foreground',
      secondary:
        'bg-secondary/70 text-secondary-foreground hover:bg-secondary hover:text-foreground',
      ghost:
        'hover:bg-secondary/80 hover:text-foreground',
      link:
        'text-primary underline-offset-4 hover:underline p-0 h-auto font-medium',
    };

    const sizes = {
      default: 'h-8 px-3.5 py-1.5',
      xs: 'h-6 rounded-md px-2 text-[11px]',
      sm: 'h-7 rounded-md px-2.5 text-xs',
      lg: 'h-10 rounded-lg px-6 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// BADGE
export function Badge({
  className,
  variant = 'default',
  children,
}: {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'emerald';
  children: React.ReactNode;
}) {
  const variants = {
    default: 'border-transparent bg-primary/10 text-primary border border-primary/20 font-semibold',
    secondary: 'border-transparent bg-secondary/80 text-secondary-foreground font-medium',
    destructive: 'border-transparent bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold',
    outline: 'text-foreground border border-border/80 bg-background/50 font-medium',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold',
    emerald: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 font-bold',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors select-none',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

// CARD
export function Card({
  className,
  children,
  hoverLift = false,
}: {
  className?: string;
  children: React.ReactNode;
  hoverLift?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/70 backdrop-blur-md text-card-foreground shadow-xs transition-all duration-200',
        hoverLift && 'hover-lift',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-col space-y-1 p-5', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('font-bold leading-tight tracking-tight text-foreground text-sm', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('text-xs text-muted-foreground leading-relaxed', className)}>{children}</p>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5 pt-0', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex items-center p-5 pt-0 border-t border-border/50', className)}>{children}</div>;
}

// INPUT
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-8 w-full rounded-lg border border-border/80 bg-background/50 px-3 py-1 text-xs shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// TEXTAREA
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[70px] w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 font-sans',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
