# Chess Application API Documentation

## Overview
This document describes the RESTful API endpoints for the Chess web application. The application uses Express.js with Handlebars templating and supports user authentication, game management, and real-time multiplayer chess games.

## Base URL
- Local development: `https://localhost:3000`
- Production: (as configured in environment)

## Authentication
The application uses Passport.js with local strategy for authentication. Sessions are managed with express-session.

## Routes Overview

### Home Routes (`/`)

#### GET `/`
**Description:** Main landing page displaying leaderboard and navigation

**Authentication:** Optional (enhanced features for logged-in users)

**Response:** 
- Renders home page with user leaderboard sorted by rating
- Shows online/offline status of users
- Displays logout success messages if applicable

**Template Variables:**
- `title`: Page title
- `user`: Current authenticated user object
- `users`: Array of all users sorted by rating
- `logoutSuccessMessage`: Flash message for successful logout
- `isHomePage`: Boolean flag for navigation highlighting

#### GET `/game/:side`
**Description:** Start a single-player game against AI

**Parameters:**
- `side` (string): Player color preference (`white` or `black`, defaults to `white`)

**Authentication:** Optional

**Response:**
- Renders game page for single-player mode
- Initializes chess board with Stockfish engine

**Template Variables:**
- `title`: Game page title
- `user`: Current user
- `side`: Player's chosen color
- `cpu`: Boolean flag indicating AI opponent
- `envParsed`: Environment configuration
- `isPlayPage`: Boolean flag for navigation

#### GET `/game/:side/:token`
**Description:** Join a multiplayer game with specific token

**Parameters:**
- `side` (string): Player color preference
- `token` (string): Game room identifier

**Authentication:** Required

**Response:**
- Renders multiplayer game page
- Connects to Socket.io room for real-time gameplay

#### POST `/game/create`
**Description:** Create a new multiplayer game

**Authentication:** Required

**Request Body:**
- `side` (string): Preferred color for game creator
- `time` (number): Game time control in minutes

**Response:**
- Redirects to created game with generated token
- Updates user statistics in database

**Validation:**
- Side must be 'white' or 'black'
- Time must be valid number (5-60 minutes)

#### POST `/update`
**Description:** Update game results and user ratings

**Authentication:** Required

**Request Body:**
- `gameResult` (string): Game outcome ('win', 'lose', 'draw')
- `opponentRating` (number): Opponent's current rating

**Response:**
- Updates user statistics (wins, losses, draws)
- Calculates new ELO rating using elo-rating algorithm
- Returns JSON with updated user data

### Authentication Routes

#### GET `/login`
**Description:** Display login form

**Authentication:** None

**Response:** Login page template

#### POST `/login`
**Description:** Authenticate user credentials

**Request Body:**
- `username` (string): User's username
- `password` (string): User's password

**Response:**
- Success: Redirect to home page
- Failure: Login page with error message

**Security Features:**
- Password hashing with bcrypt
- Session management
- CSRF protection with body-parser

#### GET `/register`
**Description:** Display registration form

**Authentication:** None

**Response:** Registration page template

#### POST `/register`
**Description:** Create new user account

**Request Body:**
- `username` (string): Desired username (unique)
- `password` (string): User password
- `confirmPassword` (string): Password confirmation

**Validation:**
- Username uniqueness check
- Password strength requirements
- Password confirmation match

**Response:**
- Success: Redirect to login with success message
- Failure: Registration form with validation errors

#### GET `/logout`
**Description:** End user session

**Authentication:** Required

**Response:** 
- Destroys user session
- Redirects to home with success message

### Profile Routes (`/profile`)

#### GET `/profile`
**Description:** Display user profile and statistics

**Authentication:** Required

**Response:**
- User profile page with game statistics
- Rating history and achievements
- Account management options

### Play Routes (`/play`)

#### GET `/play`
**Description:** Game lobby and matchmaking interface

**Authentication:** Required  

**Response:**
- Active games list
- Create game options
- Join existing games interface

## Error Handling

### 404 Not Found
All undefined routes return 404 status with custom error page.

### 500 Internal Server Error
Server errors are handled gracefully with error page rendering.
In development mode, full error stack traces are displayed.

### Authentication Errors
- Unauthorized access redirects to login page
- Invalid credentials show error messages
- Session expiration handled automatically

## Rate Limiting and Security

### Security Middleware
- **Helmet.js**: Sets security headers
- **Compression**: Gzip compression for responses  
- **Morgan**: Request logging
- **CORS**: Cross-origin request handling
- **SSL/TLS**: HTTPS enforcement with certificates

### Input Validation
- **mongo-sanitize**: Prevents NoSQL injection
- **express-validator**: Input validation and sanitization
- **CSRF protection**: Prevents cross-site request forgery

## Response Formats

### HTML Responses
Most endpoints return rendered HTML templates using Handlebars.

### JSON Responses
API endpoints (like `/update`) return JSON:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "newRating": 1250
  }
}
```

### Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes

- `200`: Success
- `302`: Redirect (authentication flows)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error