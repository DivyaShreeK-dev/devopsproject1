const teacher = requireRole("teacher");
const teacherWelcomeText = document.getElementById("teacherWelcomeText");
if (teacherWelcomeText) {
  teacherWelcomeText.textContent = `Welcome, ${teacher.name}`;
}

const subjectForm = document.getElementById("subjectForm");
const subjectList = document.getElementById("subjectList");
const subjectMessage = document.getElementById("subjectMessage");
const submittedAssignmentsContainer = document.getElementById("submittedAssignmentsContainer");
const submittedAssignmentMessage = document.getElementById("submittedAssignmentMessage");
const assignmentReportContainer = document.getElementById("assignmentReportContainer");
const subjectReportContainer = document.getElementById("subjectReportContainer");
const studentReportContainer = document.getElementById("studentReportContainer");
const teacherAccountCard = document.getElementById("teacherAccountCard");

async function loadTeacherExtraPages() {
  if (teacherAccountCard) {
    renderTeacherAccount();
  }

  if (subjectForm || subjectList) {
    await loadSubjects();
  }

  if (
    submittedAssignmentsContainer ||
    assignmentReportContainer ||
    subjectReportContainer ||
    studentReportContainer
  ) {
    const assignments = await API.request("/api/assignments");
    const details = await Promise.all(
      assignments.assignments.map((assignment) => API.request(`/api/assignments/${assignment._id}`))
    );

    if (submittedAssignmentsContainer) {
      renderSubmittedAssignments(details);
    }
    if (assignmentReportContainer) {
      renderAssignmentReport(details);
    }
    if (subjectReportContainer) {
      renderSubjectReport(details);
    }
    if (studentReportContainer) {
      renderStudentReport(details);
    }
  }
}

function renderTeacherAccount() {
  teacherAccountCard.innerHTML = `
    <article class="mark-card">
      <div class="card-top">
        <h3>${teacher.name}</h3>
        <span class="status-pill role-teacher">teacher</span>
      </div>
      <p class="meta">Email: ${teacher.email}</p>
      <p class="meta">Role: ${teacher.role}</p>
    </article>
  `;
}

async function loadSubjects() {
  const assignments = await API.request("/api/assignments");
  const assignmentSubjects = assignments.assignments.map((item) => item.subject);
  const storedSubjects = JSON.parse(localStorage.getItem("oas_teacher_subjects") || "[]");
  const merged = [...new Set([...storedSubjects, ...assignmentSubjects])];
  localStorage.setItem("oas_teacher_subjects", JSON.stringify(merged));
  renderSubjects(merged);
}

function renderSubjects(subjects) {
  if (!subjectList) {
    return;
  }

  subjectList.innerHTML = subjects.length
    ? subjects
        .map(
          (subject) => `
            <article class="mark-card">
              <div class="card-top">
                <h3>${subject}</h3>
                <button class="btn btn-secondary remove-subject-btn" data-subject="${subject}" type="button">Remove</button>
              </div>
            </article>
          `
        )
        .join("")
    : "<p class='meta'>No subjects added yet.</p>";

  document.querySelectorAll(".remove-subject-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const subjects = JSON.parse(localStorage.getItem("oas_teacher_subjects") || "[]").filter(
        (item) => item !== button.dataset.subject
      );
      localStorage.setItem("oas_teacher_subjects", JSON.stringify(subjects));
      renderSubjects(subjects);
    });
  });
}

if (subjectForm) {
  subjectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(subjectForm).entries());
    const subject = payload.subject.trim();
    if (!subject) {
      return;
    }

    const subjects = JSON.parse(localStorage.getItem("oas_teacher_subjects") || "[]");
    if (!subjects.includes(subject)) {
      subjects.push(subject);
      localStorage.setItem("oas_teacher_subjects", JSON.stringify(subjects));
      renderSubjects(subjects);
      subjectForm.reset();
      if (subjectMessage) {
        subjectMessage.textContent = "Subject added successfully.";
      }
    } else if (subjectMessage) {
      subjectMessage.textContent = "Subject already exists.";
    }
  });
}

function renderSubmittedAssignments(details) {
  const submissions = details
    .flatMap((record) =>
      record.submissions
        .filter((item) => item.status === "submitted" || item.status === "graded")
        .map((item) => ({ ...item, assignmentTitle: record.assignment.title }))
    );

  submittedAssignmentsContainer.innerHTML = submissions.length
    ? submissions
        .map(
          (submission) => `
            <article class="submission-card">
              <div class="card-top">
                <div>
                  <h3>${submission.assignmentTitle}</h3>
                  <p class="meta">${submission.student.name} • ${submission.student.email}</p>
                </div>
                ${statusBadge(submission.status)}
              </div>
              <p class="meta">Submitted: ${submission.submittedAt ? formatDate(submission.submittedAt) : "Not available"}</p>
              <div class="inline-actions">
                ${
                  submission.fileUrl
                    ? `<a class="btn btn-secondary" href="${submission.fileUrl}" target="_blank" rel="noreferrer">View Uploaded File</a>`
                    : ""
                }
              </div>
              <form class="grade-form submitted-grade-form" data-submission-id="${submission._id}">
                <label>
                  Marks
                  <input type="number" name="marks" min="0" max="100" value="${submission.marks ?? ""}" required />
                </label>
                <label>
                  Feedback
                  <textarea name="feedback" rows="3">${submission.feedback || ""}</textarea>
                </label>
                <button class="btn btn-primary" type="submit">${submission.status === "graded" ? "Update Grade" : "Save Grade"}</button>
              </form>
            </article>
          `
        )
        .join("")
    : "<p class='meta'>No submitted assignments yet.</p>";

  document.querySelectorAll(".submitted-grade-form").forEach((form) => {
    form.addEventListener("submit", handleSubmittedGrade);
  });
}

function renderAssignmentReport(details) {
  assignmentReportContainer.innerHTML = details
    .map(({ assignment, submissions }) => {
      const pending = submissions.filter((item) => item.status === "pending").length;
      const submitted = submissions.filter((item) => item.status === "submitted").length;
      const graded = submissions.filter((item) => item.status === "graded").length;
      return `
        <article class="mark-card">
          <div class="card-top">
            <h3>${assignment.title}</h3>
            <span class="status-pill status-soft">${assignment.subject}</span>
          </div>
          <div class="progress-row">
            <span class="status-pill status-pending">Pending ${pending}</span>
            <span class="status-pill status-submitted">Submitted ${submitted}</span>
            <span class="status-pill status-graded">Graded ${graded}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSubjectReport(details) {
  const grouped = new Map();

  details.forEach(({ assignment, submissions }) => {
    const current = grouped.get(assignment.subject) || {
      assignments: 0,
      submitted: 0,
      graded: 0
    };

    current.assignments += 1;
    current.submitted += submissions.filter((item) => item.status === "submitted").length;
    current.graded += submissions.filter((item) => item.status === "graded").length;
    grouped.set(assignment.subject, current);
  });

  subjectReportContainer.innerHTML = [...grouped.entries()]
    .map(
      ([subject, data]) => `
        <article class="mark-card">
          <div class="card-top">
            <h3>${subject}</h3>
            <strong>${data.assignments}</strong>
          </div>
          <p class="meta">Assignments: ${data.assignments}</p>
          <p class="meta">Submitted: ${data.submitted}</p>
          <p class="meta">Graded: ${data.graded}</p>
        </article>
      `
    )
    .join("");
}

function renderStudentReport(details) {
  const grouped = new Map();

  details.forEach(({ submissions }) => {
    submissions.forEach((submission) => {
      const key = submission.student.email;
      const current = grouped.get(key) || {
        name: submission.student.name,
        email: submission.student.email,
        submitted: 0,
        graded: 0,
        marks: []
      };

      if (submission.status === "submitted" || submission.status === "graded") {
        current.submitted += 1;
      }
      if (submission.status === "graded") {
        current.graded += 1;
        if (submission.marks !== null) {
          current.marks.push(submission.marks);
        }
      }

      grouped.set(key, current);
    });
  });

  studentReportContainer.innerHTML = [...grouped.values()]
    .map((student) => {
      const avg =
        student.marks.length > 0
          ? (student.marks.reduce((sum, mark) => sum + mark, 0) / student.marks.length).toFixed(1)
          : "0.0";

      return `
        <article class="mark-card">
          <div class="card-top">
            <div>
              <h3>${student.name}</h3>
              <p class="meta">${student.email}</p>
            </div>
            <strong>${avg}</strong>
          </div>
          <p class="meta">Submitted: ${student.submitted}</p>
          <p class="meta">Graded: ${student.graded}</p>
        </article>
      `;
    })
    .join("");
}

loadTeacherExtraPages().catch((error) => {
  const targets = [
    subjectMessage,
    submittedAssignmentsContainer,
    assignmentReportContainer,
    subjectReportContainer,
    studentReportContainer,
    teacherAccountCard
  ].filter(Boolean);

  targets.forEach((target) => {
    target.innerHTML = `<p class="message">${error.message}</p>`;
  });
});

async function handleSubmittedGrade(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submissionId = form.dataset.submissionId;
  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const data = await API.request(`/api/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    if (submittedAssignmentMessage) {
      submittedAssignmentMessage.textContent = data.message;
    }

    await loadTeacherExtraPages();
  } catch (error) {
    if (submittedAssignmentMessage) {
      submittedAssignmentMessage.textContent = error.message;
    }
  }
}
