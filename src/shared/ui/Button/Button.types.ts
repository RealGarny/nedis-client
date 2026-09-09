import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "./buttonVariants";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export type { ButtonProps };
