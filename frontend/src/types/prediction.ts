export interface ProcessParams {
  heating_temperature: number
  forming_pressure: number
  spindle_speed: number
  coolant_flow: number
  vibration_amplitude: number
  current_intensity: number
  mold_temperature: number
  feed_rate: number
  lubricant_flow: number
  clamp_force: number
}

// 物料批次特征（用于预测）
export interface MaterialBatchFeatures {
  material_batch_id: string
  supplier: string
  material_type: string
  carbon_content: number
  silicon_content: number
  manganese_content: number
  phosphorus_content: number
  sulfur_content: number
  raw_hardness: number
  tensile_strength: number
  material_status: "NORMAL" | "RISK"
  risk_reason: string
  storage_temperature: number
  storage_humidity: number
}

// 完整预测参数（工艺参数 + 物料批次）
export interface FullPredictionParams {
  process: ProcessParams
  material?: MaterialBatchFeatures
}

export interface PredictionResult {
  prediction_id: number
  prediction: number
  confidence: number
  material_batch_id?: string
  material_risk_adjustment?: number
}

export interface BatchPredictionItem {
  id: string
  params: ProcessParams
  result: PredictionResult
}

export type QualityStatusColor = "green" | "yellow" | "red"

export interface QualityStatus {
  label: string
  color: QualityStatusColor
}

export const getQualityStatus = (prediction: number): QualityStatus => {
  if (prediction < 0.3) {
    return { label: "合格", color: "green" }
  } else if (prediction < 0.7) {
    return { label: "风险", color: "yellow" }
  } else {
    return { label: "不合格", color: "red" }
  }
}