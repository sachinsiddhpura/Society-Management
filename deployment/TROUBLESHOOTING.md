# Troubleshooting

Quick-reference commands, organized by symptom. This collects everything
we've actually hit and fixed while setting this project up — each guide
(`DEPLOYMENT.md`, `JENKINS_CICD.md`, `RDS_SETUP.md`) also has its own
troubleshooting section scoped to that topic; this file is the single
place to check first regardless of which part is acting up.

---

## First things to check, always

On the **app EC2 instance** (`~/app/deployment`):

```bash
docker compose ps
```

Shows every container's status. If something isn't `running`/`healthy`,
check its logs:

```bash
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

Follow logs live while reproducing an issue:

```bash
docker compose logs -f backend
```

---

## "This site can't be reached" / connection refused in the browser

The container that should be listening isn't up yet, or hasn't finished
starting. `docker compose ps` first — if it's still `starting` or
restarting in a loop, check `docker compose logs backend`.

## 502 Bad Gateway from the browser

This comes from **nginx** (the frontend container), meaning it's up but
has nothing to forward your request to — the **backend container crashed
or never started**. Go straight to `docker compose logs backend`; the 502
itself never tells you why, only that the backend is down.

---

## Backend fails to start with a database connection error

Look for the specific exception near the bottom of the stack trace — the
top-level error (often something like `UnsatisfiedDependencyException` /
`entityManagerFactory`) is just a symptom. Filter for the real cause:

```bash
docker compose logs backend | grep -A5 "Caused by: com.mysql\|Caused by: java.net"
```

- **`Access denied for user '...'`** → wrong `DB_USERNAME`/`DB_PASSWORD` in
  `.env`. Check `cat .env` for typos, and confirm the password matches what
  you set on the RDS instance (RDS Console → your DB → **Modify** → reset
  master password if you're not sure).
- **`CommunicationsException` / `SocketTimeoutException: Connect timed
  out`** → this is a **network-level** block (packets aren't getting a
  response at all, not even a rejection) — almost always a security group
  problem, not a credentials problem. See the next section.
- **`UnknownHostException`** → typo in `DB_HOST`, or you're pointing at a
  hostname that doesn't exist. Double check it against the exact endpoint
  string in the RDS console.

After fixing the actual cause, the backend needs an explicit restart to
retry — it only attempts the DB connection once at startup and exits on
failure:

```bash
docker compose restart backend
docker compose logs -f backend
```

Watch for `Migrating schema ... to version "1 - init"` (Flyway succeeding)
as confirmation the tables now exist.

---

## Diagnosing "connection timed out" to RDS step by step

This exact sequence found a real misconfiguration once — worth running in
order rather than guessing:

**1. Test raw TCP connectivity from the EC2 host itself**, bypassing
Docker and Java entirely, to isolate whether it's a Docker-networking
quirk or a genuine AWS-level block:

```bash
timeout 5 bash -c "</dev/tcp/YOUR_RDS_ENDPOINT/3306" && echo "TCP CONNECTION OK" || echo "TCP CONNECTION FAILED"
```

If this also fails, it's conclusively a security-group/network issue, not
anything about the app or containers.

**2. Confirm the RDS instance itself is `Available`**, not still
`Creating`/`Modifying`: RDS Console → Databases → your DB → check
**Status** in the Summary panel.

**3. Confirm which security group is actually attached to the *database*
itself** (not just that the right one exists somewhere): RDS Console →
Databases → your DB → **Connectivity & security** tab → scroll to **"VPC
security groups"**. This is the step that's easy to get wrong — a security
group can exist with perfectly correct rules and still not be doing
anything if it was never actually attached to the RDS instance. (We once
found RDS was still using the VPC's `default` security group instead of
the purpose-built one — `default` only allows traffic from other things
also wearing `default`, which the app server wasn't.)

**4. Confirm the app EC2 instance has the matching security group
attached**: EC2 Console → Instances → your app instance → **Security**
tab → check the **Security groups** list. An instance can have multiple
security groups at once; adding one doesn't remove the others
(**Actions → Security → Change security groups** to add one).

**5. Confirm the rule itself references a security group as its source,
not an IP** — click into the security group attached to RDS → Inbound
rules → the **Source** column should show another security group ID
(`sg-...`), not `0.0.0.0/0` or a specific IP. That's what makes it "only
the app server can connect" rather than "anyone can connect."

---

## Jenkins build queued forever ("Waiting for next available executor")

Jenkins' built-in **"Free Swap Space" node monitor** takes the node
offline automatically when free swap drops too low. First-time cause: an
EC2 instance has **0 swap configured** by default. Check **Manage Jenkins
→ Nodes → Built-in Node** — if it shows offline, this is almost certainly
why. Fix, on the **Jenkins EC2 instance**:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
sudo systemctl restart jenkins
```

`free -h` should show `Swap: 2.0Gi` instead of `0B`. Give it 30-60 seconds
after the restart, then refresh the Jenkins dashboard.

**If this keeps recurring** even with swap configured: on a `t3.small`
(2GB RAM), Maven/npm builds can eat into swap faster than it gets
reclaimed between runs, so the monitor re-triggers over and over. Dipping
into swap during a build here is expected and harmless, not real
unhealthiness — so stop the monitor from policing it, and give it more
headroom:

1. **Manage Jenkins → Nodes** → click the small monitor/gear icon at the
   top-right of the nodes table ("Node Monitors") → uncheck **Free Swap
   Space** → Save.
2. Bump swap 2GB → 4GB:
   ```bash
   sudo swapoff /swapfile
   sudo rm /swapfile
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   free -h
   ```
   (The `/etc/fstab` entry from the first fix already points at
   `/swapfile`, so it still persists across reboots without further
   changes.)

## Jenkins pipeline fails with `release version 21 not supported`

Amazon Linux 2023's `maven` package pulls in **Java 17** as its own
dependency (the RPM is literally `maven-amazon-corretto17`), which shadows
the Java 21 *runtime* installed for Jenkins itself — but this project
needs a Java 21 *compiler*, which was never separately installed. Fix, on
the **Jenkins EC2 instance**:

```bash
sudo dnf install -y java-21-amazon-corretto-devel
```

The `Jenkinsfile`'s backend build stage already resolves `JAVA_HOME`
dynamically from this package rather than trusting whatever `java`/`javac`
happen to be first on `PATH`, so no further pipeline changes are needed
once this package is installed.

## Jenkins Deploy stage fails with `Permission denied (publickey...)`

The private key stored in the `app-ec2-ssh-key` Jenkins credential doesn't
match what's authorized on the app server. Usually caused by pasting the
wrong `.pem` file (e.g. the Jenkins server's own key instead of the app
server's), or an incomplete paste (missing the `-----BEGIN/END-----`
lines). Fix: **Manage Jenkins → Credentials → System → Global credentials
→ `app-ec2-ssh-key` → Update** — re-paste the exact, complete contents of
the app EC2 instance's original `.pem` file, confirm Username is
`ec2-user`, save, and re-run the build.

---

## Backup / restore quick reference

One-off manual export of the RDS database:

```bash
docker run --rm mysql:8.0 \
  mysqldump -h YOUR_RDS_ENDPOINT -u admin -p'YOUR_PASSWORD' society_management \
  > backup-$(date +%F).sql
```

Restore a dump into RDS:

```bash
docker run --rm -i mysql:8.0 \
  mysql -h YOUR_RDS_ENDPOINT -u admin -p'YOUR_PASSWORD' society_management \
  < backup-file.sql
```

Back up the uploaded photos volume:

```bash
docker run --rm -v deployment_uploads_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

---

## General resource checks

```bash
df -h          # disk space
free -h        # memory + swap
docker system df   # Docker's own disk usage (images/containers/volumes)
docker image prune -f   # reclaim space from old/unused images
```
