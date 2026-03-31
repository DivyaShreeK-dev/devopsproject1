# Online Assignment Submission and Tracking System

Full stack web application for assignment upload, tracking, grading, and deadline reminders.

## Folder Structure

```text
OAS_DEV/
|-- backend/
|   |-- server.js
|   |-- uploads/
|   |   `-- .gitkeep
|   `-- src/
|       |-- app.js
|       |-- config/
|       |   |-- db.js
|       |   `-- multer.js
|       |-- controllers/
|       |   |-- assignmentController.js
|       |   |-- authController.js
|       |   |-- reminderController.js
|       |   |-- statsController.js
|       |   `-- submissionController.js
|       |-- middleware/
|       |   `-- authMiddleware.js
|       |-- models/
|       |   |-- Assignment.js
|       |   |-- Submission.js
|       |   `-- User.js
|       |-- routes/
|       |   |-- assignmentRoutes.js
|       |   |-- authRoutes.js
|       |   |-- reminderRoutes.js
|       |   |-- statsRoutes.js
|       |   `-- submissionRoutes.js
|       `-- utils/
|           |-- generateToken.js
|           `-- seedData.js
|-- frontend/
|   |-- index.html
|   |-- dashboard.html
|   |-- teacher.html
|   |-- css/
|   |   `-- styles.css
|   `-- js/
|       |-- api.js
|       |-- auth.js
|       |-- common.js
|       |-- dashboard.js
|       `-- teacher.js
`-- README.md
```

## Core Features

- Student authentication with signup and login
- Teacher authentication with signup and login
- Admin dashboard for user-role management and announcements
- Assignment creation and listing
- Assignment edit and delete support for teachers
- File upload using `multer` for PDF, DOC, and DOCX
- Submission tracking with `pending`, `submitted`, and `graded`
- Teacher grading with marks and feedback
- PDF preview in browser
- Upcoming deadline reminders
- Student dashboard for totals, pending/completed work, and marks overview
- Student alert flow for deadline and graded updates

## Sample Data

Run the seed script to create:

- Admin: `admin1@example.com` / `password123`
- Teacher: `teacher1@example.com` / `password123`
- Student: `student1@example.com` / `password123`
- Student: `student2@example.com` / `password123`
- Two sample assignments
- One graded submission

## REST API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/assignments`
- `POST /api/assignments`
- `PATCH /api/assignments/:id`
- `DELETE /api/assignments/:id`
- `GET /api/assignments/:id`
- `GET /api/submissions/student`
- `POST /api/submissions/:assignmentId/upload`
- `PATCH /api/submissions/:submissionId/grade`
- `GET /api/stats/student`
- `GET /api/stats/teacher`
- `GET /api/reminders/upcoming`
- `GET /api/admin/overview`
- `PATCH /api/admin/users/:id/role`
- `GET /api/alerts`
- `POST /api/alerts`

## How To Run Locally

1. Install MongoDB Community Server and make sure the MongoDB service is running locally.
2. In the project root, create a `.env` file from `.env.example`.
3. Keep the default local Mongo URI or update it if your MongoDB runs elsewhere.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Seed sample data:

   ```bash
   npm run seed
   ```

6. Start the application:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:5000](http://localhost:5000) in your browser.

## Notes

- The backend serves both the API and the frontend pages.
- Uploaded files are stored in `backend/uploads/`.
- PDF files can be previewed in browser through the uploaded file URL.
- DOC and DOCX files are available for download.
- Public signup is limited to `student` and `teacher`; admin users come from seed data or admin role updates.

## Suggested Demo Flow

1. Sign in as `admin1@example.com` to review users and publish a platform alert.
2. Sign in as `teacher1@example.com` to create, edit, or delete an assignment and grade a submission.
3. Sign in as `student1@example.com` to upload a file, track status, and view marks.
