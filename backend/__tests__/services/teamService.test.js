const Team = require('../../models/teamModel');
const PredictorMatch = require('../../models/predictorMatchModel');
const teamService = require('../../services/teamService');
require('../setup');

describe('Team Service Tests', () => {
  let testTeam1;
  let testTeam2;
  let testMatch;

  beforeEach(async () => {
    // Create test teams
    testTeam1 = await Team.create({
      name: 'Team Alpha',
      game: 'dota2',
      logo: {
        originalUrl: '/uploads/team-logos/team-alpha-original.png',
        sizes: {
          small: '/uploads/team-logos/team-alpha-32.png',
          medium: '/uploads/team-logos/team-alpha-64.png',
          large: '/uploads/team-logos/team-alpha-128.png'
        },
        uploadedAt: new Date(),
        fileSize: 1024,
        mimeType: 'image/png'
      }
    });

    testTeam2 = await Team.create({
      name: 'Team Beta',
      game: 'dota2'
      // No logo
    });

    // Create test match
    testMatch = await PredictorMatch.create({
      game: 'dota2',
      team1: { name: 'Team Alpha', logoUrl: '' },
      team2: { name: 'Team Beta', logoUrl: '' },
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'upcoming',
      predictionTypes: []
    });
  });

  describe('getTeamLogo', () => {
    it('should return logo information for existing team with logo', async () => {
      const logo = await teamService.getTeamLogo('Team Alpha', 'dota2');
      
      expect(logo).toBeDefined();
      expect(logo.originalUrl).toBe('/uploads/team-logos/team-alpha-original.png');
      expect(logo.sizes).toBeDefined();
      expect(logo.sizes.medium).toBe('/uploads/team-logos/team-alpha-64.png');
    });

    it('should return null for team without logo', async () => {
      const logo = await teamService.getTeamLogo('Team Beta', 'dota2');
      
      expect(logo).toBeNull();
    });

    it('should return null for non-existent team', async () => {
      const logo = await teamService.getTeamLogo('Non-existent Team', 'dota2');
      
      expect(logo).toBeNull();
    });

    it('should return null for wrong game', async () => {
      const logo = await teamService.getTeamLogo('Team Alpha', 'cs2');
      
      expect(logo).toBeNull();
    });
  });

  describe('populateTeamLogo', () => {
    it('should populate team with logo information', async () => {
      const teamObj = { name: 'Team Alpha' };
      const populatedTeam = await teamService.populateTeamLogo(teamObj, 'dota2');
      
      expect(populatedTeam.name).toBe('Team Alpha');
      expect(populatedTeam.logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
      expect(populatedTeam.logo).toBeDefined();
    });

    it('should handle team without logo', async () => {
      const teamObj = { name: 'Team Beta', logoUrl: 'old-url.png' };
      const populatedTeam = await teamService.populateTeamLogo(teamObj, 'dota2');
      
      expect(populatedTeam.name).toBe('Team Beta');
      expect(populatedTeam.logoUrl).toBe('old-url.png'); // Should keep existing logoUrl
      expect(populatedTeam.logo).toBeUndefined();
    });

    it('should handle null or undefined team object', async () => {
      const nullResult = await teamService.populateTeamLogo(null, 'dota2');
      const undefinedResult = await teamService.populateTeamLogo(undefined, 'dota2');
      
      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    it('should handle team object without name', async () => {
      const teamObj = { id: 123 };
      const populatedTeam = await teamService.populateTeamLogo(teamObj, 'dota2');
      
      expect(populatedTeam).toEqual(teamObj);
    });
  });

  describe('populateTeamsLogos', () => {
    it('should populate multiple teams with logos', async () => {
      const teams = [
        { name: 'Team Alpha' },
        { name: 'Team Beta' },
        { name: 'Non-existent Team' }
      ];
      
      const populatedTeams = await teamService.populateTeamsLogos(teams, 'dota2');
      
      expect(populatedTeams).toHaveLength(3);
      expect(populatedTeams[0].logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
      expect(populatedTeams[1].logoUrl).toBe('');
      expect(populatedTeams[2].logoUrl).toBe('');
    });

    it('should handle non-array input', async () => {
      const nonArrayResult = await teamService.populateTeamsLogos('not-an-array', 'dota2');
      expect(nonArrayResult).toBe('not-an-array');
    });

    it('should handle empty array', async () => {
      const emptyResult = await teamService.populateTeamsLogos([], 'dota2');
      expect(emptyResult).toEqual([]);
    });
  });

  describe('populateMatchLogos', () => {
    it('should populate match with team logos', async () => {
      const matchObj = {
        game: 'dota2',
        team1: { name: 'Team Alpha' },
        team2: { name: 'Team Beta' }
      };
      
      const populatedMatch = await teamService.populateMatchLogos(matchObj);
      
      expect(populatedMatch.team1.logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
      expect(populatedMatch.team2.logoUrl).toBe('');
    });

    it('should handle match without game', async () => {
      const matchObj = {
        team1: { name: 'Team Alpha' },
        team2: { name: 'Team Beta' }
      };
      
      const populatedMatch = await teamService.populateMatchLogos(matchObj);
      expect(populatedMatch).toEqual(matchObj);
    });

    it('should handle null or undefined match', async () => {
      const nullResult = await teamService.populateMatchLogos(null);
      const undefinedResult = await teamService.populateMatchLogos(undefined);
      
      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    it('should handle Mongoose document with toObject method', async () => {
      const mockMatch = {
        game: 'dota2',
        team1: { name: 'Team Alpha' },
        team2: { name: 'Team Beta' },
        toObject: function() {
          return {
            game: this.game,
            team1: this.team1,
            team2: this.team2
          };
        }
      };
      
      const populatedMatch = await teamService.populateMatchLogos(mockMatch);
      
      expect(populatedMatch.team1.logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
      expect(populatedMatch.team2.logoUrl).toBe('');
    });
  });

  describe('populateMatchesLogos', () => {
    it('should populate multiple matches with logos', async () => {
      const matches = [
        {
          game: 'dota2',
          team1: { name: 'Team Alpha' },
          team2: { name: 'Team Beta' }
        },
        {
          game: 'dota2',
          team1: { name: 'Team Beta' },
          team2: { name: 'Team Alpha' }
        }
      ];
      
      const populatedMatches = await teamService.populateMatchesLogos(matches);
      
      expect(populatedMatches).toHaveLength(2);
      expect(populatedMatches[0].team1.logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
      expect(populatedMatches[1].team2.logoUrl).toBe('/uploads/team-logos/team-alpha-64.png');
    });

    it('should handle non-array input', async () => {
      const nonArrayResult = await teamService.populateMatchesLogos('not-an-array');
      expect(nonArrayResult).toBe('not-an-array');
    });
  });

  describe('getTeamsByGame', () => {
    it('should return teams for specific game', async () => {
      const dota2Teams = await teamService.getTeamsByGame('dota2');
      
      expect(dota2Teams.length).toBeGreaterThanOrEqual(2);
      const dota2TeamNames = dota2Teams.map(team => team.name);
      expect(dota2TeamNames).toContain('Team Alpha');
      expect(dota2TeamNames).toContain('Team Beta');
      
      // Check that all returned teams are dota2 teams
      const dota2OnlyTeams = dota2Teams.filter(team => team.game === 'dota2');
      expect(dota2OnlyTeams.length).toBe(dota2Teams.length);
    });

    it('should return empty array for game with no teams', async () => {
      const cs2Teams = await teamService.getTeamsByGame('cs2');
      expect(cs2Teams).toEqual([]);
    });
  });

  describe('findOrCreateTeam', () => {
    it('should return existing team', async () => {
      const team = await teamService.findOrCreateTeam('Team Alpha', 'dota2');
      
      expect(team._id.toString()).toBe(testTeam1._id.toString());
      expect(team.name).toBe('Team Alpha');
      expect(team.game).toBe('dota2');
    });

    it('should create new team if not exists', async () => {
      const team = await teamService.findOrCreateTeam('New Team', 'cs2');
      
      expect(team).toBeDefined();
      expect(team.name).toBe('New Team');
      expect(team.game).toBe('cs2');
      expect(team._id).toBeDefined();

      // Verify team was saved to database
      const savedTeam = await Team.findById(team._id);
      expect(savedTeam).toBeDefined();
      expect(savedTeam.name).toBe('New Team');
    });
  });

  describe('updateMatchesLogoUrl', () => {
    it('should update matches with new logo URL', async () => {
      const newLogoUrl = '/uploads/team-logos/team-alpha-new-64.png';
      
      const updatedCount = await teamService.updateMatchesLogoUrl('Team Alpha', 'dota2', newLogoUrl);
      
      expect(updatedCount).toBe(1); // Should update 1 match (testMatch)

      // Verify match was updated
      const updatedMatch = await PredictorMatch.findById(testMatch._id);
      expect(updatedMatch.team1.logoUrl).toBe(newLogoUrl);
    });

    it('should update multiple matches for same team', async () => {
      // Create another match with Team Alpha
      await PredictorMatch.create({
        game: 'dota2',
        team1: { name: 'Other Team', logoUrl: '' },
        team2: { name: 'Team Alpha', logoUrl: '' },
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'upcoming',
        predictionTypes: []
      });

      const newLogoUrl = '/uploads/team-logos/team-alpha-new-64.png';
      const updatedCount = await teamService.updateMatchesLogoUrl('Team Alpha', 'dota2', newLogoUrl);
      
      expect(updatedCount).toBe(2); // Should update 2 matches
    });

    it('should not update matches for different game', async () => {
      // Create CS2 match with same team name
      await PredictorMatch.create({
        game: 'cs2',
        team1: { name: 'Team Alpha', logoUrl: '' },
        team2: { name: 'Other Team', logoUrl: '' },
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'upcoming',
        predictionTypes: []
      });

      const newLogoUrl = '/uploads/team-logos/team-alpha-new-64.png';
      const updatedCount = await teamService.updateMatchesLogoUrl('Team Alpha', 'dota2', newLogoUrl);
      
      expect(updatedCount).toBe(1); // Should only update dota2 match
    });

    it('should return 0 for non-existent team', async () => {
      const newLogoUrl = '/uploads/team-logos/non-existent-64.png';
      const updatedCount = await teamService.updateMatchesLogoUrl('Non-existent Team', 'dota2', newLogoUrl);
      
      expect(updatedCount).toBe(0);
    });
  });
});