# MyDay Mood Tracker API

MyDay is a RESTful API for tracking user moods, mood types, reasons, tasks, quotes, and avatars. It supports user authentication, mood streaks, reminders, and provides endpoints for mood analytics and personalized content.

---

## Features

- **User Authentication**: Register, login, and manage user profiles securely with JWT.
- **Mood Tracking**: Record, update, and retrieve daily moods with optional reasons and notes.
- **Mood Types**: Create, list, and delete custom mood types.
- **Streaks**: Track and retrieve user mood streaks.
- **Reminders**: Set daily mood check-in reminders.
- **Tasks & Quotes**: Get tasks and motivational quotes based on current mood.
- **Avatars**: Get and update avatars based on mood and user preferences.
- **Analytics**: Retrieve mood summaries and statistics over custom date ranges.

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- bcryptjs for password hashing
- dotenv for environment configuration

---

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB instance (local or cloud)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/myday-moodtracker.git
   cd myday-moodtracker/MoodTrackerAPI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root of `MoodTrackerAPI`:

   ```
   MONGODB_URI=mongodb://localhost:27017/myday
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

---

## API Endpoints

### Authentication

- `POST /users/register` — Register a new user
- `POST /users/login` — Login and receive JWT

### User

- `GET /users/me` — Get user profile
- `GET /users/streak` — Get current mood streak
- `POST /users/reminder` — Set or update reminder

### Moods

- `POST /moods` — Create a new mood
- `GET /mood` — Get today’s mood
- `PATCH /mood` — Update today’s mood
- `GET /moods` — Get all moods (with optional filters)
- `GET /moods/:date` — Get mood by date

### Mood Types

- `GET /mood-types` — List all mood types
- `POST /mood-types` — Create a new mood type
- `DELETE /mood-types/:name` — Delete a mood type

### Tasks & Quotes

- `GET /tasks` — Get a random task for today’s mood
- `GET /quotes` — Get a random quote for today’s mood

### Avatars

- `GET /avatars?mood_type=happy` — Get avatars for a mood type
- `PATCH /users/avatar` — Update user avatar

### Analytics

- `GET /stats/moods?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` — Get mood summary for a date range

---

## Project Structure

```
MoodTrackerAPI/
├── controllers/    # API route handlers
├── models/         # Mongoose schemas
├── routes/         # Express route definitions
├── .env            # Environment variables
├── package.json
└── ...
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT

---

**Note:** This API is intended for use with a frontend or mobile client. Ensure you protect your JWT secret and never expose sensitive information in production.
