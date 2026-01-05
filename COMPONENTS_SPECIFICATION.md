# SAAS-SOLAR - Especificação Completa de Componentes UI

## Stack Tecnológica
- Next.js 14+ (App Router)
- TypeScript 5+
- Tailwind CSS 3.4+
- shadcn/ui
- Radix UI (base do shadcn/ui)
- React Hook Form + Zod (validação)
- Lucide React (ícones)

## Paleta de Cores Solar

```typescript
// tailwind.config.ts
const colors = {
  primary: {
    50: '#fefdf0',
    100: '#fefbe8',
    200: '#fef3c7',
    300: '#fde68a',
    400: '#fcd34d',
    500: '#f59e0b', // Principal
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  solar: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  }
}
```

---

## 1. COMPONENTES BASE (shadcn/ui)

### 1.1 Button

**Arquivo:** `/components/ui/button.tsx`

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-solar-600 text-white shadow-lg hover:bg-solar-700 hover:shadow-xl focus-visible:ring-solar-500",
        secondary: "bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:shadow-xl focus-visible:ring-gray-500",
        outline: "border-2 border-gray-300 bg-background text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500",
        destructive: "bg-red-600 text-white shadow-lg hover:bg-red-700 hover:shadow-xl focus-visible:ring-red-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
        success: "bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-xl focus-visible:ring-green-500",
        link: "text-solar-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

### 1.2 Input

**Arquivo:** `/components/ui/input.tsx`

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error && "border-red-500 focus:ring-red-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---

### 1.3 Textarea

**Arquivo:** `/components/ui/textarea.tsx`

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm transition-all duration-200",
            "placeholder:text-gray-400 resize-vertical",
            "focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
```

---

### 1.4 Select

**Arquivo:** `/components/ui/select.tsx`

```typescript
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    label?: string
    error?: string
  }
>(({ className, children, label, error, ...props }, ref) => (
  <div className="w-full space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    {error && (
      <p className="text-sm text-red-600">{error}</p>
    )}
  </div>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none",
      "focus:bg-solar-50 focus:text-solar-900",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-solar-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem }
```

---

### 1.5 Card

**Arquivo:** `/components/ui/card.tsx`

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:shadow-xl",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-bold tracking-tight text-gray-900", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

### 1.6 Dialog/Modal

**Arquivo:** `/components/ui/dialog.tsx`

```typescript
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg" | "xl" | "full"
  }
>(({ className, children, size = "lg", ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-7xl"
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]",
          "max-h-[90vh] overflow-y-auto",
          "rounded-xl border border-gray-200 bg-white shadow-2xl",
          "duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-solar-500">
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-b border-gray-200",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-gray-200",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-bold text-gray-900", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---

### 1.7 Alert

**Arquivo:** `/components/ui/alert.tsx`

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-md",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 text-gray-900",
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const icons = {
    default: Info,
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const Icon = icons[variant || "default"]

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div className="flex gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

---

### 1.8 Badge

**Arquivo:** `/components/ui/badge.tsx`

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        success: "bg-green-100 text-green-800 hover:bg-green-200",
        warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        error: "bg-red-100 text-red-800 hover:bg-red-200",
        info: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        solar: "bg-solar-100 text-solar-800 hover:bg-solar-200",
        outline: "border border-current text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  color?: string
}

function Badge({ className, variant, color, style, ...props }: BadgeProps) {
  if (color) {
    return (
      <div
        className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white", className)}
        style={{ backgroundColor: color, ...style }}
        {...props}
      />
    )
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

---

### 1.9 Toggle (iOS Style)

**Arquivo:** `/components/ui/toggle.tsx`

```typescript
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
  description?: string
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ToggleProps
>(({ className, label, description, ...props }, ref) => (
  <div className="flex items-center justify-between gap-3">
    {(label || description) && (
      <div className="flex-1">
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    )}
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1"
        )}
      />
    </SwitchPrimitives.Root>
  </div>
))
Toggle.displayName = SwitchPrimitives.Root.displayName

export { Toggle }
```

---

### 1.10 Tabs

**Arquivo:** `/components/ui/tabs.tsx`

```typescript
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-700",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
      "hover:bg-gray-200/50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-500 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---

### 1.11 Table

**Arquivo:** `/components/ui/table.tsx`

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-gray-50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-gray-900 font-medium text-white", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-gray-200 transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-semibold text-gray-900 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---

## 2. COMPONENTES ESPECÍFICOS DO SOLAR

### 2.1 Dashboard - MetricsCard

**Arquivo:** `/components/dashboard/metrics-card.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  subtitle?: string
  className?: string
  iconColor?: string
  iconBgColor?: string
}

export function MetricsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  iconColor = "text-solar-600",
  iconBgColor = "bg-solar-100",
}: MetricsCardProps) {
  return (
    <Card className={cn("hover:shadow-xl transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", iconBgColor)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>

        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center mt-2 text-sm">
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500 ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<MetricsCard
  title="Total de Leads"
  value={1234}
  icon={Users}
  trend={{ value: 12.5, label: "vs mês anterior", isPositive: true }}
  subtitle="Leads ativos este mês"
/>
*/
```

---

### 2.2 Dashboard - LeadsFunnelChart

**Arquivo:** `/components/dashboard/leads-funnel-chart.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface FunnelStage {
  name: string
  value: number
  color: string
  percentage?: number
}

interface LeadsFunnelChartProps {
  data: FunnelStage[]
  title?: string
}

export function LeadsFunnelChart({
  data,
  title = "Funil de Vendas"
}: LeadsFunnelChartProps) {
  const maxValue = Math.max(...data.map(stage => stage.value))

  // Calcular conversão entre etapas
  const dataWithConversion = data.map((stage, index) => ({
    ...stage,
    conversionRate: index > 0
      ? ((stage.value / data[index - 1].value) * 100).toFixed(1)
      : null
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-solar-600" />
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dataWithConversion.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100

            return (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {stage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage.conversionRate && (
                      <span className="text-xs text-gray-500">
                        {stage.conversionRate}% conversão
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                      {stage.value}
                    </span>
                  </div>
                </div>

                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full flex items-center px-3 text-white text-sm font-medium transition-all duration-500"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: stage.color,
                      minWidth: stage.value > 0 ? '60px' : '0px'
                    }}
                  >
                    {stage.value > 0 && `${((stage.value / data[0].value) * 100).toFixed(0)}%`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Taxa de conversão geral */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de Conversão Geral</span>
            <span className="text-lg font-bold text-solar-600">
              {((data[data.length - 1].value / data[0].value) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<LeadsFunnelChart
  data={[
    { name: "Novos Leads", value: 1000, color: "#3B82F6" },
    { name: "Qualificados", value: 750, color: "#8B5CF6" },
    { name: "Propostas", value: 400, color: "#F59E0B" },
    { name: "Negociação", value: 200, color: "#10B981" },
    { name: "Vendas", value: 120, color: "#059669" },
  ]}
/>
*/
```

---

### 2.3 Dashboard - SalesChart

**Arquivo:** `/components/dashboard/sales-chart.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface SalesDataPoint {
  period: string
  sales: number
  revenue: number
  kwpInstalled: number
}

interface SalesChartProps {
  data: SalesDataPoint[]
  title?: string
  period?: "day" | "week" | "month" | "year"
}

export function SalesChart({
  data,
  title = "Vendas no Período",
  period = "month"
}: SalesChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalKwp = data.reduce((sum, d) => sum + d.kwpInstalled, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{period === "month" ? "Mensal" : "Diário"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gráfico de Barras */}
        <div className="space-y-3 mb-6">
          {data.map((item, index) => {
            const heightPercentage = (item.revenue / maxRevenue) * 100

            return (
              <div key={index} className="flex items-end gap-3">
                <div className="w-20 text-sm text-gray-600 font-medium">
                  {item.period}
                </div>

                <div className="flex-1 relative">
                  <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                      style={{ width: `${heightPercentage}%` }}
                    >
                      {item.revenue > 0 && (
                        <span className="text-xs font-medium text-white">
                          {item.sales} vendas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -top-6 right-0 text-xs font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(item.revenue)}
                  </div>
                </div>

                <div className="w-24 text-right">
                  <span className="text-xs text-gray-500">
                    {item.kwpInstalled.toFixed(2)} kWp
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total de Vendas</p>
            <p className="text-xl font-bold text-gray-900">{totalSales}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Receita Total</p>
            <p className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">kWp Instalados</p>
            <p className="text-xl font-bold text-solar-600">
              {totalKwp.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<SalesChart
  data={[
    { period: "Jan", sales: 12, revenue: 180000, kwpInstalled: 150.5 },
    { period: "Fev", sales: 15, revenue: 225000, kwpInstalled: 187.3 },
    { period: "Mar", sales: 20, revenue: 300000, kwpInstalled: 250.8 },
  ]}
  period="month"
/>
*/
```

---

### 2.4 Dashboard - RecentLeadsTable

**Arquivo:** `/components/dashboard/recent-leads-table.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Clock, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  status: string
  statusColor: string
  potencia: string
  createdAt: Date
  hasAI: boolean
}

interface RecentLeadsTableProps {
  leads: Lead[]
  title?: string
  onLeadClick?: (lead: Lead) => void
}

export function RecentLeadsTable({
  leads,
  title = "Leads Recentes",
  onLeadClick
}: RecentLeadsTableProps) {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-solar-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Potência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => onLeadClick?.(lead)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {lead.name}
                    {lead.hasAI && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="IA Ativa" />
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{formatPhone(lead.phone)}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-solar-600">
                    {lead.potencia}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge color={lead.statusColor}>
                    {lead.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(lead.createdAt, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<RecentLeadsTable
  leads={[
    {
      id: "1",
      name: "João Silva",
      phone: "11987654321",
      email: "joao@email.com",
      status: "Qualificado",
      statusColor: "#10B981",
      potencia: "350 kWh",
      createdAt: new Date(),
      hasAI: true,
    },
  ]}
  onLeadClick={(lead) => console.log(lead)}
/>
*/
```

---

### 2.5 Kanban - KanbanBoard

**Arquivo:** `/components/kanban/kanban-board.tsx`

```typescript
"use client"

import { useState } from "react"
import { KanbanColumn } from "./kanban-column"
import { LeadCard } from "./lead-card"
import { cn } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  potencia?: string
  status_id: string
  notes?: string
  hasAI: boolean
  createdAt: Date
}

interface Status {
  id: string
  name: string
  color: string
  order: number
}

interface KanbanBoardProps {
  leads: Lead[]
  statuses: Status[]
  onLeadMove: (leadId: string, newStatusId: string) => Promise<void>
  onLeadEdit: (lead: Lead) => void
  className?: string
}

export function KanbanBoard({
  leads,
  statuses,
  onLeadMove,
  onLeadEdit,
  className,
}: KanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // Agrupar leads por status
  const leadsByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = leads.filter((lead) => lead.status_id === status.id)
    return acc
  }, {} as Record<string, Lead[]>)

  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
      {statuses
        .sort((a, b) => a.order - b.order)
        .map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            leads={leadsByStatus[status.id] || []}
            onLeadMove={onLeadMove}
            onLeadEdit={onLeadEdit}
            draggedLeadId={draggedLeadId}
            setDraggedLeadId={setDraggedLeadId}
          />
        ))}
    </div>
  )
}
```

---

### 2.6 Kanban - KanbanColumn

**Arquivo:** `/components/kanban/kanban-column.tsx`

```typescript
"use client"

import { useState } from "react"
import { LeadCard } from "./lead-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Archive } from "lucide-react"

interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  potencia?: string
  status_id: string
  notes?: string
  hasAI: boolean
  createdAt: Date
}

interface Status {
  id: string
  name: string
  color: string
}

interface KanbanColumnProps {
  status: Status
  leads: Lead[]
  onLeadMove: (leadId: string, newStatusId: string) => Promise<void>
  onLeadEdit: (lead: Lead) => void
  draggedLeadId: string | null
  setDraggedLeadId: (id: string | null) => void
}

export function KanbanColumn({
  status,
  leads,
  onLeadMove,
  onLeadEdit,
  draggedLeadId,
  setDraggedLeadId,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!draggedLeadId) return

    const draggedLead = leads.find((l) => l.id === draggedLeadId)
    if (draggedLead && draggedLead.status_id !== status.id) {
      await onLeadMove(draggedLeadId, status.id)
    }

    setDraggedLeadId(null)
  }

  return (
    <div className="flex-shrink-0 w-80">
      <div
        className={cn(
          "bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200 transition-all duration-200",
          "min-h-[80vh] max-h-[80vh] flex flex-col",
          isDragOver && "bg-solar-50 border-solar-600 border-2 border-dashed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: status.color }}
            />
            <h3 className="font-semibold text-gray-900 text-sm">
              {status.name}
            </h3>
            <Badge variant="default" className="bg-gray-100 text-gray-700 font-medium">
              {leads.length}
            </Badge>
          </div>
        </div>

        {/* Cards Container */}
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={onLeadEdit}
              isDragging={draggedLeadId === lead.id}
              onDragStart={() => setDraggedLeadId(lead.id)}
              onDragEnd={() => setDraggedLeadId(null)}
            />
          ))}

          {/* Empty State */}
          {leads.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Archive className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium">Nenhum contato</p>
              <p className="text-xs mt-1">Arraste contatos para cá</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Estilos CSS globais necessários (adicionar em globals.css):
/*
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
*/
```

---

### 2.7 Kanban - LeadCard

**Arquivo:** `/components/kanban/lead-card.tsx`

```typescript
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Zap, Calendar, Edit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  potencia?: string
  status_id: string
  notes?: string
  hasAI: boolean
  createdAt: Date
}

interface LeadCardProps {
  lead: Lead
  onEdit: (lead: Lead) => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}

export function LeadCard({
  lead,
  onEdit,
  isDragging,
  onDragStart,
  onDragEnd,
}: LeadCardProps) {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "p-3 cursor-move transition-all duration-200 hover:shadow-md hover:-translate-y-1",
        isDragging && "opacity-50 rotate-2"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
          {lead.name}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {lead.hasAI && (
            <div
              className="w-2 h-2 bg-green-500 rounded-full"
              title="IA Ativa"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(lead)
            }}
            title="Editar contato"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="truncate">{formatPhone(lead.phone)}</span>
        </div>

        {lead.potencia && (
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="truncate font-medium text-gray-700">
              {lead.potencia}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-gray-500">
              {formatDistanceToNow(lead.createdAt, {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
          {lead.hasAI && (
            <Badge variant="success" className="text-xs">
              IA
            </Badge>
          )}
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          <p className="line-clamp-2 leading-relaxed">{lead.notes}</p>
        </div>
      )}
    </Card>
  )
}

// Estilos CSS necessários (adicionar em globals.css):
/*
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
*/
```

---

### 2.8 Systems - SystemCard

**Arquivo:** `/components/systems/system-card.tsx`

```typescript
"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Sun, TrendingUp, DollarSign, Home, Building, Tractor, TrendingDown } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SystemCardProps {
  system: {
    id: string
    name: string
    type: "RESIDENCIAL" | "COMERCIAL" | "RURAL" | "INVESTIMENTO"
    power: number // kWp
    monthlyGeneration: number // kWh
    monthlySavings: number // R$
    roiMonths: number
    imageUrl?: string
    panels: number
    inverter: string
    area: number // m²
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
}

const typeIcons = {
  RESIDENCIAL: Home,
  COMERCIAL: Building,
  RURAL: Tractor,
  INVESTIMENTO: TrendingUp,
}

const typeColors = {
  RESIDENCIAL: "bg-blue-100 text-blue-800",
  COMERCIAL: "bg-purple-100 text-purple-800",
  RURAL: "bg-green-100 text-green-800",
  INVESTIMENTO: "bg-yellow-100 text-yellow-800",
}

export function SystemCard({
  system,
  onEdit,
  onDelete,
  onSelect,
}: SystemCardProps) {
  const TypeIcon = typeIcons[system.type]

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-solar-400 to-solar-600 overflow-hidden">
        {system.imageUrl ? (
          <Image
            src={system.imageUrl}
            alt={system.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sun className="h-24 w-24 text-white opacity-50" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={cn("gap-1", typeColors[system.type])}>
            <TypeIcon className="h-3 w-3" />
            {system.type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardHeader>
        <h3 className="text-xl font-bold text-gray-900 truncate">
          {system.name}
        </h3>
        <p className="text-sm text-gray-500">
          {system.panels} painéis • {system.area}m² • {system.inverter}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Power */}
        <div className="flex items-center justify-between p-3 bg-solar-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-solar-600" />
            <span className="text-sm text-gray-600">Potência</span>
          </div>
          <span className="text-lg font-bold text-solar-600">
            {system.power} kWp
          </span>
        </div>

        {/* Generation */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Geração Mensal</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {system.monthlyGeneration} kWh
          </span>
        </div>

        {/* Savings */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Economia Mensal</span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(system.monthlySavings)}
          </span>
        </div>

        {/* ROI */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Retorno</span>
          </div>
          <span className="text-lg font-bold text-purple-600">
            {Math.floor(system.roiMonths / 12)} anos
          </span>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="gap-2 border-t border-gray-100 pt-4">
        {onSelect && (
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onSelect(system.id)}
          >
            Selecionar
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(system.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(system.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Exemplo de uso:
/*
<SystemCard
  system={{
    id: "1",
    name: "Sistema Residencial 5kWp",
    type: "RESIDENCIAL",
    power: 5.4,
    monthlyGeneration: 675,
    monthlySavings: 450,
    roiMonths: 60,
    panels: 12,
    inverter: "Growatt 5kW",
    area: 30,
    imageUrl: "/systems/residencial-1.jpg",
  }}
  onEdit={(id) => console.log("Edit", id)}
  onDelete={(id) => console.log("Delete", id)}
  onSelect={(id) => console.log("Select", id)}
/>
*/
```

---

## 3. CONTINUAÇÃO DOS COMPONENTES (próxima parte)

Devido ao tamanho extenso da especificação, continuarei no próximo arquivo com:

- SystemForm
- ImageUploader
- SolarCalculator
- EconomyResult
- ROIChart
- WhatsAppStatus
- MessageList
- QuickReply
- Sidebar
- MobileNav
- UserMenu
- Forms (CompanyForm, LeadForm, ContactForm, ConfigForm)

Deseja que eu continue com a segunda parte da especificação?
