import React, { useState } from 'react';
import { Bell, Check, AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Alert } from '../../types/dashboard';

interface AlertListProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
}

const getLevelConfig = (level: string) => {
  switch (level) {
    case 'high':
      return { color: 'bg-red-50 border-red-200', icon: AlertCircle, textColor: 'text-red-600', bgColor: 'bg-red-100' };
    case 'medium':
      return { color: 'bg-orange-50 border-orange-200', icon: AlertTriangle, textColor: 'text-orange-600', bgColor: 'bg-orange-100' };
    default:
      return { color: 'bg-blue-50 border-blue-200', icon: Info, textColor: 'text-blue-600', bgColor: 'bg-blue-100' };
  }
};

export const AlertList: React.FC<AlertListProps> = ({ alerts, onMarkAsRead, onMarkAllAsRead }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  
  const filteredAlerts = alerts.filter(alert => 
    filterLevel === 'all' || alert.level === filterLevel
  );
  
  const unreadCount = alerts.filter(a => !a.isRead).length;
  
  const getTypeText = (type: string) => {
    const typeMap = {
      quality: '质量',
      equipment: '设备',
      process: '工艺',
      material: '物料',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">实时告警</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                {unreadCount}条未读
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              全部已读
            </button>
          )}
        </div>
        
        {/* 筛选按钮 */}
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterLevel === level
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level === 'all' ? '全部' : level === 'high' ? '高' : level === 'medium' ? '中' : '低'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无告警信息</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const { color, icon: Icon, textColor, bgColor } = getLevelConfig(alert.level);
            return (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${color} relative`}
                onClick={() => onMarkAsRead(alert.id)}
              >
                {!alert.isRead && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <div className="flex gap-3">
                  <div className={`${bgColor} p-2 rounded-lg ${textColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${textColor}`}>
                        {alert.title}
                      </span>
                      <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
                        {getTypeText(alert.type)}
                      </span>
                      {alert.line && (
                        <span className="text-xs text-gray-500">{alert.line}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {!alert.isRead && (
                        <span className="text-xs text-blue-600">点击标记已读</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};