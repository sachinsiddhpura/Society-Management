# Deployment Explained — Every Command, Every File, Line by Line

This is the companion reference to `DEPLOYMENT.md`. That file tells you
*what to type*. This file explains *what each thing does and why* — every
command you ran on the EC2 instance, and a full line-by-line walkthrough of
`docker-compose.yml`, both Dockerfiles, and `nginx.conf`.

---

## PART 1 — The commands you ran, explained

### 1.1 Connecting

```bash
ssh -i "your-key.pem" ec2-user@YOUR_EC2_PUBLIC_IP
```

Opens an encrypted shell session on the EC2 instance, authenticating with
the private key that matches the public key AWS stored on the instance when
it was launched (instead of a password). `ec2-user` is the default login
user baked into the Amazon Linux 2023 AMI.

### 1.2 Installing Docker and git

```bash
sudo dnf update -y
```
Updates all installed OS packages to their latest versions. `dnf` is Amazon
Linux 2023's package manager (the RPM-based successor to `yum`). `sudo`
runs it as root because installing/updating system packages needs admin
rights.

```bash
sudo dnf install -y docker git
```
Installs the Docker Engine package and git from Amazon Linux's repositories.
`-y` auto-confirms the "do you want to install this?" prompt.

```bash
sudo systemctl enable --now docker
```
`systemctl` controls background services (daemons) on Linux. `enable` makes
Docker start automatically on every future boot; `--now` also starts it
immediately, so you don't need a separate `systemctl start docker`.

```bash
sudo usermod -aG docker ec2-user
```
Adds the `ec2-user` account to the `docker` group. The Docker daemon's
control socket (`/var/run/docker.sock`) is owned by `root:docker`, so
without this, every `docker` command would need `sudo`. `-aG` appends the
group without removing the user from any group they're already in.

```bash
exit
```
Group membership is only re-read when a new login session starts, so you
have to disconnect and reconnect (or start a fresh shell) for the `docker`
group to actually take effect — that's why the guide has you `exit` and
`ssh` back in.

### 1.3 Installing the Docker Compose plugin

Amazon Linux 2023's stock `docker` package does **not** bundle the Compose
or Buildx plugins the way Docker Desktop does — they have to be installed
separately as CLI plugins.

```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
```
Creates the directory Docker's CLI scans for plugin binaries. `-p` creates
any missing parent directories too and doesn't error if it already exists.

```bash
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
```
Downloads the Compose v2 binary straight from GitHub Releases and saves it
into that plugins folder under the exact filename `docker-compose` — the
Docker CLI finds plugins by filename convention (`docker-<subcommand>`),
which is what makes `docker compose ...` work as a subcommand of `docker`.
`-S` shows errors, `-L` follows redirects (GitHub's download links redirect
to a CDN).

```bash
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```
Marks the downloaded file executable — `curl` just writes bytes to disk, it
doesn't set the execute permission.

```bash
docker compose version
```
Sanity check: if this prints a version, the plugin installed correctly.

### 1.4 Installing the Docker Buildx plugin

You hit this one live: `docker compose up --build` needs the **Buildx**
plugin (Docker's modern image builder) version 0.17+, which also isn't in
the base package.

```bash
BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep '"tag_name":' | cut -d '"' -f4)
```
Buildx's release filenames embed the version number (e.g.
`buildx-v0.19.3.linux-amd64`), so — unlike Compose — there's no fixed
"latest" filename to download directly. This line asks GitHub's API for the
latest release's metadata (`curl -s` = silent, no progress bar), pulls out
the `"tag_name": "v0.19.3"` line with `grep`, and uses `cut -d '"' -f4` to
slice out just `v0.19.3` from between the quotes. That gets stored in the
shell variable `BUILDX_VERSION` for the next command to use.

```bash
sudo curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
docker buildx version
```
Same pattern as Compose: download the binary for the version just looked
up, save it as `docker-buildx` in the plugins folder, make it executable,
verify.

### 1.5 Getting the code

```bash
git clone https://github.com/sachinsiddhpura/Society-Management.git app
cd app/deployment
```
Clones your GitHub repo into a new folder `app`, then moves into the
`deployment` subfolder — that's where `docker-compose.yml` and the `.env`
file live, and it's the directory you need to be in for the `../backend`
and `../frontend` build paths in `docker-compose.yml` to resolve correctly.

### 1.6 Configuring secrets

```bash
cp .env.example .env
nano .env
```
Copies the template to a real `.env` file (which is gitignored — never
committed) and opens it in the `nano` text editor so you can fill in real
passwords and the JWT secret.

```bash
openssl rand -base64 48
```
Generates 48 random bytes and base64-encodes them into a long, unguessable
string — used as `JWT_SECRET`, the key the backend uses to cryptographically
sign and verify login tokens. If this were short or predictable, someone
could forge valid login tokens without a password.

### 1.7 Building and starting everything

```bash
docker compose up -d --build
```
- `--build` tells Compose to build fresh images from the `Dockerfile`s
  (rather than trying to pull pre-built ones) before starting containers.
- `-d` ("detached") runs the containers in the background instead of
  attaching your terminal to their logs.
- Compose reads `docker-compose.yml`, builds the `backend` and `frontend`
  images, pulls the official `mysql:8.0` image, creates a private Docker
  network so the three containers can reach each other by service name, and
  starts all three.

```bash
docker compose ps
```
Lists the containers this compose project owns, with their status
(`running`, `healthy`, `exited`, etc.) — the first thing to check when
something isn't working.

```bash
docker compose logs -f backend
```
Streams (`-f` = follow, like `tail -f`) the backend container's console
output live — this is where Spring Boot's startup log, Flyway migration
output, and any errors show up.

---

## PART 2 — How each piece actually gets deployed

### 2.1 The database (MySQL)

There's no custom Dockerfile for the database — `docker-compose.yml` just
uses the official `mysql:8.0` image directly. On its **first** startup
only, that image's built-in entrypoint script reads the
`MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD`
environment variables and automatically creates the database and user
accordingly — you never ran a `CREATE DATABASE` command by hand.

Once MySQL is up, it's the **backend** that actually builds the schema:
Spring Boot's Flyway integration runs
`backend/src/main/resources/db/migration/V1__init.sql` automatically the
moment the backend container starts and successfully connects, creating
every table (`societies`, `users`, `flats`, `visitor_entries`,
`delivery_entries`) and seeding the platform super admin account. That's
why you never had to run `database/schema.sql` manually in this Docker
path — it's only there for manual/offline inspection or non-Docker setups.

Data survives container restarts/rebuilds because MySQL's data directory
(`/var/lib/mysql` inside the container) is mapped to the named Docker
volume `mysql_data` — more on volumes below.

### 2.2 The backend (Spring Boot API)

`backend/Dockerfile` is a **multi-stage build**:

1. **Build stage** (`maven:3.9-eclipse-temurin-21` image): copies in
   `pom.xml` and the `src/` folder, then runs `mvn package`, which compiles
   all the Java code and produces a single runnable
   `society-management-backend.jar`.
2. **Run stage** (`eclipse-temurin:21-jre-alpine` — a much smaller image
   with just the Java *runtime*, no compiler/build tools): copies **only**
   the finished jar out of the build stage and sets it as the container's
   entrypoint.

The result is a small final image that doesn't carry Maven, the full JDK,
or any source code — just the app and a JRE to run it. This two-stage
pattern is why the image that actually deploys is much smaller than if you
built and ran in the same layer.

At container startup, the jar reads its configuration from environment
variables (`DB_HOST=mysql`, `JWT_SECRET`, etc. — set in
`docker-compose.yml`), connects to the `mysql` container over the Docker
network, runs Flyway migrations, and starts listening on port 8080 inside
the container.

### 2.3 The frontend (React SPA)

`frontend/Dockerfile` is also multi-stage:

1. **Build stage** (`node:20-alpine`): copies in `package.json`, runs
   `npm ci` (installs exact dependency versions from `package-lock.json`),
   copies in the rest of the source, then runs `npm run build`. Vite
   compiles all the JSX/JS into a handful of optimized, minified static
   files (HTML/CSS/JS) in a `dist/` folder — there is no "server" for a
   React app in production, just static files.
2. **Run stage** (`nginx:1.27-alpine`): copies **only** the `dist/` folder
   from the build stage into nginx's web root, plus a custom
   `nginx.conf`, and that's the entire final image — a tiny web server
   serving static files, no Node.js in the deployed image at all.

Because a browser can't reach the `backend` container directly (it's only
reachable by its service name *inside* Docker's private network), the app
is built with `VITE_API_BASE_URL=/api` — a **relative** path. When your
browser loads the page from `http://YOUR_EC2_IP/` and then calls
`/api/auth/login`, that request goes to the same nginx container, which
then reverse-proxies it internally to `http://backend:8080/api/...` (see
`nginx.conf` below). This means the frontend never needs to know the
backend's address — one image works identically on your laptop, in Docker
Compose, or behind any future domain name.

---

## PART 3 — `docker-compose.yml`, line by line

```yaml
services:
```
Top-level key. Everything under it defines one container ("service") that
Compose should build/pull and run.

### The `mysql` service

```yaml
  mysql:
    image: mysql:8.0
```
Use the official MySQL image, version 8.0, pulled from Docker Hub — no
custom build needed.

```yaml
    container_name: society-mysql
```
Gives the running container a fixed, human-readable name (instead of an
auto-generated one like `deployment-mysql-1`) — used in the backup commands
in `DEPLOYMENT.md` (`docker exec society-mysql ...`).

```yaml
    restart: unless-stopped
```
If the container crashes, or the EC2 instance reboots, Docker restarts it
automatically — *unless* you explicitly stopped it yourself
(`docker compose stop`), in which case it stays stopped. This is what
makes the app survive an instance reboot without you having to SSH back in.

```yaml
    environment:
      MYSQL_DATABASE: ${DB_NAME:-society_management}
      MYSQL_USER: ${DB_USERNAME:-society_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:?DB_ROOT_PASSWORD is required}
```
Environment variables passed into the container, read by MySQL's official
entrypoint script on first boot to auto-create the database/user.
`${DB_NAME:-society_management}` means "use the `DB_NAME` value from
`.env`, or default to `society_management` if it's not set."
`${DB_PASSWORD:?DB_PASSWORD is required}` is stricter — the `:?` means
Compose **refuses to start** and prints that error message if `DB_PASSWORD`
is missing from `.env`, rather than silently starting MySQL with a blank
password.

```yaml
    volumes:
      - mysql_data:/var/lib/mysql
```
Maps the named volume `mysql_data` (declared at the bottom of the file) to
`/var/lib/mysql` inside the container — that's the directory where MySQL
physically stores all table data. Without this, every `docker compose
down` would silently wipe your entire database, because container
filesystems are ephemeral by default.

```yaml
    ports:
      - "3306:3306"
```
Maps port 3306 on the EC2 host to port 3306 inside the container, so you
*could* connect a MySQL client directly from outside if needed (e.g. for
debugging or running `seed.sql` by hand). In a hardened production setup
you'd usually remove this and only let the `backend` container reach MySQL
over the internal Docker network, closing 3306 to the outside world.

```yaml
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
```
Docker periodically runs `mysqladmin ping` *inside* the container to check
if MySQL is actually ready to accept connections (not just "the process
started," which happens well before MySQL finishes initializing). `interval:
10s` = check every 10 seconds; `timeout: 5s` = give up on a single check
after 5 seconds; `retries: 10` = must fail 10 checks in a row to be marked
unhealthy; `start_period: 30s` = don't count failures during the first 30
seconds of the container's life, since MySQL's first-ever startup
(creating the database) genuinely takes a while.

### The `backend` service

```yaml
  backend:
    build:
      context: ../backend
```
Instead of `image:`, this says "build an image from the Dockerfile found in
`../backend`" (relative to this compose file, i.e. the `backend/` folder at
the project root) — that's `backend/Dockerfile`.

```yaml
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-society_management}
      DB_USERNAME: ${DB_USERNAME:-society_user}
      DB_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
      JWT_SECRET: ${JWT_SECRET:?JWT_SECRET is required}
      JWT_EXPIRATION_MS: ${JWT_EXPIRATION_MS:-86400000}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost}
      UPLOAD_DIR: /app/uploads
```
`DB_HOST: mysql` is the key line to understand — inside a Compose network,
containers can reach each other using their **service name** as a hostname.
The backend doesn't need the MySQL container's IP address; Docker's
built-in DNS resolves `mysql` to whatever internal IP that container
currently has. The rest are read by `backend/src/main/resources/
application.yml` (which uses `${DB_HOST:localhost}` etc. — Spring's syntax
for "read this environment variable, or fall back to a default").
`UPLOAD_DIR: /app/uploads` tells the backend where to save/serve captured
photos from — matching the volume mount below.

```yaml
    volumes:
      - uploads_data:/app/uploads
```
Same reasoning as the MySQL data volume: visitor/delivery photos saved to
`/app/uploads` inside the container are persisted in the named volume
`uploads_data`, so they survive container rebuilds/restarts instead of
vanishing every time you redeploy.

```yaml
    depends_on:
      mysql:
        condition: service_healthy
```
Tells Compose not to start the `backend` container until `mysql` reports
`healthy` via the healthcheck above — without this, the backend could start
and try to connect before MySQL has finished initializing, and crash on
boot.

```yaml
    ports:
      - "8080:8080"
```
Exposes the backend directly on port 8080 of the EC2 host — mainly useful
for you to hit the API directly while debugging
(`http://YOUR_EC2_IP:8080/api/...`) or for Postman. In normal browser use,
traffic reaches the backend indirectly through the frontend's nginx proxy
instead (port 80), not this port.

### The `frontend` service

```yaml
  frontend:
    build:
      context: ../frontend
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api}
```
Builds from `frontend/Dockerfile`. `args` passes a **build-time** argument
(`ARG VITE_API_BASE_URL` in the Dockerfile) — unlike `environment:`, this
value gets baked into the compiled static JS during `npm run build`,
because a static site has no runtime to read environment variables from
once it's just HTML/CSS/JS sitting in a browser.

```yaml
    depends_on:
      - backend
```
Simple ordering (start `backend` first) — not a health-based wait like
MySQL's, just "don't bother starting the frontend before the backend
container at least exists."

```yaml
    ports:
      - "80:80"
```
Maps the container's nginx (port 80) to port 80 on the EC2 host — this is
the port your browser actually talks to at `http://YOUR_EC2_IP`.

### Volumes

```yaml
volumes:
  mysql_data:
  uploads_data:
```
Declares the two named volumes referenced above. Docker manages the actual
storage location on the host disk; you just reference them by name. They
persist until you explicitly run `docker compose down -v` (the `-v` is what
deletes volumes — without it, `down` removes containers but keeps data).

---

## PART 4 — `frontend/nginx.conf`, line by line

```nginx
server {
    listen 80;
    server_name _;
```
Defines one virtual host listening on port 80. `server_name _;` means
"match any hostname" — this container doesn't care whether it's reached via
IP address or a domain name later.

```nginx
    root /usr/share/nginx/html;
    index index.html;
```
Static files live at `/usr/share/nginx/html` (where the Dockerfile copied
the Vite `dist/` build output). `index.html` is served by default for
directory requests.

```nginx
    client_max_body_size 10M;
```
Allows request bodies (like a captured photo upload) up to 10MB; nginx's
default is only 1MB and would otherwise reject photo uploads with a 413
error.

```nginx
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```
Any request whose path starts with `/api/` is **not** served as a static
file — instead nginx forwards ("proxies") it to `http://backend:8080/api/`,
again using the Docker-internal service name `backend`. The `proxy_set_header`
lines preserve the original client info (real IP, protocol) in headers
the backend can read, since without them the backend would just see
"traffic coming from nginx" rather than the real visitor.

```nginx
    location /uploads/ {
        proxy_pass http://backend:8080/uploads/;
        proxy_set_header Host $host;
    }
```
Same idea for visitor/delivery photos — `<img src="/uploads/...">` in the
frontend gets proxied through to the backend, which serves those files
from the `uploads_data` volume.

```nginx
    location / {
        try_files $uri $uri/ /index.html;
    }
```
This is what makes client-side routing (React Router) work. For any
request that isn't `/api/...` or `/uploads/...`: first try to serve it as
an actual file (`$uri`), then as a directory (`$uri/`), and if neither
exists — e.g. someone loads `/visitors` directly or refreshes the page —
fall back to serving `index.html` and let React Router figure out what to
render client-side, instead of nginx returning a 404 for a route that only
exists in JavaScript.

```nginx
    location = /health {
        access_log off;
        return 200 "ok\n";
    }
}
```
A trivial endpoint returning "ok" — used by the Dockerfile's `HEALTHCHECK`
instruction to confirm nginx itself is alive, without cluttering the access
log with health-check noise (`access_log off`).

---

## PART 5 — Quick mental model

```
Browser  --80-->  [frontend container: nginx]
                        |
                        |-- serves static React files directly
                        |-- proxies /api/*      --> [backend container: Spring Boot :8080]
                        |-- proxies /uploads/*  --> [backend container]
                                                          |
                                                          |-- JDBC over Docker network
                                                          v
                                                [mysql container :3306]
```

All three containers sit on one private Docker network that Compose
creates automatically for this project. Only ports 80, 8080, and 3306 are
published to the host (and from there, to the internet, gated by your EC2
security group) — everything else is internal container-to-container
traffic that never leaves the Docker network.
