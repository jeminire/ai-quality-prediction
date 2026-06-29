import { AlertTriangle, CheckCircle, Lightbulb, TrendingDown, TrendingUp } from "lucide-react"

interface RootCauseItem {
  parameter: string
  currentValue: number
  unit: string
  recommendedRange: string
  impact: "high" | "medium" | "low"
  suggestion: string
}

interface RootCauseReportProps {
  data: RootCauseItem[] | null
}

const impactConfig = {
  high: { label: "高影响", color: "text-red-600 bg-red-50 border-red-200" },
  medium: { label: "中影响", color: "text-amber-600 bg-amber-50 border-amber-200" },
  low: { label: "低影响", color: "text-blue-600 bg-blue-50 border-blue-200" },
}

export function RootCauseReport({ data }: RootCauseReportProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">执行预测后将显示根因分析与决策建议</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          根因分析与决策建议
        </h3>
      </div>

      <div className="space-y-3 p-4">
        {data.map((item, index) => {
          const impact = impactConfig[item.impact]
          return (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-800">{item.parameter}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${impact.color}`}>
                      {impact.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">当前值:</span>
                      <span className="text-sm font-medium text-slate-700">
                        {item.currentValue} {item.unit}
                      </span>
                      {item.impact === "high" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">建议范围:</span>
                      <span className="text-sm font-medium text-green-700">
                        {item.recommendedRange} {item.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-md bg-slate-50 p-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700">{item.suggestion}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
