import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface ShapValue {
  feature: string
  value: number
}

interface ShapWaterfallProps {
  data: ShapValue[] | null
  baseValue?: number
}

export function ShapWaterfall({ data, baseValue = 0.5 }: ShapWaterfallProps) {
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
          text: "暂无瀑布图数据",
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

    // 计算瀑布图数据
    let current = baseValue
    const categories = ["基线", ...data.map((d) => d.feature), "预测值"]
    const positiveData: (number | "-")[] = ["-"]
    const negativeData: (number | "-")[] = ["-"]
    const helperData: number[] = [0]

    for (const item of data) {
      if (item.value >= 0) {
        positiveData.push(item.value)
        negativeData.push("-")
        helperData.push(current)
        current += item.value
      } else {
        positiveData.push("-")
        negativeData.push(Math.abs(item.value))
        helperData.push(current + item.value)
        current += item.value
      }
    }

    // 最后一列显示最终值
    const total = baseValue + data.reduce((sum, d) => sum + d.value, 0)
    const finalDiff = total - current
    if (finalDiff >= 0) {
      positiveData.push(finalDiff)
      negativeData.push("-")
    } else {
      positiveData.push("-")
      negativeData.push(Math.abs(finalDiff))
    }
    helperData.push(current)

    chartInstance.current.setOption({
      title: {
        text: "SHAP贡献分解（瀑布图）",
        left: "center",
        top: 8,
        textStyle: { fontSize: 14, fontWeight: 500, color: "#334155" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: Array<{ seriesName: string; value: number | string; name: string }>) => {
          const name = params[0].name
          if (name === "基线") return `基线值: ${baseValue.toFixed(3)}`
          if (name === "预测值") return `预测值: ${total.toFixed(3)}`
          const shapValue = data.find((d) => d.feature === name)
          if (shapValue) {
            const direction = shapValue.value > 0 ? "推高风险" : "降低风险"
            return `${name}<br/>贡献值: ${shapValue.value > 0 ? "+" : ""}${shapValue.value.toFixed(3)}<br/>(${direction})`
          }
          return name
        },
      },
      grid: { left: "3%", right: "4%", bottom: "3%", top: 48, containLabel: true },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: "#64748b", rotate: data.length > 6 ? 30 : 0 },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          name: "辅助",
          type: "bar",
          stack: "total",
          itemStyle: { color: "transparent" },
          emphasis: { itemStyle: { color: "transparent" } },
          data: helperData,
        },
        {
          name: "推高风险",
          type: "bar",
          stack: "total",
          itemStyle: { color: "#DC2626", borderRadius: [2, 2, 0, 0] },
          data: positiveData,
        },
        {
          name: "降低风险",
          type: "bar",
          stack: "total",
          itemStyle: { color: "#059669", borderRadius: [2, 2, 0, 0] },
          data: negativeData,
        },
      ],
      animationDuration: 800,
    })
  }, [data, baseValue])

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
