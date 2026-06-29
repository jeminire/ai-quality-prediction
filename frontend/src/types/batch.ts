// ===================== 质量批次（quality_label.csv）=====================
export interface QualityBatch {
  id: number
  batch_id: string
  material_batch_id: string
  quality_status: 0 | 1         // 0=合格, 1=缺陷
  defect_type: string            // 无缺陷 | 尺寸超差 | 材料成分异常 | 硬度不达标 | ...
  root_cause: string             // none | other | material_silicon | ...
  thickness: number              // mm
  parallelism: number            // mm
  hardness: number               // HB
  surface_roughness: number      // μm
  inspection_time: string        // ISO 8601
  inspector: string              // INS-001 | INS-002 | INS-003
}

// ===================== 工艺参数（process_data.csv）=====================
export interface ProcessRecord {
  record_id: string
  batch_id: string
  timestamp: string
  heating_temperature: number    // °C  正常: 845-855
  forming_pressure: number       // MPa 正常: 117.5-122.5
  spindle_speed: number          // rpm 正常: 1450-1550
  coolant_flow: number           // L/min 正常: 23.8-26.2
  vibration_amplitude: number    // mm/s 正常: 2.2-2.8
  current_intensity: number      // A   正常: 43.5-46.5
  mold_temperature: number       // °C  正常: 177-183
  feed_rate: number              // mm/min 正常: 290-310
  lubricant_flow: number         // ml/min 正常: 14.2-15.8
  clamp_force: number            // kN  正常: 78-82
  equipment_id: string           // EQ-A01 | EQ-A02 | EQ-B01 | EQ-B02
  operator_id: string
}

// ===================== 材料批次（material_data.csv）=====================
export interface MaterialBatch {
  material_batch_id: string
  supplier: string               // A | B | C
  material_type: string          // HT250 | HT300 | QT450 | QT500
  carbon_content: number
  silicon_content: number
  manganese_content: number
  phosphorus_content: number
  sulfur_content: number
  raw_hardness: number
  tensile_strength: number
  inspection_date: string
  material_status: "NORMAL" | "RISK"
  risk_reason: string
  storage_temperature: number
  storage_humidity: number
}

// ===================== 设备数据（equipment_data.csv）=====================
export interface EquipmentRecord {
  equipment_id: string
  timestamp: string
  status: "RUNNING" | "IDLE" | "MAINTENANCE"
  temperature: number
  vibration: number
  power_consumption: number
  oil_pressure: number
  hydraulic_pressure: number
  spindle_load: number
  operating_hours: number
}

// ===================== 环境数据（environment_data.csv）=====================
export interface EnvironmentRecord {
  zone_id: string                // Zone-A | Zone-B | Zone-C
  timestamp: string
  temperature: number
  humidity: number
  air_pressure: number
  dust_concentration: number
  noise_level: number
  light_intensity: number
}

// ===================== API 分页响应 =====================
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ===================== 数据统计 =====================
export interface DataStatistics {
  total_records: number
  labeled_records: number
  unlabeled_records: number
}

// ===================== 缺陷统计（前端计算）=====================
export interface DefectStat {
  defect_type: string
  count: number
  percent: number
}

export interface QualityStats {
  total: number
  pass: number
  fail: number
  passRate: number
  defectStats: DefectStat[]
}
