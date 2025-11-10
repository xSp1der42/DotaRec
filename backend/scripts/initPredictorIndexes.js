// Migration script to create indexes for Pick Predictor System
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Helper function to create index with error handling
const createIndexSafely = async (collection, keys, options, description) => {
    try {
        await collection.createIndex(keys, options);
        console.log(`  ✓ Created index: ${description}`);
    } catch (error) {
        if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
            console.log(`  ⚠ Index already exists: ${description}`);
        } else {
            throw error;
        }
    }
};

const initPredictorIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const db = mongoose.connection.db;

        // Create indexes for PredictorMatch collection
        console.log('📊 Creating indexes for predictormatches collection...');
        const matchesCollection = db.collection('predictormatches');
        
        await createIndexSafely(
            matchesCollection,
            { startTime: 1, status: 1 },
            { name: 'startTime_status_idx' },
            'startTime_status_idx'
        );

        await createIndexSafely(
            matchesCollection,
            { game: 1 },
            { name: 'game_idx' },
            'game_idx'
        );

        await createIndexSafely(
            matchesCollection,
            { status: 1 },
            { name: 'status_idx' },
            'status_idx'
        );

        // Create indexes for PredictorBet collection
        console.log('📊 Creating indexes for predictorbets collection...');
        const betsCollection = db.collection('predictorbets');
        
        await createIndexSafely(
            betsCollection,
            { userId: 1, createdAt: -1 },
            { name: 'userId_createdAt_idx' },
            'userId_createdAt_idx'
        );

        await createIndexSafely(
            betsCollection,
            { matchId: 1 },
            { name: 'matchId_idx' },
            'matchId_idx'
        );

        await createIndexSafely(
            betsCollection,
            { userId: 1, matchId: 1 },
            { name: 'userId_matchId_idx' },
            'userId_matchId_idx'
        );

        // Create indexes for Notification collection
        console.log('📊 Creating indexes for notifications collection...');
        const notificationsCollection = db.collection('notifications');
        
        await createIndexSafely(
            notificationsCollection,
            { userId: 1, read: 1, createdAt: -1 },
            { name: 'userId_read_createdAt_idx' },
            'userId_read_createdAt_idx'
        );

        await createIndexSafely(
            notificationsCollection,
            { expiresAt: 1 },
            { expireAfterSeconds: 0, name: 'expiresAt_ttl_idx' },
            'expiresAt_ttl_idx (TTL - auto-delete after 30 days)'
        );

        await createIndexSafely(
            notificationsCollection,
            { userId: 1, type: 1 },
            { name: 'userId_type_idx' },
            'userId_type_idx'
        );

        // Verify indexes
        console.log('\n📋 Verifying created indexes...');
        
        const matchIndexes = await matchesCollection.indexes();
        console.log(`  PredictorMatch indexes: ${matchIndexes.length}`);
        
        const betIndexes = await betsCollection.indexes();
        console.log(`  PredictorBet indexes: ${betIndexes.length}`);
        
        const notificationIndexes = await notificationsCollection.indexes();
        console.log(`  Notification indexes: ${notificationIndexes.length}`);

        console.log('\n✅ All indexes created successfully!');
        console.log('\n💡 Note: TTL index will automatically delete notifications after 30 days');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
};

initPredictorIndexes();
