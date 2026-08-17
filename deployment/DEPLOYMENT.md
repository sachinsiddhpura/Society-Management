# Deploying to AWS with Docker

This guide walks through deploying the Society Management System (MySQL +
Spring Boot backend + React/nginx frontend) to a single AWS EC2 instance using
Docker Compose. It's the simplest path to a working production deployment;
scaling notes (RDS, ALB, ECS) are at the bottom.

Everything below assumes you're running commands from your local machine
(AWS CLI + SSH) and then on the EC2 instance itself. Ask me to walk through
any step interactively when you're ready — I can run the local/AWS CLI
commands for you and hand you the ones that must run inside the EC2 shell.

---

## 0. Prerequisites

- An AWS account and the [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- An SSH key pair for EC2 access
- This repository pushed to a Git host (GitHub/GitLab) OR ready to `scp` up directly

---

## 1. Launch an EC2 instance

Minimum viable size: **t3.small** (2 vCPU / 2GB) for MySQL + backend + frontend
together. `t3.medium` if you expect real traffic.

```bash
aws ec2 create-key-pair --key-name society-app-key \
  --query 'KeyMaterial' --output text > society-app-key.pem
chmod 400 society-app-key.pem
```

Create a security group allowing SSH (22), HTTP (80), and HTTPS (443):

```bash
aws ec2 create-security-group --group-name society-app-sg \
  --description "Society Management App"

aws ec2 authorize-security-group-ingress --group-name society-app-sg \
  --protocol tcp --port 22 --cidr YOUR_IP/32

aws ec2 authorize-security-group-ingress --group-name society-app-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress --group-name society-app-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

Launch the instance (Amazon Linux 2023, adjust AMI id for your region):

```bash
aws ec2 run-instances \
  --image-id ami-0XXXXXXXXXXXXXXXX \
  --instance-type t3.small \
  --key-name society-app-key \
  --security-groups society-app-sg \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=20}' \
  --count 1
```

Note the public IP from the output (or `aws ec2 describe-instances`).

---

## 2. Connect and install Docker

```bash
ssh -i society-app-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

On the instance:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# log out and back in for the group change to take effect
exit
```

```bash
ssh -i society-app-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Install the Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

---

## 3. Get the code onto the instance

Option A — clone from Git:

```bash
git clone https://github.com/YOUR_USERNAME/society-management.git app
cd app/deployment
```

Option B — copy from your machine (run this locally, not on the instance):

```bash
scp -i society-app-key.pem -r "C:\Users\sachi\My Activities\Projects\todo" \
  ec2-user@YOUR_EC2_PUBLIC_IP:~/app
```

---

## 4. Configure environment variables

```bash
cd ~/app/deployment
cp .env.example .env
nano .env      # fill in real DB passwords and a strong JWT_SECRET
```

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

Set `CORS_ALLOWED_ORIGINS` to `http://YOUR_EC2_PUBLIC_IP` (or your domain
once you have one).

---

## 5. Build and start everything

```bash
cd ~/app/deployment
docker compose up -d --build
```

This builds the backend (Maven multi-stage build), builds the frontend
(Vite build served by nginx, which reverse-proxies `/api` and `/uploads` to
the backend container), and starts MySQL with a persistent volume.

Check status and logs:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

The backend runs its Flyway migration automatically on first startup — no
manual SQL step needed. `database/schema.sql` and `database/seed.sql` are
there if you ever want to inspect or seed data manually via
`mysql -h 127.0.0.1 -u society_user -p society_management < ../database/seed.sql`.

Visit `http://YOUR_EC2_PUBLIC_IP` in a browser. Log in with the seeded
super admin (`superadmin@society.app` / `Admin@123`) or register a new
society from the UI — **change the seeded passwords immediately**.

---

## 6. Point a domain at it (optional but recommended)

1. Create an A record for your domain pointing at the EC2 public IP.
2. Install nginx + certbot on the host, or add a `certbot/certbot` container
   in front of the existing `frontend` service, to get a free TLS cert:

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
sudo dnf install -y python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

If you terminate TLS with a host-level nginx, change the compose file's
frontend port mapping to `127.0.0.1:80:80` so only the host nginx (with TLS)
is publicly reachable, and have host nginx `proxy_pass` to it.

---

## 7. Keep it running / update it

Restart on reboot is automatic (`restart: unless-stopped` in
`docker-compose.yml`), and Docker itself is enabled as a system service.

Deploying a new version:

```bash
cd ~/app
git pull
cd deployment
docker compose up -d --build
```

View resource usage / prune old images:

```bash
docker compose ps
docker system df
docker image prune -f
```

---

## 8. Backups

Back up the MySQL volume regularly:

```bash
docker exec society-mysql sh -c \
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" society_management' \
  > backup-$(date +%F).sql
```

Back up uploaded photos (Docker named volume `uploads_data`):

```bash
docker run --rm -v deployment_uploads_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

---

## 9. Scaling beyond a single EC2 instance (later)

- **Managed database**: move MySQL to Amazon RDS, point `DB_HOST` at the RDS
  endpoint, and drop the `mysql` service from `docker-compose.yml`.
- **Object storage for photos**: swap `FileStorageService` to write to S3
  instead of the local `/app/uploads` volume, so backend containers stay
  stateless and can scale horizontally.
- **Container orchestration**: push images to Amazon ECR and run them on
  ECS Fargate or EKS behind an Application Load Balancer instead of a single
  EC2 host.
- **CI/CD**: build and push images to ECR on every merge to `main`, then
  `docker compose pull && docker compose up -d` on the host (or trigger an
  ECS deployment).

Ask me when you're ready to actually run these steps — I'll execute the
local/AWS CLI commands with you and give you the exact ones to paste into
the EC2 shell.
