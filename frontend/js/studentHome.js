const student = requireRole("student");
document.getElementById("welcomeText").textContent = `Welcome, ${student.name}`;
const studentHeroName = document.getElementById("studentHeroName");
if (studentHeroName) {
  studentHeroName.textContent = student.name;
}
