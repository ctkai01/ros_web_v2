// src/config/menuConfig.js
import { FaCog, FaTachometerAlt, FaUser, FaVial } from "react-icons/fa";

export const menuConfig = {
  // Key 'dashboard' phải khớp với route
  dashboard: {
    title: "sidebar.dashboard.title", // Key i18n
    links: [
      {
        to: "/dashboard/list",
        label: "sidebar.dashboard.items.dashboard",
        icon: <FaTachometerAlt size={20} />,
      },
      {
        to: "/dashboard/test",
        label: "sidebar.dashboard.items.test",
        icon: <FaVial size={20} />,
      },
      {
        to: "/dashboard/nam",
        label: "sidebar.dashboard.items.nam",
        icon: <FaUser size={20} />,
      },
    ],
  },
  setup: {
    title: "sidebar.setup.title", // Key i18n
    links: [
      {
        to: "/setup/schedule",
        label: "sidebar.setup.items.schedule",
        icon: <FaCog size={20} />,
      },
      {
        to: "/setup/test",
        label: "sidebar.setup.items.test",
        icon: <FaVial size={20} />,
      },
    ],
  },
  // Thêm các mục khác (monitoring, ai-list...) nếu chúng có sub-menu
};
