import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
// File JSON chứa các bản dịch
// Bạn nên tách ra các file riêng (ví dụ: public/locales/en/translation.json)
const resources = {
  us: {
    translation: {
      welcome: "Welcome to my website",
      hello: "Hello",
      toggleDarkMode: "Toogle dark mode",
      toggleLightMode: "Toogle light mode",
      language: "Language",
      startStopMission: "Mission start/stop",
    },
  },
  vn: {
    translation: {
      welcome: "Chào mừng đến với website của tôi",
      hello: "Xin chào",
      toggleDarkMode: "Chuyển đổi chế độ tối",
      toggleLightMode: "Chuyển đổi chế độ sáng",
      language: "Ngôn ngữ",
      startStopMission: "Nhiệm vụ bắt đầu/dừng",
    },
  },
};

i18n
  .use(HttpApi)
  .use(LanguageDetector) // Phát hiện ngôn ngữ
  .use(initReactI18next) // Kết nối với react-i18next
  .init({
    // resources,
    detection: {
      // Thứ tự i18next sẽ tìm ngôn ngữ:
      // Ở đây chúng ta chỉ định rõ là: localStorage -> Ngôn ngữ trình duyệt
      order: ['localStorage', 'navigator'],
      
      // Tên key mà nó sẽ tìm và lưu trong localStorage
      lookupLocalStorage: 'i18nextLng', 

      // Chỉ định rõ là sẽ cache vào localStorage
      caches: ['localStorage'], 
    },
    keySeparator: ".",
    // lng: "vi", // Ngôn ngữ mặc định nếu không phát hiện được
    fallbackLng: "en", // Ngôn ngữ dự phòng
    interpolation: {
      escapeValue: false, // React đã tự chống XSS
    },
    backend: {
      // Đường dẫn đến file JSON, {{lng}} và {{ns}} là các biến
      // ví dụ: /locales/en/translation.json
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18n;
