# Configuration History

Snapshots of configuration/deployment files as they existed **before** a
significant architectural change, so you can open the old version directly
and compare it against the current one without needing git commands.

(Full history of every file, including every intermediate edit, still
lives in git — `git log -- <path>` and `git diff <old-commit> <new-commit>
-- <path>` — this folder is a convenience layer on top of that for the
milestone-level "how did we used to do this" view, not a replacement.)

## How this is organized

One numbered subfolder per milestone, each containing the affected files
at their **old** relative path from the repo root, as they were
**immediately before** that milestone's change:

```
config-history/
  01-local-mysql-docker/
    deployment/docker-compose.yml   <- had a `mysql` service container
    deployment/.env.example         <- DB_* vars for that container
```

Each milestone folder has its own short `README.md` explaining what it
represents and what superseded it.

## Milestones so far

| # | What it captures | Superseded by |
|---|---|---|
| 01 | MySQL running as a Docker container alongside the app on one EC2 instance | [`RDS_SETUP.md`](../deployment/RDS_SETUP.md) — MySQL moved to Amazon RDS |
