# Milestone 01 — MySQL as a Docker container

This is what `deployment/docker-compose.yml` and `deployment/.env.example`
looked like when MySQL ran as a `mysql:8.0` container (service name
`mysql`, container name `society-mysql`) on the same EC2 instance as the
backend/frontend, with its data in a Docker named volume (`mysql_data`).

**Why it changed:** that setup meant the database died if the EC2 instance
was ever terminated, had no automated backups beyond manual `mysqldump`,
and competed with the app containers for that one instance's CPU/RAM.

**Superseded by:** [`deployment/RDS_SETUP.md`](../../deployment/RDS_SETUP.md)
— MySQL moved to a managed Amazon RDS instance. The `mysql` service was
removed from `docker-compose.yml` entirely; `backend` now points `DB_HOST`
at the RDS endpoint via `.env` instead of the container's service name.

## Files in this snapshot

- `deployment/docker-compose.yml` — full compose file including the
  `mysql` service, its healthcheck, and the `mysql_data` volume.
- `deployment/.env.example` — included `DB_ROOT_PASSWORD`, which the RDS
  setup doesn't use (RDS has no separate "root" concept the way the
  official MySQL Docker image does — just the master username/password
  you set when creating the instance).
