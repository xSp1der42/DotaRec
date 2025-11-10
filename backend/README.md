# Cybersport Cards - Backend

Backend API for the Cybersport Cards platform, featuring player card management, marketplace, seasons, and pick predictor system.

## Features

- 🎮 **Player Card Management**: Create, trade, and collect esports player cards
- 🏪 **Marketplace**: Buy and sell cards with other users
- 📅 **Seasons System**: Seasonal card releases and progression
- 🎯 **Pick Predictor**: Predict draft outcomes in esports matches (Dota 2, CS2)
- 🔔 **Notifications**: Real-time notifications for important events
- 👤 **User Profiles**: Customizable profiles with avatars
- 🔐 **Authentication**: JWT-based secure authentication

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites

- Node.js 16+
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cybersport-cards/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create required directories**
   ```bash
   mkdir -p uploads/team-logos
   ```

5. **Run database migrations**
   ```bash
   npm run init:season
   npm run init:predictor
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start at `http://localhost:5001`

## Project Structure

```
backend/
├── config/
│   └── db.js                    # MongoDB connection
├── middleware/
│   └── authMiddleware.js        # JWT authentication
├── models/
│   ├── playerModel.js           # Player card model
│   ├── userModel.js             # User model
│   ├── seasonModel.js           # Season model
│   ├── predictorMatchModel.js   # Match model
│   ├── predictorBetModel.js     # Bet model
│   └── notificationModel.js     # Notification model
├── routes/
│   ├── authRoutes.js            # Authentication endpoints
│   ├── playerRoutes.js          # Player card endpoints
│   ├── marketplaceRoutes.js     # Marketplace endpoints
│   ├── seasonRoutes.js          # Season endpoints
│   ├── predictorRoutes.js       # Pick predictor endpoints
│   └── profileRoutes.js         # User profile endpoints
├── services/
│   ├── predictionService.js     # Prediction business logic
│   └── notificationService.js   # Notification management
├── scripts/
│   ├── initSeason.js            # Season initialization
│   └── initPredictorIndexes.js  # Database index creation
├── uploads/
│   └── team-logos/              # Team logo storage
├── __tests__/                   # Test files
├── server.js                    # Application entry point
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
└── package.json
```

## API Documentation

### Authentication

```
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login user
GET    /api/auth/me              # Get current user
```

### Player Cards

```
GET    /api/players              # Get all players
GET    /api/players/:id          # Get player by ID
POST   /api/players              # Create player (admin)
PUT    /api/players/:id          # Update player (admin)
DELETE /api/players/:id          # Delete player (admin)
```

### Marketplace

```
GET    /api/marketplace          # Get marketplace listings
POST   /api/marketplace          # Create listing
POST   /api/marketplace/:id/buy  # Purchase card
```

### Seasons

```
GET    /api/seasons              # Get all seasons
GET    /api/seasons/active       # Get active season
POST   /api/seasons              # Create season (admin)
```

### Pick Predictor

```
GET    /api/predictor/matches              # List matches
GET    /api/predictor/matches/:id          # Get match details
POST   /api/predictor/matches              # Create match (admin)
POST   /api/predictor/bets                 # Place bet
GET    /api/predictor/history              # User bet history
GET    /api/predictor/stats/:matchId       # Match statistics
GET    /api/predictor/notifications        # Get notifications
```

For detailed API documentation, see:
- [Notifications API](./NOTIFICATIONS_API.md)
- [Pick Predictor README](./PICK_PREDICTOR_README.md)
- [Seasons README](./SEASONS_README.md)

## Environment Variables

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete reference.

### Essential Variables

```env
PORT=5001
BASE_URL=http://localhost:5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key

# Pick Predictor
PREDICTOR_BET_MIN=10
PREDICTOR_BET_MAX=10000
PREDICTOR_COMMISSION=0.05
PREDICTOR_CLOSE_BETTING_MINUTES=5
PREDICTOR_NOTIFICATION_MINUTES=10
UPLOAD_MAX_SIZE=2097152
UPLOAD_DIR=uploads/team-logos
```

## Database

### Collections

- `users` - User accounts and profiles
- `players` - Player cards
- `seasons` - Season information
- `predictormatches` - Esports matches for predictions
- `predictorbets` - User bets and predictions
- `notifications` - User notifications (TTL: 30 days)

### Indexes

Optimized indexes are created automatically via migration scripts:

```bash
npm run init:predictor
```

See [PICK_PREDICTOR_README.md](./PICK_PREDICTOR_README.md) for index details.

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npm test -- predictionService.test.js
```

### Test Coverage

- Unit tests for services
- Integration tests for API routes
- Model validation tests

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

### Quick Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Set environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

### Traditional Server

1. Clone repository on server
2. Install dependencies: `npm install --production`
3. Configure `.env` file
4. Run migrations
5. Use PM2: `pm2 start server.js`

## Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run init:season    # Initialize season system
npm run init:predictor # Create database indexes for predictor
```

## Development

### Adding New Features

1. Create model in `models/`
2. Create routes in `routes/`
3. Add business logic in `services/` (if needed)
4. Write tests in `__tests__/`
5. Update documentation

### Code Style

- Use async/await for asynchronous operations
- Follow existing naming conventions
- Add error handling for all routes
- Write tests for new features

### Database Migrations

Create migration scripts in `scripts/` directory:

```javascript
// scripts/myMigration.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
        
        // Your migration logic here
        
        console.log('✅ Migration completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
```

Add to `package.json`:
```json
"scripts": {
    "migrate:myfeature": "node scripts/myMigration.js"
}
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas IP whitelist
- Ensure database user has proper permissions

**File Upload Errors**
- Check `uploads/team-logos/` directory exists
- Verify directory permissions (755)
- Check `UPLOAD_MAX_SIZE` setting

**JWT Authentication Errors**
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration
- Verify Authorization header format: `Bearer <token>`

**Tests Failing**
- Ensure MongoDB Memory Server is installed
- Check for port conflicts
- Run tests with `--detectOpenHandles` flag

### Debug Mode

Enable detailed logging:

```javascript
// In any file
console.log('Debug:', { /* data */ });
```

## Performance

### Optimization Tips

1. **Database Indexes**: Ensure migrations are run
2. **Caching**: Consider Redis for frequently accessed data
3. **File Storage**: Use CDN for static files in production
4. **Rate Limiting**: Implement for public endpoints

### Monitoring

- Monitor MongoDB Atlas metrics
- Track API response times
- Set up error logging (e.g., Sentry)
- Monitor file storage usage

## Security

### Best Practices

- ✅ JWT authentication on protected routes
- ✅ Password hashing with bcrypt
- ✅ Input validation on all endpoints
- ✅ File upload validation (type, size)
- ✅ MongoDB injection prevention (Mongoose)
- ✅ CORS configuration
- ⚠️ Consider adding rate limiting
- ⚠️ Consider adding request logging

### Security Checklist

- [ ] Strong `JWT_SECRET` in production
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated regularly
- [ ] File upload limits enforced
- [ ] Admin routes properly protected
- [ ] Regular dependency updates

## Contributing

1. Create feature branch
2. Make changes
3. Write/update tests
4. Update documentation
5. Submit pull request

## Support

For issues or questions:
- Check documentation in this directory
- Review test files for usage examples
- Check server logs for errors

## License

[Your License Here]

## Additional Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables](./ENV_VARIABLES.md)
- [Pick Predictor System](./PICK_PREDICTOR_README.md)
- [Notifications API](./NOTIFICATIONS_API.md)
- [Seasons System](./SEASONS_README.md)
