function getUser() {
  const raw = localStorage.getItem("oas_user");
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem("oas_token", token);
  localStorage.setItem("oas_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("oas_token");
  localStorage.removeItem("oas_user");
}

function requireRole(role) {
  const user = getUser();
  if (!user || user.role !== role) {
    window.location.href = "/";
  }
  return user;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function statusBadge(status) {
  return `<span class="status-pill status-${status}">${status}</span>`;
}

document.addEventListener("click", (event) => {
  if (event.target.id === "logoutBtn") {
    clearSession();
    window.location.href = "/";
  }
});
