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

4. Run Prisma migrations (local dev):

   ```bash
   npm run migrate:dev
   ```

5. Generate Prisma client:
   ```bash
   npm run prisma:generate
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

## Database migrations

Migration history is tracked by Prisma in the `_prisma_migrations` table.
The datasource URL for migrations is read from `DIRECT_URL` (see
`prisma.config.ts`).

- **Create a migration (local dev):** `npm run migrate:dev` — edits the schema,
  generates a new migration under `prisma/migrations/`, applies it to your dev
  DB, and regenerates the client.
- **Apply pending migrations (production):** `npm run migrate:deploy` — applies
  only unapplied migrations. Never use `migrate:dev` against production.
- **Check state:** `npm run migrate:status` — lists applied vs. pending
  migrations (read-only).

### Deploys (Render)

Schema changes are **not** applied by pushing code — the deploy must run the
migration step. This is wired up as the Render service's **Pre-Deploy Command**:

```
npm run migrate:deploy
```

It runs after the build succeeds and before the new version takes traffic, so
the database is always in sync with the deployed code. (`prisma` is a regular
dependency so the CLI is present at deploy time.) If you add a migration, just
push — Render applies it on deploy. To apply one out-of-band, run
`npm run migrate:deploy` locally against the production `DIRECT_URL`.

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
