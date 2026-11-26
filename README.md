# Life Link — Blood Donation Management System

A community blood-donor coordination platform built with Express, Prisma, MySQL, and React.

## Local Setup & Run Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and set your MySQL connection strings and `JWT_SECRET`:
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` (development DB) and `DATABASE_URL_TEST` (test DB, e.g. `lifelink_test`) point to your local MySQL instance.

3. **Start MySQL**
   Make sure MySQL Server is running on `localhost:3306` with databases `lifelink_db` and `lifelink_test` created.

4. **Push the Prisma schema**
   ```bash
   npx prisma db push
   ```
   *(On Windows PowerShell if `npx` is blocked by execution policy, run `node "node_modules/prisma/build/index.js" db push`.)*

5. **Seed the development database**
   ```bash
   npm run db:seed
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   The app and API will be available at `http://localhost:3000`.

## Running Tests

```bash
npm run test:all
```
