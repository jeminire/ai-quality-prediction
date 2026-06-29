// src/types/dashboard.ts

export interface BatchData {
  id: string;
  batchNo: string;
  date: string;
  shift: '早班' | '中班' | '晚班';
  productionLine: string;
  operator: string;
  qualityLevel: 'pass' | 'risk' | 'fail';
  passRate: number;
  temperature: number;
  pressure: number;
  speed: number;
}

export interface KPIValue {
  value: number;
  trend: number; // 百分比变化
  unit?: string;
}

export interface DailyQuality {
  date: string;
  passRate: number;
  riskRate: number;
  failRate: number;
  totalCount: number;
}

export interface Alert {
  id: string;
  title: string;
  level: 'high' | 'medium' | 'low';
  type: 'quality' | 'equipment' | 'process' | 'material';
  content: string;
  timestamp: string;
  isRead: boolean;
  line?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  status: 'running' | 'maintenance' | 'fault' | 'standby';
  temperature: number;
  pressure: number;
  speed: number;
}