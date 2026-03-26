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
- Assignment creation and listing
- File upload using `multer` for PDF, DOC, and DOCX
- Submission tracking with `pending`, `submitted`, and `graded`
- Teacher grading with marks and feedback
- PDF preview in browser
- Upcoming deadline reminders
- Student dashboard for totals, pending/completed work, and marks overview

## Sample Data

Run the seed script to create:

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
- `GET /api/assignments/:id`
- `GET /api/submissions/student`
- `POST /api/submissions/:assignmentId/upload`
- `PATCH /api/submissions/:submissionId/grade`
- `GET /api/stats/student`
- `GET /api/reminders/upcoming`

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
