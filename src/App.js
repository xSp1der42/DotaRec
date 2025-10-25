import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';

import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import PlayerList from './components/PlayerList';
import AdminPanel from './components/AdminPanel';
import PlayerDetailPage from './components/PlayerDetailPage';
import PickemPage from './components/pickem/PickemPage';
import AdminPickemDashboard from './components/pickem/AdminPickemDashboard';

import './styles/App.css';
import './styles/FilterControls.css';

function App() {
  const [session, setSession] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [players, setPlayers] = useState([]);
  const [pickemEvents, setPickemEvents] = useState(() => JSON.parse(localStorage.getItem('pickem-events')) || []);
  const [userPicks, setUserPicks] = useState(() => JSON.parse(localStorage.getItem('user-picks')) || {});
  const [sortBy, setSortBy] = useState('popularity');
  const [filterByTeam, setFilterByTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase.from('players').select('*');
    if (error) console.error('Ошибка при загрузке игроков:', error);
    else setPlayers(data || []);
  }, []);

  useEffect(() => {
    setLoadingApp(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchPlayers();
      setLoadingApp(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, [fetchPlayers]);

  useEffect(() => { localStorage.setItem('pickem-events', JSON.stringify(pickemEvents)); }, [pickemEvents]);
  useEffect(() => { localStorage.setItem('user-picks', JSON.stringify(userPicks)); }, [userPicks]);

  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗДЕСЬ ---
  const uploadPlayerImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = fileName;

    const { error } = await supabase.storage.from('player_avatars').upload(filePath, file);
    if (error) {
      console.error('Ошибка загрузки изображения:', error);
      return null;
    }

    // Эта строка получает ПОЛНУЮ ПУБЛИЧНУЮ ССЫЛКУ
    const { data } = supabase.storage.from('player_avatars').getPublicUrl(filePath);
    
    // И мы возвращаем именно ее!
    return data.publicUrl;
  };

  const handleAddPlayer = async (playerData, imageFile) => {
    const imageUrl = await uploadPlayerImage(imageFile);
    delete playerData.image;
    const newPlayerData = { ...playerData, id: uuidv4(), clicks: 0, image_url: imageUrl };
    const { data, error } = await supabase.from('players').insert(newPlayerData).select().single();
    if (error) {
      console.error('Ошибка при добавлении игрока:', error);
    } else if (data) {
      setPlayers(prev => [...prev, data]);
    }
  };

  const handleUpdatePlayer = async (updatedPlayerData, imageFile) => {
    let imageUrl = updatedPlayerData.image_url;
    if (imageFile) {
      imageUrl = await uploadPlayerImage(imageFile);
    }
    delete updatedPlayerData.image;
    const finalPlayerData = { ...updatedPlayerData, image_url: imageUrl };
    const { data, error } = await supabase.from('players').update(finalPlayerData).eq('id', finalPlayerData.id).select().single();
    if (error) {
      console.error('Ошибка при обновлении игрока:', error);
    } else if (data) {
      setPlayers(prev => prev.map(p => (p.id === data.id ? data : p)));
    }
  };

  const handleDeletePlayer = async (playerId) => {
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) {
      console.error('Ошибка при удалении игрока:', error);
    } else {
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    }
  };

  const handleReorderPlayers = (reorderedPlayers) => {
    setPlayers(reorderedPlayers);
  };

  const handleCardClick = async (clickedPlayer) => {
    const newClicks = (clickedPlayer.clicks || 0) + 1;
    setPlayers(prevPlayers => prevPlayers.map(p => p.id === clickedPlayer.id ? { ...p, clicks: newClicks } : p));
    const { error } = await supabase.from('players').update({ clicks: newClicks }).eq('id', clickedPlayer.id);
    if (error) {
      console.error('Ошибка при обновлении кликов:', error);
      setPlayers(prevPlayers => prevPlayers.map(p => p.id === clickedPlayer.id ? { ...p, clicks: clickedPlayer.clicks } : p));
    }
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
      processedPlayers = processedPlayers.filter(player =>
        (player.nickname && player.nickname.toLowerCase().includes(lowercasedQuery)) ||
        (player.team && player.team.toLowerCase().includes(lowercasedQuery))
      );
    }
    if (filterByTeam !== 'All Teams') {
      processedPlayers = processedPlayers.filter(p => p.team === filterByTeam);
    }
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
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  
  if (loadingApp) {
    return <div className="App"><header className="app-header"><h2>Загрузка...</h2></header></div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <nav className="main-nav">
          {isAnyAdminView && session ? (
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
        {session ? (
          <button className="admin-toggle-button" onClick={handleLogout}>Выйти</button>
        ) : (
          <button className="admin-toggle-button" onClick={() => navigate('/login')}>Войти</button>
        )}
      </header>
      <main className="main-content">
        <Routes>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/cards" element={session ? <AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} /> : <LoginPage />} />
          <Route path="/admin/pickem" element={session ? <AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} /> : <LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;