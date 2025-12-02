import * as React from "react";
// import { Slot } from "@radix-ui/react-slot";
// import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
// FIX: Import LoadingIcon to be used in the Button component.
import { LoadingIcon } from "../icons";

// FIX: Move dummy implementations to the top to resolve "used before declaration" errors.
const cva = (base: string, config: any) => {
  return (props: any): string => {
    let classes = base;
    if (props) {
      const { variant, size } = props;
      if (variant && config.variants.variant[variant]) {
        classes += " " + config.variants.variant[variant];
      }
      if (size && config.variants.size[size]) {
        classes += " " + config.variants.size[size];
      }
    }
    return classes;
  };
};

// FIX: Provide a typed mock for Slot and use Object.assign to avoid spread operator errors.
const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ children, ...props }, ref) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(
      children,
      Object.assign({}, children.props, props, {
        ref,
        className: cn(
          (children.props as any).className,
          props.className
        ),
      })
    );
  }
  return null;
});
Slot.displayName = "Slot";


const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>
   {
  asChild?: boolean;
  // FIX: Add isLoading prop to support loading state in buttons.
  isLoading?: boolean;
  // FIX: Manually add variant and size props as VariantProps is not available. This fixes errors in other components using the Button.
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <LoadingIcon className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// FIX: Removed dummy implementations from the bottom of the file.

export { Button, buttonVariants };
