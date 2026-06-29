// src/sections/Dashboard/ProductionLineCard.tsx

import React from 'react';
import { Factory, Thermometer, Gauge, RefreshCw, AlertCircle, Power, Wrench } from 'lucide-react';
import { ProductionLine } from '../../types/dashboard';

interface ProductionLineCardProps {
  lines: ProductionLine[];
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'running':
      return { color: 'bg-green-100', textColor: 'text-green-700', icon: Power, label: '运行中' };
    case 'maintenance':
      return { color: 'bg-yellow-100', textColor: 'text-yellow-700', icon: Wrench, label: '维护中' };
    case 'fault':
      return { color: 'bg-red-100', textColor: 'text-red-700', icon: AlertCircle, label: '故障' };
    default:
      return { color: 'bg-gray-100', textColor: 'text-gray-700', icon: RefreshCw, label: '待机' };
  }
};

export const ProductionLineCard: React.FC<ProductionLineCardProps> = ({ lines }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">生产线状态</h3>
        <span className="text-xs text-gray-400 ml-auto">实时数据每8秒刷新</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lines.map(line => {
          const StatusIcon = getStatusConfig(line.status).icon;
          return (
            <div key={line.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{line.name}</h4>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusConfig(line.status).color} ${getStatusConfig(line.status).textColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{getStatusConfig(line.status).label}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Thermometer className="w-4 h-4" />
                    <span>温度</span>
                  </div>
                  <span className="font-mono font-medium">{line.temperature.toFixed(0)}°C</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Gauge className="w-4 h-4" />
                    <span>压力</span>
                  </div>
                  <span className="font-mono font-medium">{line.pressure.toFixed(0)} MPa</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <RefreshCw className="w-4 h-4" />
                    <span>转速</span>
                  </div>
                  <span className="font-mono font-medium">{line.speed.toFixed(0)} rpm</span>
                </div>
              </div>
              
              {line.status === 'fault' && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
                  需要立即处理！
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};