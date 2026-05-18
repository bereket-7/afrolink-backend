# AfroLink News API Backend

A robust, production-ready RESTful API for a news platform where Authors publish content and Readers consume it. Features include role-based authentication, article management, read tracking, and an analytics engine with daily report generation.

## Features

- **User Authentication**: Secure signup with strong password validation and JWT-based authentication
- **Role-Based Access Control (RBAC)**: Separate permissions for Authors and Readers
- **Article Management**: Create, update, soft-delete articles (Author only)
- **Public News Feed**: Filter published articles by category, author, or keyword search
- **Read Tracking**: Non-blocking read logging with rate limiting to prevent spam
- **Analytics Engine**: Daily aggregation of read counts using Bull job queue
- **Author Dashboard**: Performance metrics with total view counts
- **Soft Delete Integrity**: Automatic filtering of deleted content from public endpoints
- **Rate Limiting**: Protection against abuse with configurable rate limits

## Technology Choices

### Core Framework
- **Express.js**: Minimal and flexible Node.js web framework with robust middleware support
- **TypeScript**: Type safety and improved developer experience with compile-time error checking

### Database & ORM
- **PostgreSQL**: Reliable relational database with strong data integrity
- **Prisma**: Type-safe ORM with excellent TypeScript support, migrations, and query builder

### Authentication & Security
- **JWT (jsonwebtoken)**: Stateless authentication with configurable expiration
- **bcrypt**: Industry-standard password hashing with salt rounds for security
- **express-rate-limit**: Rate limiting middleware to prevent abuse
- **Zod**: Runtime type validation with TypeScript inference for request validation

### Job Queue
- **Bull**: Redis-backed job queue for reliable analytics processing
- **Redis**: High-performance in-memory data store for job queue management

### Testing
- **Jest**: JavaScript testing framework with built-in assertions and mocking
- **Supertest**: HTTP assertion library for testing Express endpoints

### Why These Choices?

1. **TypeScript + Prisma**: Provides end-to-end type safety from database to API responses
2. **Express.js**: Battle-tested with extensive middleware ecosystem and community support
3. **Bull + Redis**: Reliable distributed job processing with retry mechanisms and scheduling
4. **Zod**: Declarative validation that integrates seamlessly with TypeScript
5. **PostgreSQL**: ACID compliance, excellent for relational data with complex queries
6. **bcrypt**: Proven security for password hashing with configurable work factor

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd afrolink-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/afrolink_news?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
   JWT_EXPIRES_IN="24h"
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD=""
   PORT="3000"
   NODE_ENV="development"
   CORS_ORIGINS="http://localhost:3000"
   TRUST_PROXY="false"
   ```

4. **Set up the database**
   ```bash
   # Run Prisma migrations
   npx prisma migrate dev
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start Redis** (or use Docker Compose below)

## Docker Compose (recommended)

Run the full stack (API, PostgreSQL, Redis):

```bash
docker compose up --build
```

The API runs migrations on startup and listens on port 3000.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Running Tests
```bash
npm test
```

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

## API Endpoints

### Authentication

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

New accounts are created with the `READER` role by default.

**Response:**
```json
{
  "Success": true,
  "Message": "User created successfully",
  "Object": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "AUTHOR"
    },
    "token": "jwt-token"
  },
  "Errors": null
}
```

#### POST /auth/login
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

### Articles

#### GET /articles
Public feed of published articles with filtering and pagination.

**Query Parameters:**
- `pageNumber` (default: 1)
- `pageSize` (default: 10, max: 100)
- `category` (exact match)
- `author` (partial name match)
- `q` (keyword search in title)

**Response:**
```json
{
  "Success": true,
  "Message": "Articles retrieved successfully",
  "Object": [...],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 100,
  "Errors": null
}
```

#### GET /articles/:id
Get article details with read tracking. Published articles are public; authors can read their own drafts when authenticated. Rate limited: 1 read per 30 seconds per authenticated user (or per IP when anonymous) per article.

#### POST /articles (Author only)
Create a new article.

**Request Body:**
```json
{
  "title": "Article Title",
  "content": "Article content (minimum 50 characters)",
  "category": "Tech",
  "status": "DRAFT"
}
```

#### GET /articles/me (Author only)
Get paginated list of author's articles (including drafts).

**Query Parameters:**
- `pageNumber` (default: 1)
- `pageSize` (default: 10)
- `includeDeleted` (optional, set to "true" to include soft-deleted articles)

#### PUT /articles/:id (Author only)
Update an existing article (only own articles).

#### DELETE /articles/:id (Author only)
Soft delete an article (only own articles).

### Author Dashboard

#### GET /author/dashboard (Author only)
Get author's performance metrics with total view counts.

**Response:**
```json
{
  "Success": true,
  "Message": "Dashboard data retrieved successfully",
  "Object": [
    {
      "id": "uuid",
      "title": "Article Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "totalViews": 150
    }
  ],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 20,
  "Errors": null
}
```

## Data Models

### User
- `id`: UUID (primary key)
- `name`: String (alphabets and spaces only)
- `email`: String (unique, validated)
- `password`: String (bcrypt hashed)
- `role`: Enum (AUTHOR, READER)

### Article
- `id`: UUID (primary key)
- `title`: String (1-150 characters)
- `content`: Text (minimum 50 characters)
- `category`: String
- `status`: Enum (DRAFT, PUBLISHED)
- `authorId`: UUID (foreign key to User)
- `createdAt`: Timestamp (auto-generated)
- `deletedAt`: Timestamp (nullable, for soft delete)

### ReadLog
- `id`: UUID (primary key)
- `articleId`: UUID (foreign key to Article)
- `readerId`: UUID (nullable, foreign key to User)
- `readAt`: Timestamp (auto-generated)

### DailyAnalytics
- `id`: UUID (primary key)
- `articleId`: UUID (foreign key to Article)
- `viewCount`: Integer
- `date`: Date (unique combination with articleId)

## Analytics Engine

The analytics engine processes read logs daily using a Bull job queue:

1. **Job Scheduling**: Runs daily at midnight GMT
2. **Aggregation**: Sums all reads for each article on the given date
3. **Upsert**: Updates or creates DailyAnalytics records
4. **Timezone**: Uses GMT for consistent date boundaries

The job queue ensures:
- Non-blocking read tracking (main response returns immediately)
- Reliable processing with retry mechanisms
- Scalability across multiple workers

## Rate Limiting

### Article Read Rate Limiting
- **Limit**: 1 read per 30 seconds per user per article (or per IP when not authenticated)
- **Purpose**: Prevents spam from page refreshes
- **Implementation**: Optional JWT on `GET /articles/:id`; uses user ID + article ID when token present, otherwise IP + article ID

### General Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Protects against abuse and DoS attacks

## Security Features

- **Password Validation**: Minimum 8 characters, uppercase, lowercase, number, and special character
- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: 24-hour token expiration
- **RBAC Middleware**: Role-based access control for protected routes
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Helmet**: Security HTTP headers
- **CORS**: Configurable allowed origins via `CORS_ORIGINS`
- **Rate Limiting**: Configurable limits to prevent abuse
- **Soft Delete Integrity**: Automatic filtering of deleted records from public endpoints

## Error Handling

All errors follow a standardized response format:

```json
{
  "Success": false,
  "Message": "Error message",
  "Object": null,
  "Errors": ["Detailed error 1", "Detailed error 2"]
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Project Structure

```
afrolink-backend/
├── src/
│   ├── config/          # Configuration files (database, environment)
│   ├── controllers/     # Route handlers
│   ├── jobs/            # Job queue processors
│   ├── middleware/      # Express middleware (auth, validation, error handling)
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (auth, validation)
│   ├── app.ts           # Express app factory (createApp)
│   └── server.ts        # HTTP server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Versioned SQL migrations
├── tests/               # Unit and integration tests
├── docker-compose.yml   # Local/staging stack
├── Dockerfile
├── .github/workflows/   # CI pipeline
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Health Check

`GET /health` returns database and Redis status. Returns `503` when dependencies are unavailable.

## CI

GitHub Actions runs lint, build, migrations, and tests on push/PR. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
