import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Activity, Info, Package, AlertCircle } from "lucide-react"
import type { PredictionResult as PredictionResultType, QualityStatus } from "@/types/prediction"
import { getQualityStatus } from "@/types/prediction"

interface PredictionResultProps {
  result: PredictionResultType | null
}

export function PredictionResultCard({ result }: PredictionResultProps) {
  if (!result) {
    return null
  }

  const status: QualityStatus = getQualityStatus(result.prediction)

  const statusConfig: Record<string, {
    label: string
    description: string
    icon: React.ReactNode
    bgColor: string
    borderColor: string
    textColor: string
    iconColor: string
    barColor: string
  }> = {
    green: {
      label: "合格",
      description: "产品满足所有质量标准，可正常放行",
      icon: <CheckCircle className="w-8 h-8" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-500",
      barColor: "bg-green-500",
    },
    yellow: {
      label: "风险",
      description: "部分参数偏离标准范围，建议关注",
      icon: <AlertTriangle className="w-8 h-8" />,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      iconColor: "text-amber-500",
      barColor: "bg-amber-500",
    },
    red: {
      label: "不合格",
      description: "产品不满足质量要求，建议调整工艺参数",
      icon: <XCircle className="w-8 h-8" />,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      iconColor: "text-red-500",
      barColor: "bg-red-500",
    },
  }

  const config = statusConfig[status.color]

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`${config.iconColor} mt-0.5`}>{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-800">预测结果</h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status.color === "green"
                  ? "bg-green-100 text-green-700"
                  : status.color === "yellow"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {status.label}
            </span>
          </div>
          <p className={`text-sm ${config.textColor} mb-4`}>{config.description}</p>

          <div className="space-y-4">
            {/* 预测值 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">缺陷概率</span>
                <span className="text-sm font-bold text-slate-800">
                  {(result.prediction * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                  style={{ width: `${result.prediction * 100}%` }}
                />
              </div>
            </div>

            {/* 置信度 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">置信度</span>
                <span className="text-sm font-bold text-slate-800">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* 物料批次信息 */}
            {result.material_batch_id && (
              <div className="p-3 rounded-lg bg-white/60 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">物料批次信息</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">批次ID:</span>
                    <span className="font-medium text-slate-700">{result.material_batch_id}</span>
                  </div>
                  {result.material_risk_adjustment !== undefined && result.material_risk_adjustment > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="w-3 h-3" />
                      <span className="font-medium">物料风险调整: +{(result.material_risk_adjustment * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 预测ID */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5" />
              <span>预测记录 ID: {result.prediction_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
