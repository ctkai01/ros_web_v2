import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// File JSON chứa các bản dịch
// Bạn nên tách ra các file riêng (ví dụ: public/locales/en/translation.json)
const resources = {
  us: {
    translation: {
      welcome: "Welcome to my website",
      hello: "Hello",
      toggleDarkMode: "Toogle dark mode",
      toggleLightMode: "Toogle light mode",
    },
  },
  vn: {
    translation: {
      welcome: "Chào mừng đến với website của tôi",
      hello: "Xin chào",
      toggleDarkMode: "Chuyển đổi chế độ tối",
      toggleLightMode: "Chuyển đổi chế độ sáng",
    },
  },
};

i18n
  .use(LanguageDetector) // Phát hiện ngôn ngữ
  .use(initReactI18next) // Kết nối với react-i18next
  .init({
    resources,
    lng: "vn", // Ngôn ngữ mặc định nếu không phát hiện được
    fallbackLng: "us", // Ngôn ngữ dự phòng
    interpolation: {
      escapeValue: false, // React đã tự chống XSS
    },
  });

export default i18n;
