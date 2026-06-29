import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Package, Upload, FileBarChart, Settings, Brain, History } from "lucide-react"
import { BatchList } from "./BatchList"
import { BatchDetail } from "./BatchDetail"
import { BatchForm } from "./BatchForm"
import { DataImport } from "./DataImport"
import { DataStatistics } from "./DataStatistics"
import { ReportGenerator } from "./ReportGenerator"
import { Settings as SettingsPage } from "./Settings"
import { ModelManager } from "./ModelManager"
import { PredictionHistory } from "./PredictionHistory"
import type { QualityBatch } from "../../types/batch"

export default function QualityPage() {
  const [viewBatch, setViewBatch] = useState<QualityBatch | null>(null)
  const [editBatch, setEditBatch] = useState<QualityBatch | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdd = () => {
    setEditBatch(null)
    setFormOpen(true)
  }

  const handleEdit = (batch: QualityBatch) => {
    setEditBatch(batch)
    setFormOpen(true)
  }

  const handleSaved = () => {
    setRefreshKey((k) => k + 1)
  }

  const handleImportDone = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">AI 质量预测与智能管控系统</h1>
        <p className="text-sm text-slate-500 mt-1">基于机器学习的铸造件质量预测与工艺优化平台</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            批次管理
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            数据导入
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            模型管理
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            预测历史
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            质量报告
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <BatchList
            onView={(batch) => setViewBatch(batch)}
            onEdit={(batch) => handleEdit(batch)}
            onAdd={handleAdd}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <DataStatistics />
          <DataImport onImportDone={handleImportDone} />
        </TabsContent>

        <TabsContent value="models" className="mt-0">
          <ModelManager />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <PredictionHistory />
        </TabsContent>

        <TabsContent value="report" className="mt-0">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <SettingsPage />
        </TabsContent>
      </Tabs>

      <BatchDetail batch={viewBatch} onClose={() => setViewBatch(null)} />

      <BatchForm
        open={formOpen}
        initialData={editBatch}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}