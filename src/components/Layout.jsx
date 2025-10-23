import { Outlet } from "react-router-dom"; // 1. Import Outlet
import FlowbiteHeader from "./FlowbiteHeader"; // 2. Import Header
import Sidebar from "./Sidebar"; // 3. Import Sidebar

const Layout = () => {
  return (
    // Container chính: flex-col, full chiều cao màn hình
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header: Luôn ở trên cùng */}
      <FlowbiteHeader />

      {/* Container cho Sidebar và Content:
        - flex-1: Lấp đầy không gian còn lại (dưới Header)
        - overflow-hidden: Ngăn cuộn ở cấp này
      */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Cố định bên trái */}
        <Sidebar />

        {/* Vùng Content chính:
          - flex-1: Lấp đầy không gian còn lại (bên phải Sidebar)
          - overflow-y-auto: Chỉ cho phép vùng NÀY cuộn khi nội dung dài
          - p-6: Thêm padding cho vùng nội dung
        */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Outlet: Đây là nơi React Router sẽ render các trang con
              (như Dashboard.jsx, SetupLayout.jsx,...)
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
