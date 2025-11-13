import React from 'react';
import TeamLogo from '../shared/TeamLogo';
import '../../styles/MatchCard.css';

const MatchCard = ({ match, onClick }) => {
  // Check if match is starting soon (within 10 minutes)
  const isStartingSoon = (startTime) => {
    const now = new Date();
    const matchTime = new Date(startTime);
    const diffMinutes = (matchTime - now) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 10;
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = { day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return {
      date: date.toLocaleDateString('ru-RU', dateOptions),
      time: date.toLocaleTimeString('ru-RU', timeOptions)
    };
  };

  // Get game display name
  const getGameName = (game) => {
    return game === 'dota2' ? 'Dota 2' : game === 'cs2' ? 'CS2' : game;
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Доступно для ставок';
      case 'live':
        return 'Идет матч';
      case 'draft_phase':
        return 'Идет драфт';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const { date, time } = formatDateTime(match.startTime);
  const startingSoon = isStartingSoon(match.startTime);

  return (
    <div
      className={`predictor-match-card ${startingSoon ? 'starting-soon' : ''}`}
      onClick={() => onClick(match._id)}
    >
      {startingSoon && (
        <div className="starting-soon-badge">
          Скоро начнется
        </div>
      )}

      <div className="match-game-badge">
        {getGameName(match.game)}
      </div>

      <div className="match-teams">
        <div className="team">
          <div className="team-logo-wrapper">
            <TeamLogo
              teamId={match.team1._id}
              teamName={match.team1.name}
              size="large"
              showFallback={true}
              className="predictor-team-logo"
            />
          </div>
          <span className="team-name">{match.team1.name}</span>
        </div>

        <div className="vs-divider">VS</div>

        <div className="team">
          <div className="team-logo-wrapper">
            <TeamLogo
              teamId={match.team2._id}
              teamName={match.team2.name}
              size="large"
              showFallback={true}
              className="predictor-team-logo"
            />
          </div>
          <span className="team-name">{match.team2.name}</span>
        </div>
      </div>

      <div className="match-time">
        <div className="match-date">{date}</div>
        <div className="match-clock">{time}</div>
      </div>

      <div className="match-status">
        {getStatusText(match.status)}
      </div>
    </div>
  );
};

export default MatchCard;
