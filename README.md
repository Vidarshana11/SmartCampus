# National University of Smart Technologies Operations Hub

<p align="center">
  <img src="./frontend/public/universityImage.png" alt="National University of Smart Technologies banner" width="920">
</p>

<p align="center">
  Full-stack campus operations platform with authentication, role management, resource booking, and notifications.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-Spring_Boot_3.x-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?logo=react&logoColor=black" alt="React Vite">
  <img src="https://img.shields.io/badge/Java-21%2B-007396?logo=openjdk&logoColor=white" alt="Java 21+">
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white" alt="MySQL">
</p>

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start For New Collaborators](#quick-start-for-new-collaborators)
- [Run The App](#run-the-app)
- [Email Setup (Required)](#email-setup-required)
- [Email Verification & Password Reset](#email-verification--password-reset)
- [CI/CD](#cicd)
- [Security Rules (Important)](#security-rules-important)
- [What Goes To GitHub vs Local Only](#what-goes-to-github-vs-local-only)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview
National University of Smart Technologies Operations Hub is a full-stack project for managing:
- users and role-based access
- resource and facility operations
- bookings
- notifications
- authentication with JWT and optional Google OAuth2

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Java 21+, Spring Boot, Spring Security, JPA, Gradle |
| Frontend | React, Vite, Axios |
| Database | MySQL / MariaDB |
| Auth | JWT + optional Google OAuth2 |

## Prerequisites
Install these first:

1. Java 21+
2. Node.js + npm
3. MySQL (or MariaDB)
4. Git

## Quick Start For New Collaborators

### 1. Clone the repository
```bash
git clone https://github.com/Vidarshana11/SmartCampus.git
cd SmartCampus
```

### 2. Create local config files

macOS/Linux/Git Bash:
```bash
./scripts/setup-local.sh
```

Windows PowerShell (manual fallback):
```powershell
Copy-Item backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
Copy-Item frontend/.env.example frontend/.env
```

### 3. Start MySQL

macOS:
```bash
mysql.server start
# or
brew services start mysql
```

Linux:
```bash
sudo service mysql start
```

Windows (run terminal as Administrator):
```powershell
net start MySQL80
# if service name is different:
Get-Service *mysql*
Start-Service MySQL80
```

### 4. Create database and user
Login:
```bash
mysql -u root -p
```

Run:
```sql
CREATE DATABASE smart_campus_db;
CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'smartcampus123';
GRANT ALL PRIVILEGES ON smart_campus_db.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Update backend local config
Open `backend/src/main/resources/application.properties` and verify:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus_db
spring.datasource.username=smartcampus
spring.datasource.password=smartcampus123
```

Optional Google OAuth2 (local only):
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

**Required: Email Configuration**

The app requires SMTP for email verification and password reset. See [Email Setup](#email-setup-required) below.

### 6. Frontend env
`frontend/.env` is already created from `.env.example`. Default:
```env
VITE_API_BASE_URL=http://localhost:8080
```

## Run The App

### Backend
macOS/Linux:
```bash
cd backend
./gradlew bootRun
```

Windows:
```powershell
cd backend
gradlew.bat bootRun
```

Backend URL: `http://localhost:8080`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Email Setup (Required)

Email is required for **email verification** (new registrations) and **password reset**. Add this to your `application.properties`:

```properties
# SMTP Configuration (Gmail example)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your.email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.mail.from=your.email@gmail.com

# Email verification settings
app.email-verification.ttl-minutes=1440
app.email-verification.frontend-verify-url=http://localhost:5173/verify-email

# Password reset settings
app.password-reset.ttl-minutes=30
app.password-reset.frontend-reset-url=http://localhost:5173/reset-password
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App passwords
3. Generate an app password for "Mail"
4. Use that 16-character password (not your regular password) in `spring.mail.password`

### Other SMTP Providers

**Outlook/Hotmail:**
```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
```

**Yahoo:**
```properties
spring.mail.host=smtp.mail.yahoo.com
spring.mail.port=587
```

### Local Development Mode (Console Logging)

For local development without real email, the app logs verification codes to the console:

```
Sending verification code to: user@example.com
Code: 123456
Link: http://localhost:5173/verify-email?code=123456&email=user@example.com
```

Check your backend terminal for these logs when testing registration or password reset.

## Email Verification & Password Reset

### Email Verification Flow (Registration)

New users must verify their email before logging in:

1. Register at `/register` → System sends 6-digit code to email
2. User enters code at `/verify-email` → Account activated
3. User can now log in

**Test locally:** Check backend logs for the verification code instead of using real email.

### Password Reset Flow

Users can reset forgotten passwords via email verification:

1. Click **Forgot Password?** on login page
2. Enter email → System sends 6-digit reset code
3. Enter code at `/forgot-password` (step 2)
4. Set new password at `/reset-password` (step 3)
5. Redirect to login with success message

**API Endpoints:**
- `POST /api/auth/send-reset-code` - Send reset code to email
- `POST /api/auth/verify-reset-code` - Verify the 6-digit code
- `POST /api/auth/reset-password` - Reset password with verified code

**Security features:**
- Generic responses (doesn't reveal if email exists)
- 6-digit codes expire after configured TTL (default 30 min)
- Single-use codes (deleted after verification)
- Rate limiting on code requests

## CI/CD

GitHub Actions workflows are defined in `.github/workflows`:

- `ci.yml`: Continuous Integration checks for pull requests and non-`main` branch pushes.
- `cd.yml`: Continuous Delivery packaging for `main`, version tags (`v*`), and manual runs.

### CI workflow (`.github/workflows/ci.yml`)

- **Triggers**
  - `pull_request` on all branches
  - `push` to branches except `main`
- **Jobs**
  - `Backend Build and Test`
    - Sets up Java 21
    - Runs `./gradlew test`
    - Builds `bootJar`
    - Uploads backend JAR artifact
  - `Frontend Lint and Build`
    - Sets up Node.js 20
    - Runs `npm ci`
    - Runs `npm run lint`
    - Runs `npm run build`
    - Uploads `frontend/dist` artifact

### CD workflow (`.github/workflows/cd.yml`)

- **Triggers**
  - `push` to `main`
  - `push` tags matching `v*` (example: `v1.0.0`)
  - `workflow_dispatch` (manual trigger)
- **Pipeline**
  - Builds backend release JAR (`./gradlew clean bootJar`)
  - Builds frontend production assets (`npm ci && npm run build`)
  - Archives frontend output as `frontend-dist.tar.gz`
  - Uploads release artifacts (`backend-jar-release`, `frontend-dist-release`)
  - Creates a GitHub Release when triggered by a `v*` tag, attaching both assets

### How to verify CI/CD runs

1. Go to your repository on GitHub and open the **Actions** tab.
2. Open a PR (or push to a non-`main` branch) to confirm **CI** runs and both jobs pass.
3. Merge to `main` to confirm **CD** runs and uploads release artifacts.
4. Create and push a version tag (for example `v0.1.0`) to confirm GitHub Release creation:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

## Security Rules (Important)
- Never commit `backend/src/main/resources/application.properties`
- Never commit `frontend/.env`
- Never commit OAuth/secret files (`client_secret*.json`, `credentials.json`, `.pem`, `.p12`, `.jks`, etc.)
- Never share Google OAuth client secrets in chat, commits, or screenshots
- If any secret is exposed, rotate it immediately

## What Goes To GitHub vs Local Only

| Keep in GitHub | Keep Local Only |
|---|---|
| `backend/src/main/resources/application.properties.example` | `backend/src/main/resources/application.properties` |
| `frontend/.env.example` | `frontend/.env` |
| Source code (`backend/src`, `frontend/src`) | OAuth credential JSON files |
| Docs + scripts (`README.md`, `scripts/setup-local.sh`) | Keys/certificates (`*.pem`, `*.p12`, `*.jks`) |

## Troubleshooting

### MySQL is not starting
- Check service name on Windows:
```powershell
Get-Service *mysql*
```
- Restart:
```powershell
net stop MySQL80
net start MySQL80
```

### Port 8080 already in use
macOS/Linux:
```bash
lsof -ti:8080 | xargs kill -9
```

Windows PowerShell:
```powershell
$pid = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }
```

### Gradle build errors
macOS/Linux:
```bash
cd backend
./gradlew clean build --refresh-dependencies
```

Windows:
```powershell
cd backend
gradlew.bat clean build --refresh-dependencies
```

### Email not sending

**Check SMTP credentials:**
- Verify `spring.mail.password` is an **App Password**, not your regular Gmail password
- Ensure `spring.mail.username` matches the email you're sending from
- Check backend logs for SMTP error messages

**For development without email:**
Codes are logged to the console. Look for lines like:
```
Sending verification code to: user@example.com
Code: 123456
```

### "Email not verified" error on login

New registrations require email verification. Check:
1. Backend logs for the verification code
2. Navigate to `/verify-email` and enter your email + the code
3. Or click "Resend code" on the verify page

## Project Structure
```text
SmartCampus/
├── backend/
│   ├── src/main/java/com/smartcampus/api/
│   │   ├── booking/
│   │   ├── config/
│   │   ├── notification/
│   │   ├── resource/
│   │   ├── security/
│   │   │   ├── AuthController.java
│   │   │   ├── EmailSenderService.java          # Email sending
│   │   │   ├── EmailVerificationService.java      # Verification logic
│   │   │   ├── EmailVerificationToken.java        # Verification entity
│   │   │   ├── PasswordResetService.java        # Password reset logic
│   │   │   ├── PasswordResetToken.java          # Reset code entity
│   │   │   └── TokenGeneratorService.java        # 6-digit code generation
│   │   └── user/
│   └── src/main/resources/
│       ├── application.properties.example
│       └── application.properties (local only)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ForgotPassword.jsx               # 3-step reset flow
│   │   │   ├── Register.jsx                     # Registration + verify prompt
│   │   │   ├── ResetPassword.jsx                # New password form
│   │   │   └── VerifyEmail.jsx                  # Code verification
│   │   └── services/
│   │       └── authService.js                   # Auth API calls
│   ├── public/universityImage.png
│   ├── .env.example
│   └── .env (local only)
└── scripts/setup-local.sh
```

---
Last Updated: April 17, 2026
