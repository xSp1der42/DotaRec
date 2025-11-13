const Team = require('../models/teamModel');

class TeamService {
  /**
   * Get team logo information by team name and game
   * @param {String} teamName - Name of the team
   * @param {String} game - Game type (dota2 or cs2)
   * @returns {Promise<Object|null>} Team logo information or null if not found
   */
  async getTeamLogo(teamName, game) {
    try {
      const team = await Team.findOne({ name: teamName, game }).select('logo');
      if (!team || !team.logo || !team.logo.originalUrl) {
        return null;
      }
      return team.logo;
    } catch (error) {
      console.error(`Error fetching team logo for ${teamName} (${game}):`, error);
      return null;
    }
  }

  /**
   * Populate team objects with logo information
   * @param {Object} teamObj - Team object with name property
   * @param {String} game - Game type (dota2 or cs2)
   * @returns {Promise<Object>} Team object with populated logo information
   */
  async populateTeamLogo(teamObj, game) {
    if (!teamObj || !teamObj.name) {
      return teamObj;
    }

    const logoInfo = await this.getTeamLogo(teamObj.name, game);
    
    return {
      ...teamObj,
      logoUrl: logoInfo?.sizes?.medium || logoInfo?.originalUrl || teamObj.logoUrl || '',
      logo: logoInfo || undefined
    };
  }

  /**
   * Populate multiple teams with logo information
   * @param {Array} teams - Array of team objects
   * @param {String} game - Game type (dota2 or cs2)
   * @returns {Promise<Array>} Array of teams with populated logo information
   */
  async populateTeamsLogos(teams, game) {
    if (!Array.isArray(teams)) {
      return teams;
    }

    const populatedTeams = await Promise.all(
      teams.map(team => this.populateTeamLogo(team, game))
    );

    return populatedTeams;
  }

  /**
   * Populate match object with team logo information
   * @param {Object} match - Match object with team1 and team2 properties
   * @returns {Promise<Object>} Match object with populated team logos
   */
  async populateMatchLogos(match) {
    if (!match || !match.game) {
      return match;
    }

    const matchObj = match.toObject ? match.toObject() : match;

    // Populate team1 logo
    if (matchObj.team1) {
      matchObj.team1 = await this.populateTeamLogo(matchObj.team1, matchObj.game);
    }

    // Populate team2 logo
    if (matchObj.team2) {
      matchObj.team2 = await this.populateTeamLogo(matchObj.team2, matchObj.game);
    }

    return matchObj;
  }

  /**
   * Populate multiple matches with team logo information
   * @param {Array} matches - Array of match objects
   * @returns {Promise<Array>} Array of matches with populated team logos
   */
  async populateMatchesLogos(matches) {
    if (!Array.isArray(matches)) {
      return matches;
    }

    const populatedMatches = await Promise.all(
      matches.map(match => this.populateMatchLogos(match))
    );

    return populatedMatches;
  }

  /**
   * Get all teams for a specific game
   * @param {String} game - Game type (dota2 or cs2)
   * @returns {Promise<Array>} Array of teams
   */
  async getTeamsByGame(game) {
    try {
      const teams = await Team.find({ game }).select('name logo').sort({ name: 1 });
      return teams;
    } catch (error) {
      console.error(`Error fetching teams for game ${game}:`, error);
      return [];
    }
  }

  /**
   * Find or create a team
   * @param {String} teamName - Name of the team
   * @param {String} game - Game type (dota2 or cs2)
   * @returns {Promise<Object>} Team document
   */
  async findOrCreateTeam(teamName, game) {
    try {
      let team = await Team.findOne({ name: teamName, game });
      
      if (!team) {
        team = new Team({
          name: teamName,
          game: game
        });
        await team.save();
        console.log(`Created new team: ${teamName} (${game})`);
      }
      
      return team;
    } catch (error) {
      console.error(`Error finding/creating team ${teamName} (${game}):`, error);
      throw error;
    }
  }

  /**
   * Update team logo URL in predictor matches (for backward compatibility)
   * @param {String} teamName - Name of the team
   * @param {String} game - Game type (dota2 or cs2)
   * @param {String} logoUrl - New logo URL
   * @returns {Promise<Number>} Number of updated matches
   */
  async updateMatchesLogoUrl(teamName, game, logoUrl) {
    try {
      const PredictorMatch = require('../models/predictorMatchModel');
      
      // Update team1 matches
      const result1 = await PredictorMatch.updateMany(
        { 
          game: game,
          'team1.name': teamName 
        },
        { 
          $set: { 'team1.logoUrl': logoUrl } 
        }
      );

      // Update team2 matches
      const result2 = await PredictorMatch.updateMany(
        { 
          game: game,
          'team2.name': teamName 
        },
        { 
          $set: { 'team2.logoUrl': logoUrl } 
        }
      );

      const totalUpdated = result1.modifiedCount + result2.modifiedCount;
      console.log(`Updated ${totalUpdated} matches with new logo for ${teamName} (${game})`);
      
      return totalUpdated;
    } catch (error) {
      console.error(`Error updating matches logo for ${teamName} (${game}):`, error);
      return 0;
    }
  }
}

module.exports = new TeamService();