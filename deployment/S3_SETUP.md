# Moving Photo Storage to Amazon S3

## Why

Visitor and delivery photos currently live on the app EC2 instance's own
disk (a Docker volume). That means: the instance holds real state outside
the database, so it isn't safely replaceable; backups need a separate step
from the database; and every photo request round-trips through the
backend and nginx.

**S3** is AWS's object storage service. The backend uploads photos there
instead, and the browser loads them directly from S3's own URL — the
backend becomes fully stateless (nothing on its local disk matters
anymore), and photo traffic no longer touches your backend or nginx at
all.

This also finally puts **IAM** to real use: the backend authenticates to
S3 using the app EC2 instance's **IAM role**, not a hardcoded access
key/secret sitting in a config file. That's the correct way to do this on
AWS — nothing to leak, nothing to rotate, and the AWS SDK picks it up
automatically with zero code for credentials.

---

## Step 1 — Create the S3 bucket

AWS Console → **S3 → Create bucket**.

1. Bucket name: must be globally unique across all of AWS, e.g.
   `society-management-photos-<something-unique-to-you>`.
2. Region: same region as your other resources (e.g. `ap-south-1`).
3. **Block Public Access settings**: uncheck **"Block all public access"**.
   This doesn't make the bucket world-writable or browsable — it just lets
   *you* opt a specific bucket policy into granting public read on a
   specific prefix, which is what Step 2 does. Nothing is public until you
   explicitly write that policy.
4. Leave everything else at defaults. **Create bucket**.

---

## Step 2 — Bucket policy: public read, only for uploaded photos

Photos need to be viewable directly by the browser (`<img src="...">`),
but nothing else in the bucket should be exposed, and no one should be
able to *list* what's in it.

Bucket → **Permissions** tab → **Bucket policy** → **Edit** → paste
(substituting your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
    }
  ]
}
```

**Security note, explicitly:** this grants `GetObject` only (no
`ListBucket`), and only under the `uploads/` prefix. Nobody can browse or
enumerate the bucket's contents — they can only fetch a photo if they
already know its exact URL, which contains a random UUID. That's
"unguessable, not access-controlled" — reasonable for this app today, but
if you later want *actual* access control (e.g. only a resident's own
household can view a visitor's photo), the stronger approach is
short-lived presigned URLs generated per-request instead of a public
bucket — ask if you want that upgrade later, it's a real code change, not
just a console setting.

---

## Step 3 — Create an IAM policy and role for the app server

**3a. Create the policy** (least privilege — only `PutObject`/`DeleteObject`
under `uploads/`, nothing else): **IAM → Policies → Create policy → JSON**
tab, paste (substituting your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
    }
  ]
}
```

Name it `society-app-s3-uploads-policy` → **Create policy**.

**3b. Create the role**: **IAM → Roles → Create role**.
- Trusted entity type: **AWS service**
- Use case: **EC2**
- Next → attach `society-app-s3-uploads-policy` → Next
- Name it `society-app-ec2-role` → **Create role**.

---

## Step 4 — Attach the role to the app EC2 instance

**EC2 Console → Instances → select your app instance → Actions →
Security → Modify IAM role** → select `society-app-ec2-role` → **Update
IAM role**.

That's it — no access key, no secret, anywhere. Any process running on
that instance (including inside Docker containers, since the AWS SDK
reaches the instance metadata service through the container's network
just like any other process on the host) can now get temporary,
auto-rotating S3 credentials for exactly the two actions the policy
allows.

---

## Step 5 — Pull the code and redeploy

The backend/frontend code for this (S3 upload via the AWS SDK, IAM-role
credentials, updated `docker-compose.yml`/`nginx.conf`) is already
committed — pull it and redeploy on the **app EC2 instance**:

```bash
cd ~/app
git fetch origin main
git reset --hard origin/main
git log -1 --oneline
```

Confirm that last command shows the latest commit (see the note at the
bottom of `TROUBLESHOOTING.md` about why this step can't be skipped).
Then update `.env`:

```bash
cd deployment
nano .env
```

Add:
```
S3_BUCKET_NAME=your-actual-bucket-name
AWS_REGION=ap-south-1
```

Rebuild with `--no-cache` to guarantee a fresh build, and force new
containers:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

---

## Step 6 — Verify

1. Log in, go to **Visitor Entry** (or Delivery Entry), use **"📁 Upload
   Photo"** (or the camera, if you're on HTTPS by now), submit the entry.
2. Open the **Visitor Log** — the photo should display.
3. Right-click the photo → "Open image in new tab" — the URL should look
   like `https://YOUR_BUCKET.s3.ap-south-1.amazonaws.com/uploads/2026-.../....jpg`.
4. Cross-check in **S3 Console → your bucket → uploads/** — you should see
   the same file, organized by date.

---

## Troubleshooting

- **Upload fails with an S3 access error in `docker compose logs backend`**
  → the IAM role either isn't attached to the instance (recheck Step 4),
  or the policy's `Resource` ARN doesn't exactly match your bucket name
  (a typo here silently denies everything).
- **Upload appears to succeed but the image is broken in the browser** →
  the bucket policy's `Resource` doesn't match, or "Block Public Access"
  wasn't actually unchecked for the bucket in Step 1.
- **`S3_BUCKET_NAME is required` when running `docker compose up`** →
  `.env` on the app server wasn't updated (Step 5).
- **Confirm the instance role is actually visible from inside the
  container**:
  ```bash
  docker exec -it society-backend curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
  ```
  Should print the role name (`society-app-ec2-role`). Empty output means
  the role isn't attached, or something is blocking access to the
  instance metadata service.

---

## What's next

RDS and S3 (both of Tier 2) are done. Tier 3 — ECR, an Application Load
Balancer with a free TLS cert via ACM (this is also what would finally fix
camera capture, which needs HTTPS), and eventually ECS Fargate — whenever
you're ready.
