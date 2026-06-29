import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface BeeswarmPoint {
  feature: string
  shapValue: number
  featureValue: number
  featureValueNormalized: number // 0-1, for color mapping
}

interface ShapBeeswarmProps {
  data: BeeswarmPoint[] | null
}

export function ShapBeeswarm({ data }: ShapBeeswarmProps) {
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
          text: "暂无蜂群图数据",
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

    // Group by feature
    const features = [...new Set(data.map((d) => d.feature))]
    const seriesData = data.map((d) => ({
      value: [d.shapValue, d.feature],
      itemStyle: {
        color: d.shapValue >= 0
          ? `rgba(220, 38, 38, ${0.3 + d.featureValueNormalized * 0.7})`
          : `rgba(5, 150, 105, ${0.3 + d.featureValueNormalized * 0.7})`,
        borderColor: d.shapValue >= 0 ? "#DC2626" : "#059669",
        borderWidth: 0.5,
      },
    }))

    chartInstance.current.setOption({
      title: {
        text: "SHAP蜂群图 (Beeswarm)",
        left: "center",
        top: 8,
        textStyle: { fontSize: 14, fontWeight: 500, color: "#334155" },
      },
      tooltip: {
        trigger: "item",
        formatter: (params: { data: { value: [number, string] }; marker: string }) => {
          const point = data.find(
            (d) => d.feature === params.data.value[1] && Math.abs(d.shapValue - params.data.value[0]) < 0.001
          )
          if (!point) return ""
          const direction = point.shapValue > 0 ? "推高风险" : "降低风险"
          return `${params.marker} ${point.feature}<br/>SHAP值: ${point.shapValue > 0 ? "+" : ""}${point.shapValue.toFixed(3)}<br/>特征值: ${point.featureValue.toFixed(1)}<br/>(${direction})`
        },
      },
      grid: { left: "15%", right: "8%", bottom: "10%", top: 48 },
      xAxis: {
        type: "value",
        name: "SHAP值 (对预测的影响)",
        nameLocation: "center",
        nameGap: 30,
        nameTextStyle: { color: "#64748b", fontSize: 12 },
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: features,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#475569", fontWeight: 500 },
      },
      series: [
        {
          type: "scatter",
          data: seriesData,
          symbolSize: 10,
          animationDuration: 800,
        },
      ],
      visualMap: {
        show: false,
        dimension: 0,
        min: -1,
        max: 1,
        inRange: {
          color: ["#059669", "#94a3b8", "#DC2626"],
        },
      },
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

  return <div ref={chartRef} className="w-full h-80" />
}
