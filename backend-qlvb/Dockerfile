# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder

# Build arguments for CORS configuration
ARG CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://192.168.0.103:3000
ARG CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
ARG CORS_ALLOWED_HEADERS=*
ARG CORS_ALLOW_CREDENTIALS=true

WORKDIR /app

COPY . .

RUN chmod +x ./gradlew && ./gradlew bootJar

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine AS runtime

# Pass build arguments as environment variables
ARG CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://192.168.0.103:3000
ARG CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
ARG CORS_ALLOWED_HEADERS=*
ARG CORS_ALLOW_CREDENTIALS=true

ENV CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS
ENV CORS_ALLOWED_METHODS=$CORS_ALLOWED_METHODS
ENV CORS_ALLOWED_HEADERS=$CORS_ALLOWED_HEADERS
ENV CORS_ALLOW_CREDENTIALS=$CORS_ALLOW_CREDENTIALS

# JVM options with sensible defaults; can be overridden at runtime
ENV JAVA_TOOL_OPTIONS="-XX:ReservedCodeCacheSize=256m -XX:InitialCodeCacheSize=128m"

# Install PostgreSQL client and dos2unix
RUN apk add --no-cache postgresql-client dos2unix

WORKDIR /app

# Copy only the built JAR from builder
COPY --from=builder /app/build/libs/qlvb-backend.jar app.jar

# Copy SQL migration files
COPY src/main/resources/db/migration/V2__insert_department_data.sql /app/src/main/resources/db/migration/V2__insert_department_data.sql
COPY src/main/resources/db/migration/V3__insert_users_data.sql /app/src/main/resources/db/migration/V3__insert_users_data.sql
COPY src/main/resources/db/migration/V4__insert_senders_data.sql /app/src/main/resources/db/migration/V4__insert_senders_data.sql
COPY src/main/resources/db/migration/V6__reset_all_user_passwords.sql /app/src/main/resources/db/migration/V6__reset_all_user_passwords.sql
COPY src/main/resources/db/migration/V7__insert_document_types.sql /app/src/main/resources/db/migration/V7__insert_document_types.sql

# Copy import script
COPY import_data.sh /app/import_data.sh

# Convert line endings to Unix format and make executable
RUN dos2unix /app/import_data.sh && chmod +x /app/import_data.sh

EXPOSE 8080

# Start Spring Boot first with increased JIT code cache, then run import script
ENTRYPOINT ["/bin/sh", "-c", "java $JAVA_TOOL_OPTIONS -jar app.jar & sleep 60 && /app/import_data.sh && wait"]
