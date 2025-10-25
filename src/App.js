// App.js

// 1. ДОБАВЛЯЕМ ИМПОРТЫ для Supabase и LoginPage
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';

import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';

import PlayerList from './components/PlayerList';
import AdminPanel from './components/AdminPanel';
import PlayerDetailPage from './components/PlayerDetailPage';
import PickemPage from './components/pickem/PickemPage';
import AdminPickemDashboard from './components/pickem/AdminPickemDashboard';

import './styles/App.css';
import './styles/FilterControls.css';

function App() {
  // 2. ДОБАВЛЯЕМ СОСТОЯНИЕ ДЛЯ СЕССИИ ПОЛЬЗОВАТЕЛЯ
  const [session, setSession] = useState(null);

  // Все твои старые состояния остаются без изменений
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('cybersport-cards')) || []);
  const [pickemEvents, setPickemEvents] = useState(() => JSON.parse(localStorage.getItem('pickem-events')) || []);
  const [userPicks, setUserPicks] = useState(() => JSON.parse(localStorage.getItem('user-picks')) || {});

  const [sortBy, setSortBy] = useState('popularity');
  const [filterByTeam, setFilterByTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // 3. ДОБАВЛЯЕМ useEffect ДЛЯ ПРОВЕРКИ АУТЕНТИФИКАЦИИ
  useEffect(() => {
    // Проверяем текущую сессию при загрузке приложения
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Слушаем изменения: вход, выход из системы
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Отписываемся от слушателя при размонтировании компонента
    return () => subscription.unsubscribe();
  }, []);


  // Все твои старые useEffect и функции (handleAddPlayer и т.д.) остаются без изменений
  useEffect(() => { localStorage.setItem('cybersport-cards', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('pickem-events', JSON.stringify(pickemEvents)); }, [pickemEvents]);
  useEffect(() => { localStorage.setItem('user-picks', JSON.stringify(userPicks)); }, [userPicks]);
  const handleAddPlayer = (p) => setPlayers([...players, { ...p, id: uuidv4(), clicks: 0 }]);
  const handleUpdatePlayer = (up) => setPlayers(players.map(p => p.id === up.id ? up : p));
  const handleDeletePlayer = (id) => setPlayers(players.filter(p => p.id !== id));
  const handleReorderPlayers = (reorderedPlayers) => setPlayers(reorderedPlayers);
  const handleCardClick = (clickedPlayer) => {
    const updatedPlayers = players.map(p => {
      if (p.id === clickedPlayer.id) { return { ...p, clicks: (p.clicks || 0) + 1 }; }
      return p;
    });
    setPlayers(updatedPlayers);
  };
  const handlePlayerSelect = (player) => {
    handleCardClick(player);
    navigate(`/player/${player.id}`);
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
      processedPlayers = processedPlayers.filter(player => player.nickname.toLowerCase().includes(lowercasedQuery) || player.team.toLowerCase().includes(lowercasedQuery));
    }
    if (filterByTeam !== 'All Teams') { processedPlayers = processedPlayers.filter(p => p.team === filterByTeam); }
    switch (sortBy) {
      case 'popularity': processedPlayers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)); break;
      case 'rating_desc': processedPlayers.sort((a, b) => b.ovr - a.ovr); break;
      case 'rating_asc': processedPlayers.sort((a, b) => a.ovr - b.ovr); break;
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
    if (!player) { return <h2>Игрок не найден!</h2>; }
    return <PlayerDetailPage player={player} />;
  };

  const isAnyAdminView = location.pathname.startsWith('/admin');
  const getNavLinkClass = ({ isActive }) => "nav-button" + (isActive ? " active" : "");

  // 4. ДОБАВЛЯЕМ ФУНКЦИЮ ВЫХОДА ИЗ СИСТЕМЫ
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
    else navigate('/'); // После выхода перенаправляем на главную
  };

  return (
    <div className="App">
      <header className="app-header">
        <nav className="main-nav">
          {isAnyAdminView && session ? ( // Показываем админ-ссылки только если мы в админке И залогинены
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

        {/* 5. ИЗМЕНЯЕМ ЛОГИКУ КНОПКИ ВХОДА/ВЫХОДА */}
        {session ? (
          <button className="admin-toggle-button" onClick={handleLogout}>
            Выйти
          </button>
        ) : (
          <button className="admin-toggle-button" onClick={() => navigate('/login')}>
            Войти
          </button>
        )}
      </header>
      
      <main className="main-content">
        {/* 6. ИЗМЕНЯЕМ РОУТИНГ */}
        <Routes>
          {/* Публичные роуты остаются как есть */}
          <Route path="/" element={
            <>
              <div className="filter-container">
                 <div className="search-wrapper">
                   <input type="text" placeholder="Поиск по нику или команде..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              <PlayerList players={filteredAndSortedPlayers} onPlayerSelect={handlePlayerSelect} />
            </>
          } />
          <Route path="/player/:playerId" element={<PlayerDetailWrapper />} />
          <Route path="/pickem" element={<PickemPage events={pickemEvents} userPicks={userPicks} onPick={handleUserPick} />} />
          
          {/* Добавляем роут для страницы входа */}
          <Route path="/login" element={<LoginPage />} />

          {/* ЗАЩИЩЕННЫЕ РОУТЫ: если нет сессии, показываем LoginPage, иначе - нужный компонент */}
          <Route 
            path="/admin/cards" 
            element={!session ? <LoginPage /> : <AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} />} 
          />
          <Route 
            path="/admin/pickem" 
            element={!session ? <LoginPage /> : <AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;