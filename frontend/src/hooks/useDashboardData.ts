// src/hooks/useDashboardData.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { BatchData, DailyQuality, Alert, ProductionLine, KPIValue } from '../types/dashboard';

// 后端API响应类型
interface BackendDataItem {
  id: number;
  features: Record<string, number>;
  label: number | null;
  batch_id: string;
  created_at: string;
  updated_at: string;
}

interface BackendStatistics {
  total_records: number;
  labeled_records: number;
  unlabeled_records: number;
}

// 将后端数据转换为前端格式
const transformBackendData = (backendData: BackendDataItem[]): BatchData[] => {
  return backendData.map((item) => {
    // 根据label判断质量等级
    let qualityLevel: 'pass' | 'risk' | 'fail' = 'pass';
    if (item.label === null || item.label === undefined) {
      qualityLevel = 'pass';
    } else if (item.label === 0) {
      qualityLevel = 'pass';
    } else if (item.label === 1) {
      qualityLevel = 'risk';
    } else {
      qualityLevel = 'fail';
    }
    
    // 计算合格率（基于label）
    const passRate = item.label === 0 ? 95 + Math.random() * 5 : 
                     item.label === 1 ? 70 + Math.random() * 20 : 
                     40 + Math.random() * 30;
    
    // 提取工艺参数
    const features = item.features || {};
    
    return {
      id: String(item.id),
      batchNo: item.batch_id,
      date: item.created_at,
      shift: '早班' as const,
      productionLine: 'A线',
      operator: '操作员',
      qualityLevel,
      passRate,
      temperature: features.heating_temperature || features.temperature || 500,
      pressure: features.forming_pressure || features.pressure || 100,
      speed: features.spindle_speed || features.speed || 1500,
    };
  });
};

// 生成告警数据（基于后端数据异常检测）
const generateAlertsFromData = (data: BatchData[]): Alert[] => {
  const alerts: Alert[] = [];
  
  // 检查高温异常
  const highTempBatches = data.filter(b => b.temperature > 680);
  if (highTempBatches.length > 0) {
    alerts.push({
      id: '1',
      title: '温度超标预警',
      level: 'high',
      type: 'process',
      content: `发现${highTempBatches.length}个批次温度超过680°C，请检查设备`,
      timestamp: new Date().toISOString(),
      isRead: false,
      line: highTempBatches[0].productionLine,
    });
  }
  
  // 检查低压异常
  const lowPressureBatches = data.filter(b => b.pressure < 80);
  if (lowPressureBatches.length > 0) {
    alerts.push({
      id: '2',
      title: '压力偏低预警',
      level: 'medium',
      type: 'equipment',
      content: `发现${lowPressureBatches.length}个批次压力低于80，请检查液压系统`,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      isRead: false,
      line: lowPressureBatches[0].productionLine,
    });
  }
  
  // 检查风险批次
  const riskBatches = data.filter(b => b.qualityLevel === 'risk');
  if (riskBatches.length > 0) {
    alerts.push({
      id: '3',
      title: '质量风险批次',
      level: 'medium',
      type: 'quality',
      content: `发现${riskBatches.length}个质量风险批次，需要重点关注`,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      isRead: false,
      line: riskBatches[0].productionLine,
    });
  }
  
  return alerts;
};

export const useDashboardData = () => {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // 从后端加载批次数据
  const loadBatchesFromBackend = useCallback(async () => {
    try {
      setError(null);
      // 从后端API获取数据
      const response = await apiClient.get<{
        data: BackendDataItem[];
        page: number;
        per_page: number;
        total: number;
      }>('/data/?page=1&per_page=100');
      
      // 转换数据格式
      const transformedData = transformBackendData(response.data);
      setBatches(transformedData);
      
      // 基于数据生成告警
      const generatedAlerts = generateAlertsFromData(transformedData);
      setAlerts(generatedAlerts);
      
      return transformedData;
    } catch (err) {
      console.error('Failed to load batches from backend:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
      return [];
    }
  }, []);

  // 计算KPI指标
  const calculateKPIs = useCallback((): {
    output: KPIValue;
    passRate: KPIValue;
    riskCount: KPIValue;
    oee: KPIValue;
  } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayBatches = batches.filter(b => new Date(b.date) >= today);
    const yesterdayBatches = batches.filter(b => {
      const batchDate = new Date(b.date);
      return batchDate >= yesterday && batchDate < today;
    });
    
    // 产量
    const todayOutput = todayBatches.length;
    const yesterdayOutput = yesterdayBatches.length;
    const outputTrend = yesterdayOutput === 0 ? 0 : 
      ((todayOutput - yesterdayOutput) / yesterdayOutput) * 100;
    
    // 合格率
    const todayPassCount = todayBatches.filter(b => b.qualityLevel === 'pass').length;
    const todayPassRate = todayBatches.length === 0 ? 0 : (todayPassCount / todayBatches.length) * 100;
    const yesterdayPassCount = yesterdayBatches.filter(b => b.qualityLevel === 'pass').length;
    const yesterdayPassRate = yesterdayBatches.length === 0 ? 0 : (yesterdayPassCount / yesterdayBatches.length) * 100;
    const passRateTrend = yesterdayPassRate === 0 ? 0 : todayPassRate - yesterdayPassRate;
    
    // 风险数
    const todayRiskCount = todayBatches.filter(b => b.qualityLevel === 'risk').length;
    const yesterdayRiskCount = yesterdayBatches.filter(b => b.qualityLevel === 'risk').length;
    const riskTrend = yesterdayRiskCount === 0 ? 0 : 
      ((todayRiskCount - yesterdayRiskCount) / yesterdayRiskCount) * 100;
    
    // OEE（模拟，基于合格率计算）
    const oeeValue = todayPassRate * 0.85 + Math.random() * 10;
    const oeeTrend = Math.random() * 10 - 5;
    
    return {
      output: { value: todayOutput, trend: outputTrend, unit: '批' },
      passRate: { value: todayPassRate, trend: passRateTrend, unit: '%' },
      riskCount: { value: todayRiskCount, trend: riskTrend, unit: '个' },
      oee: { value: oeeValue, trend: oeeTrend, unit: '%' },
    };
  }, [batches]);
  
  // 计算每日质量趋势
  const getDailyQualityTrend = useCallback((days: number = 7): DailyQuality[] => {
    const dailyMap = new Map<string, { pass: number; risk: number; fail: number; total: number }>();
    
    batches.forEach(batch => {
      const dateKey = new Date(batch.date).toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { pass: 0, risk: 0, fail: 0, total: 0 };
      
      if (batch.qualityLevel === 'pass') existing.pass++;
      else if (batch.qualityLevel === 'risk') existing.risk++;
      else existing.fail++;
      existing.total++;
      
      dailyMap.set(dateKey, existing);
    });
    
    const sortedDates = Array.from(dailyMap.keys()).sort().reverse().slice(0, days);
    
    return sortedDates.map(date => {
      const data = dailyMap.get(date)!;
      return {
        date,
        passRate: (data.pass / data.total) * 100,
        riskRate: (data.risk / data.total) * 100,
        failRate: (data.fail / data.total) * 100,
        totalCount: data.total,
      };
    }).reverse();
  }, [batches]);
  
  // 计算质量分布
  const getQualityDistribution = useCallback(() => {
    const passCount = batches.filter(b => b.qualityLevel === 'pass').length;
    const riskCount = batches.filter(b => b.qualityLevel === 'risk').length;
    const failCount = batches.filter(b => b.qualityLevel === 'fail').length;
    const total = batches.length;
    
    return {
      pass: { count: passCount, percent: total > 0 ? (passCount / total) * 100 : 0 },
      risk: { count: riskCount, percent: total > 0 ? (riskCount / total) * 100 : 0 },
      fail: { count: failCount, percent: total > 0 ? (failCount / total) * 100 : 0 },
      total,
    };
  }, [batches]);
  
  // 标记告警为已读
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);
  
  const markAllAlertsAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  }, []);
  
  // 刷新生产线状态
  const refreshProductionLines = useCallback(() => {
    setProductionLines(prev => prev.map(line => ({
      ...line,
      temperature: line.status === 'running' ? 400 + Math.random() * 300 : line.temperature,
      pressure: line.status === 'running' ? 150 + Math.random() * 150 : line.pressure,
      speed: line.status === 'running' ? 1200 + Math.random() * 1500 : line.speed,
    })));
  }, []);
  
  // 初始化生产线数据
  useEffect(() => {
    const initialLines: ProductionLine[] = [
      { id: 'line-0', name: 'A线', status: 'running', temperature: 500, pressure: 150, speed: 1500 },
      { id: 'line-1', name: 'B线', status: 'running', temperature: 520, pressure: 160, speed: 1600 },
      { id: 'line-2', name: 'C线', status: 'running', temperature: 510, pressure: 155, speed: 1550 },
    ];
    setProductionLines(initialLines);
  }, []);
  
  // 刷新所有数据
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await loadBatchesFromBackend();
    setLastUpdate(new Date());
    setLoading(false);
  }, [loadBatchesFromBackend]);
  
  // 初始化数据
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadBatchesFromBackend();
      setLoading(false);
    };
    init();
  }, [loadBatchesFromBackend]);
  
  // 生产线状态定时刷新（每8秒）
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProductionLines();
    }, 8000);
    
    return () => clearInterval(interval);
  }, [refreshProductionLines]);
  
  // 批次数据定时刷新（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadBatchesFromBackend();
      setLastUpdate(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadBatchesFromBackend]);
  
  return {
    batches,
    alerts,
    productionLines,
    loading,
    lastUpdate,
    error,
    calculateKPIs,
    getDailyQualityTrend,
    getQualityDistribution,
    markAlertAsRead,
    markAllAlertsAsRead,
    refreshAllData,
  };
};
