# Database Documentation

## Overview
The Chess application uses MongoDB as its primary database with Mongoose ODM for schema definition and data modeling. The database stores user accounts, authentication data, game statistics, and user ratings.

## Database Configuration

### Connection Setup
```javascript
// config/database.js
mongoose.connect("mongodb://" + process.env.DB_HOST + ":" + process.env.DB_PORT + "/" + process.env.DB_USER, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
```

### Environment Variables
- `DB_HOST`: MongoDB server hostname (default: localhost)
- `DB_PORT`: MongoDB server port (default: 27017)
- `DB_USER`: Database name

### Connection Features
- **Auto-reconnection**: Automatically reconnects on connection loss
- **Error handling**: Logs connection errors for debugging
- **Modern options**: Uses latest MongoDB driver features

## Models

### User Model (`models/user.js`)

#### Schema Definition
```javascript
var UserSchema = mongoose.Schema({
    username: String,
    password: String,
    dateCreated: String,
    status: { type: String, default: 'online' },
    rating: { type: Number, default: parseInt(process.env.RATING) },
    nbGamesWin: { type: Number, default: 0 },
    nbGamesDraw: { type: Number, default: 0 },
    nbGamesLose: { type: Number, default: 0 },
    lastConnection: Date
});
```

#### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `username` | String | - | Unique identifier for user account |
| `password` | String | - | Bcrypt hashed password with salt |
| `dateCreated` | String | - | Account creation timestamp |
| `status` | String | 'online' | Current user status (online/offline) |
| `rating` | Number | env.RATING | ELO chess rating |
| `nbGamesWin` | Number | 0 | Count of games won |
| `nbGamesDraw` | Number | 0 | Count of games drawn |
| `nbGamesLose` | Number | 0 | Count of games lost |
| `lastConnection` | Date | - | Timestamp of last user activity |

#### Instance Methods

##### `authenticate(plainText)`
**Purpose:** Validates user password during login

**Parameters:**
- `plainText` (String): User-entered password

**Returns:** Boolean indicating password match

**Implementation:**
```javascript
UserSchema.methods = {
    authenticate: function (plainText) {
        return util.compareSync(plainText, this.password);
    }
};
```

**Security Features:**
- Uses bcrypt for secure password comparison
- Constant-time comparison prevents timing attacks
- Salted hashes prevent rainbow table attacks

## Data Operations

### User Registration
```javascript
// Create new user with hashed password
const newUser = new User({
    username: req.body.username,
    password: util.encrypt(req.body.password),
    dateCreated: moment().format('MMMM Do YYYY, h:mm:ss a'),
    rating: parseInt(process.env.RATING)
});
```

### User Authentication
```javascript
// Find user and verify password
User.findOne({ username: username }, function(err, user) {
    if (user && user.authenticate(password)) {
        // Login successful
    }
});
```

### Rating Updates
```javascript
// Update user rating after game
const newRating = eloRating.calculate(playerRating, opponentRating, gameResult);
User.findOneAndUpdate(
    { username: username },
    { 
        rating: newRating.playerRating,
        $inc: { [`nbGames${result}`]: 1 }
    }
);
```

### Status Management
```javascript
// Update user online status
User.findOneAndUpdate(
    { username: username },
    { 
        status: 'online',
        lastConnection: new Date()
    }
);
```

## Security Implementation

### Password Security (`app/util.js`)

#### Password Hashing
```javascript
encrypt: function (plainText) {
    return bcrypt.hashSync(plainText, parseInt(process.env.HASH_SALT));
}
```

**Features:**
- Bcrypt with configurable salt rounds
- Environment-based salt configuration
- Synchronous hashing for immediate response

#### Password Verification
```javascript
compareSync: function (plainText, password) {
    return bcrypt.compareSync(plainText, password);
}
```

**Security Benefits:**
- Constant-time comparison
- Automatic salt extraction
- Timing attack protection

### Input Sanitization
- **mongo-sanitize**: Prevents NoSQL injection attacks
- **Mongoose validation**: Schema-level data validation
- **Express validator**: Input validation middleware

## Rating System

### ELO Rating Implementation
The application uses the `elo-rating` npm package for chess rating calculations.

#### Rating Calculation
```javascript
const result = eloRating.calculate(playerRating, opponentRating, gameOutcome);
// result.playerRating - new rating for player
// result.opponentRating - new rating for opponent
```

#### Game Outcomes
- `1`: Player wins
- `0.5`: Draw
- `0`: Player loses

#### Default Rating
- New users start with rating from `process.env.RATING`
- Typical starting rating: 1200-1500

### Statistics Tracking
```javascript
// Increment game counters based on result
const updateField = {
    'win': 'nbGamesWin',
    'draw': 'nbGamesDraw',
    'lose': 'nbGamesLose'
};
```

## Data Queries

### Leaderboard Query
```javascript
User.find({})
    .sort({ rating: 'desc' })
    .exec(function(err, users) {
        // Returns users sorted by rating (highest first)
    });
```

### User Lookup
```javascript
User.findOne({ username: username }, function(err, user) {
    // Find specific user by username
});
```

### Bulk Status Updates
```javascript
User.findOneAndUpdate(
    { username: username },
    { status: 'offline', lastConnection: new Date() },
    { new: true }
);
```

## Indexing Strategy

### Recommended Indexes
```javascript
// Username index for fast user lookups
db.users.createIndex({ "username": 1 }, { unique: true });

// Rating index for leaderboard queries
db.users.createIndex({ "rating": -1 });

// Status index for active user queries
db.users.createIndex({ "status": 1 });

// Compound index for rating + status
db.users.createIndex({ "rating": -1, "status": 1 });
```

### Performance Benefits
- **Username uniqueness**: Enforced at database level
- **Fast leaderboard**: Optimized rating queries
- **Active users**: Efficient status filtering
- **Compound queries**: Combined rating and status lookups

## Backup and Recovery

### Data Export
```bash
# Export user data
mongoexport --db chess --collection users --out users_backup.json

# Export with query filter
mongoexport --db chess --collection users --query '{"rating": {"$gt": 1500}}' --out high_rated_users.json
```

### Data Import
```bash
# Import user data
mongoimport --db chess --collection users --file users_backup.json

# Import with upsert option
mongoimport --db chess --collection users --file users_backup.json --upsert
```

## Database Maintenance

### Regular Maintenance Tasks
1. **Index optimization**: Monitor query performance
2. **Data cleanup**: Remove inactive accounts periodically
3. **Statistics recalculation**: Verify game counters accuracy
4. **Connection monitoring**: Track connection pool usage

### Monitoring Queries
```javascript
// Find users with inconsistent game counts
db.users.find({
    $expr: {
        $ne: [
            { $add: ["$nbGamesWin", "$nbGamesDraw", "$nbGamesLose"] },
            "$totalGames"
        ]
    }
});

// Find users with impossible ratings
db.users.find({
    $or: [
        { rating: { $lt: 100 } },
        { rating: { $gt: 3000 } }
    ]
});
```

## Environment Configuration

### Required Environment Variables
```bash
# Database connection
DB_HOST=localhost
DB_PORT=27017
DB_USER=chess_db

# Security
HASH_SALT=10

# Game settings
RATING=1200
```

### Development vs Production
```javascript
// Development
mongoose.set('debug', true); // Enable query logging

// Production
mongoose.set('debug', false); // Disable debugging
```

## Error Handling

### Common Database Errors
1. **Connection failures**: Network or MongoDB server issues
2. **Validation errors**: Schema constraint violations
3. **Duplicate key errors**: Username uniqueness violations
4. **Authentication errors**: Invalid credentials

### Error Response Format
```javascript
{
    success: false,
    error: "Database operation failed",
    code: "DB_ERROR",
    details: errorObject
}
```