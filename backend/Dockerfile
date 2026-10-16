# ---- build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Dependências primeiro: a camada fica em cache enquanto o pom.xml não muda.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -q -B package -DskipTests && mv target/*.jar app.jar

# ---- runtime ----
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --uid 1001 app && mkdir /data && chown app /data
USER app

COPY --from=build /app/app.jar app.jar

ENV DB_PATH=/data/rastreador.db
VOLUME /data
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
