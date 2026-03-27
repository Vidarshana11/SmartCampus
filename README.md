# Smart Campus Operations Hub

A comprehensive full-stack application for managing campus operations including facilities, bookings, incident tickets, and notifications.

## Project Overview

This is a complete Smart Campus Operations Hub with:
- **Backend**: Spring Boot REST API with JWT + OAuth2 authentication
- **Frontend**: React with Vite for modern UI
- **Database**: MySQL/MariaDB for persistent data storage
- **Security**: RBAC with 6 role levels

## Technologies Used

### Backend
- Java 21+
- Spring Boot 3.x
- Spring Security (JWT + OAuth2)
- Spring Data JPA
- Gradle
- MySQL/MariaDB

### Frontend
- React 18+
- Vite
- JavaScript ES6+
- Responsive Design

## Prerequisites

Before getting started, install:

1. **Java 21+**
   ```bash
   # macOS
   brew install openjdk@21

   # Windows/Linux - Download from https://www.oracle.com/java/technologies/downloads/
   ```

2. **Node.js & npm**
   ```bash
   # macOS
   brew install node

   # Windows - Download from https://nodejs.org/
   ```

3. **MySQL/MariaDB**
   ```bash
   # macOS
   brew install mysql

   # Windows - Download from https://dev.mysql.com/downloads/mysql/
   ```

4. **Git**
   ```bash
   # macOS
   brew install git

   # Windows - Download from https://git-scm.com/
   ```

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Vidarshana11/SmartCampus.git
cd SmartCampus
```

### 2. Database Setup

#### Create Database & User

Start MySQL:
```bash
# macOS
mysql.server start

# Or using brew services
brew services start mysql
```

Login to MySQL:
```bash
mysql -u root -p
```

Create database and user:
```sql
-- Create the database
CREATE DATABASE smart_campus_db;

-- Create a user (change password as needed)
CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'smartcampus123';

-- Grant privileges
GRANT ALL PRIVILEGES ON smart_campus_db.* TO 'smartcampus'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

#### Configure Database Connection in Backend

Navigate to backend configuration:
```bash
cd backend/src/main/resources
```

Open or create `application.properties`:
```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus_db
spring.datasource.username=smartcampus
spring.datasource.password=smartcampus123
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration=86400000

# OAuth2 Google Configuration (Optional)
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=profile,email

# CORS Configuration
cors.allowed-origins=http://localhost:5173,http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allowed-headers=*
cors.max-age=3600
```

### 3. Backend Setup

Navigate to backend directory:
```bash
cd backend
```

Build the project:
```bash
./gradlew build
```

Run the backend server:
```bash
./gradlew bootRun
```

The backend API will be available at: **http://localhost:8080**

### 4. Frontend Setup

Navigate to frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create `.env` file in frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8080
```

Run the development server:
```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

## Running the Project

### Terminal 1 - Backend
```bash
cd backend
./gradlew bootRun
# Server runs on http://localhost:8080
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# Application runs on http://localhost:5173
```

## Database Connection Troubleshooting

### Issue: "Access denied for user"
**Solution**: Verify credentials in `application.properties`
```bash
# Test connection from command line
mysql -u smartcampus -p smartcampus123 -h localhost -D smart_campus_db
```

### Issue: "Unknown database 'smart_campus_db'"
**Solution**: Create the database using the SQL commands in Database Setup section

### Issue: "MySQL server has gone away"
**Solution**: Restart MySQL
```bash
# macOS
brew services restart mysql

# Linux
sudo service mysql restart
```

### Issue: "Gradle build fails"
**Solution**:
```bash
# Clean and rebuild
./gradlew clean build --refresh-dependencies
```

## API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login with credentials
```

### Notification Endpoints
```
GET    /api/notifications                  - Get user notifications
GET    /api/notifications/unread-count     - Get unread count
PUT    /api/notifications/{id}/read        - Mark as read
PUT    /api/notifications/read-all         - Mark all as read
DELETE /api/notifications/{id}             - Delete notification
POST   /api/notifications/admin/system     - Send system notification (Admin)
POST   /api/notifications/admin/broadcast  - Broadcast notification (Admin)
```

### User & Role Management Endpoints
```
GET    /api/users                   - Get all users (paginated)
GET    /api/users/{id}              - Get user by ID
GET    /api/users/me                - Get current user
PUT    /api/users/{id}/role         - Update user role (Admin)
PUT    /api/users/{id}              - Update user details
DELETE /api/users/{id}              - Delete user (Admin)
GET    /api/roles                   - Get all available roles
```

### Facility & Resource Endpoints
```
GET    /api/resources               - List all resources
POST   /api/resources               - Create new resource
PUT    /api/resources/{id}          - Update resource
DELETE /api/resources/{id}          - Delete resource
```

### Booking Endpoints
```
GET    /api/bookings                - List bookings
POST   /api/bookings                - Create booking
PUT    /api/bookings/{id}           - Update booking
DELETE /api/bookings/{id}           - Cancel booking
```

## User Roles & Permissions

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **STUDENT** | Basic | View resources, create bookings |
| **LECTURER** | Standard | Create bookings, view schedule |
| **TECHNICIAN** | Standard | Handle maintenance tickets |
| **MANAGER** | Advanced | Approve bookings, view reports |
| **ADMIN** | Full | User management, system config |
| **USER** | Basic | Default guest access |

## Project Structure

```
SmartCampus/
├── backend/
│   ├── src/main/java/com/smartcampus/api/
│   │   ├── security/           # JWT, OAuth2, authentication
│   │   ├── user/               # User & role management
│   │   ├── notification/       # Notifications system
│   │   ├── booking/            # Booking management
│   │   ├── resource/           # Facilities & resources
│   │   └── ticket/             # Incident tickets
│   ├── src/main/resources/
│   │   └── application.properties  # Database & server config
│   ├── build.gradle            # Gradle dependencies
│   └── gradlew                 # Gradle wrapper script
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── notifications/  # Notification UI
│   │   │   ├── auth/           # Login/Register
│   │   │   └── ...
│   │   ├── pages/              # Page components
│   │   │   ├── RoleManagement.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ...
│   │   ├── services/           # API services
│   │   │   ├── notificationService.js
│   │   │   ├── authService.js
│   │   │   └── ...
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   └── index.html              # HTML template
│
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Team Contributions

- **Member 1**: Facilities & Assets Management
- **Member 2**: Booking Management System
- **Member 3**: Incident Ticketing System
- **Member 4**: Notifications, Role Management, OAuth Integration

## Testing the API

### Using cURL
```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get notifications (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/notifications
```

### Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import collection from project documentation
3. Set up environment variables (`BASE_URL`, `TOKEN`)
4. Test endpoints

## Troubleshooting

### Frontend not connecting to backend
1. Check if backend is running on port 8080
2. Verify `VITE_API_BASE_URL` in frontend `.env` file
3. Check CORS configuration in backend `application.properties`

### Port already in use
```bash
# Kill process on port 8080 (macOS/Linux)
lsof -ti:8080 | xargs kill -9

# Or use different port in application.properties
server.port=8081
```

### Build fails
```bash
# Clean cache and rebuild
cd backend
./gradlew clean build --refresh-dependencies

cd ../frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Production Deployment

### For Production Use:
1. Set `server.port=80` or use reverse proxy
2. Configure SSL/TLS certificates
3. Use environment variables for sensitive data
4. Set up database backups
5. Configure proper CORS origins
6. Build frontend: `npm run build`
7. Deploy jarfile: `java -jar smart-campus-api-0.0.1-SNAPSHOT.jar`

## Support & Questions

For issues or questions:
1. Check the troubleshooting section
2. Verify all prerequisites are installed
3. Check database connection
4. Review application logs

## License

This project is part of the PAF 2026 Smart Campus Operations Hub assignment.

---

**Last Updated**: March 27, 2026
**Maintainer**: Vidarshana
