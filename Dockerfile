# ---- Stage 1: Build ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Stage 2: Run ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/retail-0.0.1-SNAPSHOT.jar app.jar

# Expose default port (Render overrides via PORT env var)
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
