const user = requireRole("student");
document.getElementById("welcomeText").textContent = `Welcome, ${user.name}`;
const studentHeroName = document.getElementById("studentHeroName");
if (studentHeroName) {
  studentHeroName.textContent = user.name;
}
const studentView = document.body.dataset.studentView || "overview";

const statsGrid = document.getElementById("statsSection");
const assignmentsContainer = document.getElementById("assignmentsContainer");
const marksOverview = document.getElementById("marksOverview");
const reminderBanner = document.getElementById("reminderBanner");
const studentRecentActivity = document.getElementById("studentRecentActivity");
const studentRecentTable = document.getElementById("studentRecentTable");
const studentDeadlineCard = document.getElementById("studentDeadlineCard");
const assignmentSearch = document.getElementById("assignmentSearch");
const assignmentFilter = document.getElementById("assignmentFilter");

let allAssignments = [];

async function loadDashboard() {
  try {
    const [statsData, assignmentsData, reminderData] = await Promise.all([
      API.request("/api/stats/student"),
      API.request("/api/assignments"),
      API.request("/api/reminders/upcoming")
    ]);

    if (statsGrid) {
      renderStats(statsData.stats);
    }
    allAssignments = assignmentsData.assignments;
    applyInitialFilters();
    if (marksOverview) {
      renderMarks(statsData.stats.marksOverview);
    }
    if (studentRecentActivity) {
      renderRecentActivity(assignmentsData.assignments);
    }
    if (studentRecentTable) {
      renderRecentTable(assignmentsData.assignments);
    }
    if (studentDeadlineCard) {
      renderDeadlineCard(reminderData.reminders, assignmentsData.assignments);
    }
    if (reminderBanner) {
      renderReminders(reminderData.reminders);
    }
  } catch (error) {
    if (assignmentsContainer) {
      assignmentsContainer.innerHTML = `<p class="message">${error.message}</p>`;
    }
    if (marksOverview) {
      marksOverview.innerHTML = `<p class="message">${error.message}</p>`;
    }
  }
}

function renderStats(stats) {
  if (!statsGrid) {
    return;
  }

  const cards = [
    { label: "Total Assignments", value: stats.totalAssignments, tone: "tone-blue" },
    { label: "Completed", value: stats.completed, tone: "tone-green" },
    { label: "Pending", value: stats.pending, tone: "tone-amber" },
    { label: "Average Marks", value: `${stats.averageMarks}%`, tone: "tone-cyan" }
  ];

  statsGrid.innerHTML = cards
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

function renderReminders(reminders) {
  if (!reminderBanner) {
    return;
  }

  if (!reminders.length) {
    reminderBanner.classList.add("hidden");
    return;
  }

  reminderBanner.classList.remove("hidden");
  reminderBanner.innerHTML = reminders
    .map((item) => `<p><strong>${item.title}</strong> is due by ${formatDate(item.dueDate)}</p>`)
    .join("");
}

function renderMarks(marks) {
  if (!marksOverview) {
    return;
  }

  if (!marks.length) {
    marksOverview.innerHTML = "<p class='meta'>No graded assignments yet.</p>";
    return;
  }

  marksOverview.innerHTML = marks
    .map(
      (item) => `
      <article class="mark-card">
        <div class="card-top">
          <h3>${item.assignmentTitle}</h3>
          <strong>${item.marks}</strong>
        </div>
        <p class="meta">${item.feedback || "No feedback yet"}</p>
      </article>
    `
    )
    .join("");
}

function renderAssignments(assignments) {
  if (!assignmentsContainer) {
    return;
  }

  if (!assignments.length) {
    assignmentsContainer.innerHTML = "<p class='meta'>No assignments match your current filters.</p>";
    return;
  }

  assignmentsContainer.innerHTML = assignments
    .map((assignment) => {
      const submission = assignment.submission;
      const isPdf = submission && submission.fileType === "application/pdf";
      const urgency = getUrgencyLabel(assignment.dueDate, assignment.submissionStatus || "pending");

      return `
        <article class="assignment-card">
          <div class="card-top compact-card-top">
            <div>
              <h3>${assignment.title}</h3>
              <p class="meta">${assignment.subject} • Due ${formatDate(assignment.dueDate)}</p>
            </div>
            <div class="inline-actions compact-actions">
              <div class="stacked-badges">
                ${statusBadge(assignment.submissionStatus || "pending")}
                ${urgency ? `<span class="status-pill ${urgency.className}">${urgency.label}</span>` : ""}
              </div>
              <button class="btn btn-secondary toggle-details-btn" type="button">View Details</button>
            </div>
          </div>
          <div class="assignment-details hidden">
            <p>${assignment.description}</p>
            <form class="upload-form" data-assignment-id="${assignment._id}">
              <label>
                Upload PDF or DOC
                <input type="file" name="assignmentFile" accept=".pdf,.doc,.docx" />
              </label>
              <button class="btn btn-primary" type="submit">Submit Assignment</button>
            </form>
            ${
              submission && submission.fileUrl
                ? `
                  <div class="inline-actions">
                    <a class="btn btn-secondary" href="${submission.fileUrl}" target="_blank" rel="noreferrer">
                      ${isPdf ? "Open PDF Preview" : "Download File"}
                    </a>
                  </div>
                  ${
                    isPdf
                      ? `<iframe class="preview-frame" src="${submission.fileUrl}" title="PDF preview"></iframe>`
                      : ""
                  }
                `
                : ""
            }
            ${
              submission && submission.status === "graded"
                ? `<p class="meta">Marks: ${submission.marks ?? "-"} | Feedback: ${submission.feedback || "No feedback"}</p>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".upload-form").forEach((form) => {
    form.addEventListener("submit", handleUpload);
  });

  document.querySelectorAll(".toggle-details-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".assignment-card");
      const details = card.querySelector(".assignment-details");
      const isHidden = details.classList.contains("hidden");
      details.classList.toggle("hidden");
      button.textContent = isHidden ? "Hide Details" : "View Details";
    });
  });
}

function renderRecentActivity(assignments) {
  if (!studentRecentActivity) {
    return;
  }

  const recentItems = [];

  assignments.forEach((assignment) => {
    const submission = assignment.submission;

    if (submission && submission.submittedAt) {
      recentItems.push({
        title: assignment.title,
        status: submission.status,
        date: submission.gradedAt || submission.submittedAt,
        message:
          submission.status === "graded"
            ? `Graded with marks ${submission.marks ?? "-"}`
            : "Assignment submitted successfully"
      });
    } else {
      const dueDate = new Date(assignment.dueDate);
      if (dueDate.getTime() >= Date.now() - 24 * 60 * 60 * 1000) {
        recentItems.push({
          title: assignment.title,
          status: "pending",
          date: assignment.dueDate,
          message: "Assignment is active and waiting for submission"
        });
      }
    }
  });

  recentItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  const itemsToShow = recentItems.slice(0, 5);

  if (!itemsToShow.length) {
    studentRecentActivity.innerHTML = "<p class='meta'>No recent activity yet.</p>";
    return;
  }

  studentRecentActivity.innerHTML = itemsToShow
    .map(
      (item) => `
        <article class="mark-card">
          <div class="card-top">
            <div>
              <h3>${item.title}</h3>
              <p class="meta">${item.message}</p>
            </div>
            ${statusBadge(item.status)}
          </div>
          <p class="meta">${formatDate(item.date)}</p>
        </article>
      `
    )
    .join("");
}

function renderRecentTable(assignments) {
  if (!studentRecentTable) {
    return;
  }

  const rows = assignments
    .map((assignment) => {
      const submission = assignment.submission;
      if (!submission) {
        return {
          subject: assignment.subject,
          status: "pending",
          marks: "-",
          date: assignment.dueDate
        };
      }

      return {
        subject: assignment.subject,
        status: submission.status,
        marks: submission.marks ?? "-",
        date: submission.gradedAt || submission.submittedAt || assignment.dueDate
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (!rows.length) {
    studentRecentTable.innerHTML = "<p class='meta'>No submissions yet.</p>";
    return;
  }

  studentRecentTable.innerHTML = `
    <div class="table-card">
      <div class="table-head">
        <span>Subject</span>
        <span>Status</span>
        <span>Marks</span>
      </div>
      ${rows
        .map(
          (row) => `
            <div class="table-row">
              <span>${row.subject}</span>
              <span>${statusBadge(row.status)}</span>
              <span>${row.marks}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDeadlineCard(reminders, assignments) {
  if (!studentDeadlineCard) {
    return;
  }

  const item =
    reminders[0] ||
    assignments
      .map((assignment) => ({
        title: assignment.title,
        dueDate: assignment.dueDate
      }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  if (!item) {
    studentDeadlineCard.innerHTML = "<p class='meta'>No upcoming deadlines right now.</p>";
    return;
  }

  const hours = Math.max(
    0,
    Math.round((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const dueText = hours <= 48 ? `Due in ${Math.max(1, Math.ceil(hours / 24))} day(s)` : formatDate(item.dueDate);

  studentDeadlineCard.innerHTML = `
    <article class="mark-card">
      <div class="card-top">
        <h3>${item.title}</h3>
        <span class="status-pill status-alert">Deadline</span>
      </div>
      <p class="meta">${dueText}</p>
    </article>
  `;
}

function getUrgencyLabel(dueDate, status) {
  if (status === "submitted" || status === "graded") {
    return null;
  }

  const hours = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours < 0) {
    return { label: "Overdue", className: "status-overdue" };
  }
  if (hours <= 24) {
    return { label: "Due Soon", className: "status-alert" };
  }
  if (hours <= 72) {
    return { label: "Upcoming", className: "status-soft" };
  }
  return null;
}

function applyAssignmentFilters() {
  if (!assignmentsContainer || !assignmentSearch || !assignmentFilter) {
    return;
  }

  const query = assignmentSearch.value.trim().toLowerCase();
  const selectedStatus = assignmentFilter.value;

  const filtered = allAssignments.filter((assignment) => {
    const status = assignment.submissionStatus || "pending";
    const matchesStatus = selectedStatus === "all" || status === selectedStatus;
    const matchesQuery =
      !query ||
      assignment.title.toLowerCase().includes(query) ||
      assignment.subject.toLowerCase().includes(query) ||
      assignment.description.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  renderAssignments(filtered);
}

function applyInitialFilters() {
  if (!assignmentsContainer) {
    return;
  }

  if (studentView === "submit" && assignmentFilter) {
    assignmentFilter.value = "pending";
  }

  if (assignmentSearch && assignmentFilter) {
    applyAssignmentFilters();
    return;
  }

  renderAssignments(allAssignments);
}

async function handleUpload(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const assignmentId = form.dataset.assignmentId;
  const fileInput = form.querySelector("input[type='file']");

  if (!fileInput.files.length) {
    alert("Please choose a file first.");
    return;
  }

  const body = new FormData();
  body.append("assignmentFile", fileInput.files[0]);

  try {
    await API.request(`/api/submissions/${assignmentId}/upload`, {
      method: "POST",
      body
    });
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

loadDashboard();

if (assignmentSearch) {
  assignmentSearch.addEventListener("input", applyAssignmentFilters);
}

if (assignmentFilter) {
  assignmentFilter.addEventListener("change", applyAssignmentFilters);
}
