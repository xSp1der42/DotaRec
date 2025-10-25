// App.js

import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
// useNavigate уже импортирован, это хорошо
import { Routes, Route, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';

import PlayerList from './components/PlayerList';
import AdminPanel from './components/AdminPanel';
import PlayerDetailPage from './components/PlayerDetailPage';
import PickemPage from './components/pickem/PickemPage';
import AdminPickemDashboard from './components/pickem/AdminPickemDashboard';

import './styles/App.css';
import './styles/FilterControls.css';

function App() {
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('cybersport-cards')) || []);
  const [pickemEvents, setPickemEvents] = useState(() => JSON.parse(localStorage.getItem('pickem-events')) || []);
  const [userPicks, setUserPicks] = useState(() => JSON.parse(localStorage.getItem('user-picks')) || {});

  const [sortBy, setSortBy] = useState('popularity');
  const [filterByTeam, setFilterByTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { localStorage.setItem('cybersport-cards', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('pickem-events', JSON.stringify(pickemEvents)); }, [pickemEvents]);
  useEffect(() => { localStorage.setItem('user-picks', JSON.stringify(userPicks)); }, [userPicks]);

  const handleAddPlayer = (p) => setPlayers([...players, { ...p, id: uuidv4(), clicks: 0 }]);
  const handleUpdatePlayer = (up) => setPlayers(players.map(p => p.id === up.id ? up : p));
  const handleDeletePlayer = (id) => setPlayers(players.filter(p => p.id !== id));
  const handleReorderPlayers = (reorderedPlayers) => setPlayers(reorderedPlayers);

  // Эта функция остаётся, она правильно обновляет клики
  const handleCardClick = (clickedPlayer) => {
    const updatedPlayers = players.map(p => {
      if (p.id === clickedPlayer.id) {
        return { ...p, clicks: (p.clicks || 0) + 1 };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };
  
  // ИЗМЕНЕНИЕ: Создаем новую функцию для навигации
  const handlePlayerSelect = (player) => {
    handleCardClick(player); // Сначала обновляем клики
    navigate(`/player/${player.id}`); // Затем переходим на страницу игрока
  };

  const handleAddEvent = (title) => setPickemEvents([...pickemEvents, { id: uuidv4(), title, matches: [] }]);
  const handleDeleteEvent = (id) => setPickemEvents(pickemEvents.filter(e => e.id !== id));
  const handleSaveMatch = (eventId, matchData) => {
    setPickemEvents(prevEvents => prevEvents.map(event => {
      if (event.id === eventId) {
        const matchExists = event.matches.some(m => m.id === matchData.id);
        const updatedMatches = matchExists ? event.matches.map(m => m.id === matchData.id ? matchData : m) : [...event.matches, { ...matchData, id: uuidv4() }];
        return { ...event, matches: updatedMatches };
      }
      return event;
    }));
  };
  const handleDeleteMatch = (eventId, matchId) => setPickemEvents(prev => prev.map(e => e.id === eventId ? { ...e, matches: e.matches.filter(m => m.id !== matchId) } : e));
  const handleUserPick = (matchId, team) => setUserPicks({ ...userPicks, [matchId]: team });

  const filteredAndSortedPlayers = useMemo(() => {
    let processedPlayers = [...players];
    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      processedPlayers = processedPlayers.filter(player =>
        player.nickname.toLowerCase().includes(lowercasedQuery) ||
        player.team.toLowerCase().includes(lowercasedQuery)
      );
    }
    if (filterByTeam !== 'All Teams') {
      processedPlayers = processedPlayers.filter(p => p.team === filterByTeam);
    }
    switch (sortBy) {
      case 'popularity':
        processedPlayers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
        break;
      case 'rating_desc':
        processedPlayers.sort((a, b) => b.ovr - a.ovr);
        break;
      case 'rating_asc':
        processedPlayers.sort((a, b) => a.ovr - b.ovr);
        break;
      default: break;
    }
    return processedPlayers;
  }, [players, sortBy, filterByTeam, searchQuery]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set(players.map(p => p.team).filter(Boolean));
    return ['All Teams', ...Array.from(teams).sort()];
  }, [players]);

  const PlayerDetailWrapper = () => {
    const { playerId } = useParams();
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return <h2>Игрок не найден!</h2>;
    }
    return <PlayerDetailPage player={player} />;
  };

  const isAnyAdminView = location.pathname.startsWith('/admin');
  const getNavLinkClass = ({ isActive }) => "nav-button" + (isActive ? " active" : "");

  return (
    <div className="App">
      <header className="app-header">
        <nav className="main-nav">
          {isAnyAdminView ? (
            <>
              <NavLink to="/admin/cards" className={getNavLinkClass}>Админка: Карточки</NavLink>
              <NavLink to="/admin/pickem" className={getNavLinkClass}>Админка: Pick'em</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end className={getNavLinkClass}>Карточки</NavLink>
              <NavLink to="/pickem" className={getNavLinkClass}>Pick'em</NavLink>
            </>
          )}
        </nav>

        <button className="admin-toggle-button" onClick={() => navigate(isAnyAdminView ? '/' : '/admin/cards')}>
          {isAnyAdminView ? 'Выйти' : 'Войти в админку'}
        </button>
      </header>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <>
              <div className="filter-container">
                {/* ... фильтры остаются без изменений ... */}
                 <div className="search-wrapper">
                   <input
                      type="text"
                      placeholder="Поиск по нику или команде..."
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                  <span className="filter-label">Сортировать:</span>
                  <button onClick={() => setSortBy('popularity')} className={`sort-button ${sortBy === 'popularity' ? 'active' : ''}`}>По популярности</button>
                  <button onClick={() => setSortBy('rating_desc')} className={`sort-button ${sortBy === 'rating_desc' ? 'active' : ''}`}>По рейтингу (убыв.)</button>
                  <button onClick={() => setSortBy('rating_asc')} className={`sort-button ${sortBy === 'rating_asc' ? 'active' : ''}`}>По рейтингу (возр.)</button>
                </div>
                <div className="filter-group">
                  <label htmlFor="team-select" className="filter-label">По командам:</label>
                  <select id="team-select" className="team-select" value={filterByTeam} onChange={(e) => setFilterByTeam(e.target.value)}>
                    {uniqueTeams.map(team => (<option key={team} value={team}>{team}</option>))}
                  </select>
                </div>
              </div>
              {/* ИЗМЕНЕНИЕ: Передаем новую функцию onPlayerSelect вместо onCardClick */}
              <PlayerList players={filteredAndSortedPlayers} onPlayerSelect={handlePlayerSelect} />
            </>
          } />
          <Route path="/player/:playerId" element={<PlayerDetailWrapper />} />
          <Route path="/pickem" element={<PickemPage events={pickemEvents} userPicks={userPicks} onPick={handleUserPick} />} />
          <Route path="/admin/cards" element={<AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} />} />
          <Route path="/admin/pickem" element={<AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;