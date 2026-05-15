import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "danger" | "ghost" | "icon" | "primary" | "secondary";
type ButtonSize = "compact" | "default" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export function Button({ children, className, size = "default", type = "button", variant = "secondary", ...props }: ButtonProps) {
  return (
    <button className={cn("ui-button", `ui-button-${variant}`, `ui-button-size-${size}`, className)} type={type} {...props}>
      {children}
    </button>
  );
}
