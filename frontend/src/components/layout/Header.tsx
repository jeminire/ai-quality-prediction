import { useState, useEffect, useRef } from "react"
import { Bell, User, Settings, AlertTriangle, AlertCircle, Info, X, Check } from "lucide-react"

interface Notification {
  id: string
  type: "warning" | "critical" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
  prediction?: number
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "critical",
      title: "质量预警",
      message: "检测到缺陷概率超过70%，需要立即处理",
      timestamp: new Date().toISOString(),
      read: false,
      prediction: 0.85
    },
    {
      id: "2",
      type: "warning",
      title: "风险提醒",
      message: "部分批次质量波动较大，请关注",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      prediction: 0.55
    },
    {
      id: "3",
      type: "info",
      title: "系统通知",
      message: "AI模型已更新至最新版本",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    }
  ])
  const notificationRef = useRef<HTMLDivElement>(null)

  // 获取未读消息数量
  const unreadCount = notifications.filter(n => !n.read).length

  // 点击外部关闭通知面板
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 标记所有已读
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  // 标记单条已读
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationStyle = (type: Notification["type"]) => {
    switch (type) {
      case "critical":
        return "border-l-red-500 bg-red-50"
      case "warning":
        return "border-l-amber-500 bg-amber-50"
      case "info":
        return "border-l-blue-500 bg-blue-50"
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="text-lg font-semibold">刹车盘生产线</div>
      <div className="flex items-center gap-2">
        {/* 通知按钮 */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* 通知面板 */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 max-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              {/* 通知头部 */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">预警通知</h3>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Check className="w-3 h-3" />
                      全部已读
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="rounded p-1 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* 通知列表 */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Bell className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">暂无通知</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative border-l-4 p-4 transition-all hover:bg-slate-50 ${getNotificationStyle(notification.type)} ${
                          !notification.read ? "bg-opacity-100" : "bg-opacity-50"
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-slate-800 text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mb-2">
                              {notification.message}
                            </p>
                            {notification.prediction !== undefined && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200 text-xs">
                                <span className="text-slate-500">缺陷概率:</span>
                                <span className={`font-bold ${
                                  notification.prediction >= 0.7 
                                    ? "text-red-600" 
                                    : notification.prediction >= 0.3 
                                      ? "text-amber-600" 
                                      : "text-green-600"
                                }`}>
                                  {(notification.prediction * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            <p className="text-[10px] text-slate-400 mt-2">
                              {new Date(notification.timestamp).toLocaleString("zh-CN")}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 通知底部 */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>共 {notifications.length} 条通知</span>
                    <span>{unreadCount} 条未读</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="rounded-lg p-2 hover:bg-slate-100 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 border-l pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium">操作员</span>
        </div>
      </div>
    </header>
  )
}