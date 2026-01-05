# SAAS-SOLAR - Especificação de Componentes UI (Parte 2)

## 3. COMPONENTES DE SISTEMAS FOTOVOLTAICOS (continuação)

### 3.1 SystemForm

**Arquivo:** `/components/systems/system-form.tsx`

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
import { ImageUploader } from "./image-uploader"
import { useState } from "react"

const systemFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  type: z.enum(["RESIDENCIAL", "COMERCIAL", "RURAL", "INVESTIMENTO"]),
  power: z.number().min(0.1, "Potência deve ser maior que 0"),
  panels: z.number().min(1, "Deve ter ao menos 1 painel"),
  inverter: z.string().min(3, "Informe o modelo do inversor"),
  area: z.number().min(1, "Área deve ser maior que 0"),
  monthlyGeneration: z.number().min(0, "Geração deve ser positiva"),
  monthlySavings: z.number().min(0, "Economia deve ser positiva"),
  roiMonths: z.number().min(1, "ROI deve ser maior que 0"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
})

type SystemFormData = z.infer<typeof systemFormSchema>

interface SystemFormProps {
  initialData?: Partial<SystemFormData>
  onSubmit: (data: SystemFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function SystemForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SystemFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl)

  const form = useForm<SystemFormData>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "RESIDENCIAL",
      power: initialData?.power || 0,
      panels: initialData?.panels || 0,
      inverter: initialData?.inverter || "",
      area: initialData?.area || 0,
      monthlyGeneration: initialData?.monthlyGeneration || 0,
      monthlySavings: initialData?.monthlySavings || 0,
      roiMonths: initialData?.roiMonths || 0,
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
    },
  })

  const handleSubmit = async (data: SystemFormData) => {
    await onSubmit({
      ...data,
      imageUrl: imageUrl || data.imageUrl,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informações Básicas
        </h3>

        <Input
          label="Nome do Sistema"
          placeholder="Ex: Sistema Residencial 5kWp"
          required
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />

        <Select
          value={form.watch("type")}
          onValueChange={(value) => form.setValue("type", value as any)}
        >
          <SelectTrigger label="Tipo de Sistema" error={form.formState.errors.type?.message}>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
            <SelectItem value="COMERCIAL">Comercial</SelectItem>
            <SelectItem value="RURAL">Rural</SelectItem>
            <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          label="Descrição (opcional)"
          placeholder="Descrição detalhada do sistema"
          rows={3}
          {...form.register("description")}
        />
      </div>

      {/* Especificações Técnicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Especificações Técnicas
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Potência (kWp)"
            type="number"
            step="0.1"
            placeholder="5.4"
            required
            error={form.formState.errors.power?.message}
            {...form.register("power", { valueAsNumber: true })}
          />

          <Input
            label="Número de Painéis"
            type="number"
            placeholder="12"
            required
            error={form.formState.errors.panels?.message}
            {...form.register("panels", { valueAsNumber: true })}
          />

          <Input
            label="Inversor"
            placeholder="Ex: Growatt 5kW"
            required
            error={form.formState.errors.inverter?.message}
            {...form.register("inverter")}
          />

          <Input
            label="Área (m²)"
            type="number"
            step="0.1"
            placeholder="30"
            required
            error={form.formState.errors.area?.message}
            {...form.register("area", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Dados Financeiros */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Dados Financeiros
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Geração Mensal (kWh)"
            type="number"
            placeholder="675"
            required
            error={form.formState.errors.monthlyGeneration?.message}
            {...form.register("monthlyGeneration", { valueAsNumber: true })}
          />

          <Input
            label="Economia Mensal (R$)"
            type="number"
            step="0.01"
            placeholder="450.00"
            required
            error={form.formState.errors.monthlySavings?.message}
            {...form.register("monthlySavings", { valueAsNumber: true })}
          />

          <Input
            label="ROI (meses)"
            type="number"
            placeholder="60"
            required
            helperText="Tempo de retorno do investimento"
            error={form.formState.errors.roiMonths?.message}
            {...form.register("roiMonths", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Upload de Imagem */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Imagem do Sistema
        </h3>

        <ImageUploader
          currentImageUrl={imageUrl}
          onImageUpload={setImageUrl}
          maxSizeMB={5}
          acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
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
          {initialData ? "Atualizar Sistema" : "Criar Sistema"}
        </Button>
      </div>
    </form>
  )
}

// Exemplo de uso:
/*
<SystemForm
  initialData={{
    name: "Sistema Residencial 5kWp",
    type: "RESIDENCIAL",
    power: 5.4,
  }}
  onSubmit={async (data) => {
    console.log("Submitting:", data)
    await createSystem(data)
  }}
  onCancel={() => setIsFormOpen(false)}
  isLoading={false}
/>
*/
```

---

### 3.2 ImageUploader

**Arquivo:** `/components/systems/image-uploader.tsx`

```typescript
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  currentImageUrl?: string
  onImageUpload: (url: string) => void
  maxSizeMB?: number
  acceptedFormats?: string[]
  className?: string
}

export function ImageUploader({
  currentImageUrl,
  onImageUpload,
  maxSizeMB = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  className,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validar tipo
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato não suportado. Use: ${acceptedFormats.join(", ")}`)
      return
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`)
      return
    }

    try {
      setIsUploading(true)

      // Criar preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload para servidor/storage (exemplo com FormData)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erro ao fazer upload")
      }

      const { url } = await response.json()
      onImageUpload(url)
    } catch (err) {
      setError("Erro ao fazer upload da imagem")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      // Criar um novo FileList e atribuir ao input
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files

      // Disparar evento de change
      const event = new Event("change", { bubbles: true })
      fileInputRef.current.dispatchEvent(event)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Preview ou Upload Area */}
      {previewUrl ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="relative aspect-video w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 mb-4 bg-solar-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-solar-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Clique para fazer upload ou arraste a imagem
            </p>
            <p className="text-xs text-gray-500">
              {acceptedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ")} (máx. {maxSizeMB}MB)
            </p>
            {isUploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-solar-600"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button (alternativo) */}
      {!previewUrl && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Imagem
        </Button>
      )}
    </div>
  )
}

// Exemplo de uso:
/*
<ImageUploader
  currentImageUrl="/systems/example.jpg"
  onImageUpload={(url) => console.log("Image uploaded:", url)}
  maxSizeMB={5}
  acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
/>
*/
```

---

## 4. CALCULADORA SOLAR

### 4.1 SolarCalculator

**Arquivo:** `/components/calculator/solar-calculator.tsx`

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { EconomyResult } from "./economy-result"
import { ROIChart } from "./roi-chart"
import { Calculator, Zap } from "lucide-react"

interface CalculationResult {
  systemPower: number // kWp
  monthlyGeneration: number // kWh
  monthlySavings: number // R$
  annualSavings: number // R$
  systemCost: number // R$
  roiMonths: number
  co2Reduction: number // kg/ano
  treesEquivalent: number
}

export function SolarCalculator() {
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(0)
  const [electricityRate, setElectricityRate] = useState<number>(0.85)
  const [systemType, setSystemType] = useState<string>("RESIDENCIAL")
  const [result, setResult] = useState<CalculationResult | null>(null)

  const calculateSystem = () => {
    // Média de geração por kWp no Brasil: 125 kWh/mês
    const generationPerKwp = 125

    // Calcular potência necessária
    const systemPower = monthlyConsumption / generationPerKwp

    // Geração mensal (90% de offset)
    const monthlyGeneration = monthlyConsumption * 0.9

    // Economia mensal
    const monthlySavings = monthlyGeneration * electricityRate

    // Economia anual
    const annualSavings = monthlySavings * 12

    // Custo do sistema (média R$ 4.500/kWp)
    const costPerKwp = systemType === "RESIDENCIAL" ? 4500 : 4200
    const systemCost = systemPower * costPerKwp

    // ROI em meses
    const roiMonths = Math.ceil(systemCost / monthlySavings)

    // Redução de CO2 (0.5 kg por kWh)
    const co2Reduction = monthlyGeneration * 12 * 0.5

    // Equivalente em árvores (1 árvore absorve ~20kg CO2/ano)
    const treesEquivalent = Math.ceil(co2Reduction / 20)

    setResult({
      systemPower: Math.ceil(systemPower * 10) / 10,
      monthlyGeneration: Math.round(monthlyGeneration),
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      systemCost: Math.round(systemCost),
      roiMonths,
      co2Reduction: Math.round(co2Reduction),
      treesEquivalent,
    })
  }

  const handleCalculate = () => {
    if (monthlyConsumption > 0 && electricityRate > 0) {
      calculateSystem()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-solar-600" />
            Calculadora Solar
          </CardTitle>
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Consumo Mensal (kWh)"
              type="number"
              placeholder="350"
              value={monthlyConsumption || ""}
              onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
              leftIcon={<Zap className="h-4 w-4" />}
              helperText="Consulte sua conta de energia"
            />

            <Input
              label="Tarifa de Energia (R$/kWh)"
              type="number"
              step="0.01"
              placeholder="0.85"
              value={electricityRate || ""}
              onChange={(e) => setElectricityRate(Number(e.target.value))}
              helperText="Valor médio em sua região"
            />

            <Select value={systemType} onValueChange={setSystemType}>
              <SelectTrigger label="Tipo de Sistema">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                <SelectItem value="COMERCIAL">Comercial</SelectItem>
                <SelectItem value="RURAL">Rural</SelectItem>
                <SelectItem value="INVESTIMENTO">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculate Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalculate}
            disabled={!monthlyConsumption || !electricityRate}
            className="w-full"
          >
            <Calculator className="h-5 w-5 mr-2" />
            Calcular Sistema Ideal
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <EconomyResult result={result} />
          <ROIChart result={result} />
        </>
      )}
    </div>
  )
}
```

---

### 4.2 EconomyResult

**Arquivo:** `/components/calculator/economy-result.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sun,
  DollarSign,
  TrendingUp,
  Calendar,
  Leaf,
  TreePine,
} from "lucide-react"

interface CalculationResult {
  systemPower: number
  monthlyGeneration: number
  monthlySavings: number
  annualSavings: number
  systemCost: number
  roiMonths: number
  co2Reduction: number
  treesEquivalent: number
}

interface EconomyResultProps {
  result: CalculationResult
}

export function EconomyResult({ result }: EconomyResultProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const metrics = [
    {
      icon: Sun,
      label: "Potência do Sistema",
      value: `${result.systemPower} kWp`,
      color: "text-solar-600",
      bgColor: "bg-solar-100",
    },
    {
      icon: Zap,
      label: "Geração Mensal",
      value: `${result.monthlyGeneration} kWh`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: DollarSign,
      label: "Economia Mensal",
      value: formatCurrency(result.monthlySavings),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: TrendingUp,
      label: "Economia Anual",
      value: formatCurrency(result.annualSavings),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: DollarSign,
      label: "Investimento Total",
      value: formatCurrency(result.systemCost),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Calendar,
      label: "Retorno do Investimento",
      value: `${Math.floor(result.roiMonths / 12)} anos e ${result.roiMonths % 12} meses`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: Leaf,
      label: "Redução de CO₂",
      value: `${result.co2Reduction} kg/ano`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      icon: TreePine,
      label: "Equivalente em Árvores",
      value: `${result.treesEquivalent} árvores`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Resultado da Simulação</CardTitle>
          <Badge variant="success" className="text-sm">
            Sistema Viável
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {metric.value}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Savings in 25 years */}
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Economia Total em 25 anos
              </p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(result.annualSavings * 25)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Lucro Líquido</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(result.annualSavings * 25 - result.systemCost)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### 4.3 ROIChart

**Arquivo:** `/components/calculator/roi-chart.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface CalculationResult {
  systemCost: number
  annualSavings: number
  roiMonths: number
}

interface ROIChartProps {
  result: CalculationResult
}

export function ROIChart({ result }: ROIChartProps) {
  // Calcular dados para 25 anos
  const years = Array.from({ length: 26 }, (_, i) => i)
  const data = years.map((year) => {
    const totalSavings = result.annualSavings * year
    const netProfit = totalSavings - result.systemCost
    return {
      year,
      totalSavings,
      systemCost: result.systemCost,
      netProfit,
    }
  })

  const maxValue = Math.max(...data.map((d) => Math.max(d.totalSavings, d.systemCost)))
  const breakEvenYear = Math.ceil(result.roiMonths / 12)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Retorno do Investimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="space-y-2 mb-6">
          {data
            .filter((_, index) => index % 5 === 0) // Mostrar a cada 5 anos
            .map((item) => {
              const savingsWidth = (item.totalSavings / maxValue) * 100
              const costWidth = (item.systemCost / maxValue) * 100
              const isBreakEven = item.year === breakEvenYear

              return (
                <div key={item.year} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 w-16">
                      Ano {item.year}
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(item.totalSavings)}
                      </span>
                      {item.netProfit > 0 && (
                        <span className="text-blue-600 font-semibold">
                          Lucro: {formatCurrency(item.netProfit)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Custo do sistema (linha vermelha de referência) */}
                    {item.year > 0 && (
                      <div
                        className="absolute h-full border-r-2 border-red-500 border-dashed"
                        style={{ left: `${costWidth}%` }}
                      />
                    )}

                    {/* Economia acumulada */}
                    <div
                      className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 flex items-center justify-end px-3"
                      style={{ width: `${savingsWidth}%` }}
                    >
                      {item.totalSavings > 0 && (
                        <span className="text-xs font-medium text-white">
                          {((item.totalSavings / item.systemCost) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {/* Indicador de Break-Even */}
                    {isBreakEven && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-lg">
                          BREAK-EVEN
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
            <span className="text-sm text-gray-600">Economia Acumulada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500 border-dashed rounded"></div>
            <span className="text-sm text-gray-600">Investimento</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-gray-600 mb-1">Break-Even</p>
            <p className="text-xl font-bold text-yellow-600">
              {breakEvenYear} anos
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-1">Lucro em 25 anos</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(result.annualSavings * 25 - result.systemCost)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">ROI</p>
            <p className="text-xl font-bold text-blue-600">
              {((result.annualSavings * 25 / result.systemCost) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 5. WHATSAPP COMPONENTS

### 5.1 WhatsAppStatus

**Arquivo:** `/components/whatsapp/whatsapp-status.tsx`

```typescript
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface WhatsAppStatusProps {
  isConnected: boolean
  qrCode?: string
  phoneNumber?: string
  onReconnect?: () => void
  onDisconnect?: () => void
  className?: string
}

export function WhatsAppStatus({
  isConnected,
  qrCode,
  phoneNumber,
  onReconnect,
  onDisconnect,
  className,
}: WhatsAppStatusProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-3 rounded-full",
                isConnected ? "bg-green-100" : "bg-red-100"
              )}
            >
              <MessageSquare
                className={cn(
                  "h-6 w-6",
                  isConnected ? "text-green-600" : "text-red-600"
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                WhatsApp Business
              </h3>
              <p className="text-sm text-gray-500">
                {isConnected ? phoneNumber : "Desconectado"}
              </p>
            </div>
          </div>

          <Badge
            variant={isConnected ? "success" : "error"}
            className="flex items-center gap-1"
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>

        {/* QR Code */}
        {!isConnected && qrCode && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Escaneie o QR Code com seu WhatsApp
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isConnected ? (
            <Button
              variant="destructive"
              onClick={onDisconnect}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onReconnect}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Conectar
            </Button>
          )}
        </div>

        {/* Stats */}
        {isConnected && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-xs text-gray-500">Conversas Ativas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">156</p>
              <p className="text-xs text-gray-500">Mensagens Hoje</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">98%</p>
              <p className="text-xs text-gray-500">Taxa de Resposta</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<WhatsAppStatus
  isConnected={true}
  phoneNumber="+55 11 98765-4321"
  onReconnect={() => console.log("Reconnect")}
  onDisconnect={() => console.log("Disconnect")}
/>
*/
```

---

### 5.2 MessageList

**Arquivo:** `/components/whatsapp/message-list.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageSquare, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  contactName: string
  contactPhone: string
  avatarUrl?: string
  lastMessage: string
  timestamp: Date
  unreadCount: number
  hasAI: boolean
  isOnline: boolean
}

interface MessageListProps {
  messages: Message[]
  onMessageClick?: (message: Message) => void
  className?: string
}

export function MessageList({
  messages,
  onMessageClick,
  className,
}: MessageListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-solar-600" />
          Mensagens Recentes
          <Badge variant="default" className="ml-auto">
            {messages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                  message.unreadCount > 0 && "bg-blue-50"
                )}
                onClick={() => onMessageClick?.(message)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={message.avatarUrl} />
                      <AvatarFallback className="bg-solar-100 text-solar-700">
                        {getInitials(message.contactName)}
                      </AvatarFallback>
                    </Avatar>
                    {message.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {message.contactName}
                        </h4>
                        {message.hasAI && (
                          <Bot className="h-3 w-3 text-green-600" title="IA Ativa" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(message.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">
                      {message.lastMessage}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {message.contactPhone}
                      </span>
                      {message.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="bg-blue-600 text-white text-xs"
                        >
                          {message.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Nenhuma mensagem</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Componente Avatar (se não existir no shadcn/ui):
/*
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
*/
```

---

### 5.3 QuickReply

**Arquivo:** `/components/whatsapp/quick-reply.tsx`

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Plus, Trash2, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickReplyTemplate {
  id: string
  title: string
  message: string
  category: "greeting" | "info" | "pricing" | "scheduling" | "custom"
  usageCount: number
}

interface QuickReplyProps {
  templates: QuickReplyTemplate[]
  onSelectTemplate?: (template: QuickReplyTemplate) => void
  onAddTemplate?: () => void
  onEditTemplate?: (template: QuickReplyTemplate) => void
  onDeleteTemplate?: (id: string) => void
  className?: string
}

const categoryColors = {
  greeting: "bg-blue-100 text-blue-800",
  info: "bg-purple-100 text-purple-800",
  pricing: "bg-green-100 text-green-800",
  scheduling: "bg-yellow-100 text-yellow-800",
  custom: "bg-gray-100 text-gray-800",
}

const categoryLabels = {
  greeting: "Saudação",
  info: "Informação",
  pricing: "Preços",
  scheduling: "Agendamento",
  custom: "Personalizado",
}

export function QuickReply({
  templates,
  onSelectTemplate,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  className,
}: QuickReplyProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-solar-600" />
            Respostas Rápidas
          </CardTitle>
          {onAddTemplate && (
            <Button variant="outline" size="sm" onClick={onAddTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "p-4 rounded-lg border-2 border-gray-200 hover:border-solar-400 transition-all cursor-pointer group",
                onSelectTemplate && "hover:shadow-md"
              )}
              onClick={() => onSelectTemplate?.(template)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {template.title}
                    </h4>
                    <Badge className={categoryColors[template.category]}>
                      {categoryLabels[template.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Usado {template.usageCount}x
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditTemplate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTemplate(template)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteTemplate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTemplate(template.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Message Preview */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {template.message}
              </p>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">
                Nenhuma resposta rápida cadastrada
              </p>
              <p className="text-xs mt-1">
                Adicione respostas para agilizar o atendimento
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Exemplo de uso:
/*
<QuickReply
  templates={[
    {
      id: "1",
      title: "Boas-vindas",
      message: "Olá! Bem-vindo à Solar Energy. Como posso ajudá-lo?",
      category: "greeting",
      usageCount: 45,
    },
    {
      id: "2",
      title: "Informações sobre Sistema",
      message: "Nossos sistemas fotovoltaicos são ideais para...",
      category: "info",
      usageCount: 23,
    },
  ]}
  onSelectTemplate={(template) => console.log("Selected:", template)}
  onAddTemplate={() => console.log("Add new")}
  onEditTemplate={(template) => console.log("Edit:", template)}
  onDeleteTemplate={(id) => console.log("Delete:", id)}
/>
*/
```

---

## 6. PRÓXIMA PARTE

A especificação continua com:
- Sidebar/Navigation components
- Forms (CompanyForm, LeadForm, ContactForm, ConfigForm)
- Utility components (Loading, Empty States, Error Boundaries)

Deseja que eu crie a Parte 3 com os componentes restantes?
