interface StatusBadgeProps {
  status: "pass" | "risk" | "fail"
  label?: string
}

const statusConfig = {
  pass: { label: "合格", color: "bg-green-100 text-green-700" },
  risk: { label: "风险", color: "bg-amber-100 text-amber-700" },
  fail: { label: "不合格", color: "bg-red-100 text-red-700" },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {label || config.label}
    </span>
  )
}