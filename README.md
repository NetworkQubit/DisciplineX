# DisciplineX

DisciplineX is a personal study productivity app built for desktop use. It focuses on one user workspace with stored profile data, subject planning, task management, session tracking, analytics, and a reset option to clear saved data.

## Stack

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express + MongoDB
- Persistence: Mongoose models for profile, subjects, tasks, and study sessions

## Current Product Shape

- Desktop-focused dashboard
- Personal timer and recent session tracking
- Subject and task management
- Stored profile/preferences
- Reset data action that clears saved records from MongoDB

## API

### Workspace

- `GET /api/workspace`
- `PATCH /api/workspace/profile`
- `POST /api/workspace/subjects`
- `PATCH /api/workspace/subjects/:subjectId`
- `DELETE /api/workspace/subjects/:subjectId`
- `POST /api/workspace/tasks`
- `PATCH /api/workspace/tasks/reorder`
- `PATCH /api/workspace/tasks/:taskId`
- `DELETE /api/workspace/tasks/:taskId`
- `POST /api/workspace/sessions/start`
- `PATCH /api/workspace/sessions/:sessionId/pause`
- `PATCH /api/workspace/sessions/:sessionId/stop`
- `DELETE /api/workspace/reset`

## Data Model

### User

- `username`, `email`, `bio`
- `studyGoalMinutes`, `totalStudySeconds`
- `streak`, `level`, `xp`
- `preferences`

### Subject

- `user`, `name`, `color`, `goalMinutes`, `icon`

### Task

- `user`, `subject`, `title`
- `status`, `priority`, `position`

### StudySession

- `user`, `subject`, `mode`
- `startedAt`, `endedAt`, `durationSeconds`
- `isActive`, `isPaused`

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Create backend env values from the example:

```bash
cp backend/.env.example backend/.env
```

3. Set `MONGODB_URI` in `backend/.env`.

Atlas example:

```env
MONGODB_URI=mongodb+srv://YOUR_DB_USERNAME:YOUR_DB_PASSWORD@YOUR_CLUSTER.mongodb.net/disciplinex?retryWrites=true&w=majority
```

Local MongoDB Community example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/disciplinex
```

4. Start the frontend and backend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`.

## Database Note

The backend accepts either MongoDB Atlas or a local MongoDB Community server through `MONGODB_URI`. For Render deployment, use MongoDB Atlas and set the same URI in your Render environment variables.
