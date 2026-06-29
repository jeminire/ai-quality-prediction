import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface ShapFeature {
  feature: string
  importance: number
}

interface ShapFeatureChartProps {
  data: ShapFeature[] | null
}

export function ShapFeatureChart({ data }: ShapFeatureChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    if (!data || data.length === 0) {
      chartInstance.current.setOption({
        title: {
          text: "暂无SHAP分析数据",
          left: "center",
          top: "center",
          textStyle: { color: "#94a3b8", fontSize: 14 },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      })
      return
    }

    // 按重要性排序
    const sortedData = [...data].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))

    chartInstance.current.setOption({
      title: {
        text: "SHAP特征重要性",
        left: "center",
        top: 8,
        textStyle: { fontSize: 14, fontWeight: 500, color: "#334155" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: Array<{ name: string; value: number; marker: string }>) => {
          const p = params[0]
          const direction = p.value > 0 ? "推高风险" : "降低风险"
          return `${p.marker} ${p.name}<br/>SHAP值: ${p.value > 0 ? "+" : ""}${p.value.toFixed(3)} (${direction})`
        },
      },
      grid: { left: "3%", right: "8%", bottom: "3%", top: 48, containLabel: true },
      xAxis: {
        type: "value",
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: sortedData.map((d) => d.feature),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#475569", fontWeight: 500 },
      },
      series: [
        {
          type: "bar",
          data: sortedData.map((d) => ({
            value: d.importance,
            itemStyle: {
              color: d.importance >= 0 ? "#DC2626" : "#059669",
              borderRadius: d.importance >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          })),
          barWidth: 24,
          label: {
            show: true,
            position: "right",
            formatter: (params: { value: number }) =>
              `${params.value > 0 ? "+" : ""}${params.value.toFixed(3)}`,
            color: "#475569",
            fontWeight: 500,
          },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    })
  }, [data])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  return <div ref={chartRef} className="w-full h-72" />
}
