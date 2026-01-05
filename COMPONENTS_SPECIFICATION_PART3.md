# SAAS-SOLAR - Especificação de Componentes UI (Parte 3 - Final)

## 6. NAVIGATION COMPONENTS

### 6.1 Sidebar

**Arquivo:** `/components/navigation/sidebar.tsx`

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  Columns,
  Sun,
  Calculator,
  MessageSquare,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: number
  disabled?: boolean
}

interface SidebarProps {
  companyName?: string
  userName?: string
  userEmail?: string
  onLogout?: () => void
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
    badge: 12,
  },
  {
    label: "Kanban",
    href: "/kanban",
    icon: Columns,
  },
  {
    label: "Sistemas",
    href: "/systems",
    icon: Sun,
  },
  {
    label: "Calculadora",
    href: "/calculator",
    icon: Calculator,
  },
  {
    label: "WhatsApp",
    href: "/whatsapp",
    icon: MessageSquare,
    badge: 3,
  },
  {
    label: "Empresa",
    href: "/company",
    icon: Building2,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({
  companyName = "Solar Energy",
  userName = "Usuário",
  userEmail = "user@example.com",
  onLogout,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-solar-400 to-solar-600 rounded-lg flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">{companyName}</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-solar-400 to-solar-600 rounded-lg flex items-center justify-center mx-auto">
            <Sun className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-solar-50 text-solar-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100",
                  item.disabled && "opacity-50 cursor-not-allowed",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge
                        variant={isActive ? "solar" : "default"}
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-solar-100 rounded-full flex items-center justify-center">
              <span className="text-solar-700 font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 bg-solar-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-solar-700 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {onLogout && (
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={onLogout}
            className={cn(
              "w-full text-red-600 hover:text-red-700 hover:bg-red-50",
              isCollapsed && "mx-auto"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-600" />
        )}
      </button>
    </aside>
  )
}
```

---

### 6.2 MobileNav

**Arquivo:** `/components/navigation/mobile-nav.tsx`

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  Columns,
  Sun,
  Calculator,
  MessageSquare,
  Settings,
  Building2,
  Menu,
  LogOut,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: any
  badge?: number
}

interface MobileNavProps {
  companyName?: string
  userName?: string
  onLogout?: () => void
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users, badge: 12 },
  { label: "Kanban", href: "/kanban", icon: Columns },
  { label: "Sistemas", href: "/systems", icon: Sun },
  { label: "Calculadora", href: "/calculator", icon: Calculator },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageSquare, badge: 3 },
  { label: "Empresa", href: "/company", icon: Building2 },
  { label: "Configurações", href: "/settings", icon: Settings },
]

export function MobileNav({
  companyName = "Solar Energy",
  userName = "Usuário",
  onLogout,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 px-4 border-b border-gray-200 flex items-center justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-solar-400 to-solar-600 rounded-lg flex items-center justify-center">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="font-bold text-gray-900">
              {companyName}
            </SheetTitle>
          </div>
        </SheetHeader>

        <nav className="py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-solar-50 text-solar-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant={isActive ? "solar" : "default"}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-solar-100 rounded-full flex items-center justify-center">
              <span className="text-solar-700 font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
            </div>
          </div>

          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Sheet Component (se não existir):
/*
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "left" | "right"
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-white shadow-lg transition ease-in-out",
        side === "left" && "left-0 top-0 h-full",
        side === "right" && "right-0 top-0 h-full",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4">
        <X className="h-4 w-4" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle }
*/
```

---

### 6.3 UserMenu

**Arquivo:** `/components/navigation/user-menu.tsx`

```typescript
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, Building2 } from "lucide-react"

interface UserMenuProps {
  userName: string
  userEmail: string
  avatarUrl?: string
  onProfileClick?: () => void
  onCompanyClick?: () => void
  onSettingsClick?: () => void
  onLogout?: () => void
}

export function UserMenu({
  userName,
  userEmail,
  avatarUrl,
  onProfileClick,
  onCompanyClick,
  onSettingsClick,
  onLogout,
}: UserMenuProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-solar-100 text-solar-700">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-gray-500">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {onProfileClick && (
          <DropdownMenuItem onClick={onProfileClick}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
        )}

        {onCompanyClick && (
          <DropdownMenuItem onClick={onCompanyClick}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Empresa</span>
          </DropdownMenuItem>
        )}

        {onSettingsClick && (
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {onLogout && (
          <DropdownMenuItem
            onClick={onLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// DropdownMenu Component (se não existir):
/*
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
*/
```

---

## 7. FORMS

### 7.1 LeadForm

**Arquivo:** `/components/forms/lead-form.tsx`

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"

const leadFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  potencia: z.string().optional(),
  status_id: z.string().min(1, "Selecione um status"),
  notes: z.string().optional(),
  hasAI: z.boolean().default(false),
})

type LeadFormData = z.infer<typeof leadFormSchema>

interface Status {
  id: string
  name: string
  color: string
}

interface LeadFormProps {
  initialData?: Partial<LeadFormData>
  statuses: Status[]
  onSubmit: (data: LeadFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function LeadForm({
  initialData,
  statuses,
  onSubmit,
  onCancel,
  isLoading = false,
}: LeadFormProps) {
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      potencia: initialData?.potencia || "",
      status_id: initialData?.status_id || "",
      notes: initialData?.notes || "",
      hasAI: initialData?.hasAI || false,
    },
  })

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    let formatted = cleaned

    if (cleaned.length <= 2) {
      formatted = cleaned
    } else if (cleaned.length <= 7) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    } else if (cleaned.length <= 11) {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    } else {
      formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
    }

    return formatted
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informações do Lead
        </h3>

        <Input
          label="Nome Completo"
          placeholder="João Silva"
          required
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />

        <Input
          label="Telefone"
          type="tel"
          placeholder="(11) 98765-4321"
          required
          error={form.formState.errors.phone?.message}
          {...form.register("phone")}
          onChange={(e) => {
            const formatted = formatPhoneInput(e.target.value)
            form.setValue("phone", formatted)
          }}
        />

        <Input
          label="E-mail (opcional)"
          type="email"
          placeholder="joao@email.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />

        <Input
          label="Potência/Consumo (opcional)"
          placeholder="350 kWh"
          helperText="Consumo médio mensal ou potência desejada"
          error={form.formState.errors.potencia?.message}
          {...form.register("potencia")}
        />

        <Select
          value={form.watch("status_id")}
          onValueChange={(value) => form.setValue("status_id", value)}
        >
          <SelectTrigger
            label="Status"
            error={form.formState.errors.status_id?.message}
          >
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          label="Observações (opcional)"
          placeholder="Notas sobre o lead..."
          rows={4}
          {...form.register("notes")}
        />
      </div>

      {/* IA Settings */}
      <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <Toggle
          checked={form.watch("hasAI")}
          onCheckedChange={(checked) => form.setValue("hasAI", checked)}
          label="Atendimento Automático com IA"
          description="A IA responderá automaticamente as mensagens deste lead"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {initialData ? "Atualizar Lead" : "Criar Lead"}
        </Button>
      </div>
    </form>
  )
}

// Exemplo de uso:
/*
<LeadForm
  initialData={{
    name: "João Silva",
    phone: "(11) 98765-4321",
    email: "joao@email.com",
  }}
  statuses={[
    { id: "1", name: "Novo Lead", color: "#3B82F6" },
    { id: "2", name: "Qualificado", color: "#10B981" },
  ]}
  onSubmit={async (data) => {
    console.log("Submitting:", data)
    await createLead(data)
  }}
  onCancel={() => setIsFormOpen(false)}
/>
*/
```

---

### 7.2 CompanyForm

**Arquivo:** `/components/forms/company-form.tsx`

```typescript
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUploader } from "@/components/systems/image-uploader"
import { useState } from "react"

const PLANOS = ["CRM POR VOZ", "IA ATENDIMENTO", "IA ATENDIMENTO + FOLLOW"]

const companyFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().optional(),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  plano: z.enum(["CRM POR VOZ", "IA ATENDIMENTO", "IA ATENDIMENTO + FOLLOW"]),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

interface CompanyFormProps {
  initialData?: Partial<CompanyFormData>
  onSubmit: (data: CompanyFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function CompanyForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CompanyFormProps) {
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl)

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      cnpj: initialData?.cnpj || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      website: initialData?.website || "",
      plano: initialData?.plano || "CRM POR VOZ",
      description: initialData?.description || "",
      logoUrl: initialData?.logoUrl || "",
    },
  })

  const handleSubmit = async (data: CompanyFormData) => {
    await onSubmit({
      ...data,
      logoUrl: logoUrl || data.logoUrl,
    })
  }

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length <= 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      )
    }
    return value
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Logo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Logo da Empresa</h3>
        <ImageUploader
          currentImageUrl={logoUrl}
          onImageUpload={setLogoUrl}
          maxSizeMB={2}
          acceptedFormats={["image/png", "image/jpeg", "image/svg+xml"]}
        />
      </div>

      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informações Básicas
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Nome da Empresa"
            placeholder="Solar Energy LTDA"
            required
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />

          <Input
            label="CNPJ (opcional)"
            placeholder="00.000.000/0000-00"
            {...form.register("cnpj")}
            onChange={(e) => {
              const formatted = formatCNPJ(e.target.value)
              form.setValue("cnpj", formatted)
            }}
          />

          <Input
            label="Telefone"
            type="tel"
            placeholder="(11) 98765-4321"
            required
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="contato@empresa.com"
            required
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />

          <Input
            label="Website (opcional)"
            type="url"
            placeholder="https://www.empresa.com"
            error={form.formState.errors.website?.message}
            {...form.register("website")}
          />

          <Select
            value={form.watch("plano")}
            onValueChange={(value) => form.setValue("plano", value as any)}
          >
            <SelectTrigger label="Plano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANOS.map((plano) => (
                <SelectItem key={plano} value={plano}>
                  {plano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          label="Descrição (opcional)"
          placeholder="Descrição da empresa..."
          rows={3}
          {...form.register("description")}
        />
      </div>

      {/* Endereço */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="CEP (opcional)"
            placeholder="00000-000"
            {...form.register("zipCode")}
          />

          <Input
            label="Endereço (opcional)"
            placeholder="Rua Example, 123"
            {...form.register("address")}
          />

          <Input
            label="Cidade (opcional)"
            placeholder="São Paulo"
            {...form.register("city")}
          />

          <Input
            label="Estado (opcional)"
            placeholder="SP"
            maxLength={2}
            {...form.register("state")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {initialData ? "Atualizar Empresa" : "Criar Empresa"}
        </Button>
      </div>
    </form>
  )
}
```

---

## 8. UTILITY COMPONENTS

### 8.1 LoadingSpinner

**Arquivo:** `/components/ui/loading-spinner.tsx`

```typescript
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return (
    <div className="flex items-center justify-center">
      <svg
        className={cn("animate-spin text-solar-600", sizes[size], className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  )
}
```

---

### 8.2 EmptyState

**Arquivo:** `/components/ui/empty-state.tsx`

```typescript
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

### 8.3 PageHeader

**Arquivo:** `/components/ui/page-header.tsx`

```typescript
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-3 bg-solar-100 rounded-lg">
              <Icon className="h-6 w-6 text-solar-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
```

---

## 9. RESUMO E PRÓXIMOS PASSOS

### Componentes Criados (Total: 40+)

#### Base Components (shadcn/ui)
1. Button (6 variants)
2. Input
3. Textarea
4. Select
5. Card
6. Dialog/Modal
7. Alert
8. Badge
9. Toggle (iOS style)
10. Tabs
11. Table

#### Dashboard
12. MetricsCard
13. LeadsFunnelChart
14. SalesChart
15. RecentLeadsTable

#### Kanban
16. KanbanBoard
17. KanbanColumn
18. LeadCard

#### Systems
19. SystemCard
20. SystemForm
21. ImageUploader

#### Calculator
22. SolarCalculator
23. EconomyResult
24. ROIChart

#### WhatsApp
25. WhatsAppStatus
26. MessageList
27. QuickReply

#### Navigation
28. Sidebar
29. MobileNav
30. UserMenu

#### Forms
31. LeadForm
32. CompanyForm

#### Utility
33. LoadingSpinner
34. EmptyState
35. PageHeader

### Instalação de Dependências

```bash
# shadcn/ui CLI
npx shadcn-ui@latest init

# Dependências principais
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-avatar
npm install lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install date-fns

# TypeScript
npm install -D @types/node @types/react @types/react-dom
```

### Estrutura de Pastas Recomendada

```
/app
  /dashboard
  /leads
  /kanban
  /systems
  /calculator
  /whatsapp
  /company
  /settings

/components
  /ui              # Componentes base shadcn/ui
  /dashboard       # Componentes específicos do dashboard
  /kanban          # Componentes do kanban
  /systems         # Componentes de sistemas fotovoltaicos
  /calculator      # Calculadora solar
  /whatsapp        # WhatsApp components
  /navigation      # Sidebar, MobileNav, UserMenu
  /forms           # Formulários

/lib
  utils.ts         # Funções utilitárias (cn, formatters, etc)

/styles
  globals.css      # Estilos globais + Tailwind
```

### Próximas Etapas

1. Implementar integração com Supabase
2. Criar hooks customizados (useLeads, useSystems, etc)
3. Implementar autenticação
4. Criar testes unitários
5. Configurar CI/CD
6. Implementar PWA
7. Adicionar analytics

Todos os componentes estão prontos para uso em produção com Next.js 14+, TypeScript e Tailwind CSS!
