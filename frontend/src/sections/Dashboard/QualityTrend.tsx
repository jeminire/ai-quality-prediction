// src/sections/Dashboard/QualityTrend.tsx

import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { DailyQuality } from '../../types/dashboard';

interface QualityTrendProps {
  dailyData: (days: number) => DailyQuality[];
}

export const QualityTrend: React.FC<QualityTrendProps> = ({ dailyData }) => {
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [trendData, setTrendData] = useState<DailyQuality[]>([]);
  
  useEffect(() => {
    const data = dailyData(daysRange);
    setTrendData(data);
  }, [daysRange, dailyData]);
  
  const getOption = () => {
    const dates = trendData.map(d => d.date.slice(5)); // MM-DD格式
    const passRates = trendData.map(d => d.passRate.toFixed(1));
    const riskRates = trendData.map(d => d.riskRate.toFixed(1));
    const failRates = trendData.map(d => d.failRate.toFixed(1));
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${param.value}%<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['合格率', '风险率', '废品率'],
        left: 'left',
        itemWidth: 30,
        textStyle: { color: '#666' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: dates.length > 15 ? 45 : 0 },
      },
      yAxis: {
        type: 'value',
        name: '比率 (%)',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      series: [
        {
          name: '合格率',
          type: 'line',
          data: passRates,
          smooth: true,
          lineStyle: { color: '#10B981', width: 3 },
          symbol: 'circle',
          symbolSize: 8,
          areaStyle: { opacity: 0.1, color: '#10B981' },
        },
        {
          name: '风险率',
          type: 'line',
          data: riskRates,
          smooth: true,
          lineStyle: { color: '#F59E0B', width: 3 },
          symbol: 'diamond',
          symbolSize: 8,
        },
        {
          name: '废品率',
          type: 'line',
          data: failRates,
          smooth: true,
          lineStyle: { color: '#EF4444', width: 3 },
          symbol: 'triangle',
          symbolSize: 8,
        },
      ],
    };
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">质量趋势分析</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setDaysRange(7)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              daysRange === 7
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            近7天
          </button>
          <button
            onClick={() => setDaysRange(30)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              daysRange === 30
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            近30天
          </button>
        </div>
      </div>
      <ReactECharts option={getOption()} style={{ height: 400 }} />
    </div>
  );
};