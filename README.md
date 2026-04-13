# Smart Campus Operations Hub

<p align="center">
  <img src="./frontend/public/campus-white-bg.png" alt="Smart Campus banner" width="920">
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
- [Security Rules (Important)](#security-rules-important)
- [What Goes To GitHub vs Local Only](#what-goes-to-github-vs-local-only)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview
Smart Campus Operations Hub is a full-stack project for managing:
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
│   │   └── user/
│   └── src/main/resources/
│       ├── application.properties.example
│       └── application.properties (local only)
├── frontend/
│   ├── src/
│   ├── public/campus-white-bg.png
│   ├── .env.example
│   └── .env (local only)
└── scripts/setup-local.sh
```

---
Last Updated: April 6, 2026
