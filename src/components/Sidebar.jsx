import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaList,
  FaQuestionCircle,
  FaRobot,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/**
 * Component Link con (Đã được viết lại)
 * - Nhận `isActive` từ prop, thay vì tự tính
 * - Dùng <button> thay vì <NavLink>
 * - Gửi sự kiện `onHover` và `onClick`
 */
const SidebarLink = ({ to, icon, label, isExpanded, isActive, onHover }) => {
  const navigate = useNavigate(); // Hook để điều hướng

  // 1. Xác định 'key' của menu (ví dụ: '/dashboard/main' -> 'dashboard')
  const menuKey = to.split("/")[1];

  // 2. Xác định class active/inactive
  const activeClass = isActive
    ? "bg-sidebar-active text-sidebar-text-active font-bold" // Style active
    : "text-sidebar-text hover:bg-sidebar-hover hover:font-bold"; // Style mặc định

  // 3. Class chung
  const linkClass = `flex cursor-pointer items-center p-3 rounded-lg transition-all duration-200 w-full ${
    isExpanded ? "space-x-4" : "justify-center"
  } ${activeClass}`;

  return (
    <li>
      <button
        className={linkClass}
        onMouseEnter={() => onHover(menuKey)} // 4. Gửi sự kiện hover
        onClick={() => navigate(to)} // 5. Điều hướng khi click
      >
        <div className="flex-shrink-0 w-6 flex justify-center">{icon}</div>
        <span
          className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {label}
        </span>
      </button>
    </li>
  );
};

/**
 * Component Sidebar chính (Đã cập nhật)
 * - Nhận `onHover` và `activeGroup` từ Layout
 */
const Sidebar = ({ onHover, activeGroup }) => {
  const { t } = useTranslation();
  // State này vẫn quản lý việc thu gọn/mở rộng của Sidebar chính
  const [isExpanded, setIsExpanded] = useState(true);

  // 6. CẬP NHẬT `to` paths: Phải trỏ đến trang con mặc định
  const mainLinks = [
    {
      to: "/dashboard/list",
      label: t("sidebar.dashboard.title"),
      icon: <FaTachometerAlt size={20} />,
    },
    {
      to: "/setup/schedule",
      label: t("sidebar.setup.title"),
      icon: <FaCog size={20} />,
    },
    // (Cập nhật các link khác nếu chúng có sub-menu)
    {
      to: "/monitoring",
      label: t("sidebar.monitoring.title"),
      icon: <FaChartBar size={20} />,
    },
    {
      to: "/ai-list",
      label: t("sidebar.aiList.title"),
      icon: <FaRobot size={20} />,
    },
    {
      to: "/system",
      label: t("sidebar.system.title"),
      icon: <FaList size={20} />,
    },
  ];

  const bottomLinks = [
    {
      to: "/help",
      label: t("sidebar.help"),
      icon: <FaQuestionCircle size={20} />,
    },
    {
      to: "/logout",
      label: t("sidebar.logout"),
      icon: <FaSignOutAlt size={20} />,
    },
  ];

  return (
    // Container chính:
    // **Lưu ý: Không có onMouseLeave ở đây** (nó đã được chuyển ra wrapper trong Layout.jsx)
    <aside
      className={`flex flex-col flex-shrink-0 bg-sidebar-bg text-white transition-all duration-300 ease-in-out
      ${isExpanded ? "w-64" : "w-20"}`}
    >
      {/* Nút Toggle (thu/mở) */}
      <div
        className={`flex items-center border-b border-sidebar-border transition-all duration-300 ${
          isExpanded ? "justify-end" : "justify-center"
        } h-16`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 m-2 rounded-md text-sidebar-text hover:bg-sidebar-hover"
          aria-label={t("sidebar.toggle")}
        >
          {isExpanded ? (
            <FaChevronLeft size={18} />
          ) : (
            <FaChevronRight size={18} />
          )}
        </button>
      </div>

      {/* Danh sách link chính */}
      <nav className="flex-1 mt-4 px-2">
        <ul className="space-y-2">
          {mainLinks.map((link) => {
            const menuKey = link.to.split("/")[1]; // Lấy key (ví dụ: 'dashboard')
            return (
              <SidebarLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                isExpanded={isExpanded}
                onHover={onHover} // 8. Truyền onHover xuống
                isActive={activeGroup === menuKey} // 9. Quyết định active
              />
            );
          })}
        </ul>
      </nav>

      {/* Danh sách link dưới cùng */}
      <div className="mb-4 px-2">
        <ul className="space-y-2">
          {bottomLinks.map((link) => {
            const menuKey = link.to.split("/")[1];
            return (
              <SidebarLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                isExpanded={isExpanded}
                onHover={onHover} // (Sẽ gọi onHover(null) nếu key không có trong config)
                isActive={activeGroup === menuKey}
              />
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
