import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MainHeader from "./FlowbiteHeader";
import Sidebar from "./Sidebar";
import SubMenu from "./SubMenu";

const Layout = () => {
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const location = useLocation();
  const activeGroup = location.pathname.split("/")[1] || null;

  // Logic của bạn: Chỉ hiển thị menu khi hover
  const menuToShow = hoveredMenu;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800">
      <MainHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* 1. TẠO MỘT VỎ BỌC (WRAPPER) CHO CẢ 2 MENU */}
        <div
          className="flex flex-shrink-0" // flex-shrink-0 để nó không bị co lại
          onMouseLeave={() => setHoveredMenu(null)} // 2. ĐẶT onMouseLeave TẠI ĐÂY
        >
          {/* === CỘT 1: SIDEBAR CHÍNH === */}
          <Sidebar
            onHover={setHoveredMenu}
            activeGroup={activeGroup}
            // (Chúng ta sẽ xóa onMouseLeave bên trong Sidebar ở bước 2)
          />

          {/* === CỘT 2: SUB-MENU ĐỘNG === */}
          {/* SubMenu bây giờ nằm "an toàn" bên trong vỏ bọc */}
          <SubMenu menuKey={menuToShow} />
        </div>

        {/* === CỘT 3: NỘI DUNG CHÍNH === */}
        <main
          className="flex-1 overflow-y-auto p-6"
          // Giữ sự kiện này để reset hover khi đi vào main
          onMouseEnter={() => setHoveredMenu(null)}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
