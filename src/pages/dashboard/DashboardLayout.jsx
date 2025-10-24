// src/pages/dashboard/DashboardLayout.jsx

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronLeft,
  FaChevronRight,
  // Thêm icon cho các link con (bạn có thể đổi tùy ý)
  FaTachometerAlt,
  FaUser,
  FaVial,
} from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";

/**
 * Component Link con (DÙNG MÀU SUB-MENU)
 * Component này giống hệt component trong SetupLayout
 */
const SubMenuLink = ({ to, icon, label, isExpanded }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center p-3 rounded-lg transition-all duration-200 ${
      isExpanded ? "space-x-4" : "justify-center"
    } ${
      isActive
        ? "bg-submenu-active text-submenu-text-active font-semibold" // Style active
        : "text-submenu-text hover:bg-submenu-hover" // Style mặc định
    }`;

  return (
    <li>
      <NavLink to={to} className={navLinkClass}>
        <div className="flex-shrink-0 w-6 flex justify-center">{icon}</div>
        <span
          className={`overflow-hidden transition-all duration-200 ${
            isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          {label}
        </span>
      </NavLink>
    </li>
  );
};

/**
 * Component Layout chính cho trang Dashboard (DÙNG MÀU SUB-MENU)
 */
const DashboardLayout = () => {
  const { t } = useTranslation();

  // State `isExpanded` này chỉ ảnh hưởng đến sub-menu của Dashboard
  const [isExpanded, setIsExpanded] = useState(true);

  // Danh sách link con (của Dashboard)
  const dashboardLinks = [
    {
      to: "dashboard",
      label: t("dashboard.links.dashboard"),
      icon: <FaTachometerAlt size={20} />,
    },
    {
      to: "test",
      label: t("dashboard.links.test"),
      icon: <FaVial size={20} />,
    },
    { to: "nam", label: t("dashboard.links.nam"), icon: <FaUser size={20} /> },
  ];

  return (
    // Container này nằm BÊN TRONG <main> của Layout.jsx chính
    <div className="flex h-full shadow-lg rounded-lg overflow-hidden">
      {/* 1. Sub-menu (Menu con có thể thu gọn) */}
      <aside
        // DÙNG MÀU SUB-MENU từ index.css
        className={`flex flex-col flex-shrink-0 bg-submenu-bg text-white transition-all duration-300 ease-in-out
        ${isExpanded ? "w-64" : "w-20"}`}
      >
        {/* Nút Toggle (thu/mở) */}
        <div
          className={`flex items-center border-b border-submenu-border transition-all duration-300 ${
            isExpanded ? "justify-end" : "justify-center"
          } h-16`} // Cùng chiều cao với Header
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 m-2 rounded-md text-submenu-text hover:bg-submenu-hover"
            aria-label={t("sidebar.toggle")}
          >
            {isExpanded ? (
              <FaChevronLeft size={18} />
            ) : (
              <FaChevronRight size={18} />
            )}
          </button>
        </div>

        {/* Danh sách link con */}
        <nav className="flex-1 mt-4 px-2">
          <ul className="space-y-2">
            {dashboardLinks.map((link) => (
              <SubMenuLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                isExpanded={isExpanded}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* 2. Vùng nội dung cho các trang con */}
      <div className="flex-1 p-6 bg-background dark:bg-gray-800 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
