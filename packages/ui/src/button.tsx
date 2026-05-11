import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ff-button ff-button-${variant} ff-button-${size} ${className}`.trim()}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
}
