# Backend Resources Configuration

This directory contains configuration files for the Smart Campus API backend.

## Files

### `application.properties`
Main Spring Boot configuration file for database, security, OAuth2, and other settings.

## Configuration Guide

### Database Configuration
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus_db
spring.datasource.username=smartcampus
spring.datasource.password=smartcampus123
```

**Setup Steps:**
1. Create MySQL database and user using these commands:
```sql
CREATE DATABASE smart_campus_db;
CREATE USER 'smartcampus'@'localhost' IDENTIFIED BY 'smartcampus123';
GRANT ALL PRIVILEGES ON smart_campus_db.* TO 'smartcampus'@'localhost';
FLUSH PRIVILEGES;
```

2. Update the credentials in `application.properties` if you used different username/password

3. The `ddl-auto=update` setting will automatically create tables on first run

### JWT Configuration
```properties
jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
jwt.expiration=86400000
```

- `jwt.secret`: Base64-encoded secret key for signing JWT tokens (change in production!)
- `jwt.expiration`: Token expiration time in milliseconds (86400000ms = 24 hours)

### OAuth2 Google Configuration
To enable Google OAuth2 login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:8080/login/oauth2/code/google`
6. Copy credentials to `application.properties`:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

### CORS Configuration
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS,PATCH
```

Add your frontend URL to `cors.allowed-origins` to enable requests from the frontend.

### File Upload Settings
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=30MB
upload.dir=uploads/
```

- Maximum file upload size: 10MB
- Maximum request size: 30MB
- Uploaded files stored in: `uploads/` directory

## Environment Variables

You can override properties using environment variables:

```bash
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret
export GOOGLE_CLIENT_ID=your_id
export GOOGLE_CLIENT_SECRET=your_secret
```

## Logging Levels

Adjust logging in `application.properties`:

```properties
logging.level.root=INFO                              # Root level
logging.level.com.smartcampus.api=DEBUG              # Application logs
logging.level.org.springframework.security=DEBUG      # Security logs
logging.level.org.hibernate.SQL=DEBUG                # SQL logs
```

## Production Deployment

For production, update:

1. **Database**: Use production database server
```properties
spring.datasource.url=jdbc:mysql://prod-db-server:3306/smart_campus_db
```

2. **JWT Secret**: Generate a new secure secret
```bash
# Generate random secret
openssl rand -base64 32
```

3. **CORS Origins**: Update to your production domain
```properties
cors.allowed-origins=https://yourdomain.com
```

4. **SSL/TLS**: Enable HTTPS
```properties
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=your_password
server.ssl.key-store-type=PKCS12
```

5. **Logging**: Set to INFO level for performance
```properties
logging.level.root=INFO
logging.level.com.smartcampus.api=INFO
```

## Troubleshooting

### "Cannot connect to database"
- Check MySQL is running
- Verify credentials in `application.properties`
- Ensure database exists: `CREATE DATABASE smart_campus_db;`

### "JWT token expired"
- Increase `jwt.expiration` value (in milliseconds)
- Users need to login again for new token

### "CORS error when calling API"
- Add frontend URL to `cors.allowed-origins`
- Ensure frontend is making requests to correct API URL

### File upload failing
- Increase `spring.servlet.multipart.max-file-size`
- Ensure `uploads/` directory exists and is writable
- Check disk space

## Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security & OAuth2](https://spring.io/projects/spring-security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [MySQL Documentation](https://dev.mysql.com/doc/)
