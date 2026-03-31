const tabButtons = document.querySelectorAll(".tab-btn");
const formPanels = document.querySelectorAll(".form-panel");
const authMessage = document.getElementById("authMessage");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.remove("active"));
    formPanels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(`${button.dataset.tab}Form`).classList.add("active");
    authMessage.textContent = "";
  });
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "Signing you in...";

  try {
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    const data = await API.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveSession(data.token, data.user);
    window.location.href =
      data.user.role === "teacher"
        ? "/teacher.html"
        : data.user.role === "admin"
          ? "/admin.html"
          : "/dashboard.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

document.getElementById("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "Creating your account...";

  try {
    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData.entries());
    const data = await API.request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveSession(data.token, data.user);
    window.location.href =
      data.user.role === "teacher"
        ? "/teacher.html"
        : data.user.role === "admin"
          ? "/admin.html"
          : "/dashboard.html";
  } catch (error) {
    authMessage.textContent = error.message;
  }
});
