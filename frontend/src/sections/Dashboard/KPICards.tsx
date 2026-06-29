// src/sections/Dashboard/KPICards.tsx

import React from 'react';
import { Package, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { KPIValue } from '../../types/dashboard';

interface KPICardsProps {
  kpis: {
    output: KPIValue;
    passRate: KPIValue;
    riskCount: KPIValue;
    oee: KPIValue;
  };
}

const KPI_CARDS = [
  { key: 'output', label: '今日产量', icon: Package, color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { key: 'passRate', label: '合格率', icon: CheckCircle, color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { key: 'riskCount', label: '风险数', icon: AlertTriangle, color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { key: 'oee', label: '设备OEE', icon: Activity, color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
];

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };
  
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {KPI_CARDS.map(({ key, label, icon: Icon, bgColor, textColor }) => {
        const kpi = kpis[key as keyof typeof kpis];
        return (
          <div
            key={key}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => console.log(`跳转到${label}详情页`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${textColor}`} />
              </div>
              <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                {getTrendIcon(kpi.trend)} {Math.abs(kpi.trend).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {kpi.value.toFixed(1)}{kpi.unit}
            </h3>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-xs text-gray-400 mt-2">较昨日</p>
          </div>
        );
      })}
    </div>
  );
};