# Moving MySQL to Amazon RDS

## Why

Right now MySQL runs as a Docker container (`society-mysql`) on the same
EC2 instance as the app. That means: if the instance is ever terminated,
your database dies with it; backups are a manual `mysqldump` you have to
remember to run; and MySQL is competing with the backend/frontend
containers for that one instance's CPU/RAM.

**RDS** is AWS's managed relational database service. You point it at
"I want a MySQL 8.0 database," and AWS handles: automated daily backups
with point-in-time restore, patching, and (if you ever turn it on)
Multi-AZ failover to a standby replica. Your app connects to it exactly
like any other MySQL server — nothing about your JPA/Flyway code changes,
only *where* `DB_HOST` points.

This guide uses the **RDS Free Tier template** (single-AZ, small instance
class, 20GB storage) — free for your account's first 12 months, ~750 hours/
month, enough to run one instance continuously. Good enough to learn on;
Multi-AZ (real production durability) is a one-click upgrade later, at
roughly double the cost.

---

## Step 1 — Create the RDS instance

AWS Console → **RDS → Databases → Create database**.

1. Choose a database creation method: **Standard create**.
2. Engine options: **MySQL**, version **8.0.x** (match what you've been
   running in Docker).
3. Templates: **Free tier** — this auto-selects an eligible instance class,
   single-AZ, and 20GiB storage for you.
4. Settings:
   - DB instance identifier: `society-management-db`
   - Master username: `admin`
   - Master password: set one yourself (don't use "Auto generate") —
     you'll need it in a moment. Write it down.
5. Instance configuration / Storage: leave the free-tier defaults
   (typically `db.t3.micro` or `db.t4g.micro`, 20GiB gp2/gp3). Uncheck
   storage autoscaling if you want cost to stay fully predictable.
6. **Connectivity** — the important part:
   - Compute resource: "Don't connect to an EC2 compute resource" (you'll
     wire up the security group manually so it's explicit and you
     understand it — see Step 2).
   - VPC: the same VPC your app/Jenkins EC2 instances are in (almost
     certainly "default VPC" unless you changed it).
   - Public access: **No**. This is a hard rule — the database should
     never be directly reachable from the internet, only from your app
     server, over the private network inside your VPC.
   - VPC security group: **Create new**, name it `rds-mysql-sg`.
   - Availability Zone: no preference.
7. **Additional configuration**:
   - Initial database name: `society_management` — RDS creates this empty
     database for you on first launch, matching what Flyway expects.
   - Backup retention: 7 days is the default and fine.
   - Enable deletion protection: check this — it just requires an extra
     confirmation step before anyone can delete the whole database,
     cheap insurance against a misclick.
8. **Create database**. This takes several minutes ("Creating" →
   "Available") — go do Step 2 while you wait, then come back for the
   endpoint in Step 3.

---

## Step 2 — Only let the app server reach it

By default, `rds-mysql-sg`'s inbound rules are empty — nothing can connect
yet, not even your app server. Fix that:

AWS Console → **EC2 → Security Groups → `rds-mysql-sg` → Edit inbound
rules → Add rule**:
- Type: **MYSQL/Aurora** (auto-fills port 3306)
- Source: **Custom** → search for and select your **app EC2 instance's
  security group** (not its IP — referencing the security group means
  "any instance using this SG," which survives the app instance being
  replaced later without you having to edit this rule again)

Save rules. Nothing else should ever be allowed to reach 3306 on this
database — not Jenkins, not your laptop, not `0.0.0.0/0`.

---

## Step 3 — Get the connection details

RDS Console → **Databases → `society-management-db`** (once status is
"Available") → copy the **Endpoint** shown under "Connectivity & security"
— it looks like:

```
society-management-db.abc123xyz.ap-south-1.rds.amazonaws.com
```

Port is `3306`.

---

## Step 4 — Point the app at RDS instead of the container

`deployment/docker-compose.yml` and `deployment/.env.example` have already
been updated in this repo — the `mysql` service is gone, and `backend`
now reads `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD` from your `.env`
file instead of a hardcoded `mysql` service name. Pull that change onto the
app server and update its `.env`:

```bash
cd ~/app
git pull
cd deployment
nano .env
```

Set:
```
DB_HOST=society-management-db.abc123xyz.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=society_management
DB_USERNAME=admin
DB_PASSWORD=<the master password from Step 1>
```

(Delete the old `DB_ROOT_PASSWORD` line if it's still there — RDS doesn't
use that Docker-MySQL-image-specific variable.)

---

## Step 5 — (Optional) Bring your existing test data along

If you want to keep what's already in the container (your test society,
guard/resident accounts, visitor entries) instead of starting fresh, copy
it over before redeploying. Run this **on the app EC2 instance** — it uses
Docker itself to get a `mysql` client, so nothing extra needs installing:

```bash
docker exec society-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" society_management' > ~/data-export.sql

docker run --rm -i mysql:8.0 \
  mysql -h society-management-db.abc123xyz.ap-south-1.rds.amazonaws.com \
        -u admin -p'<the master password>' society_management \
  < ~/data-export.sql
```

(Traffic from that throwaway container still originates from the app EC2
instance's network interface, so it's allowed through by the security
group rule from Step 2.)

If you'd rather start clean, skip this step entirely — Flyway will build a
fresh schema and seed just the platform super admin on first startup,
exactly like it did the very first time you deployed.

---

## Step 6 — Redeploy

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Since the `mysql` container no longer exists, `docker compose ps` should
now show only `backend` and `frontend`. Watch the backend logs for Flyway:
- **Fresh database**: `Migrating schema ... to version "1 - init"`
- **Migrated existing data** (Step 5): `Schema ... is up to date` or a
  baseline message — either way, no errors, and no attempt to recreate
  tables that already exist.

Visit the app in the browser and confirm login still works.

---

## Step 7 — Clean up the old container's leftover data (once confident)

The old `mysql_data` Docker volume is now orphaned (nothing references it
anymore) but still exists on disk with your old data as a safety net. Once
you're confident RDS has everything you need:

```bash
docker volume ls | grep mysql
docker volume rm deployment_mysql_data
```

---

## Troubleshooting

- **Backend can't connect / connection timed out** — almost always the
  security group in Step 2. Double check the source is set to the app
  EC2 instance's *security group*, not left empty or set to the wrong one.
- **`Access denied for user 'admin'`** — the password in `.env` doesn't
  match what you set when creating the RDS instance (Step 1). RDS master
  passwords can be reset from the console (**Modify** → set new master
  password) if you've lost track of it.
- **Flyway complains about a non-empty schema on a fresh RDS instance you
  did NOT migrate data into** — this shouldn't happen (a brand-new RDS
  database is empty), but if you see it, you likely pointed `DB_NAME` at a
  database that already had unrelated tables in it; double-check the RDS
  console shows `society_management` as genuinely empty before first
  connecting the backend.

---

## What's next in this tier

The other Tier 2 item is **S3** — moving visitor/delivery photo uploads
off the local Docker volume and into an S3 bucket, so the app server holds
no persistent state at all beyond the running containers themselves. Say
the word when you're ready and we'll do that one next, same format.
