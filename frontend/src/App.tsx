import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import Prediction from "./pages/Prediction"
import DataManage from "./pages/DataManage"
import ControlPlatform from "./pages/ControlPlatform"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/control-platform" replace />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/data" element={<DataManage />} />
          <Route path="/data/process" element={<DataManage />} />
          <Route path="/data/material" element={<DataManage />} />
          <Route path="/data/quality" element={<DataManage />} />
          <Route path="/data/equipment" element={<DataManage />} />
          <Route path="/data/environment" element={<DataManage />} />
          <Route path="/control-platform" element={<ControlPlatform />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App