# Milestone 02 — Uploaded photos on local disk

This is what the upload path looked like when visitor/delivery photos were
saved to the app EC2 instance's own disk (`/app/uploads` inside the
backend container, backed by the Docker named volume `uploads_data`), and
served back out through the backend itself at `/uploads/...`, which nginx
reverse-proxied.

**Why it changed:** the app server held real state (the photos) outside
the database, so it wasn't safely replaceable/scalable, backups needed a
separate step from the database, and every photo request round-tripped
through the backend and nginx instead of being served directly.

**Superseded by:** `deployment/S3_SETUP.md` — photos moved to Amazon S3.
The backend authenticates to S3 using the app EC2 instance's IAM role
(no access keys stored anywhere), `photoUrl` values are now direct S3
URLs the browser loads independently of the backend, and the `uploads_data`
volume, `/uploads/**` static resource handler, and nginx `/uploads/`
proxy rule were all removed as no longer needed.

## Files in this snapshot

- `deployment/docker-compose.yml`, `deployment/.env.example` — had
  `UPLOAD_DIR`/`uploads_data` volume wiring.
- `frontend/nginx.conf` — had a `/uploads/` proxy location.
- `backend/src/main/resources/application.yml` — had `app.upload.dir`.
- `backend/.../service/FileStorageService.java` — wrote to local disk via
  `java.nio.file`.
- `backend/.../config/WebConfig.java` — served `/uploads/**` as a static
  resource handler backed by that local directory (the whole class was
  removed - it existed only for this).
- `backend/pom.xml` — before the AWS S3 SDK dependency was added.
