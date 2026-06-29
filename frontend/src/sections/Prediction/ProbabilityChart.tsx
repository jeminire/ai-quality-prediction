import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { PredictionResult } from "@/types/prediction"
import { getQualityStatus } from "@/types/prediction"

interface ProbabilityChartProps {
  result: PredictionResult | null
}

export function ProbabilityChart({ result }: ProbabilityChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    if (!result) {
      chartInstance.current.setOption({
        title: {
          text: "填写工艺参数",
          left: "center",
          top: "40%",
          textStyle: { color: "#94a3b8", fontSize: 14, fontWeight: 500 },
        },
        subtitle: {
          text: "点击\"开始预测\"查看概率分布",
          left: "center",
          top: "55%",
          textStyle: { color: "#cbd5e1", fontSize: 12 },
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      })
      return
    }

    const status = getQualityStatus(result.prediction)

    const data = [
      { name: "缺陷概率", value: result.prediction, color: "#DC2626" },
      { name: "合格概率", value: 1 - result.prediction, color: "#059669" },
    ]

    chartInstance.current.setOption({
      title: {
        text: `预测结果: ${status.label}`,
        left: "center",
        top: 8,
        textStyle: { fontSize: 14, fontWeight: 500, color: "#334155" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0]
          return `${p.name}: ${(p.value * 100).toFixed(1)}%`
        },
      },
      grid: { left: "3%", right: "8%", bottom: "3%", top: 48, containLabel: true },
      xAxis: {
        type: "value",
        max: 1,
        axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%`, color: "#64748b" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#475569", fontWeight: 500 },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => ({
            value: d.value,
            itemStyle: {
              color: d.color,
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: 28,
          label: {
            show: true,
            position: "right",
            formatter: (params: { value: number }) => `${(params.value * 100).toFixed(1)}%`,
            color: "#475569",
            fontWeight: 500,
          },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    })
  }, [result])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  return <div ref={chartRef} className="w-full h-56" />
}
