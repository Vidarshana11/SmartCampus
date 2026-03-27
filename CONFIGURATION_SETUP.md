# Application Properties Setup Guide

## ⚠️ Important: Configuration Files are NOT Committed to Git

The `application.properties` file contains **sensitive configuration** and is intentionally **excluded from version control**.

### Why?
- Prevents accidental exposure of database credentials
- Keeps API keys and secrets secure
- Each developer/environment has their own config

## 📋 Setup Instructions

### Step 1: Copy the Template
```bash
cd backend/src/main/resources/
cp application.properties.example application.properties
```

### Step 2: Configure for Your Environment

Edit `application.properties` with your local database credentials:

```properties
# Database Configuration - UPDATE THESE VALUES
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus_db
spring.datasource.username=YOUR_DB_USER
spring.datasource.password=YOUR_DB_PASSWORD
```

### Step 3: Database Setup

Create the database and user:
```bash
mysql -u root -p
```

```sql
CREATE DATABASE smart_campus_db;
CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'smartcampus123';
GRANT ALL PRIVILEGES ON smart_campus_db.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Optional - Configure OAuth2 (Google Login)

If using Google OAuth2:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials for "Web Application"
3. Add redirect URI: `http://localhost:8080/login/oauth2/code/google`
4. Update in `application.properties`:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

### Step 5: Run the Application

```bash
cd /path/to/SmartCampus/backend
./gradlew bootRun
```

## 📝 Configuration Reference

See `application.properties.example` for all available options:

| Setting | Default | Description |
|---------|---------|-------------|
| `spring.datasource.url` | localhost:3306 | MySQL server URL |
| `spring.datasource.username` | smartcampus | Database user |
| `spring.datasource.password` | smartcampus123 | Database password |
| `jwt.secret` | pre-configured | JWT signing secret |
| `jwt.expiration` | 86400000 | Token expiration (24 hours in ms) |
| `cors.allowed-origins` | localhost:5173 | Frontend URL |
| `spring.servlet.multipart.max-file-size` | 10MB | Max upload size |

## 🔒 Security Best Practices

✅ **DO**
- Keep `application.properties` file **local only**
- Use strong database passwords
- Never commit credentials to git
- Update JWT secret in production
- Use environment variables for sensitive data

❌ **DON'T**
- Commit `application.properties` to git
- Share credentials in chat or email
- Use default passwords in production
- Hardcode API keys
- Push secrets to public repositories

## 🆘 Troubleshooting

### "application.properties not found"
```bash
cd backend/src/main/resources/
cp application.properties.example application.properties
# Then configure with your values
```

### "Cannot connect to database"
1. Verify MySQL is running
2. Check credentials in `application.properties`
3. Ensure database exists: `CREATE DATABASE smart_campus_db;`
4. Test connection: `mysql -u smartcampus -p -h localhost -D smart_campus_db`

### "Port 8080 already in use"
Change in `application.properties`:
```properties
server.port=8081
```

## 📚 Additional Files

- **application.properties.example** - Template with all configuration options
- **.gitignore** - Ensures application.properties is never committed
- **README.md** - Full configuration documentation

## 🚀 For Team Members

When cloning the repository for the first time:
1. `git clone <repo>`
2. `cd backend/src/main/resources`
3. `cp application.properties.example application.properties`
4. Edit `application.properties` with your local values
5. That's it! Your config won't be tracked by git

---

**Version**: 1.0
**Last Updated**: Mar 27, 2026
