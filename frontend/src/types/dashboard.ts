export interface BatchData {
  id: string;
  batchNo: string;
  date: string;
  shift: '早班' | '中班' | '晚班';
  productionLine: string;
  operator: string;
  qualityLevel: 'pass' | 'risk' | 'fail' | '合格' | '不合格';
  passRate: number;
  temperature: number;
  pressure: number;
  speed: number;
  batchId?: string;
  productionTime?: string;
  qualityRate?: number;
  defectCount?: number;
  processParams?: Record<string, any>;
  remarks?: string;
}

export interface KPIValue {
  value: number;
  trend: number;
  unit?: string;
}

export interface KPIData {
  output: KPIValue;
  passRate: KPIValue;
  riskCount: KPIValue;
  oee: KPIValue;
  totalBatches?: number;
  qualifiedBatches?: number;
  unqualifiedBatches?: number;
  qualifiedRate?: number;
}

export interface DailyQuality {
  date: string;
  passRate: number;
  riskRate: number;
  failRate: number;
  totalCount: number;
  total?: number;
  qualified?: number;
  unqualified?: number;
  qualifiedRate?: number;
  defectCount?: number;
}

export interface Alert {
  id: string;
  title: string;
  level: 'high' | 'medium' | 'low' | 'critical' | 'warning' | 'info';
  type: 'quality' | 'equipment' | 'process' | 'material';
  content: string;
  timestamp: string;
  isRead: boolean;
  line?: string;
  message?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  status: 'running' | 'maintenance' | 'fault' | 'standby';
  temperature: number;
  pressure: number;
  speed: number;
}
