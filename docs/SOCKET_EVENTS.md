# Socket.io Events Documentation

## Overview
The Chess application uses Socket.io for real-time multiplayer gameplay, user presence tracking, and live game monitoring. This document describes all socket events, their parameters, and expected behaviors.

## Connection Setup

### Client Connection
```javascript
const socket = io('/', { 
    query: { user: username } 
});
```

### Namespaces

#### Default Namespace (`/`)
Handles all game-related events and user interactions.

#### Monitor Namespace (`/monitor`)
Provides real-time statistics about active users and games.

## Connection Events

### `connection`
**Triggered when:** A user connects to the application

**Server Actions:**
- Updates user status to 'online' in database (if authenticated user)
- Increments active user counter
- Adds user to names tracking array
- Emits update to monitor namespace

**Data Stored:**
- `socket.id`: Unique socket identifier
- `user`: Username from handshake query
- `status`: User online status

### `disconnect`
**Triggered when:** A user disconnects from the application

**Server Actions:**
- Updates user status to 'offline' in database
- Sets `lastConnection` timestamp
- Decrements active user counter
- Removes user from active games
- Notifies opponents of disconnection
- Cleans up game rooms if empty

## Game Events

### `join`
**Direction:** Client → Server  
**Description:** Player joins a multiplayer game room

**Client Payload:**
```javascript
{
    token: "game-room-token",
    side: "white" | "black"
}
```

**Server Behavior:**
- **First player:** Initializes game room with player data
- **Second player:** Completes game setup and starts match
- **Spectator:** Adds to game observers

**Game Initialization:**
```javascript
games[room] = {
    players: [
        {
            socket: socket,
            name: username,
            status: 'joined',
            side: 'white'
        },
        {
            socket: null,
            name: '',
            status: 'waiting',
            side: 'black'
        }
    ],
    observers: [],
    game: new Chess(), // chess.js instance
    turn: 'white',
    moveHistory: []
}
```

**Emitted Events:**
- `waiting`: Sent to first player
- `start`: Sent to both players when game begins
- `observer`: Sent to spectators

### `move`
**Direction:** Client → Server  
**Description:** Player makes a chess move

**Client Payload:**
```javascript
{
    move: {
        from: "e2",
        to: "e4",
        promotion: "q" // optional
    },
    token: "game-room-token"
}
```

**Server Validation:**
- Verifies it's player's turn
- Validates move legality using chess.js
- Checks game state (not ended)

**Server Actions on Valid Move:**
- Updates game position
- Switches turn to opponent
- Checks for game end conditions
- Broadcasts move to all room participants

**Emitted Events:**
- `moved`: Sent to opponent with move data
- `game-over`: Sent if game ends (checkmate, draw, etc.)

### `message`
**Direction:** Client → Server  
**Description:** Player sends chat message during game

**Client Payload:**
```javascript
{
    message: "Good luck!",
    token: "game-room-token"
}
```

**Server Actions:**
- Validates message content (basic sanitization)
- Broadcasts to all room participants
- Logs message with timestamp

**Emitted Event:**
- `message`: Broadcasted to room with sender name and timestamp

### `resign`
**Direction:** Client → Server  
**Description:** Player resigns from the game

**Client Payload:**
```javascript
{
    token: "game-room-token"
}
```

**Server Actions:**
- Ends game immediately
- Updates game result
- Notifies all participants

**Emitted Event:**
- `game-over`: Sent with resignation result

### `offer-draw`
**Direction:** Client → Server  
**Description:** Player offers a draw to opponent

**Client Payload:**
```javascript
{
    token: "game-room-token"
}
```

**Server Actions:**
- Forwards draw offer to opponent
- Tracks pending draw offers

**Emitted Event:**
- `draw-offered`: Sent to opponent

### `accept-draw` / `decline-draw`
**Direction:** Client → Server  
**Description:** Response to draw offer

**Server Actions:**
- **Accept:** Ends game with draw result
- **Decline:** Continues game, clears offer

**Emitted Events:**
- `game-over`: If draw accepted
- `draw-declined`: If draw declined

## Time Control Events

### `time`
**Direction:** Client → Server  
**Description:** Updates player's remaining time

**Client Payload:**
```javascript
{
    time: 600, // seconds remaining
    token: "game-room-token"
}
```

**Server Actions:**
- Stores time data for player
- Monitors for time expiration

**Time Expiration:**
When player's time reaches zero:
- Game ends automatically
- Opponent wins by timeout
- `game-over` event emitted

## Monitoring Events

### Monitor Namespace Events

#### `update` (Monitor → Client)
**Description:** Real-time statistics update

**Payload:**
```javascript
{
    nbUsers: 42,      // Active connected users
    nbGames: 15       // Active games in progress
}
```

**Frequency:** Sent whenever user count or game count changes

## Error Handling

### Invalid Move
```javascript
socket.emit('invalid-move', {
    error: "Move is not legal",
    move: attemptedMove
});
```

### Game Not Found
```javascript
socket.emit('error', {
    message: "Game room not found",
    code: "GAME_NOT_FOUND"
});
```

### Permission Denied
```javascript
socket.emit('error', {
    message: "Not your turn",
    code: "INVALID_TURN"
});
```

## Game State Management

### Active Games Storage
```javascript
games = {
    "room-token": {
        players: [...],
        observers: [...],
        game: Chess(),
        turn: "white",
        timeControl: {
            white: 600,
            black: 600
        },
        moveHistory: [],
        status: "active"
    }
}
```

### Cleanup Process
- Games removed when both players disconnect
- Automatic cleanup after 1 hour of inactivity
- Observer removal on disconnect

## Security Considerations

### Input Validation
- All move data validated through chess.js
- Chat messages sanitized
- Token validation for room access

### Rate Limiting
- Move frequency limits
- Chat message throttling
- Connection attempt limits

### Authentication
- User verification through session data
- Anonymous users allowed as observers
- Move authorization by player identity

## Client Implementation Examples

### Basic Game Setup
```javascript
// Join game
socket.emit('join', {
    token: gameToken,
    side: preferredSide
});

// Listen for game start
socket.on('start', (data) => {
    initializeBoard(data.position);
    setPlayerSide(data.side);
});

// Make move
socket.emit('move', {
    move: { from: 'e2', to: 'e4' },
    token: gameToken
});

// Receive opponent move
socket.on('moved', (data) => {
    makeMove(data.move);
    updateBoard(data.position);
});
```

### Chat Implementation
```javascript
// Send message
socket.emit('message', {
    message: chatInput.value,
    token: gameToken
});

// Receive messages
socket.on('message', (data) => {
    displayMessage(data.name, data.message, data.timestamp);
});
```

## Performance Optimization

### Event Throttling
- Move events: Maximum 1 per second
- Chat messages: Maximum 5 per minute
- Time updates: Maximum 1 per second

### Memory Management
- Inactive game cleanup
- Observer list pruning
- Move history truncation after game end

### Scalability
- Room-based event distribution
- Minimal data in socket events
- Database updates batched where possible