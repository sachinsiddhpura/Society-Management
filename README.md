# Society Management System

A multi-tenant apartment/society management platform: gate security (visitor
entries with photo capture), delivery/courier logging (Zomato, Swiggy,
Amazon, etc.), resident & flat management, and self-service society
registration — each society's data is isolated from every other society.

**Stack:** React (Vite + Tailwind) · Spring Boot 3 (Java 21) · MySQL 8 ·
JWT auth · Docker.

## Project layout

```
backend/      Spring Boot REST API (JWT auth, JPA, Flyway migrations)
frontend/     React SPA (Vite, Tailwind, react-webcam for photo capture)
database/     Standalone SQL scripts (schema.sql, seed.sql) for manual use
postman/      Postman collection + environment covering every endpoint
deployment/   docker-compose.yml, .env.example, and DEPLOYMENT.md (AWS guide)
```

## Roles

| Role | Can do |
|---|---|
| `SUPER_ADMIN` | Platform owner. Views/suspends every registered society. |
| `SOCIETY_ADMIN` | Created automatically when a society registers. Manages flats, staff, residents for their society. |
| `GUARD` | Logs visitor and delivery entries at the gate, checks them out. |
| `RESIDENT` | Approves/rejects visitors headed to their flat. |

## Core features

- JWT authentication, BCrypt password hashing, role-based access control
- Self-service **society registration** (multi-tenant: every table is scoped by `society_id`)
- **Gate visitor entries**: name/phone/purpose/vehicle/flat + live **photo capture** via webcam, pending → approved/rejected → checked-out workflow
- **Delivery entries**: Zomato, Swiggy, Amazon, Flipkart, BigBasket, Blinkit, Postal, Courier, Other — with agent photo, order ID, IN/OUT status
- Flats & residents management, staff (guards/admins) management
- File upload endpoint backing photo capture, served back as static `/uploads/...` URLs

---

## Run locally (without Docker)

### 1. Database

Either let the backend auto-provision the schema via Flyway (recommended —
just start the backend, see step 2), **or** run the standalone script
yourself first:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p society_management < database/seed.sql
```

### 2. Backend

```bash
cd backend
# set env vars for your local MySQL, or edit src/main/resources/application.yml directly
set DB_USERNAME=root
set DB_PASSWORD=your_mysql_password
mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:8080`, Flyway applies
`src/main/resources/db/migration/V1__init.sql` automatically on first boot
(seeding the platform super admin).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_BASE_URL=http://localhost:8080/api
npm run dev
```

Open `http://localhost:5173`.

### Seeded logins (from `database/seed.sql` / the Flyway migration)

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@society.app` | `Admin@123` |
| Society Admin | `admin@greenvalley.com` | `Admin@123` |
| Guard | `guard@greenvalley.com` | `Guard@123` |
| Resident | `resident@greenvalley.com` | `Resident@123` |

(`superadmin@society.app` is created by the Flyway migration even without
`seed.sql`; the rest need `seed.sql` or the "Register Society" screen.)

**Change every one of these before any real deployment.**

---

## Run locally with Docker

```bash
cd deployment
cp .env.example .env      # fill in DB passwords and a JWT_SECRET
docker compose up -d --build
```

Frontend (nginx, reverse-proxying `/api` and `/uploads` to the backend
container) is on `http://localhost`, backend directly on
`http://localhost:8080`, MySQL on `localhost:3306`.

---

## API testing

Import both files from `postman/` into Postman:

- `Society_Management.postman_collection.json`
- `Society_Management.postman_environment.json`

Run **Auth → Login** (or **Register Society**) first — its test script
automatically stores the JWT into the `token` environment variable so every
subsequent request authenticates.

---

## Deploying to AWS

See [`deployment/DEPLOYMENT.md`](deployment/DEPLOYMENT.md) for a full,
step-by-step guide (EC2 setup, security groups, installing Docker,
`docker compose up -d --build`, HTTPS via certbot, backups, and notes on
scaling to RDS/ECS later). Come back and ask when you're ready to deploy —
I'll run through it with you command by command.
