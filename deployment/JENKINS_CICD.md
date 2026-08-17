# CI/CD with Jenkins — Full Setup Guide

Sets up: **push to `main` on GitHub → Jenkins (on its own EC2 instance)
automatically builds and sanity-checks the code → SSHes into your app's
EC2 instance → pulls the new code → rebuilds and restarts the Docker
containers.**

```
GitHub (push to main)
     |  webhook (instant notification)
     v
Jenkins EC2 instance  ──ssh──>  App EC2 instance (mysql + backend + frontend)
  - checks out code                - git reset --hard origin/main
  - mvn package (sanity build)      - docker compose up -d --build
  - npm run build (sanity build)
```

Two separate EC2 instances: one dedicated to Jenkins (builds are memory/CPU
hungry — you don't want them competing with your live app for RAM), one
running the app exactly as it does today. Jenkins doesn't deploy an
artifact it built itself; it just triggers the *same* `docker compose up -d
--build` you already run by hand today, over SSH, on the app server —
whichever code is on `main` at that moment.

---

## Prerequisites

- The app EC2 instance already set up and running (`DEPLOYMENT.md`) with
  the repo cloned at `~/app` on it
- That EC2 instance's `.pem` SSH key file
- A GitHub repo (already have: `sachinsiddhpura/Society-Management`)

---

## Step 1 — (Recommended) Give the app server a fixed IP

Right now your app EC2 instance's public IP can change if it's ever
stopped/restarted. Since Jenkins will SSH to a specific IP on every deploy,
lock it down first:

1. AWS Console → **EC2 → Network & Security → Elastic IPs → Allocate
   Elastic IP address** → Allocate.
2. Select the new address → **Actions → Associate Elastic IP address** →
   pick your app instance → Associate.
3. Note the new IP — you'll use it below as `APP_SERVER_HOST`. (If you skip
   this, just make sure to update the Jenkins job's `APP_SERVER_HOST`
   parameter any time the app instance's IP changes.)

---

## Step 2 — Launch the Jenkins EC2 instance

Same process as your app instance:

1. AWS Console → **EC2 → Launch Instance**.
2. Name: `jenkins-server`. AMI: **Amazon Linux 2023**. Type: `t3.small`
   minimum (Jenkins + Maven + npm builds need more than `t2.micro`'s 1GB
   RAM) or `t3.medium` if you want headroom.
3. Key pair: create a new one (e.g. `jenkins-key`) or reuse an existing one
   — download the `.pem`.
4. Security group — create a new one, `jenkins-sg`, with inbound rules:
   - `22` (SSH) from **your IP only**
   - `8080` (Jenkins web UI + GitHub webhook target) from **0.0.0.0/0** (or
     see the security note at the bottom for restricting this to GitHub's
     IP ranges)
5. Storage: 20GB is comfortable.
6. Launch.

---

## Step 3 — Install Jenkins, Java, Maven, and Node on that instance

```bash
ssh -i "jenkins-key.pem" ec2-user@YOUR_JENKINS_PUBLIC_IP
```

```bash
sudo dnf update -y
sudo dnf install -y java-21-amazon-corretto git wget
```

Add the official Jenkins package repo and install it:

```bash
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
sudo dnf install -y jenkins
sudo systemctl daemon-reload
sudo systemctl enable --now jenkins
```

Install Maven (to build the backend) and Node.js 20 (to build the
frontend) — these run the pipeline's sanity-build stages:

```bash
sudo dnf install -y maven
mvn -v
```

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v
npm -v
```

Confirm Jenkins is up:

```bash
sudo systemctl status jenkins
```

---

## Step 4 — Unlock Jenkins and finish the setup wizard

1. Visit `http://YOUR_JENKINS_PUBLIC_IP:8080` in a browser.
2. Get the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Paste it in, choose **Install suggested plugins**, wait for it to finish.
4. Create your real admin user when prompted (don't leave the default
   password lying around).

---

## Step 5 — Install two extra plugins

**Manage Jenkins → Plugins → Available plugins**, search for and install:

- **SSH Agent** — lets the pipeline use an SSH private key credential to
  connect to the app server (`sshagent(...)` step in the Jenkinsfile).
- **GitHub Integration** — enables the "GitHub hook trigger for GITScm
  polling" build trigger, so a GitHub webhook can kick off a build.

(Git and Pipeline plugins are already included in "suggested plugins" from
Step 4.)

---

## Step 6 — Add the app server's SSH key as a Jenkins credential

1. **Manage Jenkins → Credentials → System → Global credentials
   (unrestricted) → Add Credentials**.
2. Kind: **SSH Username with private key**.
3. ID: `app-ec2-ssh-key` (must match exactly — the Jenkinsfile references
   this ID).
4. Username: `ec2-user`.
5. Private key: **Enter directly** → paste the full contents of the app
   EC2's `.pem` file (open it in a text editor and copy everything,
   including the `-----BEGIN...-----` / `-----END...-----` lines).
6. Save.

---

## Step 7 — Let Jenkins SSH into the app server

The app EC2 instance's security group currently only allows SSH from your
own laptop's IP — Jenkins also needs to reach it on port 22.

AWS Console → **EC2 → select the app instance → Security tab → click its
security group → Edit inbound rules → Add rule**:
- Type: SSH, Port 22, Source: the Jenkins instance's security group
  (`jenkins-sg`) if they're in the same VPC (cleanest — search for it by
  name in the source field), or its public IP `/32` otherwise.

---

## Step 8 — Add the Jenkinsfile to the repo

A `Jenkinsfile` has already been created at the repo root
(`C:\Users\sachi\My Activities\Projects\todo\Jenkinsfile`) — it defines the
pipeline stages Jenkins will run. It needs to be committed and pushed so
Jenkins (configured to read "Pipeline script from SCM" in the next step)
can find it. Run yourself from the project root:

```bash
git checkout main
git pull
git add Jenkinsfile deployment/JENKINS_CICD.md
git commit -m "Add Jenkins CI/CD pipeline"
git push
```

Before pushing, open the `Jenkinsfile` and update the default
`APP_SERVER_HOST` value to your actual app EC2 IP (or Elastic IP from Step
1) if it's different from the placeholder already in there.

---

## Step 9 — Create the Jenkins pipeline job

1. Jenkins dashboard → **New Item**.
2. Name: `society-management-cicd`. Type: **Pipeline**. OK.
3. **Build Triggers** section → check **GitHub hook trigger for GITScm
   polling**.
4. **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/sachinsiddhpura/Society-Management.git`
   - Branch Specifier: `*/main`
   - Script Path: `Jenkinsfile`
5. Save.

---

## Step 10 — Add the GitHub webhook

1. GitHub → your repo → **Settings → Webhooks → Add webhook**.
2. Payload URL: `http://YOUR_JENKINS_PUBLIC_IP:8080/github-webhook/`
   (the trailing slash matters).
3. Content type: `application/json`.
4. Which events: **Just the push event**.
5. Active: checked. **Add webhook**.

GitHub will immediately send a test ping — check it shows a green
checkmark under **Recent Deliveries** on that webhook's page. A red X
usually means Jenkins isn't reachable on port 8080 from the internet
(re-check the `jenkins-sg` security group).

---

## Step 11 — Test it

First, trigger one build manually to make sure everything's wired up
before relying on the webhook:

Jenkins job page → **Build with Parameters** → confirm/adjust
`APP_SERVER_HOST` → **Build**. Watch it under **Build History → Console
Output**.

If that succeeds, make a trivial change locally (e.g. edit the README),
commit, and push to `main` — a new build should start in Jenkins within a
few seconds automatically, with no manual trigger.

```bash
git add README.md
git commit -m "Test Jenkins webhook trigger"
git push
```

---

## What each pipeline stage does

- **Checkout** — Jenkins pulls the exact commit that was just pushed.
- **Backend: compile & package** (`mvn -DskipTests clean package`) — a fast
  correctness gate. This is *not* the jar that ends up running in
  production — the app server's Docker build compiles its own copy from
  scratch in a clean container. This stage exists purely to catch a commit
  that doesn't even compile *before* it reaches the Deploy stage.
- **Frontend: install & build** (`npm ci && npm run build`) — same idea for
  the React app.
- **Deploy to AWS** — opens an SSH connection to the app server (using the
  `app-ec2-ssh-key` credential via the SSH Agent plugin) and runs, on that
  server: `git fetch` + `git reset --hard origin/main` (guarantees the repo
  there exactly matches what's on GitHub, discarding any stray local
  changes — safe, because the only file that could differ,
  `deployment/.env`, is gitignored and untouched by this), then `docker
  compose up -d --build`, exactly what you've been running by hand.
- **Verify** — runs `docker compose ps` on the app server and prints it to
  the Jenkins build log, so you can see container status without SSHing in
  yourself.

If any stage fails, the pipeline stops immediately (Jenkins default) — a
broken commit that fails to compile never reaches the Deploy stage, and the
previously-running deployment is left untouched.

---

## Troubleshooting

- **Webhook shows a red X in GitHub's Recent Deliveries** — Jenkins isn't
  reachable on `:8080` from the internet. Re-check `jenkins-sg` allows
  inbound `8080` from `0.0.0.0/0`, and that `sudo systemctl status jenkins`
  shows it running.
- **Pipeline stuck / never triggers on push** — confirm the job's *Build
  Triggers* has "GitHub hook trigger for GITScm polling" checked, and that
  the webhook's Payload URL ends in `/github-webhook/`.
- **`Permission denied (publickey)` in the Deploy stage** — the pasted
  private key in the `app-ec2-ssh-key` credential doesn't match the app
  server's key pair, or the `Username` isn't `ec2-user`.
- **`ssh: connect to host ... port 22: Connection timed out`** — the app
  EC2 security group isn't allowing inbound SSH from the Jenkins instance
  (Step 7).
- **`mvn: command not found` / `npm: command not found`** — Maven or
  Node.js didn't install correctly on the Jenkins instance; re-run the
  relevant install commands from Step 3 and confirm `mvn -v` / `node -v`
  work over SSH as the `jenkins` user, not just `ec2-user` (run
  `sudo -u jenkins mvn -v` to check).
- **`docker compose` fails on the app server during Deploy** — SSH into the
  app server directly and run the same command
  (`cd ~/app/deployment && docker compose up -d --build`) to see the full
  error; the usual causes are the same ones from initial setup (buildx
  missing, `.env` not filled in, etc.).

---

## Security notes for later

- Restricting the Jenkins `8080` inbound rule to
  [GitHub's published webhook IP ranges](https://api.github.com/meta)
  instead of `0.0.0.0/0` reduces exposure, at the cost of having to update
  the security group if GitHub's ranges change.
- Consider putting Jenkins behind HTTPS (nginx + certbot in front of it,
  same pattern as the app's optional TLS setup in `DEPLOYMENT.md`) rather
  than exposing the plain web UI on `:8080` over HTTP.
- The `app-ec2-ssh-key` credential grants Jenkins full SSH access to your
  production server — treat the Jenkins instance itself (its admin
  password, and who has access to configure jobs/credentials) as security-
  sensitive as the production server.
