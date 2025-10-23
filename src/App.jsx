// src/App.jsx
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout"; // <-- 1. Import Layout của bạn

// 2. Import các trang của bạn (hoặc tạo giả để test)
// Ví dụ: import DashboardPage from './pages/Dashboard';
// Hoặc tạo giả:
const DashboardPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">Dashboard Content</h1>
);
const MonitoringPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">Monitoring Content</h1>
);
const AiListPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">AI List Content</h1>
);
const SystemPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">System Content</h1>
);
const HelpPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">Help Content</h1>
);
const LogoutPage = () => (
  <h1 className="text-3xl font-bold dark:text-white">Logout Content</h1>
);

// Chúng ta sẽ import Layout của Setup như đã nói
// import SetupLayout from "./pages/setup/SetupLayout";

function App() {
  return (
    <Routes>
      {/* 3. TẠO MỘT ROUTE CHA DÙNG `Layout` */}
      <Route path="/" element={<Layout />}>
        {/* 4. LỒNG TẤT CẢ CÁC TRANG CON VÀO TRONG */}

        {/* Route mặc định (khi vào "/") sẽ tự chuyển đến "/dashboard" */}
        {/* <Route index element={<Navigate to="/dashboard" replace />} /> */}

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
