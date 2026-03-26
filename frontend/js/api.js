const API = {
  async request(url, options = {}) {
    const token = localStorage.getItem("oas_token");
    const headers = options.headers || {};

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }
};
