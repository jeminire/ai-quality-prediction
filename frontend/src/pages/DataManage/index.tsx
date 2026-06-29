import { useLocation } from "react-router-dom"
import DataPlatform from "./DataPlatform"
import ProcessData from "./ProcessData"
import MaterialData from "./MaterialData"
import QualityLabel from "./QualityLabel"
import EquipmentData from "./EquipmentData"
import EnvironmentData from "./EnvironmentData"

export default function DataManage() {
  const location = useLocation()

  const renderContent = () => {
    if (location.pathname.endsWith('/process')) {
      return <ProcessData />
    } else if (location.pathname.endsWith('/material')) {
      return <MaterialData />
    } else if (location.pathname.endsWith('/quality')) {
      return <QualityLabel />
    } else if (location.pathname.endsWith('/equipment')) {
      return <EquipmentData />
    } else if (location.pathname.endsWith('/environment')) {
      return <EnvironmentData />
    } else {
      return <DataPlatform />
    }
  }

  return (
    <div className="h-full overflow-auto bg-slate-50">
      {renderContent()}
    </div>
  )
}