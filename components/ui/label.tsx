import * as React from "react";
// import * as LabelPrimitive from "@radix-ui/react-label";
// import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// FIX: Move dummy cva implementation to the top to fix "used before declaration" error.
const cva = (base: string, config?: any) => (props?: any) => base;

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

// FIX: Replace Radix Label with a standard label, remove VariantProps, and fix types to resolve all errors.
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = "Label";

// FIX: Removed dummy implementations from the bottom of the file.

export { Label };
