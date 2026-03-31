const teacher = requireRole("teacher");
document.getElementById("teacherWelcomeText").textContent = `Welcome, ${teacher.name}`;

const assignmentForm = document.getElementById("assignmentForm");
const teacherAssignments = document.getElementById("teacherAssignments");
const teacherMessage = document.getElementById("teacherMessage");
const teacherActionMessage = document.getElementById("teacherActionMessage");
const teacherStatsGrid = document.getElementById("teacherStatsGrid");
const recentActivity = document.getElementById("recentActivity");
const teacherAssignmentSearch = document.getElementById("teacherAssignmentSearch");
const teacherSubmissionFilter = document.getElementById("teacherSubmissionFilter");
const exportReportBtn = document.getElementById("exportReportBtn");

let assignmentRecords = [];

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  teacherMessage.textContent = "Creating assignment...";

  try {
    const payload = Object.fromEntries(new FormData(event.target).entries());
    const data = await API.request("/api/assignments", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    teacherMessage.textContent = data.message;
    assignmentForm.reset();
    loadTeacherDashboard();
  } catch (error) {
    teacherMessage.textContent = error.message;
  }
});

async function loadTeacherDashboard() {
  try {
    const [data, statsData] = await Promise.all([
      API.request("/api/assignments"),
      API.request("/api/stats/teacher")
    ]);
    const detailedAssignments = await Promise.all(
      data.assignments.map((assignment) => API.request(`/api/assignments/${assignment._id}`))
    );

    assignmentRecords = detailedAssignments;
    renderTeacherStats(statsData.stats);
    renderRecentActivity(statsData.stats.recentActivity);
    applyTeacherFilters();
  } catch (error) {
    teacherAssignments.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

function renderTeacherStats(stats) {
  const cards = [
    { label: "Assignments", value: stats.totalAssignments },
    { label: "Students", value: stats.totalStudents },
    { label: "Submitted", value: stats.submittedCount },
    { label: "Graded", value: stats.gradedCount }
  ];

  teacherStatsGrid.innerHTML = cards
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

function renderRecentActivity(items) {
  if (!items.length) {
    recentActivity.innerHTML = "<p class='meta'>No recent activity yet.</p>";
    return;
  }

  recentActivity.innerHTML = items
    .map(
      (item) => `
        <article class="mark-card">
          <div class="card-top">
            <h3>${item.assignmentTitle}</h3>
            ${statusBadge(item.status)}
          </div>
          <p class="meta">Updated ${formatDate(item.updatedAt)}</p>
        </article>
      `
    )
    .join("");
}

function renderTeacherAssignments(records) {
  if (!records.length) {
    teacherAssignments.innerHTML = "<p class='meta'>No assignments match your current filters.</p>";
    return;
  }

  teacherAssignments.innerHTML = records
    .map(({ assignment, submissions }) => `
      <article class="assignment-card">
        <div class="card-top compact-card-top">
          <div>
            <h3>${assignment.title}</h3>
            <p class="meta">${assignment.subject} • Due ${formatDate(assignment.dueDate)}</p>
          </div>
          <button class="btn btn-secondary teacher-toggle-btn" type="button">View Details</button>
        </div>
        <div class="assignment-details hidden">
          <p>${assignment.description}</p>
          ${renderAssignmentProgress(submissions)}
          <div class="inline-actions">
            <button class="btn btn-secondary edit-assignment-btn" data-assignment-id="${assignment._id}" type="button">Edit</button>
            <button class="btn btn-secondary delete-assignment-btn" data-assignment-id="${assignment._id}" type="button">Delete</button>
          </div>
          <form class="assignment-edit-form hidden edit-assignment-form" data-assignment-id="${assignment._id}">
            <label>
              Title
              <input type="text" name="title" value="${escapeHtml(assignment.title)}" required />
            </label>
            <label>
              Subject
              <input type="text" name="subject" value="${escapeHtml(assignment.subject)}" required />
            </label>
            <label>
              Due Date
              <input type="datetime-local" name="dueDate" value="${toDateTimeLocal(assignment.dueDate)}" required />
            </label>
            <label>
              Description
              <textarea name="description" rows="4" required>${escapeHtml(assignment.description)}</textarea>
            </label>
            <div class="inline-actions">
              <button class="btn btn-primary" type="submit">Save Changes</button>
              <button class="btn btn-secondary cancel-edit-btn" data-assignment-id="${assignment._id}" type="button">Cancel</button>
            </div>
          </form>
          <div class="teacher-assignment-list">
            ${
              submissions.length
                ? submissions
                    .map((submission) => {
                    const previewLink = submission.fileUrl
                      ? `<a class="btn btn-secondary" href="${submission.fileUrl}" target="_blank" rel="noreferrer">View File</a>`
                      : "";

                    const canGrade = Boolean(submission.fileUrl);

                    return `
                      <div class="submission-card">
                        <div class="card-top">
                          <div>
                            <h4>${submission.student.name}</h4>
                            <p class="meta">${submission.student.email}</p>
                          </div>
                          ${statusBadge(submission.status)}
                        </div>
                        <p class="meta">Submitted: ${submission.submittedAt ? formatDate(submission.submittedAt) : "Not yet submitted"}</p>
                        <div class="inline-actions">${previewLink}</div>
                        ${
                          canGrade
                            ? `
                              <form class="grade-form" data-submission-id="${submission._id}">
                                <label>
                                  Marks
                                  <input type="number" name="marks" min="0" max="100" value="${submission.marks ?? ""}" required />
                                </label>
                                <label>
                                  Feedback
                                  <textarea name="feedback" rows="3">${submission.feedback || ""}</textarea>
                                </label>
                                <button class="btn btn-primary" type="submit">Save Grade</button>
                              </form>
                            `
                            : "<p class='meta'>Waiting for student upload before grading.</p>"
                        }
                      </div>
                    `;
                    })
                    .join("")
                : "<p class='meta'>No submissions for the current filter.</p>"
            }
          </div>
        </div>
      </article>
    `)
    .join("");

  document.querySelectorAll(".grade-form").forEach((form) => {
    form.addEventListener("submit", handleGradeSubmit);
  });

  document.querySelectorAll(".edit-assignment-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const form = document.querySelector(`.edit-assignment-form[data-assignment-id="${button.dataset.assignmentId}"]`);
      form.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".cancel-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const form = document.querySelector(`.edit-assignment-form[data-assignment-id="${button.dataset.assignmentId}"]`);
      form.classList.add("hidden");
    });
  });

  document.querySelectorAll(".assignment-edit-form").forEach((form) => {
    form.addEventListener("submit", handleAssignmentEdit);
  });

  document.querySelectorAll(".delete-assignment-btn").forEach((button) => {
    button.addEventListener("click", () => handleAssignmentDelete(button.dataset.assignmentId));
  });

  document.querySelectorAll(".teacher-toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".assignment-card");
      const details = card.querySelector(".assignment-details");
      const isHidden = details.classList.contains("hidden");
      details.classList.toggle("hidden");
      button.textContent = isHidden ? "Hide Details" : "View Details";
    });
  });
}

function renderAssignmentProgress(submissions) {
  const progress = {
    pending: submissions.filter((item) => item.status === "pending").length,
    submitted: submissions.filter((item) => item.status === "submitted").length,
    graded: submissions.filter((item) => item.status === "graded").length
  };

  return `
    <div class="progress-row">
      <span class="status-pill status-pending">Pending ${progress.pending}</span>
      <span class="status-pill status-submitted">Submitted ${progress.submitted}</span>
      <span class="status-pill status-graded">Graded ${progress.graded}</span>
    </div>
  `;
}

function applyTeacherFilters() {
  const query = teacherAssignmentSearch.value.trim().toLowerCase();
  const selectedStatus = teacherSubmissionFilter.value;

  const filtered = assignmentRecords
    .map((record) => {
      const filteredSubmissions =
        selectedStatus === "all"
          ? record.submissions
          : record.submissions.filter((submission) => submission.status === selectedStatus);

      return { ...record, submissions: filteredSubmissions };
    })
    .filter((record) => {
      const matchesQuery =
        !query ||
        record.assignment.title.toLowerCase().includes(query) ||
        record.assignment.subject.toLowerCase().includes(query) ||
        record.assignment.description.toLowerCase().includes(query);

      const matchesSubmission = selectedStatus === "all" || record.submissions.length > 0;
      return matchesQuery && matchesSubmission;
    });

  renderTeacherAssignments(filtered);
}

async function handleGradeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submissionId = form.dataset.submissionId;
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    await API.request(`/api/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    loadTeacherDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function handleAssignmentEdit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const assignmentId = form.dataset.assignmentId;
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const data = await API.request(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    teacherActionMessage.textContent = data.message;
    loadTeacherDashboard();
  } catch (error) {
    teacherActionMessage.textContent = error.message;
  }
}

async function handleAssignmentDelete(assignmentId) {
  const confirmed = window.confirm("Delete this assignment and all related submissions?");
  if (!confirmed) {
    return;
  }

  try {
    const data = await API.request(`/api/assignments/${assignmentId}`, {
      method: "DELETE"
    });
    teacherActionMessage.textContent = data.message;
    loadTeacherDashboard();
  } catch (error) {
    teacherActionMessage.textContent = error.message;
  }
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

loadTeacherDashboard();

teacherAssignmentSearch.addEventListener("input", applyTeacherFilters);
teacherSubmissionFilter.addEventListener("change", applyTeacherFilters);
exportReportBtn.addEventListener("click", downloadCsvReport);

async function downloadCsvReport() {
  const token = localStorage.getItem("oas_token");

  try {
    const response = await fetch("/api/submissions/report/export", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Unable to export report");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "submission-report.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    teacherActionMessage.textContent = "CSV report downloaded successfully.";
  } catch (error) {
    teacherActionMessage.textContent = error.message;
  }
}
