# FINCRM — Company Master React + SQL Database Project

A production-quality **Company Master module** built with a **React + Vite** frontend, a **Node.js + Express** backend, and a local **MySQL database**.

The project is designed for desktop applications, featuring strict layouts, well-sized elements, and consistent typography.

---

## 1. Project Architecture

```
React (Vite Frontend)
   │
   ▼ [HTTP REST Requests]
Express.js (Node.js Backend)
   │
   ▼ [mysql2/promise Client]
MySQL Database (Local Server)
```

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MySQL Server 8.0**
- A database manager/GUI (e.g. MySQL Workbench, DBeaver)

---

## 3. Database Setup

1. Start your local MySQL server.
2. Create the database, schema, and tables by running the script:
   ```sql
   -- Log into MySQL and run:
   source backend/src/db/schema.sql;
   ```
3. Insert local seed development data:
   ```sql
   source backend/src/db/seed.sql;
   ```

### 3.1 Database Schema Relationships
The system configures exactly three tables:
- **`MASCOM`**: Company Master (Primary key: `mascom_id`)
- **`MASCON`**: Contact Master (Primary key: `mascon_id`, Foreign key: `mascom_id -> MASCOM.mascom_id` with `ON DELETE CASCADE`)
- **`TRACOM`**: Transaction / Demo / Follow-up Master (Primary key: `tracom_id`, Foreign keys referencing `MASCOM.mascom_id` and `MASCON.mascon_id` with `ON DELETE CASCADE`)

### 3.2 Excel Fields Mapping Reference
The schema maps raw Excel spreadsheet columns to clean, standardized database attributes:
- `erp_usnig` (misspelled in spreadsheet) ➜ `erp_using`
- `Key_person` ➜ `key_person`
- `User Name` ➜ `user_name`
- `Price Quoted` ➜ `price_quoted`
- `AMC Quoted` ➜ `amc_quoted`
- `Demo_date` ➜ `demo_date`
- `Demo_time` ➜ `demo_time`

---

## 4. Custom ID Generation Logic

Every row in the database uses a custom string identifier instead of autoincrementing integers.
Format: `XXX-00001`
- **`XXX`**: The last 3 digits of the Unix epoch timestamp in seconds at creation (e.g., `827` for timestamp `1,787,573,827`). This ensures the prefix changes dynamically every second.
- **`-`**: Separation hyphen.
- **`00001`**: A 5-digit sequential number incremented per prefix.

### Safe Concurrency Implementation
The custom ID generation is handled entirely on the backend in `backend/src/utils/idGenerator.js`:
- Insertion runs inside an active SQL transaction.
- It locks the target row lookup utilizing a `SELECT ... FOR UPDATE` clause on the prefix pattern (e.g. `827-%`).
- This guarantees sequential safety and prevents duplicate collisions under concurrent insert requests.

---

## 5. Environment Variables

Create a `.env` file in the `backend/` directory based on `backend/.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Express backend port | `5000` |
| `DB_HOST` | MySQL Server hostname | `localhost` |
| `DB_PORT` | MySQL Server port | `3306` |
| `DB_NAME` | Database schema name | `fincrm` |
| `DB_USER` | MySQL login username | `root` |
| `DB_PASSWORD` | MySQL login password | `0000` |

---

## 6. Installation & Launch Commands

### 6.1 Backend API Server
Navigate to the backend directory, install packages, and boot the server:
```bash
cd backend
npm install
npm run dev
```
The console will log:
```
Database connected successfully
Server is running on port 5000
```

### 6.2 Frontend React Application
Open a separate terminal window, navigate to the frontend directory, install packages, and boot Vite:
```bash
cd frontend
npm install
npm run dev
```
Vite will compile and launch the page (usually on `http://localhost:5173/` or `http://localhost:5174/`).

---

## 7. Company Master API Endpoints Reference

All requests and responses use JSON payloads.

- **GET `/api/companies`**: Lists all companies.
  - Supports search query: `GET /api/companies?search=pharma`
- **GET `/api/companies/:id`**: Retrieves a single company record.
- **POST `/api/companies`**: Creates a new company. Returns details with the newly generated ID.
- **PUT `/api/companies/:id`**: Updates an existing company's details.
- **DELETE `/api/companies/:id`**: Deletes a company by ID (cascades dependent contacts and activities).

---

## 8. Troubleshooting

### 1. Database Connection Fails
- Confirm that the `MySQL80` service is running in Windows Services.
- Check that the username and password in `backend/.env` match your local MySQL credentials.
- Ensure the port in `.env` is correct (default `3306`).

### 2. Port Already in Use
- If port `5000` is occupied, change the `PORT` value in `backend/.env`.
- If port `5173` is occupied, Vite will automatically select the next port (e.g. `5174`). Follow the terminal URI output.

### 3. CORS Error
- Ensure the backend configuration has `cors` middleware enabled (`app.use(cors())`).
