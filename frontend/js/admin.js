const admin = requireRole("admin");
const adminWelcomeText = document.getElementById("adminWelcomeText");
const adminHeroName = document.getElementById("adminHeroName");
const adminStatsGrid = document.getElementById("adminStatsGrid");
const adminUsers = document.getElementById("adminUsers");
const adminRecentSubmissions = document.getElementById("adminRecentSubmissions");
const alertForm = document.getElementById("alertForm");
const adminMessage = document.getElementById("adminMessage");
const adminUserSearch = document.getElementById("adminUserSearch");
const adminRoleFilter = document.getElementById("adminRoleFilter");
const adminUserForm = document.getElementById("adminUserForm");
const adminActivityChart = document.getElementById("adminActivityChart");

if (adminWelcomeText) {
  adminWelcomeText.textContent = `Welcome, ${admin.name}`;
}
if (adminHeroName) {
  adminHeroName.textContent = admin.name;
}

let allUsers = [];

if (adminUserForm) {
  adminUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (adminMessage) {
      adminMessage.textContent = "Adding user...";
    }

    try {
      const payload = Object.fromEntries(new FormData(adminUserForm).entries());
      const data = await API.request("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (adminMessage) {
        adminMessage.textContent = data.message;
      }
      adminUserForm.reset();
      loadAdminDashboard();
    } catch (error) {
      if (adminMessage) {
        adminMessage.textContent = error.message;
      }
    }
  });
}

if (alertForm) {
  alertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (adminMessage) {
      adminMessage.textContent = "Publishing alert...";
    }

    try {
      const payload = Object.fromEntries(new FormData(alertForm).entries());
      if (!payload.expiresAt) {
        delete payload.expiresAt;
      }

      const data = await API.request("/api/alerts", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (adminMessage) {
        adminMessage.textContent = data.message;
      }
      alertForm.reset();
    } catch (error) {
      if (adminMessage) {
        adminMessage.textContent = error.message;
      }
    }
  });
}

async function loadAdminDashboard() {
  try {
    const data = await API.request("/api/admin/overview");

    if (adminStatsGrid) {
      renderAdminStats(data.stats);
    }

    if (adminActivityChart) {
      renderActivityChart(data.activityChart);
    }

    if (adminRecentSubmissions) {
      renderRecentSubmissions(data.recentSubmissions);
    }

    if (adminUsers) {
      allUsers = data.users;
      applyUserFilters();
    }
  } catch (error) {
    if (adminMessage) {
      adminMessage.textContent = error.message;
    }
    if (adminUsers) {
      adminUsers.innerHTML = `<p class="message">${error.message}</p>`;
    }
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
  if (!adminUsers) {
    return;
  }

  adminUsers.innerHTML = users
    .map(
      (userItem) => `
        <article class="submission-card">
          <div class="card-top">
            <div>
              <h3>${userItem.name}</h3>
              <p class="meta">${userItem.email}</p>
            </div>
            <span class="status-pill role-${userItem.role}">${userItem.role}</span>
          </div>
          <div class="inline-actions">
            <select data-user-id="${userItem._id}" class="role-select">
              <option value="student" ${userItem.role === "student" ? "selected" : ""}>Student</option>
              <option value="teacher" ${userItem.role === "teacher" ? "selected" : ""}>Teacher</option>
              <option value="admin" ${userItem.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
            <button class="btn btn-secondary delete-user-btn" data-user-id="${userItem._id}" type="button">Delete</button>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", handleRoleUpdate);
  });

  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", () => handleUserDelete(button.dataset.userId));
  });
}

function renderRecentSubmissions(items) {
  if (!adminRecentSubmissions) {
    return;
  }

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
    if (adminMessage) {
      adminMessage.textContent = "User role updated successfully.";
    }
    loadAdminDashboard();
  } catch (error) {
    if (adminMessage) {
      adminMessage.textContent = error.message;
    }
  }
}

async function handleUserDelete(userId) {
  const confirmed = window.confirm("Delete this user? Related student submissions or teacher assignments will also be removed.");
  if (!confirmed) {
    return;
  }

  try {
    const data = await API.request(`/api/admin/users/${userId}`, {
      method: "DELETE"
    });
    if (adminMessage) {
      adminMessage.textContent = data.message;
    }
    loadAdminDashboard();
  } catch (error) {
    if (adminMessage) {
      adminMessage.textContent = error.message;
    }
  }
}

function applyUserFilters() {
  if (!adminUsers || !adminUserSearch || !adminRoleFilter) {
    return;
  }

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

function renderActivityChart(points) {
  if (!adminActivityChart) {
    return;
  }

  const ctx = adminActivityChart.getContext("2d");
  const width = adminActivityChart.width = adminActivityChart.clientWidth || 700;
  const height = adminActivityChart.height = 220;

  ctx.clearRect(0, 0, width, height);

  const padding = 36;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const barWidth = chartWidth / points.length - 18;

  ctx.font = "12px Segoe UI";
  ctx.fillStyle = "#607086";
  ctx.strokeStyle = "#d9e3ef";
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  points.forEach((point, index) => {
    const x = padding + index * (barWidth + 18) + 9;
    const barHeight = (point.value / maxValue) * (chartHeight - 18);
    const y = height - padding - barHeight;

    ctx.fillStyle = "#dbe8f8";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#1f4e8c";
    ctx.fillText(String(point.value), x + barWidth / 2 - 6, y - 8);

    ctx.fillStyle = "#607086";
    ctx.save();
    ctx.translate(x + barWidth / 2, height - padding + 16);
    ctx.rotate(-0.18);
    ctx.textAlign = "center";
    ctx.fillText(point.label, 0, 0);
    ctx.restore();
  });
}

loadAdminDashboard();

if (adminUserSearch) {
  adminUserSearch.addEventListener("input", applyUserFilters);
}

if (adminRoleFilter) {
  adminRoleFilter.addEventListener("change", applyUserFilters);
}
