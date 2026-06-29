// src/sections/Dashboard/ProductionTable.tsx

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { BatchData } from '../../types/dashboard';

interface ProductionTableProps {
  batches: BatchData[];
  onRowClick: (batch: BatchData) => void;
  filterQuality?: string | null;
}

const ITEMS_PER_PAGE = 10;

export const ProductionTable: React.FC<ProductionTableProps> = ({ batches, onRowClick, filterQuality }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const getQualityBadge = (level: string) => {
    switch (level) {
      case 'pass':
        return { color: 'bg-green-100 text-green-700', text: '合格' };
      case 'risk':
        return { color: 'bg-orange-100 text-orange-700', text: '风险' };
      default:
        return { color: 'bg-red-100 text-red-700', text: '不合格' };
    }
  };
  
  const filteredBatches = useMemo(() => {
    let filtered = batches;
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.operator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 质量等级过滤
    if (filterQuality) {
      filtered = filtered.filter(batch => batch.qualityLevel === filterQuality);
    }
    
    return filtered;
  }, [batches, searchTerm, filterQuality]);
  
  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">最近批次记录</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索批次号或操作员..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {filterQuality && (
          <div className="text-sm text-blue-600">
            当前筛选: {filterQuality === 'pass' ? '合格' : filterQuality === 'risk' ? '风险' : '不合格'}批次
            <button
              onClick={() => window.location.reload()}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              清除
            </button>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">批次号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">日期</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">班次</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">生产线</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作员</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">质量等级</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">合格率</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedBatches.map((batch) => {
              const badge = getQualityBadge(batch.qualityLevel);
              return (
                <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{batch.batchNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(batch.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.shift}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.productionLine}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.operator}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div
                          className={`h-2 rounded-full ${
                            batch.passRate >= 90 ? 'bg-green-500' : batch.passRate >= 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${batch.passRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{batch.passRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRowClick(batch)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页，共 {filteredBatches.length} 条记录
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};