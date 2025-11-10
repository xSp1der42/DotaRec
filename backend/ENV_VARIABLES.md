# Environment Variables Reference

## Quick Reference

This document provides a quick reference for all environment variables used in the Cybersport Cards backend.

## Required Variables

### Server Configuration

```env
PORT=5001
```
Port number for the Express server.

```env
BASE_URL=http://localhost:5001
```
Base URL for the application. Change to production URL in production.

### Database Configuration

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```
MongoDB connection string. Use MongoDB Atlas or local MongoDB instance.

### Authentication

```env
JWT_SECRET=your_super_secret_jwt_key_here
```
Secret key for JWT token generation. **Must be strong and unique in production.**

## Pick Predictor System Variables

### Betting Limits

```env
PREDICTOR_BET_MIN=10
```
Minimum bet amount in virtual coins. Default: 10

```env
PREDICTOR_BET_MAX=10000
```
Maximum bet amount in virtual coins. Default: 10000

### System Configuration

```env
PREDICTOR_COMMISSION=0.05
```
System commission rate (0.05 = 5%). This percentage is taken from the reward pool. Default: 0.05

```env
PREDICTOR_CLOSE_BETTING_MINUTES=5
```
Minutes before match start to automatically close betting. Default: 5

```env
PREDICTOR_NOTIFICATION_MINUTES=10
```
Minutes before match start to send "match starting" notifications. Default: 10

### File Upload Configuration

```env
UPLOAD_MAX_SIZE=2097152
```
Maximum file upload size in bytes. Default: 2097152 (2MB)

```env
UPLOAD_DIR=uploads/team-logos
```
Directory path for storing team logo uploads. Default: uploads/team-logos

## Environment-Specific Configurations

### Development

```env
PORT=5001
BASE_URL=http://localhost:5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=dev_secret_key_12345
PREDICTOR_BET_MIN=10
PREDICTOR_BET_MAX=10000
PREDICTOR_COMMISSION=0.05
PREDICTOR_CLOSE_BETTING_MINUTES=5
PREDICTOR_NOTIFICATION_MINUTES=10
UPLOAD_MAX_SIZE=2097152
UPLOAD_DIR=uploads/team-logos
```

### Production

```env
PORT=5001
BASE_URL=https://your-production-domain.com
MONGO_URI=mongodb+srv://prod_user:strong_password@cluster.mongodb.net/prod-db
JWT_SECRET=super_strong_production_secret_key_xyz789
PREDICTOR_BET_MIN=10
PREDICTOR_BET_MAX=10000
PREDICTOR_COMMISSION=0.05
PREDICTOR_CLOSE_BETTING_MINUTES=5
PREDICTOR_NOTIFICATION_MINUTES=10
UPLOAD_MAX_SIZE=2097152
UPLOAD_DIR=uploads/team-logos
```

## Configuration Tips

### Security

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Use strong JWT secrets**
   - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Minimum 32 characters
   - Mix of letters, numbers, and symbols

3. **Secure MongoDB connection**
   - Use strong passwords
   - Enable IP whitelist in MongoDB Atlas
   - Use connection string with authentication

### Performance

1. **Adjust betting close time**
   - Increase `PREDICTOR_CLOSE_BETTING_MINUTES` for more preparation time
   - Decrease for last-minute betting excitement

2. **Notification timing**
   - Adjust `PREDICTOR_NOTIFICATION_MINUTES` based on user preferences
   - Consider time zones for international matches

3. **File upload limits**
   - Increase `UPLOAD_MAX_SIZE` if needed for high-quality logos
   - Consider CDN for production file serving

### Business Logic

1. **Betting limits**
   - Adjust `PREDICTOR_BET_MIN` and `PREDICTOR_BET_MAX` based on economy
   - Consider user feedback and engagement metrics

2. **Commission rate**
   - `PREDICTOR_COMMISSION` affects reward distribution
   - Lower commission = higher user rewards
   - Higher commission = more platform revenue

## Validation

### Check Configuration

Run this script to validate your environment variables:

```javascript
// validate-env.js
require('dotenv').config();

const required = [
    'PORT',
    'BASE_URL',
    'MONGO_URI',
    'JWT_SECRET',
    'PREDICTOR_BET_MIN',
    'PREDICTOR_BET_MAX',
    'PREDICTOR_COMMISSION',
    'PREDICTOR_CLOSE_BETTING_MINUTES',
    'PREDICTOR_NOTIFICATION_MINUTES',
    'UPLOAD_MAX_SIZE',
    'UPLOAD_DIR'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run with: `node validate-env.js`

## Troubleshooting

### Common Issues

**Issue**: "JWT_SECRET is not defined"  
**Solution**: Ensure `.env` file exists and contains `JWT_SECRET`

**Issue**: "Cannot connect to MongoDB"  
**Solution**: Check `MONGO_URI` format and network connectivity

**Issue**: "File upload fails"  
**Solution**: Verify `UPLOAD_DIR` exists and has write permissions

**Issue**: "Betting closes at wrong time"  
**Solution**: Check `PREDICTOR_CLOSE_BETTING_MINUTES` value and server timezone

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Pick Predictor README](./PICK_PREDICTOR_README.md)
- [Notifications API](./NOTIFICATIONS_API.md)
- [Seasons README](./SEASONS_README.md)
