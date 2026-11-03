import type { ReactElement, ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

/**
 * Componente de badge adaptado de ApenasGabs/ApenasTemplate
 */
export const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps): ReactElement => {
  const variantClasses: Record<string, string> = {
    default: "badge",
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
    outline: "badge-outline",
  };

  const sizeClasses: Record<string, string> = {
    xs: "badge-xs",
    sm: "badge-sm",
    md: "",
    lg: "badge-lg",
  };

  const variantClass = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`badge ${variantClass} ${sizeClass} ${className}`.trim()}>
      {children}
    </span>
  );
};
