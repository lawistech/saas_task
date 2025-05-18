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
5. Configure your database in the `.env` file
6. Run migrations:
   ```
   php artisan migrate
   ```
7. Start the server:
   ```
   php artisan serve
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
3. Start the development server:
   ```
   ng serve
   ```
4. Open your browser and navigate to `http://localhost:4200`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
