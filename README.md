# threesevenreal
**Autores:** Javier Pérez - Jorge Villar
**Año académico:** 2025-2026
**Ciclo:** CFGS Desarrollo de Aplicaciones Web

---

## 1. Introducción y justificación
- Descripción de la aplicación, su finalidad y objetivos.

	threesevenreal es una plataforma web para jugar a juegos de cartas y dominó en línea con funcionalidades de lobby, sala de juego multiusuario, chat y gestión de amigos. Permite crear y unirse a salas de juego (Blackjack, Poker, ThreeSeven, Domino), comunicarse en tiempo real mediante WebSockets (STOMP/SockJS) y gestionar el perfil de usuario.

- Motivación para elegir este proyecto.

	El proyecto integra tecnologías modernas de frontend (React + Vite) y backend (Spring Boot) y aborda aspectos prácticos del desarrollo web: autenticación con JWT, persistencia con MongoDB, comunicación en tiempo real, y sincronización de estado en partidas en línea.

## 2. Análisis y diseño del proyecto

### 2.1. Arquitectura web
- Tipo de arquitectura:
	- Cliente SPA (React) + Backend REST + WebSockets (arquitectura cliente-servidor). El frontend es una SPA desarrollada con React y el backend expone APIs REST y un broker STOMP sobre WebSocket para la comunicación en tiempo real.

- Comunicación entre partes:
	- Frontend (threesevenrealCliente) ↔ Backend (Spring Boot) mediante HTTPS/REST (endpoints bajo `/api/*`) y WebSockets STOMP en `/ws` para eventos en tiempo real.
	- Persistencia en MongoDB (Spring Data MongoDB).

- Mecanismos de comunicación detectados:
	- WebSockets/STOMP (`/ws`, destinos `/app/*`, topics `/topic/*`, queues `/queue/*`).
	- REST API (`/api/auth`, `/api/users`, `/api/friends`, `/api/rooms`, `/api/domino`, `/api/chat`, `/api/stats`, etc.).

### 2.2. Tecnologías y herramientas utilizadas
Extraído de `pom.xml`, `package.json` y archivos de configuración.
- **Frontend:** React 19, Vite, react-router-dom, Axios, @stomp/stompjs, sockjs-client, JavaScript/JSX.
- **Backend:** Spring Boot 3.4.3 (parent), Java 21, Spring Web, Spring WebSocket, Spring Security, Spring Data MongoDB, Lombok, JJWT (io.jsonwebtoken 0.12.6).
- **Base de datos:** MongoDB (Spring Data MongoDB). La URI de conexión está en `src/main/resources/application.properties`.
- **Seguridad:** Spring Security con JWT (`JwtService`), `BCryptPasswordEncoder` para hashing de contraseñas, filtro `jwtAuthFilter` para extraer token Bearer.
- **Integración y pruebas:** `spring-boot-starter-test` (JUnit/Jupiter) en backend; ESLint en frontend.
- **Despliegue y hosting:** No hay scripts de despliegue específicos ni Dockerfiles en el repositorio. El backend se ejecuta por defecto en el puerto `8080` (`server.port=8080`). Para desarrollo el frontend usa Vite (`npm run dev`). (Detalle de hosting: [completar manualmente]).
- **Otras herramientas:** Git (control de versiones). CORS configurado para `http://localhost:5173` y `http://localhost:3000`.

### 2.3. Análisis de usuarios (perfiles de usuario)
- Roles/perfiles detectados en el código:
	- No hay roles explícitos persistidos ni autoridades definidas en el `User` (el método `getAuthorities()` retorna una lista vacía). Por tanto el sistema usa autenticación pero no define roles tipo `ADMIN`/`USER` en el modelo.

- Privilegios observados:
	- Usuario autenticado: puede acceder a la mayoría de endpoints (`anyRequest().authenticated()`), actualizar su perfil (`PATCH /api/users/me`), crear/unirse a salas, enviar/aceptar solicitudes de amistad, enviar mensajes por WebSocket y consultar estadísticas.
	- Endpoints públicos: `/api/auth/**` (registro/login) y el endpoint WebSocket `/ws` está permitido en la configuración de seguridad (el acceso con token se valida en la conexión STOMP si se proporciona `Authorization` en las cabeceras).

### 2.4. Requisitos funcionales y no funcionales
**Funcionales:** (extraídos de controladores y servicios)
- Registro y autenticación de usuarios: `POST /api/auth/register`, `POST /api/auth/login`.
- Gestión de perfil: `PATCH /api/users/me`.
- Gestión de amigos: búsqueda (`GET /api/friends/search`), enviar solicitud (`POST /api/friends/request`), aceptar/rechazar (`POST /api/friends/{id}/accept|reject`), cancelar (`DELETE /api/friends/request/{id}`), listar solicitudes y amigos (`/api/friends/requests/received`, `/api/friends/requests/sent`, `GET /api/friends`).
- Creación y unión a salas de juego: `POST /api/rooms/create/{gameType}`, `POST /api/rooms/join/{roomId}`, `GET /api/rooms/available/{gameType}`.
- Juegos concretos: endpoints y controladores para Domino (`/api/domino/**`), Blackjack, Poker, ThreeSeven (crear/join/rooms/state según implementación).
- Chat y lobby: historial `GET /api/chat/history` y envío por WebSocket `@MessageMapping("/chat.send")` (broadcast a `/topic/lobby.chat`).
- Comunicación en tiempo real del juego: STOMP destinations para juego `/app/game/{roomId}/connect`, `/app/game/{roomId}/action`, `/app/game/{roomId}/chat` y controladores específicos de juego (`DominoWebSocketController`, `GameWebSocketController`).
- Estadísticas y ranking: `GET /api/stats/me`, `GET /api/stats/user/{username}`, `GET /api/stats/ranking`.

**No funcionales:**
- Seguridad: autenticación JWT, filtrado de requests stateless, passwords con BCrypt.
- Rendimiento: uso de broker simple de Spring (in-memory) para WebSockets; mensajes de chat temporales en memoria con TTL (120s) y purga programada; cooldown por usuario en chat (3s) para limitar spam.
- Disponibilidad/escala: la configuración actual usa broker simple y almacenamiento en MongoDB; escalado horizontal del WebSocket broker no está configurado (se necesitaría broker externo como Redis o RabbitMQ para clustering).
- Usabilidad: SPA con rutas protegidas (`ProtectedRoute`) y componentes para perfiles, lobby y partidas.

### 2.5. Estructura de navegación
- Rutas principales del frontend (extraído de `src/App.jsx`):

	- /
	- /login
	- /register
	- /lobby (protegida)
	- /blackjack (protegida)
	- /threeseven (protegida)
	- /poker (protegida)
	- /profile (protegida)
	- /profile/:username (protegida)
	- /ranking (protegida)
	- /friends (protegida)
	- /:gameType/online (protegida)

- Principales endpoints REST (resumen jerárquico):

	- /api/auth/
		- POST /register
		- POST /login

	- /api/users/
		- PATCH /me

	- /api/friends/
		- GET /search
		- POST /request
		- POST /{id}/accept
		- POST /{id}/reject
		- DELETE /request/{id}
		- GET /requests/received
		- GET /requests/sent
		- GET /
		- DELETE /{friendId}
		- GET /status/{otherUserId}

	- /api/rooms/
		- POST /create/{gameType}
		- POST /join/{roomId}
		- GET /available/{gameType}

	- /api/domino/
		- POST /create
		- POST /join/{roomId}
		- GET /rooms
		- GET /rooms/all
		- GET /rooms/{roomId}/state

	- /api/chat/
		- GET /history

	- /api/stats/
		- GET /me
		- GET /user/{username}
		- GET /ranking

	- WebSocket STOMP endpoint: /ws (SockJS enabled)
		- Destinos de envío (`@MessageMapping`):
			- /app/chat.send (lobby chat)
			- /app/lobby.connect, /app/lobby.disconnect
			- /app/game/{roomId}/connect
			- /app/game/{roomId}/action
			- /app/game/{roomId}/chat
			- /app/domino/{roomId}/connect, /app/domino/{roomId}/action, /app/domino/{roomId}/chat

### 2.6. Organización de la lógica de negocio
- Paquetes principales (backend):
	- `controller` — controladores REST y WebSocket (lógica de rutas y mapeo de mensajes).
	- `service` — lógica de negocio (AuthService, UserService, GameRoomService, DominoGameService, ChatService, StatsService, etc.).
	- `repository` — interfaces de acceso a MongoDB (UserRepository, GameRoomRepository, DominoRoomRepository, FriendshipRepository, etc.).
	- `model` / `dto` — entidades persistidas y objetos de transferencia.
	- `config` — configuración de seguridad y WebSocket.

- Integraciones externas / servicios de terceros:
	- MongoDB Atlas (cadena de conexión en `application.properties`).
	- STOMP/SockJS para WebSocket sobre HTTP.

### 2.7. Modelo de datos
- Entidades principales detectadas (colecciones MongoDB):
	- `users` (`User`): `id`, `username` (índice único), `email` (índice único), `password`, `avatarSymbol`, `wins`, `losses`, `gamesPlayed`, `createdAt`, `enabled`, `avatarImage`.
	- `friendships` (`Friendship`): `id`, `senderId`, `receiverId`, `status` (PENDING, ACCEPTED, REJECTED), `createdAt`, `updatedAt`.
	- `game_rooms` (`GameRoom`): `id`, `gameType` (BLACKJACK/THREESEVEN/POKER), `status` (WAITING/PLAYING/FINISHED), `playerIds`, `playerUsernames`, `maxPlayers`, `currentRound`, `gameState` (JSON serializado), `currentTurnPlayerId`, `createdAt`, `updatedAt`.
	- `domino_rooms` (`DominoRoom`): `id`, `status`, `maxPlayers`, `playerIds`, `playerUsernames`, `gameState` (serializado), `createdAt`, `updatedAt`.
	- `game_results` (`GameResult`): `id`, `roomId`, `gameType`, `winnerId`, `winnerUsername`, `playerIds`, `playerUsernames`, `playedAt`.

---

## 3. Conclusiones
(Generar esta sección como plantilla para completar manualmente)
- Resultados obtenidos
- Retos encontrados y soluciones
- Aprendizajes y mejoras futuras
- Planificación y metodología utilizada

## 4. Bibliografía y fuentes de información
(Dejar espacio para completar manualmente)

## 5. Anexos

### Guía de instalación y despliegue
- Requisitos previos:
	- Java 21
	- Maven (o usar `./mvnw` / `mvnw.cmd` incluido)
	- Node.js y npm (para el frontend)

- Variables / configuración detectadas (archivo `src/main/resources/application.properties`):
	- Solicitar a los autores

- Ejecutar backend (desde la carpeta `threesevenreal`):

	```bash
	# Linux / macOS
	./mvnw spring-boot:run

	# Windows (PowerShell o CMD)
	mvnw.cmd spring-boot:run
	```

- Ejecutar frontend (desde la carpeta `threesevenrealCliente`):

	```bash
	cd threesevenrealCliente
	npm install
	npm run dev
	```

- Notas de despliegue:
	- Por defecto el backend escucha en el puerto `8080`. El frontend (Vite) corre en `http://localhost:5173` durante el desarrollo (CORS configurado para ese origen).
	- Para producción, compilar el frontend (`npm run build`) y servir los ficheros estáticos desde un servidor (o integrar en el empaquetado del backend). No existe un Dockerfile ni scripts de CI/CD en el repositorio — [completar manualmente] si se desea añadir despliegue automatizado.

---

Si falta algún detalle o quieres que incluya ejemplos de curl/requests o un diagrama ASCII de navegación más detallado, dime y lo añado.
