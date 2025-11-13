const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Team = require('../models/teamModel');
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  logoUpload, 
  handleMulterError, 
  validateFileExists 
} = require('../middleware/fileValidation');
const imageProcessingService = require('../services/imageProcessingService');
const teamService = require('../services/teamService');

const router = express.Router();

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads/team-logos');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('Created team-logos directory');
  }
};

// Initialize uploads directory
ensureUploadsDir();

/**
 * @route   POST /api/admin/teams/:teamId/logo
 * @desc    Upload logo for a specific team (Admin only)
 * @access  Private/Admin
 */
router.post('/admin/teams/:teamId/logo', 
  protect, 
  admin,
  logoUpload.single('logo'),
  handleMulterError,
  validateFileExists,
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const uploadedFile = req.file;

      // Validate team exists
      const team = await Team.findById(teamId);
      if (!team) {
        // Clean up uploaded file if team doesn't exist
        await imageProcessingService.cleanupFiles([uploadedFile.path]);
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Validate uploaded image
      const imageMetadata = await imageProcessingService.validateImage(uploadedFile.path);

      // Generate multiple sizes
      const generatedFiles = await imageProcessingService.generateLogoSizes(
        uploadedFile.path, 
        teamId
      );

      // Get URL paths for the generated files
      const logoUrls = imageProcessingService.getLogoUrls(generatedFiles);

      // Clean up old logo files if they exist (including WebP versions)
      if (team.logo && team.logo.originalUrl) {
        const oldFiles = imageProcessingService.getCleanupPaths(team.logo);
        await imageProcessingService.cleanupFiles(oldFiles);
      }

      // Update team with new logo information including WebP versions
      team.logo = {
        originalUrl: logoUrls.original,
        sizes: {
          small: logoUrls.small,
          medium: logoUrls.medium,
          large: logoUrls.large
        },
        webp: {
          small: logoUrls.webp.small,
          medium: logoUrls.webp.medium,
          large: logoUrls.webp.large
        },
        uploadedAt: new Date(),
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.mimetype
      };

      await team.save();

      // Update predictor matches with new logo URL for backward compatibility
      const logoUrl = logoUrls.medium || logoUrls.original;
      await teamService.updateMatchesLogoUrl(team.name, team.game, logoUrl);

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        team: {
          id: team._id,
          name: team.name,
          game: team.game,
          logo: team.logo
        }
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        await imageProcessingService.cleanupFiles([req.file.path]);
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload logo'
      });
    }
  }
);

/**
 * @route   GET /api/admin/teams/logos
 * @desc    Get all teams with their logo information (Admin only)
 * @access  Private/Admin
 */
router.get('/admin/teams/logos', protect, admin, async (req, res) => {
  try {
    const { game } = req.query;
    
    // Build query filter
    const filter = {};
    if (game && ['dota2', 'cs2'].includes(game)) {
      filter.game = game;
    }

    const teams = await Team.find(filter)
      .select('name game logo createdAt updatedAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      teams: teams
    });

  } catch (error) {
    console.error('Error fetching teams with logos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams'
    });
  }
});

/**
 * @route   DELETE /api/admin/teams/:teamId/logo
 * @desc    Delete logo for a specific team (Admin only)
 * @access  Private/Admin
 */
router.delete('/admin/teams/:teamId/logo', protect, admin, async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!team.logo || !team.logo.originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Team has no logo to delete'
      });
    }

    // Collect all logo files to delete (including WebP versions)
    const filesToDelete = imageProcessingService.getCleanupPaths(team.logo);

    // Clean up logo files
    await imageProcessingService.cleanupFiles(filesToDelete);

    // Remove logo information from team
    team.logo = undefined;
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully',
      team: {
        id: team._id,
        name: team.name,
        game: team.game
      }
    });

  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete logo'
    });
  }
});

/**
 * @route   GET /api/teams/:teamId/logo
 * @desc    Get logo information for a specific team with WebP support (Public access)
 * @access  Public
 */
router.get('/teams/:teamId/logo', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { size = 'medium', format } = req.query;

    const team = await Team.findById(teamId).select('name game logo');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!team.logo || !team.logo.originalUrl) {
      return res.status(404).json({
        success: false,
        message: 'Team has no logo',
        team: {
          id: team._id,
          name: team.name,
          game: team.game
        }
      });
    }

    // Determine format preference (WebP for modern browsers)
    const acceptsWebP = req.headers.accept && req.headers.accept.includes('image/webp');
    const useWebP = (format === 'webp' || acceptsWebP) && team.logo.webp && team.logo.webp[size];

    // Determine which logo URL to return based on size and format
    let logoUrl = team.logo.originalUrl;
    let webpUrl = null;

    if (size && team.logo.sizes && team.logo.sizes[size]) {
      logoUrl = team.logo.sizes[size];
    }

    if (useWebP) {
      webpUrl = team.logo.webp[size];
    }

    // Set caching headers for performance (requirement 5.1)
    res.set({
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000', // 1 day browser, 1 year CDN
      'ETag': `"${team.logo.uploadedAt.getTime()}-${size}"`,
      'Last-Modified': team.logo.uploadedAt.toUTCString(),
      'Vary': 'Accept' // Vary on Accept header for WebP negotiation
    });

    res.status(200).json({
      success: true,
      team: {
        id: team._id,
        name: team.name,
        game: team.game,
        logo: {
          url: webpUrl || logoUrl, // Prefer WebP if available and supported
          fallbackUrl: logoUrl, // Always provide PNG fallback
          sizes: team.logo.sizes,
          webp: team.logo.webp,
          uploadedAt: team.logo.uploadedAt,
          supportsWebP: !!webpUrl
        }
      }
    });

  } catch (error) {
    console.error('Error fetching team logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team logo'
    });
  }
});

module.exports = router;