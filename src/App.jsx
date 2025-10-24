// src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout"; // <-- 1. Import Layout của bạn
import { DashboardCreate, DashboardHome, DashboardView } from "./pages/dashboard";

function App() {
  return (
    <Routes>
      {/* 3. TẠO MỘT ROUTE CHA DÙNG `Layout` */}
      <Route path="/" element={<Layout />}>
        {/* 4. LỒNG TẤT CẢ CÁC TRANG CON VÀO TRONG */}
        {/* Route mặc định -> chuyển đến trang con đầu tiên */}
        {/* <Route index element={<Navigate to="/dashboard" replace />} /> */}
        <Route index element={<Navigate to="/dashboard/list" replace />} />
        {/* --- Nhóm Dashboard --- */}
        <Route path="dashboard/list" element={<DashboardHome />} />
        <Route path="dashboard/test" element={<div>Test</div>} />
        <Route path="dashboard/nam" element={<div>Trang của Nam</div>} />
        <Route path="dashboard/create" element={<DashboardCreate />} />
        <Route path="dashboard/view/:id" element={<DashboardView />} />

        {/* <Route path="dashboard" element={<DashboardHome />} />
        <Route path="dashboard/test" element={<div>Test</div>} />
        <Route path="dashboard/nam" element={<div>Trang của Nam</div>} /> */}

        {/* Các trang này sẽ được render vào <Outlet /> của Layout */}
        {/* <Route path="dashboard" element={<DashboardPage />} /> */}

        {/* Trang Setup sẽ dùng layout con của nó (như ta đã bàn) */}
        {/* Dấu * có nghĩa là nó sẽ bắt mọi route con như /setup/robots, /setup/maps... */}
        {/* <Route path="setup/*" element={<SetupLayout />} /> */}

        {/* <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="ai-list" element={<AiListPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="logout" element={<LogoutPage />} /> */}

        {/* Route 404 (nếu không khớp) */}
        <Route path="*" element={<div>404 Page Not Found</div>} />
      </Route>

      {/* (Bạn có thể thêm các trang không dùng Layout ở đây, ví dụ trang Login) */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
    </Routes>
  );
}

export default App;
