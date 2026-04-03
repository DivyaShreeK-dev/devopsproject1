const teacher = requireRole("teacher");
document.getElementById("teacherWelcomeText").textContent = `Welcome, ${teacher.name}`;
const teacherHeroName = document.getElementById("teacherHeroName");
if (teacherHeroName) {
  teacherHeroName.textContent = teacher.name;
}
