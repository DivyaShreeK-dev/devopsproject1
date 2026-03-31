const admin = requireRole("admin");
document.getElementById("adminWelcomeText").textContent = `Welcome, ${admin.name}`;

const adminStatsGrid = document.getElementById("adminStatsGrid");
const adminUsers = document.getElementById("adminUsers");
const adminRecentSubmissions = document.getElementById("adminRecentSubmissions");
const alertForm = document.getElementById("alertForm");
const adminMessage = document.getElementById("adminMessage");
const adminUserSearch = document.getElementById("adminUserSearch");
const adminRoleFilter = document.getElementById("adminRoleFilter");

let allUsers = [];

alertForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminMessage.textContent = "Publishing alert...";

  try {
    const payload = Object.fromEntries(new FormData(alertForm).entries());
    if (!payload.expiresAt) {
      delete payload.expiresAt;
    }

    const data = await API.request("/api/alerts", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    adminMessage.textContent = data.message;
    alertForm.reset();
    loadAdminDashboard();
  } catch (error) {
    adminMessage.textContent = error.message;
  }
});

async function loadAdminDashboard() {
  try {
    const data = await API.request("/api/admin/overview");
    renderAdminStats(data.stats);
    allUsers = data.users;
    applyUserFilters();
    renderRecentSubmissions(data.recentSubmissions);
  } catch (error) {
    adminMessage.textContent = error.message;
  }
}

function renderAdminStats(stats) {
  const cards = [
    { label: "Users", value: stats.totalUsers },
    { label: "Students", value: stats.totalStudents },
    { label: "Teachers", value: stats.totalTeachers },
    { label: "Assignments", value: stats.totalAssignments }
  ];

  adminStatsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <h3>${card.label}</h3>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderUsers(users) {
  adminUsers.innerHTML = users
    .map(
      (userItem) => `
        <article class="submission-card">
          <div class="card-top">
            <div>
              <h3>${userItem.name}</h3>
              <p class="meta">${userItem.email}</p>
            </div>
            <span class="status-pill role-badge role-${userItem.role}">${userItem.role}</span>
          </div>
          <div class="inline-actions">
            <select data-user-id="${userItem._id}" class="role-select">
              <option value="student" ${userItem.role === "student" ? "selected" : ""}>Student</option>
              <option value="teacher" ${userItem.role === "teacher" ? "selected" : ""}>Teacher</option>
              <option value="admin" ${userItem.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", handleRoleUpdate);
  });
}

function renderRecentSubmissions(items) {
  if (!items.length) {
    adminRecentSubmissions.innerHTML = "<p class='meta'>No recent submission activity yet.</p>";
    return;
  }

  adminRecentSubmissions.innerHTML = items
    .map(
      (item) => `
        <article class="submission-card">
          <div class="card-top">
            <div>
              <h3>${item.assignment ? item.assignment.title : "Assignment"}</h3>
              <p class="meta">${item.student ? item.student.name : "Student"} • ${item.student ? item.student.email : ""}</p>
            </div>
            ${statusBadge(item.status)}
          </div>
          <p class="meta">Updated ${formatDate(item.updatedAt)}</p>
        </article>
      `
    )
    .join("");
}

async function handleRoleUpdate(event) {
  const select = event.currentTarget;

  try {
    await API.request(`/api/admin/users/${select.dataset.userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: select.value })
    });
    adminMessage.textContent = "User role updated successfully.";
    loadAdminDashboard();
  } catch (error) {
    adminMessage.textContent = error.message;
  }
}

function applyUserFilters() {
  const query = adminUserSearch.value.trim().toLowerCase();
  const role = adminRoleFilter.value;

  const filteredUsers = allUsers.filter((userItem) => {
    const matchesRole = role === "all" || userItem.role === role;
    const matchesQuery =
      !query ||
      userItem.name.toLowerCase().includes(query) ||
      userItem.email.toLowerCase().includes(query);

    return matchesRole && matchesQuery;
  });

  renderUsers(filteredUsers);
}

loadAdminDashboard();
adminUserSearch.addEventListener("input", applyUserFilters);
adminRoleFilter.addEventListener("change", applyUserFilters);
