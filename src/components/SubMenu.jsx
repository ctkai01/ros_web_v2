import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { menuConfig } from "../config/menuConfig.jsx"; // 1. Import config

/**
 * Component Link con (Dùng màu Sub-menu)
 */
const SubMenuLink = ({ to, icon, label, isExpanded }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center p-3 rounded-lg transition-all duration-200 ${
      isExpanded ? "space-x-4" : "justify-center"
    } ${
      isActive
        ? "bg-submenu-active text-submenu-text-active font-semibold"
        : "text-submenu-text hover:bg-submenu-hover hover:font-bold"
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
 * Component SubMenu chính
 * - Nhận `menuKey` (ví dụ: 'dashboard') từ Layout.jsx
 */
const SubMenu = ({ menuKey }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  // 2. Lấy dữ liệu menu từ file config
  const currentMenu = menuKey ? menuConfig[menuKey] : null;

  // 3. Nếu không có key (hover ra ngoài) hoặc key không có sub-menu
  if (!currentMenu) {
    // Render một component trống, không chiếm diện tích
    return <aside className="w-0 transition-all duration-300 ease-in-out" />;
  }

  // 4. Nếu có, render sub-menu
  return (
    <aside
      className={`flex flex-col flex-shrink-0 bg-submenu-bg text-white transition-all duration-300 ease-in-out
      ${isExpanded ? "w-64" : "w-20"}`}
    >
      {/* Nút Toggle */}
      <div className="flex items-center border-b border-submenu-border h-16">
        <button
          className="p-2 m-2 rounded-md text-submenu-text"
        >
          {/* {isExpanded ? (
            <FaChevronLeft size={18} />
          ) : (
            <FaChevronRight size={18} />
          )} */}
        </button>
        {/* Tiêu đề (chỉ hiện khi mở rộng) */}
        <span
          className={`font-bold text-xl text-submenu-text transition-all duration-200 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          {t(currentMenu.title)}
        </span>
      </div>

      {/* Danh sách link con */}
      <nav className="flex-1 mt-4 px-2">
        <ul className="space-y-2">
          {currentMenu.links.map((link) => (
            <SubMenuLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={t(link.label)}
              isExpanded={isExpanded}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SubMenu;
