const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Team = require('../models/teamModel');
const PredictorMatch = require('../models/predictorMatchModel');

dotenv.config();

/**
 * Migration script to extract teams from predictor matches and create Team documents
 * This ensures existing teams are available in the new Team collection
 */
async function migrateTeamsFromMatches() {
  try {
    console.log('🚀 Starting team migration from predictor matches...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique teams from predictor matches
    const matches = await PredictorMatch.find({}, 'team1 team2 game');
    console.log(`📊 Found ${matches.length} predictor matches`);

    const teamsSet = new Set();
    const teamsData = [];

    // Extract unique teams
    matches.forEach(match => {
      const team1Key = `${match.game}:${match.team1.name}`;
      const team2Key = `${match.game}:${match.team2.name}`;
      
      if (!teamsSet.has(team1Key)) {
        teamsSet.add(team1Key);
        teamsData.push({
          name: match.team1.name,
          game: match.game,
          // Preserve existing logo URL if it exists
          ...(match.team1.logoUrl && {
            logo: {
              originalUrl: match.team1.logoUrl,
              sizes: {},
              uploadedAt: new Date(),
              fileSize: 0,
              mimeType: 'unknown'
            }
          })
        });
      }
      
      if (!teamsSet.has(team2Key)) {
        teamsSet.add(team2Key);
        teamsData.push({
          name: match.team2.name,
          game: match.game,
          // Preserve existing logo URL if it exists
          ...(match.team2.logoUrl && {
            logo: {
              originalUrl: match.team2.logoUrl,
              sizes: {},
              uploadedAt: new Date(),
              fileSize: 0,
              mimeType: 'unknown'
            }
          })
        });
      }
    });

    console.log(`🔍 Found ${teamsData.length} unique teams`);

    // Insert teams (use insertMany with ordered: false to continue on duplicates)
    let insertedCount = 0;
    let skippedCount = 0;

    for (const teamData of teamsData) {
      try {
        const existingTeam = await Team.findOne({ 
          name: teamData.name, 
          game: teamData.game 
        });
        
        if (!existingTeam) {
          await Team.create(teamData);
          insertedCount++;
          console.log(`✅ Created team: ${teamData.name} (${teamData.game})`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped existing team: ${teamData.name} (${teamData.game})`);
        }
      } catch (error) {
        if (error.code === 11000) {
          skippedCount++;
          console.log(`⏭️  Skipped duplicate team: ${teamData.name} (${teamData.game})`);
        } else {
          console.error(`❌ Error creating team ${teamData.name}:`, error.message);
        }
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   - Teams inserted: ${insertedCount}`);
    console.log(`   - Teams skipped: ${skippedCount}`);
    console.log(`   - Total processed: ${teamsData.length}`);

    // Verify the migration
    const totalTeams = await Team.countDocuments();
    console.log(`\n✅ Total teams in database: ${totalTeams}`);

    console.log('\n🎉 Team migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTeamsFromMatches();
}

module.exports = migrateTeamsFromMatches;