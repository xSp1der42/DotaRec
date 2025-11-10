# Pick Predictor System - Configuration Guide

## Overview

The Pick Predictor System allows users to predict draft outcomes in esports matches (Dota 2, CS2) and place bets using virtual currency. This document covers system configuration and setup.

## Environment Variables

All Pick Predictor configuration is managed through environment variables in `.env`:

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PREDICTOR_BET_MIN` | 10 | Minimum bet amount in coins |
| `PREDICTOR_BET_MAX` | 10000 | Maximum bet amount in coins |
| `PREDICTOR_COMMISSION` | 0.05 | System commission (5%) taken from reward pool |
| `PREDICTOR_CLOSE_BETTING_MINUTES` | 5 | Minutes before match start to close betting |
| `PREDICTOR_NOTIFICATION_MINUTES` | 10 | Minutes before match start to send notifications |

### File Upload Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_MAX_SIZE` | 2097152 | Maximum file size in bytes (2MB) |
| `UPLOAD_DIR` | uploads/team-logos | Directory for team logo uploads |

## Directory Structure

```
backend/
├── uploads/
│   └── team-logos/          # Team logo files
├── models/
│   ├── predictorMatchModel.js
│   ├── predictorBetModel.js
│   └── notificationModel.js
├── services/
│   ├── predictionService.js
│   └── notificationService.js
├── routes/
│   └── predictorRoutes.js
└── scripts/
    └── initPredictorIndexes.js
```

## Database Collections

### predictormatches

Stores match information and prediction types.

**Key Fields:**
- `game`: 'dota2' | 'cs2'
- `team1`, `team2`: Team information with logos
- `startTime`: Match start time
- `status`: 'upcoming' | 'live' | 'draft_phase' | 'completed' | 'cancelled'
- `predictionTypes`: Array of available prediction types

**Indexes:**
- `startTime_status_idx`: For querying upcoming matches
- `game_idx`: For filtering by game
- `status_idx`: For filtering by status

### predictorbets

Stores user bets and predictions.

**Key Fields:**
- `userId`: Reference to User
- `matchId`: Reference to PredictorMatch
- `predictions`: Array of user predictions with bet amounts
- `totalBet`: Total amount wagered
- `totalReward`: Total winnings

**Indexes:**
- `userId_createdAt_idx`: For user bet history
- `matchId_idx`: For match-specific bets
- `userId_matchId_idx`: For user-match lookup

### notifications

Stores user notifications with automatic expiration.

**Key Fields:**
- `userId`: Reference to User
- `type`: 'match_starting' | 'prediction_result'
- `read`: Boolean flag
- `expiresAt`: Expiration date (30 days from creation)

**Indexes:**
- `userId_read_createdAt_idx`: For user notification queries
- `expiresAt_ttl_idx`: TTL index for auto-deletion
- `userId_type_idx`: For filtering by notification type

## Setup Instructions

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Create Upload Directory

```bash
mkdir -p uploads/team-logos
chmod 755 uploads/team-logos
```

### 3. Run Database Migration

```bash
npm run init:predictor
```

This creates all necessary indexes for optimal performance.

### 4. Verify Setup

Check that indexes were created:

```javascript
// In MongoDB shell
db.predictormatches.getIndexes()
db.predictorbets.getIndexes()
db.notifications.getIndexes()
```

## API Endpoints

### Match Management

```
GET    /api/predictor/matches              # List available matches
GET    /api/predictor/matches/:id          # Get match details
POST   /api/predictor/matches              # Create match (admin)
PUT    /api/predictor/matches/:id          # Update match (admin)
DELETE /api/predictor/matches/:id          # Delete match (admin)
POST   /api/predictor/matches/:id/results  # Set draft results (admin)
POST   /api/predictor/matches/:id/logo     # Upload team logo (admin)
```

### Betting

```
GET    /api/predictor/bets                 # Get user bets
POST   /api/predictor/bets                 # Place bet
GET    /api/predictor/bets/:id             # Get bet details
GET    /api/predictor/history              # User prediction history
```

### Statistics & Notifications

```
GET    /api/predictor/stats/:matchId       # Match betting statistics
GET    /api/predictor/notifications        # Get notifications
PUT    /api/predictor/notifications/:id    # Mark notification as read
```

## Business Logic

### Odds Calculation

Odds are calculated dynamically based on bet distribution:

```javascript
odds = (totalRewardPool / optionRewardPool) * (1 - PREDICTOR_COMMISSION)
```

- **Minimum odds**: 1.1
- **Maximum odds**: 10.0
- **Commission**: 5% (configurable)

### Reward Distribution

When draft results are set:

1. System identifies winning bets
2. Calculates each winner's share of reward pool
3. Distributes rewards proportionally to bet amounts
4. Applies system commission
5. Credits user accounts
6. Sends result notifications

### Betting Lifecycle

```
Match Created → Betting Open → Betting Closes (5 min before) → 
Match Starts → Draft Phase → Results Set → Rewards Distributed
```

### Automatic Processes

1. **Betting Closure**: Automatically closes 5 minutes before match start
2. **Notifications**: Sent 10 minutes before match start
3. **Notification Cleanup**: Auto-deleted after 30 days (TTL index)

## File Upload Configuration

### Team Logos

**Supported Formats**: PNG, JPG, JPEG, SVG  
**Maximum Size**: 2MB (configurable via `UPLOAD_MAX_SIZE`)  
**Storage**: Local filesystem in `uploads/team-logos/`

### Upload Process

1. Admin uploads logo via POST `/api/predictor/matches/:id/logo`
2. Multer validates file type and size
3. File saved with unique name: `team-logo-{matchId}-{team}-{timestamp}.{ext}`
4. URL stored in match document
5. File served statically at `/uploads/team-logos/{filename}`

### Security

- File type validation (whitelist)
- Size limit enforcement
- Unique filenames prevent overwrites
- Admin-only access

## Performance Considerations

### Database Optimization

- **Indexes**: All critical queries use indexes
- **TTL Index**: Automatic cleanup of old notifications
- **Compound Indexes**: Optimize multi-field queries

### Caching Recommendations

- Cache match list for 30 seconds
- Cache betting statistics for 10 seconds
- Cache user notifications for 30 seconds

### Scaling

For high traffic:

1. **Database**: MongoDB Atlas auto-scales
2. **File Storage**: Consider CDN for team logos
3. **API**: Implement rate limiting
4. **Caching**: Add Redis for frequently accessed data

## Monitoring

### Key Metrics

- Active matches count
- Total bets placed per match
- Reward pool sizes
- Notification delivery rate
- File upload success rate

### Health Checks

```bash
# Check API health
curl http://localhost:5001/api/predictor/matches

# Check database connection
# Look for "✅ MongoDB Connected" in logs

# Check upload directory
ls -la uploads/team-logos/
```

## Troubleshooting

### Common Issues

**Issue**: Betting closes too early/late  
**Solution**: Adjust `PREDICTOR_CLOSE_BETTING_MINUTES` in `.env`

**Issue**: File upload fails  
**Solution**: Check directory permissions and `UPLOAD_MAX_SIZE`

**Issue**: Notifications not sent  
**Solution**: Verify `PREDICTOR_NOTIFICATION_MINUTES` and check logs

**Issue**: Slow queries  
**Solution**: Ensure indexes are created via `npm run init:predictor`

### Debug Mode

Enable detailed logging:

```javascript
// In predictionService.js or notificationService.js
console.log('Debug:', { /* relevant data */ });
```

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific test suites
npm test -- predictionService.test.js
npm test -- predictorRoutes.test.js
npm test -- notificationService.test.js
```

### Manual Testing

1. Create a test match (admin)
2. Upload team logos
3. Place bets as different users
4. Verify odds calculation
5. Set draft results
6. Verify reward distribution
7. Check notifications

## Security Best Practices

- [ ] Validate all user inputs
- [ ] Enforce bet limits (min/max)
- [ ] Check user balance before accepting bets
- [ ] Admin-only access for match management
- [ ] File upload validation (type, size)
- [ ] Rate limiting on betting endpoints
- [ ] Audit logging for reward distribution

## Future Enhancements

- Real-time updates via WebSocket
- Automated result fetching from esports APIs
- Advanced analytics and statistics
- Mobile push notifications
- Social features (sharing predictions)
- Leaderboards and achievements

## Support

For issues or questions:
- Check server logs for errors
- Review MongoDB Atlas metrics
- Consult main deployment guide: `DEPLOYMENT.md`
- Review API documentation: `NOTIFICATIONS_API.md`
