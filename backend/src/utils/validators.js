const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const validateSignupInput = ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    return "All fields are required";
  }

  if (String(name).trim().length < 2) {
    return "Name must be at least 2 characters";
  }

  if (!isValidEmail(email)) {
    return "Enter a valid email address";
  }

  if (String(password).length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

const validateAssignmentInput = ({ title, description, subject, dueDate }) => {
  if (!title || !description || !subject || !dueDate) {
    return "All fields are required";
  }

  if (String(title).trim().length < 3) {
    return "Title must be at least 3 characters";
  }

  if (String(subject).trim().length < 2) {
    return "Subject must be at least 2 characters";
  }

  if (String(description).trim().length < 10) {
    return "Description must be at least 10 characters";
  }

  if (Number.isNaN(new Date(dueDate).getTime())) {
    return "Please choose a valid due date";
  }

  return null;
};

module.exports = {
  validateSignupInput,
  validateAssignmentInput
};
