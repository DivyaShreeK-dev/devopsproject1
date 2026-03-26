const user = requireRole("student");
document.getElementById("welcomeText").textContent = `Welcome, ${user.name}`;

const statsGrid = document.getElementById("statsGrid");
const assignmentsContainer = document.getElementById("assignmentsContainer");
const marksOverview = document.getElementById("marksOverview");
const reminderBanner = document.getElementById("reminderBanner");
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

    renderStats(statsData.stats);
    allAssignments = assignmentsData.assignments;
    renderAssignments(allAssignments);
    renderMarks(statsData.stats.marksOverview);
    renderReminders(reminderData.reminders);
  } catch (error) {
    assignmentsContainer.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

function renderStats(stats) {
  const cards = [
    { label: "Total Assignments", value: stats.totalAssignments },
    { label: "Completed", value: stats.completed },
    { label: "Pending", value: stats.pending },
    { label: "Average Marks", value: stats.averageMarks }
  ];

  statsGrid.innerHTML = cards
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

function renderReminders(reminders) {
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
          <div class="card-top">
            <div>
              <h3>${assignment.title}</h3>
              <p class="meta">${assignment.subject} • Due ${formatDate(assignment.dueDate)}</p>
            </div>
            <div class="stacked-badges">
              ${statusBadge(assignment.submissionStatus || "pending")}
              ${urgency ? `<span class="status-pill ${urgency.className}">${urgency.label}</span>` : ""}
            </div>
          </div>
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
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".upload-form").forEach((form) => {
    form.addEventListener("submit", handleUpload);
  });
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

assignmentSearch.addEventListener("input", applyAssignmentFilters);
assignmentFilter.addEventListener("change", applyAssignmentFilters);
