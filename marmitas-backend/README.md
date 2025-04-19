# Marmitas Backend

Backend API server for the Marmitas application, built with Node.js, Express, TypeScript, and Supabase.

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone <backend-repository-url>
   cd marmitas-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3001
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/controllers/` - Request handlers for API endpoints
- `src/models/` - Data models and database schemas
- `src/services/` - Business logic and database operations
- `src/routes/` - API route definitions
- `src/middleware/` - Express middleware functions
- `src/config/` - Configuration files
- `src/utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions
- `supabase/` - Supabase configurations and migrations

## API Endpoints

The API is available at `http://localhost:3001/api`.

A basic health check endpoint is available at `http://localhost:3001/health`.

## Build

To build the application for production:

```bash
npm run build
```

## Production

To run the application in production:

```bash
npm start
```

## Testing

To run tests:

```bash
npm test
```

## Linting

To lint the codebase:

```bash
npm run lint
``` 