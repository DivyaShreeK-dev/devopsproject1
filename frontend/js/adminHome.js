const admin = requireRole("admin");
document.getElementById("adminWelcomeText").textContent = `Welcome, ${admin.name}`;
const adminHeroName = document.getElementById("adminHeroName");
if (adminHeroName) {
  adminHeroName.textContent = admin.name;
}

const adminStatsGrid = document.getElementById("adminStatsGrid");
const adminActivityChart = document.getElementById("adminActivityChart");
const adminDistribution = document.getElementById("adminDistribution");
const adminRecentSubmissions = document.getElementById("adminRecentSubmissions");

async function loadAdminHome() {
  try {
    const data = await API.request("/api/admin/overview");
    renderStats(data.stats);
    renderDistribution(data.stats);
    renderActivityChart(data.activityChart);
    renderRecentSubmissions(data.recentSubmissions);
  } catch (error) {
    adminRecentSubmissions.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

function renderStats(stats) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers, tone: "tone-blue" },
    { label: "Assignments", value: stats.totalAssignments, tone: "tone-amber" },
    { label: "Submissions", value: stats.submittedCount + stats.gradedCount, tone: "tone-green" },
    { label: "Pending Alerts", value: stats.pendingCount, tone: "tone-rose" }
  ];

  adminStatsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card ${card.tone}">
          <h3>${card.label}</h3>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderDistribution(stats) {
  const items = [
    { label: "Students", value: stats.totalStudents },
    { label: "Teachers", value: stats.totalTeachers },
    { label: "Admins", value: stats.totalAdmins }
  ];

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  adminDistribution.innerHTML = items
    .map((item) => {
      const percentage = Math.round((item.value / total) * 100);
      return `
        <article class="mark-card">
          <div class="card-top">
            <h3>${item.label}</h3>
            <strong>${percentage}%</strong>
          </div>
          <p class="meta">${item.value} total</p>
        </article>
      `;
    })
    .join("");
}

function renderRecentSubmissions(items) {
  if (!items.length) {
    adminRecentSubmissions.innerHTML = "<p class='meta'>No recent activity yet.</p>";
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

function renderActivityChart(points) {
  const ctx = adminActivityChart.getContext("2d");
  const width = adminActivityChart.width = adminActivityChart.clientWidth || 720;
  const height = adminActivityChart.height = 220;

  ctx.clearRect(0, 0, width, height);
  const padding = 32;
  const maxValue = Math.max(...points.map((item) => item.value), 1);
  const gap = 16;
  const barWidth = (width - padding * 2 - gap * (points.length - 1)) / points.length;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const y = padding + ((height - padding * 2) / 3) * i;
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
  }
  ctx.stroke();

  points.forEach((point, index) => {
    const x = padding + index * (barWidth + gap);
    const barHeight = ((height - padding * 2 - 24) * point.value) / maxValue;
    const y = height - padding - barHeight;

    ctx.fillStyle = "#6ea8fe";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#dce7ff";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(String(point.value), x + barWidth / 2, y - 8);
    ctx.fillText(point.label, x + barWidth / 2, height - 10);
  });
}

loadAdminHome();
