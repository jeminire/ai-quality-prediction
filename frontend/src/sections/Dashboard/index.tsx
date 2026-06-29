import React, { useState } from 'react';
import { RefreshCw, FileText, Download, Printer, FileSpreadsheet, TrendingUp, BrainCircuit, AlertCircle, Lightbulb } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { KPICards } from './KPICards';
import { QualityTrend } from './QualityTrend';
import { QualityDistribution } from './QualityDistribution';
import { AlertList } from './AlertList';
import { ProductionLineCard } from './ProductionLineCard';
import { ProductionTable } from './ProductionTable';
import { DashboardBatchDetail } from './DashboardBatchDetail';
import { BatchData } from '../../types/dashboard';

export const Dashboard: React.FC = () => {
  const {
    batches,
    alerts,
    productionLines,
    loading,
    lastUpdate,
    calculateKPIs,
    getDailyQualityTrend,
    getQualityDistribution,
    markAlertAsRead,
    markAllAlertsAsRead,
    refreshAllData,
  } = useDashboardData();
  
  const [filterQuality, setFilterQuality] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('quality');
  
  const kpis = calculateKPIs();
  const distribution = getQualityDistribution();

  // 导出质量报告
  const exportQualityReport = () => {
    const headers = [
      '批次号', '生产时间', '质量等级', '合格率(%)', '缺陷数量',
      '生产线', '操作员', '工艺参数', '备注'
    ];
    
    const rows = batches.map(batch => [
      batch.batchId,
      batch.productionTime,
      batch.qualityLevel,
      batch.qualityRate,
      batch.defectCount,
      batch.productionLine,
      batch.operator,
      JSON.stringify(batch.processParams),
      batch.remarks || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `质量报告_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('质量报告导出成功！');
  };

  // 导出预测报告
  const exportPredictionReport = () => {
    const headers = [
      '批次号', '预测时间', '预测结果', '缺陷概率(%)', '置信度(%)',
      '预测模型', '预测特征', '实际结果', '预测准确度'
    ];
    
    const rows = batches.map(batch => [
      batch.batchId,
      batch.productionTime,
      batch.qualityLevel === '合格' ? '合格' : '不合格',
      batch.qualityLevel === '合格' ? (100 - batch.qualityRate).toFixed(1) : batch.qualityRate.toFixed(1),
      '95.0', // 模拟置信度
      'RandomForest',
      JSON.stringify(batch.processParams),
      batch.qualityLevel,
      '92.5' // 模拟准确度
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `预测报告_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('预测报告导出成功！');
  };

  // 导出趋势分析报告
  const exportTrendReport = () => {
    const dailyData = getDailyQualityTrend();
    const headers = [
      '日期', '总批次', '合格批次', '不合格批次', '合格率(%)',
      '平均缺陷数', '质量趋势', '关键指标'
    ];
    
    const rows = dailyData.map(day => {
      const 合格率 = day.total > 0 ? ((day.qualified / day.total) * 100).toFixed(1) : '0';
      const 趋势 = day.qualifiedRate > 90 ? '良好' : day.qualifiedRate > 80 ? '正常' : '需关注';
      
      return [
        day.date,
        day.total,
        day.qualified,
        day.unqualified,
        合格率,
        (day.defectCount / day.total).toFixed(1),
        趋势,
        `合格率${合格率}%`
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `趋势分析报告_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('趋势分析报告导出成功！');
  };

  // 导出根因分析与决策建议报告
  const exportRootCauseReport = () => {
    const headers = [
      '批次号', '问题类型', '根因分析', '影响程度', '决策建议',
      '优先级', '预计效果', '实施难度', '责任部门', '时间要求'
    ];
    
    const rows = batches
      .filter(batch => batch.qualityLevel !== '合格')
      .map(batch => {
        const defectType = batch.defectCount > 5 ? '严重缺陷' : batch.defectCount > 2 ? '一般缺陷' : '轻微缺陷';
        const rootCause = `工艺参数偏差：${Object.entries(batch.processParams)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')}`;
        const impact = batch.defectCount > 5 ? '高' : batch.defectCount > 2 ? '中' : '低';
        const suggestion = batch.defectCount > 5 
          ? '立即停线检查，调整工艺参数，加强质量监控'
          : '持续监控，优化工艺参数，预防性维护';
        const priority = batch.defectCount > 5 ? '紧急' : batch.defectCount > 2 ? '重要' : '一般';
        const expectedEffect = batch.defectCount > 5 ? '显著改善' : '逐步改善';
        const difficulty = batch.defectCount > 5 ? '中等' : '较低';
        const department = '生产部';
        const timeRequirement = batch.defectCount > 5 ? '24小时内' : '一周内';
        
        return [
          batch.batchId,
          defectType,
          rootCause,
          impact,
          suggestion,
          priority,
          expectedEffect,
          difficulty,
          department,
          timeRequirement
        ];
      });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `根因分析与决策建议报告_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('根因分析与决策建议报告导出成功！');
  };

  // 打印综合报告
  const printComprehensiveReport = () => {
    const printContent = `
      <html>
        <head>
          <title>综合质量分析报告</title>
          <style>
            body { font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #1e40af; margin-bottom: 10px; }
            h2 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .summary-item { display: inline-block; margin: 10px 20px; }
            .summary-label { font-size: 12px; color: #64748b; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #1e40af; color: white; }
            tr:nth-child(even) { background: #f8fafc; }
            .status-good { color: #16a34a; font-weight: bold; }
            .status-warning { color: #ca8a04; font-weight: bold; }
            .status-bad { color: #dc2626; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            .recommendation { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI质量预测与智能管控系统 - 综合质量分析报告</h1>
            <p>卓越汽车零部件有限公司</p>
            <p>报告生成时间：${new Date().toLocaleString('zh-CN')}</p>
          </div>
          
          <div class="summary">
            <h2>📊 质量概览</h2>
            <div class="summary-item">
              <div class="summary-label">总批次</div>
              <div class="summary-value">${kpis.totalBatches}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">合格批次</div>
              <div class="summary-value" style="color: #16a34a;">${kpis.qualifiedBatches}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">不合格批次</div>
              <div class="summary-value" style="color: #dc2626;">${kpis.unqualifiedBatches}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">合格率</div>
              <div class="summary-value">${kpis.qualifiedRate.toFixed(1)}%</div>
            </div>
          </div>
          
          <h2>📈 质量趋势分析</h2>
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>总批次</th>
                <th>合格批次</th>
                <th>不合格批次</th>
                <th>合格率</th>
              </tr>
            </thead>
            <tbody>
              ${getDailyQualityTrend().slice(0, 7).map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${day.total}</td>
                  <td>${day.qualified}</td>
                  <td>${day.unqualified}</td>
                  <td class="${day.qualifiedRate >= 90 ? 'status-good' : day.qualifiedRate >= 80 ? 'status-warning' : 'status-bad'}">
                    ${day.qualifiedRate.toFixed(1)}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>⚠️ 告警信息</h2>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>级别</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              ${alerts.slice(0, 10).map(alert => `
                <tr>
                  <td>${alert.timestamp}</td>
                  <td>${alert.type}</td>
                  <td class="${alert.level === 'critical' ? 'status-bad' : alert.level === 'warning' ? 'status-warning' : 'status-good'}">
                    ${alert.level}
                  </td>
                  <td>${alert.message}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>💡 决策建议</h2>
          ${alerts.filter(a => a.level === 'critical').length > 0 ? `
            <div class="recommendation">
              <strong>紧急建议：</strong>检测到${alerts.filter(a => a.level === 'critical').length}个严重告警，建议立即停线检查，优先处理关键质量问题。
            </div>
          ` : ''}
          ${kpis.qualifiedRate < 90 ? `
            <div class="recommendation">
              <strong>质量改进建议：</strong>当前合格率为${kpis.qualifiedRate.toFixed(1)}%，低于目标值90%。建议加强工艺参数监控，优化生产流程。
            </div>
          ` : `
            <div class="recommendation" style="background: #dcfce7; border-left-color: #16a34a;">
              <strong>质量状况良好：</strong>当前合格率为${kpis.qualifiedRate.toFixed(1)}%，达到目标要求。建议继续保持现有质量控制措施。
            </div>
          `}
          
          <div class="footer">
            <p>报告生成系统：AI质量预测与智能管控系统</p>
            <p>数据来源：实时生产数据与AI预测模型</p>
            <p>© 2024 卓越汽车零部件有限公司 - 保留所有权利</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  const handleSliceClick = (qualityLevel: string) => {
    setFilterQuality(qualityLevel);
    document.getElementById('production-table')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleRowClick = (batch: BatchData) => {
    setSelectedBatch(batch);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* 页面标题和刷新按钮 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
            <p className="text-sm text-gray-500 mt-1">
              最后更新时间: {lastUpdate.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              生成报告
            </button>
            <button
              onClick={refreshAllData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新数据
            </button>
          </div>
        </div>
        
        {/* KPI卡片 */}
        <KPICards kpis={kpis} />
        
        {/* 质量趋势和分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <QualityTrend dailyData={getDailyQualityTrend} />
          </div>
          <div>
            <QualityDistribution
              distribution={distribution}
              onSliceClick={handleSliceClick}
            />
          </div>
        </div>
        
        {/* 生产状态和告警 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ProductionLineCard lines={productionLines} />
          <AlertList
            alerts={alerts}
            onMarkAsRead={markAlertAsRead}
            onMarkAllAsRead={markAllAlertsAsRead}
          />
        </div>
        
        {/* 批次表格 */}
        <div id="production-table">
          <ProductionTable
            batches={batches.slice(0, 50)}
            onRowClick={handleRowClick}
            filterQuality={filterQuality}
          />
        </div>
      </div>
      
      {/* 批次详情弹窗 */}
      <DashboardBatchDetail 
        batch={selectedBatch} 
        onClose={() => setSelectedBatch(null)} 
      />

      {/* 报告生成模态框 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">生成分析报告</h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 质量报告 */}
                <button
                  onClick={() => {
                    exportQualityReport();
                    setShowReportModal(false);
                  }}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">质量报告</h3>
                      <p className="text-sm text-slate-600 mb-3">包含生产批次质量数据、合格率统计、缺陷分析等详细信息</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV格式导出
                      </div>
                    </div>
                  </div>
                </button>

                {/* 预测报告 */}
                <button
                  onClick={() => {
                    exportPredictionReport();
                    setShowReportModal(false);
                  }}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <BrainCircuit className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">预测报告</h3>
                      <p className="text-sm text-slate-600 mb-3">AI模型预测结果、置信度分析、预测准确度评估</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV格式导出
                      </div>
                    </div>
                  </div>
                </button>

                {/* 趋势分析报告 */}
                <button
                  onClick={() => {
                    exportTrendReport();
                    setShowReportModal(false);
                  }}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">趋势分析报告</h3>
                      <p className="text-sm text-slate-600 mb-3">历史质量趋势、合格率变化、关键指标分析</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV格式导出
                      </div>
                    </div>
                  </div>
                </button>

                {/* 根因分析与决策建议报告 */}
                <button
                  onClick={() => {
                    exportRootCauseReport();
                    setShowReportModal(false);
                  }}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <Lightbulb className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">根因分析与决策建议</h3>
                      <p className="text-sm text-slate-600 mb-3">问题根因分析、影响程度评估、决策建议方案</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV格式导出
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* 综合打印报告 */}
              <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Printer className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">综合质量分析报告</h3>
                      <p className="text-sm text-slate-600">包含质量概览、趋势分析、告警信息、决策建议的完整报告</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      printComprehensiveReport();
                      setShowReportModal(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    <Printer className="w-5 h-5" />
                    打印报告
                  </button>
                </div>
              </div>

              {/* 报告统计信息 */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{batches.length}</p>
                  <p className="text-xs text-slate-600 mt-1">总批次数据</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.level === 'info').length}</p>
                  <p className="text-xs text-slate-600 mt-1">信息告警</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{alerts.filter(a => a.level === 'warning').length}</p>
                  <p className="text-xs text-slate-600 mt-1">警告告警</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.level === 'critical').length}</p>
                  <p className="text-xs text-slate-600 mt-1">严重告警</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                * 报告将基于当前数据生成，包含{batches.length}条批次记录和{alerts.length}条告警信息
              </p>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;