// src/sections/Dashboard/QualityDistribution.tsx

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface QualityDistributionProps {
  distribution: {
    pass: { count: number; percent: number };
    risk: { count: number; percent: number };
    fail: { count: number; percent: number };
    total: number;
  };
  onSliceClick: (qualityLevel: string) => void;
}

export const QualityDistribution: React.FC<QualityDistributionProps> = ({
  distribution,
  onSliceClick,
}) => {
  const getOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>数量: ${params.value}批<br/>占比: ${params.percent}%`;
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: [
          { name: '合格', icon: 'circle', itemStyle: { color: '#10B981' } },
          { name: '风险', icon: 'circle', itemStyle: { color: '#F59E0B' } },
          { name: '不合格', icon: 'circle', itemStyle: { color: '#EF4444' } },
        ],
        textStyle: { color: '#666' },
      },
      series: [
        {
          name: '质量分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontWeight: 'bold',
          },
          emphasis: {
            scale: true,
            label: { show: true, fontWeight: 'bold' },
          },
          data: [
            { value: distribution.pass.count, name: '合格', itemStyle: { color: '#10B981' } },
            { value: distribution.risk.count, name: '风险', itemStyle: { color: '#F59E0B' } },
            { value: distribution.fail.count, name: '不合格', itemStyle: { color: '#EF4444' } },
          ],
        },
      ],
    };
  };
  
  const handleChartClick = (params: any) => {
    if (params.componentType === 'series' && params.data) {
      let qualityLevel = '';
      if (params.name === '合格') qualityLevel = 'pass';
      else if (params.name === '风险') qualityLevel = 'risk';
      else if (params.name === '不合格') qualityLevel = 'fail';
      if (qualityLevel) onSliceClick(qualityLevel);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">质量分布</h3>
        <p className="text-sm text-gray-500">总批次: {distribution.total}</p>
      </div>
      <ReactECharts
        option={getOption()}
        style={{ height: 300 }}
        onEvents={{ click: handleChartClick }}
      />
      <div className="mt-4 text-center text-xs text-gray-500">
        点击扇形区域筛选对应批次
      </div>
    </div>
  );
};