import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCog,
  FaChartBar,
  FaRobot,
  FaList,
  FaQuestionCircle,
  FaSignOutAlt,
  FaChevronLeft,
} from "react-icons/fa"; // Import các icon bạn cần

// 1. Tạo một component Link con để tái sử dụng
const SidebarLink = ({ to, icon, label }) => {
  // Hàm này của NavLink sẽ trả về class, tùy thuộc vào link có active hay không
  const navLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
      isActive
        ? "bg-slate-700 text-white" // Style khi link đang active
        : "text-blue-300 hover:bg-blue-800 hover:text-white" // Style mặc định
    }`;

  return (
    <li>
      <NavLink to={to} className={navLinkClass}>
        {icon}
        <span className="text-xs font-medium mt-1.5 uppercase tracking-wider">
          {label}
        </span>
      </NavLink>
    </li>
  );
};

// 2. Component Sidebar chính
const Sidebar = () => {
  return (
    // Sidebar container: w-24 (chiều rộng 24 * 0.25rem = 6rem)
    <aside className="w-24 bg-blue-900 text-white flex flex-col flex-shrink-0">
      {/* Nút thu gọn (như trong ảnh) */}
      <div className="flex items-center justify-center h-16 border-b border-blue-800">
        <button className="p-2 rounded-md text-blue-300 hover:bg-blue-800 hover:text-white">
          <FaChevronLeft size={18} />
        </button>
      </div>

      {/* 3. Danh sách link chính (flex-1 để đẩy các link dưới cùng xuống) */}
      <nav className="flex-1 mt-4">
        <ul className="space-y-2 px-2">
          <SidebarLink
            to="/dashboard"
            icon={<FaTachometerAlt size={22} />}
            label="Dashboard"
          />
          <SidebarLink to="/setup" icon={<FaCog size={22} />} label="Setup" />
          <SidebarLink
            to="/monitoring"
            icon={<FaChartBar size={22} />}
            label="Monitoring"
          />
          <SidebarLink
            to="/ai-list"
            icon={<FaRobot size={22} />}
            label="AI List"
          />
          <SidebarLink
            to="/system"
            icon={<FaList size={22} />}
            label="System"
          />
        </ul>
      </nav>

      {/* 4. Các link dưới cùng (Help, Logout) */}
      <div className="mb-4">
        <ul className="space-y-2 px-2">
          <SidebarLink
            to="/help"
            icon={<FaQuestionCircle size={22} />}
            label="Help"
          />
          <SidebarLink
            to="/logout"
            icon={<FaSignOutAlt size={22} />}
            label="Logout"
          />
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
