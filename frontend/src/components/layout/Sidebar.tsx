import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { BrainCircuit, Database, FlaskConical, CheckCircle, Wrench, CloudSun, Factory, MonitorPlay, ChevronRight, User } from "lucide-react"

const dataSubMenu = [
  { label: "工艺参数", icon: Database, href: "/data/process" },
  { label: "物料批次", icon: FlaskConical, href: "/data/material" },
  { label: "质量标签", icon: CheckCircle, href: "/data/quality" },
  { label: "设备状态", icon: Wrench, href: "/data/equipment" },
  { label: "环境参数", icon: CloudSun, href: "/data/environment" },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(
    () => location.pathname.startsWith("/data")
  )

  useEffect(() => {
    if (location.pathname.startsWith("/data")) {
      setIsDataMenuOpen(true)
    }
  }, [location.pathname])

  const isDataActive = location.pathname.startsWith("/data")
  const isDataHubActive = location.pathname === "/data" || location.pathname === "/data/"

  const handleDataManageClick = () => {
    setIsDataMenuOpen(!isDataMenuOpen)
    if (!isDataMenuOpen) {
      navigate("/data")
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Logo区域 */}
        <div className="border-b border-slate-700/50 p-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Factory className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI质量预测系统
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">卓越汽车零部件</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {/* 一体化智能管控平台 */}
          <NavLink
            key="/control-platform"
            to="/control-platform"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30" 
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`
            }
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
              location.pathname === "/control-platform" 
                ? "bg-white/20" 
                : "bg-slate-700/50 group-hover:bg-slate-700"
            }`}>
              <MonitorPlay className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium">一体化智能管控平台</span>
            </div>
            {location.pathname === "/control-platform" && (
              <ChevronRight className="h-4 w-4 text-white/70" />
            )}
          </NavLink>

          {/* 数据管理主菜单 */}
          <button
            onClick={handleDataManageClick}
            className={`group w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
              isDataHubActive 
                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30" 
                : isDataActive 
                  ? "bg-slate-800/80 text-white" 
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
              isDataHubActive 
                ? "bg-white/20" 
                : isDataActive 
                  ? "bg-emerald-600/30" 
                  : "bg-slate-700/50 group-hover:bg-slate-700"
            }`}>
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium">数据管理</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${
              isDataMenuOpen ? "rotate-90" : ""
            }`} />
          </button>

          {/* 数据管理子菜单 */}
          {isDataMenuOpen && (
            <div className="ml-2 mt-1 space-y-1">
              {dataSubMenu.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-600/30 to-blue-700/20 text-white ml-2" 
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white ml-2"
                      }`
                    }
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300 ${
                      location.pathname === item.href 
                        ? "bg-blue-600/40" 
                        : "bg-slate-700/30 group-hover:bg-slate-700/50"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}

          {/* AI质量预测 */}
          <NavLink
            key="/prediction"
            to="/prediction"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30" 
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`
            }
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${
              location.pathname === "/prediction" 
                ? "bg-white/20" 
                : "bg-slate-700/50 group-hover:bg-slate-700"
            }`}>
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium">AI质量预测</span>
            </div>
            {location.pathname === "/prediction" && (
              <ChevronRight className="h-4 w-4 text-white/70" />
            )}
          </NavLink>
        </nav>

        {/* 底部用户信息 */}
        <div className="border-t border-slate-700/50 p-4 bg-gradient-to-t from-slate-900/80 to-transparent backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">操作员-001</p>
              <p className="text-xs text-slate-400">白班 | 在线</p>
            </div>
            <div className="flex h-2 w-2 items-center justify-center rounded-full bg-green-500 ring-2 ring-green-500/30"></div>
          </div>
        </div>
      </div>
    </aside>
  )
}