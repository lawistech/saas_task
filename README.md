# SaaS Task Management System

A project management system built with Angular frontend and Laravel backend, inspired by Monday.com's task management interface.

## Features

- User authentication and authorization
- Project management
- Task management with customizable columns
- Profile management
- Responsive design

## Tech Stack

### Frontend
- Angular
- TypeScript
- HttpClient with withFetch() for improved performance
- Responsive UI components

### Backend
- Laravel
- PHP
- MySQL
- RESTful API
- Laravel Sanctum for authentication

## Getting Started

### Prerequisites
- Node.js and npm
- PHP 8.1+
- Composer
- MySQL

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   composer install
   ```
3. Copy the environment file:
   ```
   cp .env.example .env
   ```
4. Generate application key:
   ```
   php artisan key:generate
   ```
5. Configure your database and API URL in the `.env` file:
   ```
   # Set the API URL for your backend (default: http://localhost:8000)
   API_URL=http://localhost:8000
   ```
6. Run migrations:
   ```
   php artisan migrate
   ```
7. Start the server:
   ```
   php artisan serve --port=8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the environment file (optional):
   ```
   cp .env.example .env
   ```
4. Configure the API URL in the `.env` file if needed:
   ```
   API_URL=http://localhost:8000/api
   ```
5. Start the development server:
   ```
   ng serve
   ```
6. Open your browser and navigate to `http://localhost:4200`

## Environment Configuration

The application uses environment variables to configure API endpoints instead of hardcoded URLs.

### Backend Configuration
Configure the API URL in the backend `.env` file:
```
API_URL=http://localhost:8000
```

### Frontend Configuration
The frontend automatically reads the API URL from the environment configuration. You can modify the configuration in:
- `frontend/.env` for environment variables (recommended)
- `frontend/src/assets/config/app.config.json` for runtime configuration
- Environment variables for build-time configuration

Configure the API URL in the frontend `.env` file:
```
API_URL=http://localhost:8000/api
PRODUCTION=false
```

### Production Deployment
For production deployment, set the following environment variables:
- `API_URL`: Your production API URL
- `PRODUCTION`: Set to `true` for production builds

## License

This project is licensed under the MIT License - see the LICENSE file for details.
