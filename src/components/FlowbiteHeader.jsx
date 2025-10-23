// src/components/FlowbiteHeader.jsx

import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  Navbar,
  NavbarBrand,
  NavbarToggle,
  Tooltip,
} from "flowbite-react";
import { useTranslation } from "react-i18next";
import { FaBell, FaMoon, FaPlay, FaSun } from "react-icons/fa";
import ddeLogo from "../assets/logo.png";
import { useTheme } from "../contexts/ThemeContext";
function FlowbiteHeader() {
  // const theme = "light"; // Giả sử ta lấy giá trị theme từ context hoặc state
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme(); // Giả sử ta lấy hàm toggleTheme từ context hoặc props
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  console.log("Current language:", i18n.language);
  console.log("Current theme:", theme);
  return (
    // Chúng ta thêm 'theme' prop để override màu nền mặc định của Flowbite
    <Navbar fluid theme={{ root: { base: "bg-white text-black" } }}>
      {/* 1. Logo (Bên trái) */}
      <NavbarBrand href="#">
        {/* <div className="w-8 h-8 mr-3 bg-white rounded-md flex items-center justify-center text-blue-900 font-bold">
          DDE
        </div>
        <span className="self-center whitespace-nowrap text-lg font-semibold text-black">
          DATA DESIGN ENGINEERING
        </span> */}
        <img src={ddeLogo} className="mr-3 h-6 sm:h-9" alt="DDE Logo" />
      </NavbarBrand>

      {/* 2. Phần giữa (Nút bấm & Trạng thái) */}
      {/* 'md:order-2' để xếp phần này ở giữa trên desktop */}
      <div className="flex md:order-2 space-x-3 items-center">
        <Button color="light" size="lg" className="cursor-pointer">
          <FaPlay color="#0ac028" />
          {/* <FaPlay className="h-4 w-4" /> */}
        </Button>

        <div className="flex items-center bg-secondary rounded-md px-3 py-3">
          <span className="mr-3 text-sm font-medium text-white">
            No Mission Running
          </span>
          <Badge color="gray" className="text-xs">
            UNKNOWN
          </Badge>
        </div>

        <Badge color="success" className="text-xs">
          ALL OK
        </Badge>
      </div>

      {/* 3. Phần phải (Ngôn ngữ, User, Cảnh báo) */}
      {/* 'md:order-3' đảm bảo phần này luôn ở cuối cùng bên phải */}
      <div className="flex items-center space-x-4 md:order-3">
        <Tooltip
          content={
            theme === "light" ? t("toggleDarkMode") : t("toggleLightMode")
          }
        >
          <button
            onClick={toggleTheme}
            className="p-4 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
          </button>
        </Tooltip>
        <Dropdown
          inline
          label={
            <div className="flex items-center space-x-1.5 text-foreground p-2 rounded-lg hover:bg-muted">
              {/* <FaFlag color="red" />
              <span>{i18n.language.toUpperCase()}</span> */}
              <img
                src={`https://flagcdn.com/${i18n.language}.svg`}
                alt={i18n.language}
                className="w-8 h-8"
              />
            </div>
          }
        >
          <DropdownItem onClick={() => changeLanguage("us")}>
            <img
              src={`https://flagcdn.com/us.svg`}
              alt={i18n.language}
              className="w-8 h-8"
            />
          </DropdownItem>
          <DropdownItem onClick={() => changeLanguage("vn")}>
            <img
              src={`https://flagcdn.com/vn.svg`}
              alt={i18n.language}
              className="w-8 h-8"
            />
          </DropdownItem>
        </Dropdown>

        {/* <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar
              alt="User settings"
              img="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
              rounded
              size="sm"
            />
          }
        >
          <Dropdown.Header>
            <span className="block text-sm">admin</span>
            <span className="block truncate text-sm font-medium">
              admin@email.com
            </span>
          </Dropdown.Header>
          <Dropdown.Item>Dashboard</Dropdown.Item>
          <Dropdown.Item>Settings</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item>Sign out</Dropdown.Item>
        </Dropdown> */}

        <div className="flex items-center space-x-1.5 text-red-400 font-semibold p-2">
          <FaBell />
          <span>Low 0%</span>
        </div>
      </div>

      <NavbarToggle />
    </Navbar>
  );
}

export default FlowbiteHeader;
