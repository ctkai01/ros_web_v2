// src/contexts/ThemeContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";

// 1. Hàm để lấy theme ban đầu (khớp với logic trong index.html)
const getInitialTheme = () => {
  // Kiểm tra xem code có đang chạy trên trình duyệt không
  if (typeof window !== "undefined" && window.localStorage) {
    // 1. Ưu tiên: Lấy theme từ localStorage (nếu người dùng đã chọn)
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }

    // 2. Ưu tiên thứ 2: Kiểm tra cài đặt hệ thống
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  // 3. Mặc định: Luôn là 'light' nếu không có gì khớp
  return "light";
};

// 2. Tạo Context
const ThemeContext = createContext();

// 3. Tạo Provider (Component bọc ứng dụng)
export const ThemeProvider = ({ children }) => {
  // Khởi tạo state với theme ban đầu đã tính toán
  const [theme, setTheme] = useState(getInitialTheme);

  // 4. useEffect để áp dụng theme vào <html>
  useEffect(() => {
    const root = window.document.documentElement; // Lấy thẻ <html>

    // Áp dụng class:
    // Nếu theme là 'dark', thêm class 'dark'. Ngược lại, xóa nó đi.
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Lưu lựa chọn mới nhất của người dùng vào localStorage
    localStorage.setItem("theme", theme);
  }, [theme]); // <-- Hook này sẽ chạy lại mỗi khi `theme` thay đổi

  // 5. Hàm để chuyển đổi theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Cung cấp state (theme) và hàm (toggleTheme) cho các component con
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 6. Custom Hook để sử dụng (cho tiện)
export const useTheme = () => {
  return useContext(ThemeContext);
};
