# Deployment Checklist

Use this checklist to ensure proper deployment of the Cybersport Cards backend with Pick Predictor system.

## Pre-Deployment

### Environment Setup
- [ ] `.env` file created from `.env.example`
- [ ] All required environment variables configured
- [ ] `JWT_SECRET` is strong and unique (32+ characters)
- [ ] `MONGO_URI` points to correct database (production)
- [ ] `BASE_URL` updated to production URL
- [ ] Pick Predictor variables configured:
  - [ ] `PREDICTOR_BET_MIN` set
  - [ ] `PREDICTOR_BET_MAX` set
  - [ ] `PREDICTOR_COMMISSION` set
  - [ ] `PREDICTOR_CLOSE_BETTING_MINUTES` set
  - [ ] `PREDICTOR_NOTIFICATION_MINUTES` set
  - [ ] `UPLOAD_MAX_SIZE` set
  - [ ] `UPLOAD_DIR` set

### Dependencies
- [ ] Node.js 16+ installed
- [ ] All npm packages installed (`npm install`)
- [ ] Production dependencies only (`npm install --production` for production)

### Directory Structure
- [ ] `uploads/` directory exists
- [ ] `uploads/team-logos/` directory exists
- [ ] Directory permissions set correctly (755)
- [ ] `.gitkeep` file in `uploads/team-logos/`

### Database
- [ ] MongoDB Atlas cluster created (or local MongoDB running)
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured (production server IP)
- [ ] Connection string tested

## Deployment Steps

### 1. Database Migrations
- [ ] Run season initialization: `npm run init:season`
- [ ] Run predictor indexes: `npm run init:predictor`
- [ ] Verify indexes created successfully
- [ ] Check MongoDB for collections:
  - [ ] `users`
  - [ ] `players`
  - [ ] `seasons`
  - [ ] `predictormatches`
  - [ ] `predictorbets`
  - [ ] `notifications`

### 2. Application Deployment

#### Vercel Deployment
- [ ] Vercel CLI installed
- [ ] Environment variables set in Vercel dashboard
- [ ] `vercel.json` configured correctly
- [ ] Deploy: `vercel --prod`
- [ ] Verify deployment URL

#### Traditional Server Deployment
- [ ] Repository cloned on server
- [ ] Dependencies installed
- [ ] PM2 installed globally
- [ ] Application started with PM2
- [ ] PM2 configured for auto-restart
- [ ] PM2 startup script configured

### 3. Static Files
- [ ] Uploads directory accessible
- [ ] Static file serving configured
- [ ] Test file upload (team logo)
- [ ] Verify file URL accessibility

### 4. Security
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured for production domains
- [ ] Environment variables secured (not in git)
- [ ] MongoDB connection uses authentication
- [ ] File upload validation working
- [ ] Admin routes protected
- [ ] JWT authentication working

## Post-Deployment

### Verification
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Authentication endpoints working:
  - [ ] `POST /api/auth/register`
  - [ ] `POST /api/auth/login`
  - [ ] `GET /api/auth/me`
- [ ] Player card endpoints working
- [ ] Marketplace endpoints working
- [ ] Season endpoints working
- [ ] Pick Predictor endpoints working:
  - [ ] `GET /api/predictor/matches`
  - [ ] `POST /api/predictor/bets`
  - [ ] `GET /api/predictor/history`
  - [ ] `GET /api/predictor/notifications`
- [ ] File upload working (team logos)
- [ ] Notifications being created

### Testing
- [ ] Create test user account
- [ ] Create test match (admin)
- [ ] Upload team logo
- [ ] Place test bet
- [ ] Verify bet recorded in database
- [ ] Check notification created
- [ ] Test reward distribution (after match completion)

### Monitoring Setup
- [ ] Server logs accessible
- [ ] MongoDB Atlas monitoring enabled
- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring configured (optional)
- [ ] Disk space monitoring for uploads directory

### Performance
- [ ] Database indexes verified
- [ ] API response times acceptable
- [ ] File upload speed acceptable
- [ ] Concurrent user handling tested

## Rollback Plan

In case of issues:

1. **Database Issues**
   - [ ] Backup connection string ready
   - [ ] Previous database state documented
   - [ ] Rollback script prepared (if needed)

2. **Application Issues**
   - [ ] Previous version tag/commit noted
   - [ ] Rollback command ready: `git checkout <previous-version>`
   - [ ] PM2 restart command ready: `pm2 restart cybersport-backend`

3. **File Storage Issues**
   - [ ] Backup of uploads directory
   - [ ] Restore procedure documented

## Documentation

- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment guide reviewed
- [ ] Team notified of deployment
- [ ] Changelog updated

## Maintenance

### Regular Tasks
- [ ] Monitor server logs daily
- [ ] Check MongoDB Atlas metrics weekly
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Backup uploads directory weekly
- [ ] Review and clean old notifications (auto-deleted after 30 days)
- [ ] Monitor disk space for uploads

### Security Updates
- [ ] Subscribe to security advisories
- [ ] Update dependencies regularly
- [ ] Rotate JWT secret periodically
- [ ] Review and update CORS settings
- [ ] Audit admin access logs

## Emergency Contacts

- **Database Issues**: [MongoDB Atlas Support]
- **Server Issues**: [Hosting Provider Support]
- **Application Issues**: [Development Team]

## Notes

Add any deployment-specific notes here:

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Environment**: [ ] Development [ ] Staging [ ] Production

## Sign-off

- [ ] Technical Lead Approval
- [ ] QA Testing Complete
- [ ] Documentation Updated
- [ ] Team Notified

---

**Checklist Completed**: _______________
**Production Ready**: [ ] Yes [ ] No
