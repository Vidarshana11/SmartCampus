# Smart Campus Operations Hub - Backend API

A comprehensive Spring Boot REST API for managing campus operations including facilities, bookings, incident tickets, and notifications.

## Features

- **Authentication & Authorization** - JWT + OAuth2 (Google)
- **Facilities & Resources Management** - Track campus resources
- **Booking System** - Reserve facilities and resources
- **Incident Ticketing** - Report and track maintenance issues
- **Notifications** - Real-time user notifications
- **Role Management** - RBAC with 6 roles (STUDENT, LECTURER, TECHNICIAN, MANAGER, ADMIN, USER)

## Technology Stack

- **Framework**: Spring Boot 3.x
- **Build Tool**: Gradle
- **Database**: JPA/Hibernate
- **Security**: Spring Security + JWT + OAuth2
- **API**: RESTful with proper HTTP methods (GET, POST, PUT, DELETE)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/oauth/refresh` - Refresh JWT token

### Notifications
- `GET /api/notifications` - Get user notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification
- `POST /api/notifications/admin/system` - Send system notification (Admin)
- `POST /api/notifications/admin/broadcast` - Broadcast to all users (Admin)

### Role Management
- `GET /api/roles` - Get all available roles
- `GET /api/users` - Get all users (paginated, filterable)
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/me` - Get current user
- `GET /api/users/role/{role}` - Get users by role
- `PUT /api/users/{id}/role` - Update user role
- `PUT /api/users/{id}` - Update user details
- `DELETE /api/users/{id}` - Delete user

### Facilities & Resources
- `GET /api/resources` - List all resources
- `POST /api/resources` - Create new resource
- `PUT /api/resources/{id}` - Update resource
- `DELETE /api/resources/{id}` - Delete resource

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

## Getting Started

### Prerequisites
- Java 21+
- Gradle 9.4+
- MySQL/MariaDB (or update `application.properties` for your DB)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Vidarshana11/SmartCampus.git
cd SmartCampus
```

2. Configure database in `src/main/resources/application.properties`
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus
spring.datasource.username=root
spring.datasource.password=your_password
```

3. Build the project
```bash
./gradlew build
```

4. Run the application
```bash
./gradlew bootRun
```

The API will be available at `http://localhost:8080`

## Environment Configuration

### JWT Configuration
```properties
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration=86400000
```

### OAuth2 Google Configuration
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=profile,email
```

## Role Hierarchy

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Full system access |
| **ADMIN** | User management, approve bookings |
| **MANAGER** | Department operations, reports |
| **TECHNICIAN** | Handle maintenance tickets |
| **LECTURER** | Create bookings, view schedule |
| **STUDENT** | Basic booking, view resources |

## Security

- All endpoints protected with JWT or OAuth2
- Method-level security with `@PreAuthorize` annotations
- CORS configured for frontend communication
- Password encryption with BCrypt

## Testing

Test the API endpoints using:
- **curl** - Command line HTTP client
- **Postman** - GUI API testing tool
- **Spring Boot Test** - Unit and integration tests

Example curl request:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/notifications
```

## Project Structure

```
src/main/java/com/smartcampus/api/
├── security/          # JWT, OAuth2, authentication
├── user/              # User & role management
├── notification/      # Notification system
├── booking/           # Booking management
├── resource/          # Facilities & resources
└── SmartCampusApiApplication.java
```

## Contributors

- Member 1: Facilities & Assets Module
- Member 2: Booking Management Module
- Member 3: Incident Tickets Module
- Member 4: Notifications, Role Management, OAuth Integration

## License

This project is part of the PAF 2026 Smart Campus Operations Hub assignment.

## Support

For questions or issues, please refer to the documentation or contact the development team.
