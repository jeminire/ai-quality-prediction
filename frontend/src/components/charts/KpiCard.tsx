import { ReactNode } from "react"

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
  icon?: ReactNode
  status?: "success" | "warning" | "danger"
}

export function KpiCard({ title, value, unit, trend, trendLabel, icon, status }: KpiCardProps) {
  const statusBg = {
    success: "border-green-200 bg-green-50/30",
    warning: "border-amber-200 bg-amber-50/30",
    danger: "border-red-200 bg-red-50/30",
  }

  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${status ? statusBg[status] : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon && <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <p className="text-3xl font-bold">{value}</p>
        {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className={`mt-2 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%{" "}
          {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}