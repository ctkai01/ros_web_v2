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
import { BsJoystick } from "react-icons/bs";
import { FaMoon, FaPlay, FaSun } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { IoPersonSharp } from "react-icons/io5";
import ddeLogo from "../assets/logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { languages } from "./../constants";

function MainHeader() {
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
        <img src={ddeLogo} className="mr-3 h-6 sm:h-9" alt="DDE Logo" />
      </NavbarBrand>

      <div className="flex md:order-2 space-x-3 items-center">
        <Tooltip content={t("header.startStopMission")}>
          <Button color="light" size="lg" className="cursor-pointer">
            <FaPlay color="#0ac028" />
          </Button>
        </Tooltip>

        <div className="flex items-center bg-secondary rounded-md px-3 py-3">
          <span className="mr-3 text-sm font-medium text-white">
            No Mission Running
          </span>
          <Badge color="gray" className="text-sm">
            UNKNOWN
          </Badge>
        </div>

        <Badge color="success" className="text-sm">
          ALL OK
        </Badge>
      </div>

      {/* 3. Phần phải (Ngôn ngữ, User, Cảnh báo) */}
      {/* 'md:order-3' đảm bảo phần này luôn ở cuối cùng bên phải */}
      <div className="flex items-center space-x-4 md:order-3">
        <Tooltip content={t("header.language")} placement="auto">
          <Dropdown
            inline
            label=""
            dismissOnClick={false}
            renderTrigger={() => (
              <div className="cursor-pointer flex items-center space-x-1.5 text-foreground p-2 rounded-lg hover:bg-gray-100  dark:hover:bg-gray-700">
                <img
                  src={`/flags/${i18n.language}.svg`}
                  alt={i18n.language}
                  className="w-8 h-8"
                />
              </div>
            )}
          >
            {languages.map((lang) => {
              return (
                <DropdownItem onClick={() => changeLanguage(lang)}>
                  <img
                    src={`/flags/${lang}.svg`}
                    alt={lang}
                    className="w-8 h-8"
                  />
                </DropdownItem>
              );
            })}
          </Dropdown>
        </Tooltip>
        <Tooltip
          content={
            theme === "light"
              ? t("header.toggleDarkMode")
              : t("header.toggleLightMode")
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

        <Tooltip content={t("header.roleText")}>
          <button
            className="flex text-sm gap-2 items-center p-4 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <IoPersonSharp
              className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              size={16}
            />
            Admin
          </button>
        </Tooltip>
        <Tooltip content={t("header.joyStick")}>
          <button
            className="flex text-sm gap-2 items-center p-4 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <BsJoystick
              className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              size={16}
            />
          </button>
        </Tooltip>
        <Tooltip
          content={`${t("header.voltage")}: 0.0V | ${t(
            "header.current"
          )}: 0.0A | ${t("header.power")}: 0.0W | ${t(
            "header.teamperatureNotAvailable"
          )}`}
        >
          <button
            className="flex text-sm gap-2 items-center p-4 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            <IoIosWarning
              className="text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              size={16}
            />
            {t("header.low")} 0%
          </button>
        </Tooltip>
      </div>

      <NavbarToggle />
    </Navbar>
  );
}
export default MainHeader;
