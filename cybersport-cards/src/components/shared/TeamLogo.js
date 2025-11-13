import React, { useState, useEffect, useRef } from 'react';
import logoService from '../../services/logoService';
import './TeamLogo.css';

/**
 * TeamLogo Component - Displays team logos with fallback to text
 * Implements requirements 3.1, 3.2, 3.4, 4.4 for responsive display and fallback handling
 */
const TeamLogo = ({
  teamId,
  teamName,
  size = 'medium', // small (32px), medium (64px), large (128px)
  showFallback = true,
  className = '',
  onClick = null,
  style = {},
  alt = null
}) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const mountedRef = useRef(true);

  // Size mappings for CSS classes and pixel values
  const sizeMap = {
    small: { class: 'team-logo--small', pixels: 32 },
    medium: { class: 'team-logo--medium', pixels: 64 },
    large: { class: 'team-logo--large', pixels: 128 }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const loadLogo = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const logoData = await logoService.getTeamLogo(teamId, size, true); // Prefer WebP
        
        if (mountedRef.current) {
          if (logoData && logoData.url) {
            setLogoUrl(logoData.url);
            setFallbackUrl(logoData.fallbackUrl); // Store PNG fallback
            setHasError(false);
            setTriedFallback(false);
          } else {
            setLogoUrl(null);
            setFallbackUrl(null);
            setHasError(true);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.warn(`Error loading logo for team ${teamId}:`, error);
          setLogoUrl(null);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadLogo();
  }, [teamId, size]);

  const handleImageError = () => {
    // Try fallback URL if WebP fails and we haven't tried it yet
    if (fallbackUrl && !triedFallback && logoUrl !== fallbackUrl) {
      setTriedFallback(true);
      setLogoUrl(fallbackUrl);
    } else {
      setHasError(true);
      setLogoUrl(null);
    }
  };

  const handleImageLoad = () => {
    setHasError(false);
  };

  const handleMouseEnter = () => {
    if (teamName) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, { teamId, teamName, logoUrl });
    }
  };

  // Generate CSS classes
  const cssClasses = [
    'team-logo',
    currentSize.class,
    className,
    isLoading ? 'team-logo--loading' : '',
    hasError ? 'team-logo--error' : '',
    logoUrl ? 'team-logo--has-image' : '',
    onClick ? 'team-logo--clickable' : ''
  ].filter(Boolean).join(' ');

  // Render loading placeholder
  if (isLoading) {
    return (
      <div 
        className={cssClasses}
        style={style}
        title={teamName}
      >
        <div className="team-logo__placeholder">
          <div className="team-logo__spinner"></div>
        </div>
      </div>
    );
  }

  // Render logo image if available
  if (logoUrl && !hasError) {
    return (
      <div 
        className={cssClasses}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <img
          src={logoUrl}
          alt={alt || `${teamName} logo`}
          className="team-logo__image"
          onError={handleImageError}
          onLoad={handleImageLoad}
          draggable={false}
        />
        {showTooltip && teamName && (
          <div className="team-logo__tooltip">
            {teamName}
          </div>
        )}
      </div>
    );
  }

  // Render fallback (text or empty if showFallback is false)
  if (showFallback && teamName) {
    // Generate initials from team name (max 3 characters)
    const initials = teamName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);

    return (
      <div 
        className={cssClasses}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={teamName}
      >
        <div className="team-logo__fallback">
          <span className="team-logo__initials">
            {initials}
          </span>
        </div>
        {showTooltip && (
          <div className="team-logo__tooltip">
            {teamName}
          </div>
        )}
      </div>
    );
  }

  // Render empty placeholder if no fallback
  return (
    <div 
      className={cssClasses}
      style={style}
      title={teamName || 'Team logo not available'}
    >
      <div className="team-logo__empty">
        <span className="team-logo__empty-icon">?</span>
      </div>
    </div>
  );
};

export default TeamLogo;