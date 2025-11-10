# Deployment Guide - Cybersport Cards Backend

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account or local MongoDB instance
- Access to environment variables

## Environment Setup

### 1. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=5001
BASE_URL=http://localhost:5001  # Change to production URL in production

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here  # Generate a strong secret

# Pick Predictor System Configuration
PREDICTOR_BET_MIN=10
PREDICTOR_BET_MAX=10000
PREDICTOR_COMMISSION=0.05
PREDICTOR_CLOSE_BETTING_MINUTES=5
PREDICTOR_NOTIFICATION_MINUTES=10
UPLOAD_MAX_SIZE=2097152
UPLOAD_DIR=uploads/team-logos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Required Directories

Ensure the uploads directory structure exists:

```bash
mkdir -p uploads/team-logos
```

### 4. Run Database Migrations

#### Initialize Season System

```bash
npm run init:season
```

This will:
- Create the first season
- Update existing player cards with season 1

#### Initialize Pick Predictor Indexes

```bash
npm run init:predictor
```

This will create optimized indexes for:
- **PredictorMatch collection**: Indexes on `startTime`, `status`, and `game`
- **PredictorBet collection**: Indexes on `userId`, `matchId`, and `createdAt`
- **Notification collection**: Indexes on `userId`, `read`, `type`, and TTL index for auto-deletion

### 5. Start the Server

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## Production Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json** (already configured in project root):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/server.js"
       }
     ]
   }
   ```

3. **Set Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.example`

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Alternative: Traditional Server Deployment

1. **Clone repository on server**:
   ```bash
   git clone <repository-url>
   cd cybersport-cards
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install --production
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   ```

4. **Run migrations**:
   ```bash
   npm run init:season
   npm run init:predictor
   ```

5. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "cybersport-backend"
   pm2 save
   pm2 startup
   ```

## File Upload Configuration

### Team Logos Directory

The system stores team logos in `uploads/team-logos/`. Ensure:

1. **Directory exists and has write permissions**:
   ```bash
   mkdir -p uploads/team-logos
   chmod 755 uploads/team-logos
   ```

2. **Supported formats**: PNG, JPG, JPEG, SVG
3. **Maximum file size**: 2MB (configurable via `UPLOAD_MAX_SIZE`)

### Static File Serving

Team logos are served at: `http://your-domain/uploads/team-logos/filename.ext`

Ensure your server configuration allows static file serving from the `uploads` directory.

## Database Indexes

The Pick Predictor system uses several indexes for optimal performance:

### PredictorMatch Collection
- `startTime_status_idx`: Composite index for querying upcoming matches
- `game_idx`: Index for filtering by game (Dota 2 / CS2)
- `status_idx`: Index for filtering by match status

### PredictorBet Collection
- `userId_createdAt_idx`: Composite index for user bet history
- `matchId_idx`: Index for querying bets by match
- `userId_matchId_idx`: Composite index for user-match bet lookup

### Notification Collection
- `userId_read_createdAt_idx`: Composite index for user notifications
- `expiresAt_ttl_idx`: TTL index for automatic deletion after 30 days
- `userId_type_idx`: Composite index for filtering notifications by type

### Verify Indexes

After running migrations, verify indexes in MongoDB:

```javascript
// In MongoDB shell or Compass
db.predictormatches.getIndexes()
db.predictorbets.getIndexes()
db.notifications.getIndexes()
```

## Health Checks

### API Health Check

```bash
curl http://localhost:5001/api/health
```

### Database Connection Check

Check server logs for:
```
✅ MongoDB Connected: cluster.mongodb.net
```

## Troubleshooting

### Issue: Indexes not created

**Solution**: Run the migration script manually:
```bash
npm run init:predictor
```

### Issue: Upload directory not writable

**Solution**: Set proper permissions:
```bash
chmod -R 755 uploads
```

### Issue: Environment variables not loaded

**Solution**: Ensure `.env` file exists in backend root and contains all required variables.

### Issue: MongoDB connection fails

**Solution**: 
1. Check `MONGO_URI` in `.env`
2. Verify MongoDB Atlas IP whitelist includes your server IP
3. Ensure database user has proper permissions

## Monitoring

### Recommended Monitoring

1. **Server uptime**: Use PM2 or similar process manager
2. **Database performance**: Monitor MongoDB Atlas metrics
3. **File storage**: Monitor `uploads/` directory size
4. **API response times**: Use application monitoring tools

### Logs

- **Application logs**: Check PM2 logs or server console
- **MongoDB logs**: Available in MongoDB Atlas dashboard
- **Error tracking**: Consider integrating Sentry or similar service

## Backup Strategy

### Database Backups

MongoDB Atlas provides automatic backups. For manual backups:

```bash
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)
```

### File Backups

Backup the uploads directory regularly:

```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## Security Checklist

- [ ] Strong `JWT_SECRET` configured
- [ ] MongoDB connection uses authentication
- [ ] Environment variables not committed to repository
- [ ] File upload size limits enforced
- [ ] CORS configured for production domains
- [ ] HTTPS enabled in production
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Regular security updates applied

## Performance Optimization

1. **Database Indexes**: Already configured via migration script
2. **Static File Caching**: Configure CDN or reverse proxy caching for uploads
3. **API Rate Limiting**: Consider implementing rate limiting for public endpoints
4. **Connection Pooling**: MongoDB driver handles this automatically

## Scaling Considerations

### Horizontal Scaling

If deploying multiple instances:

1. **Shared File Storage**: Use cloud storage (AWS S3, Google Cloud Storage) instead of local uploads
2. **Session Management**: JWT tokens are stateless, no additional configuration needed
3. **Database**: MongoDB Atlas handles scaling automatically

### Vertical Scaling

- Increase server resources (CPU, RAM) as needed
- Monitor MongoDB Atlas metrics and upgrade tier if necessary

## Support

For issues or questions:
- Check application logs
- Review MongoDB Atlas metrics
- Consult API documentation in `NOTIFICATIONS_API.md` and `SEASONS_README.md`
