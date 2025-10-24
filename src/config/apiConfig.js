const OBJECT_LIST_API_URL = "http://192.168.0.23:8100/list_object_data";
const ACTION_FOLLOW_HUMAN_API_URL =
  "http://192.168.0.23:8100/enable_follow_human";
const ACTION_FOLLOW_OBJECT_API_URL =
  "http://192.168.0.23:8100/data_object_follow";
const ACTION_DECTECT_API_URL = "http://192.168.0.23:8100/detect_and_tracking";
const CAPTURE_FRAME_API_URL = "http://192.168.0.23:8101/current_frame";
// http://192.168.0.23:8100/detect_and_tracking

export const fetchObjectList = async () => {
  const response = await fetch(OBJECT_LIST_API_URL, {
    method: "GET",
    cache: "no-store", // <-- Dòng quan trọng nhất
  });
  if (!response.ok) {
    // Nếu response không thành công (vd: 404, 500), ném ra lỗi
    // để component có thể bắt và xử lý.
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi response thành JSON và trả về
  const data = await response.json();
  return data;
};

// curl -X POST "http://192.168.0.23:8100/data_object_follow" \
//   -H "Content-Type: application/json" \
//   -d '{"data": "person:1"}'

// curl -X POST "http://192.168.0.23:8100/enable_follow_human" \
//   -H "Content-Type: application/json" \
//   -d '{"data": "start_follow"}'

// curl -X POST "http://192.168.0.23:8100/enable_follow_human" \
//   -H "Content-Type: application/json" \
//   -d '{"data": "stop_follow"}'
export const sendStartFollow = async () => {
  const postData = {
    data: "start_follow",
  };
  const response = await fetch(ACTION_FOLLOW_HUMAN_API_URL, {
    // 1. Chỉ định phương thức là POST
    method: "POST",

    // 2. Thiết lập header, tương đương với -H "Content-Type: application/json"
    headers: {
      "Content-Type": "application/json",
    },

    // 3. Đính kèm dữ liệu, đã được chuyển thành chuỗi JSON
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // Ném ra lỗi nếu có vấn đề từ server (vd: 404, 500)
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi phản hồi từ server thành JSON và trả về
  const responseData = await response.json();
  // console.log("Phản hồi thành công:", responseData);
  return responseData;
};

export const sendStartDetection = async () => {
  const postData = {
    data: "run",
  };
  const response = await fetch(ACTION_DECTECT_API_URL, {
    // 1. Chỉ định phương thức là POST
    method: "POST",

    // 2. Thiết lập header, tương đương với -H "Content-Type: application/json"
    headers: {
      "Content-Type": "application/json",
    },

    // 3. Đính kèm dữ liệu, đã được chuyển thành chuỗi JSON
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // Ném ra lỗi nếu có vấn đề từ server (vd: 404, 500)
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi phản hồi từ server thành JSON và trả về
  const responseData = await response.json();
  // console.log("Phản hồi thành công:", responseData);
  return responseData;
};

export const sendStopDetection = async () => {
  const postData = {
    data: "stop",
  };
  const response = await fetch(ACTION_DECTECT_API_URL, {
    // 1. Chỉ định phương thức là POST
    method: "POST",

    // 2. Thiết lập header, tương đương với -H "Content-Type: application/json"
    headers: {
      "Content-Type": "application/json",
    },

    // 3. Đính kèm dữ liệu, đã được chuyển thành chuỗi JSON
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // Ném ra lỗi nếu có vấn đề từ server (vd: 404, 500)
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi phản hồi từ server thành JSON và trả về
  const responseData = await response.json();
  // console.log("Phản hồi thành công:", responseData);
  return responseData;
};

export const sendStopFollow = async () => {
  const postData = {
    data: "stop_follow",
  };
  const response = await fetch(ACTION_FOLLOW_HUMAN_API_URL, {
    // 1. Chỉ định phương thức là POST
    method: "POST",

    // 2. Thiết lập header, tương đương với -H "Content-Type: application/json"
    headers: {
      "Content-Type": "application/json",
    },

    // 3. Đính kèm dữ liệu, đã được chuyển thành chuỗi JSON
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // Ném ra lỗi nếu có vấn đề từ server (vd: 404, 500)
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi phản hồi từ server thành JSON và trả về
  const responseData = await response.json();
  // console.log("Phản hồi thành công:", responseData);
  return responseData;
};

export const sendFollowObjectData = async (key) => {
  const postData = {
    data: key,
  };
  const response = await fetch(ACTION_FOLLOW_OBJECT_API_URL, {
    // 1. Chỉ định phương thức là POST
    method: "POST",

    // 2. Thiết lập header, tương đương với -H "Content-Type: application/json"
    headers: {
      "Content-Type": "application/json",
    },

    // 3. Đính kèm dữ liệu, đã được chuyển thành chuỗi JSON
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // Ném ra lỗi nếu có vấn đề từ server (vd: 404, 500)
    throw new Error(`Lỗi HTTP: ${response.status}`);
  }

  // Chuyển đổi phản hồi từ server thành JSON và trả về
  const responseData = await response.json();
  // console.log("Phản hồi thành công:", responseData);
  return responseData;
};

export const sendCaptureFrame = async () => {
  const response = await fetch(CAPTURE_FRAME_API_URL);

  if (!response.ok) {
    // Nếu response không thành công (vd: 404, 500), ném ra lỗi
    // để component có thể bắt và xử lý.
    throw new Error(`Error HTTP: ${response.status}`);
  }

  const imageBlob = await response.blob();
  return imageBlob;
};
