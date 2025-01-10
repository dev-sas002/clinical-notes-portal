import type React from "react"
import { cn } from "./cn"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600",
  secondary: "border border-ink-300 bg-white text-ink-700 hover:bg-ink-100",
  ghost: "text-ink-600 hover:bg-ink-100",
  danger: "border border-danger-200 bg-white text-danger-700 hover:bg-danger-50",
}

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-50",
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...rest}
  />
)
