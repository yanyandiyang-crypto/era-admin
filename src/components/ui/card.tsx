import * as React from "react"

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  pulse?: boolean;
  pulseClass?: string;
  compact?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", pulse = false, pulseClass = "ring-2 ring-red-300/60", compact = false, ...props }, ref) => (
    <div
      ref={ref}
      className={`border bg-card text-card-foreground shadow-sm ${compact ? "rounded-md" : "rounded-lg"} ${pulse ? `animate-pulse ${pulseClass}` : ""} ${className}`}
      {...props}
    />
  )
)
Card.displayName = "Card"

type HeaderProps = React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }

const CardHeader = React.forwardRef<
  HTMLDivElement,
  HeaderProps
>(({ className = "", compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col ${compact ? "space-y-0.5 p-2" : "space-y-1.5 p-6"} ${className}`}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

type TitleProps = React.HTMLAttributes<HTMLHeadingElement> & { compact?: boolean }

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  TitleProps
>(({ className = "", compact = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={`${compact ? "text-sm font-semibold" : "text-2xl font-semibold leading-none tracking-tight"} ${className}`}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

type DescriptionProps = React.HTMLAttributes<HTMLParagraphElement> & { compact?: boolean }

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  DescriptionProps
>(({ className = "", compact = false, ...props }, ref) => (
  <p
    ref={ref}
    className={`${compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"} ${className}`}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

type ContentProps = React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }

const CardContent = React.forwardRef<
  HTMLDivElement,
  ContentProps
>(({ className = "", compact = false, ...props }, ref) => (
  <div ref={ref} className={`${compact ? "p-2 pt-0" : "p-6 pt-0"} ${className}`} {...props} />
))
CardContent.displayName = "CardContent"

type FooterProps = React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }

const CardFooter = React.forwardRef<
  HTMLDivElement,
  FooterProps
>(({ className = "", compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center ${compact ? "p-2 pt-0" : "p-6 pt-0"} ${className}`}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
