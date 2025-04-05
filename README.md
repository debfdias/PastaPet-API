# Pasta Patas API

A Node.js API built with TypeScript, Express, Prisma ORM, and JWT authentication.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a PostgreSQL database and update the `.env` file with your database credentials:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```

4. Run Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

## Running the Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user

### Users

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes:

1. Login using the `/api/auth/login` endpoint
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your-token>
   ```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "message": "Error message"
}
```
