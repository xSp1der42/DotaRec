import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';

import { supabase } from './services/supabaseClient';
import { useAuth } from './context/AuthContext';

// Компоненты
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PlayerList from './components/cards/PlayerList';
import AdminPanel from './components/admin/AdminPanel';
import ShopPage from './components/shop/ShopPage';
import AdminPacks from './components/admin/AdminPacks';
import PickemPage from './components/pickem/PickemPage';
import AdminPickemDashboard from './components/admin/AdminPickemDashboard';
import MiniGamePage from './components/minigame/MiniGamePage';
import FilterControls from './components/shared/FilterControls';

// Страницы
import PlayerDetailPage from './pages/PlayerDetailPage';
import ProfilePage from './pages/ProfilePage';

// Стили
import './styles/App.css';

function App() {
  const { session, profile, isAdmin, updateProfile, loading } = useAuth();
  const [players, setPlayers] = useState([]);
  const [packs, setPacks] = useState(() => {
    try {
      const savedPacks = localStorage.getItem('packs');
      return savedPacks ? JSON.parse(savedPacks) : [];
    } catch (error) {
      return [];
    }
  });

  const [pickemEvents, setPickemEvents] = useState([]);
  const [userPicks, setUserPicks] = useState({});

  const [sortBy, setSortBy] = useState('popularity');
  const [filterByTeam, setFilterByTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const fetchPublicData = useCallback(async () => {
    try {
      const { data: playersData, error: playersError } = await supabase.from('players').select('*');
      if (playersError) throw playersError;
      setPlayers(playersData || []);

      const { data: eventsData, error: eventsError } = await supabase.from('pickem_events').select('*');
      if (eventsError) throw eventsError;
      setPickemEvents(eventsData || []);
    } catch (error) {
      console.error('Ошибка при загрузке публичных данных:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPublicData();
    }
  }, [loading, fetchPublicData]);

  useEffect(() => {
    if (session?.user) {
      const fetchUserPicks = async () => {
        const { data, error } = await supabase
          .from('user_picks')
          .select('event_id, picks')
          .eq('user_id', session.user.id);

        if (error) {
          console.error("Ошибка при загрузке прогнозов:", error);
        } else {
          const picksMap = data.reduce((acc, pick) => {
            acc[pick.event_id] = pick.picks;
            return acc;
          }, {});
          setUserPicks(picksMap);
        }
      };
      fetchUserPicks();
    } else {
      setUserPicks({});
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('packs', JSON.stringify(packs));
  }, [packs]);

  const handleAddCoins = async (amount) => {
    const numericAmount = parseInt(amount, 10);
    if (!profile || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Пожалуйста, войдите в аккаунт и введите корректное число.");
      return;
    }
    const newBalance = (profile.coins || 0) + numericAmount;
    const updatedProfile = await updateProfile({ coins: newBalance });
    if (updatedProfile) {
      alert(`${numericAmount.toLocaleString('ru-RU')} коинов успешно добавлено!`);
    } else {
      alert('Не удалось обновить баланс.');
    }
  };

  const uploadPlayerImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { error } = await supabase.storage.from('player_avatars').upload(fileName, file);
    if (error) {
      console.error('Ошибка загрузки изображения:', error);
      return null;
    }
    return fileName;
  };

  const handleAddPlayer = async (playerData, imageFile) => {
    const imagePath = await uploadPlayerImage(imageFile);
    delete playerData.id;
    const newPlayerData = { ...playerData, clicks: 0, image_url: imagePath };
    const { data, error } = await supabase.from('players').insert(newPlayerData).select().single();
    if (error) alert(`Не удалось создать карточку: ${error.message}`);
    else if (data) setPlayers(prev => [...prev, data]);
  };

  const handleUpdatePlayer = async (updatedPlayerData, imageFile) => {
    let imagePath = updatedPlayerData.image_url;
    if (imageFile) imagePath = await uploadPlayerImage(imageFile);
    const finalPlayerData = { ...updatedPlayerData, image_url: imagePath };
    const { data, error } = await supabase.from('players').update(finalPlayerData).eq('id', finalPlayerData.id).select().single();
    if (error) alert(`Не удалось обновить карточку: ${error.message}`);
    else if (data) setPlayers(prev => prev.map(p => (p.id === data.id ? data : p)));
  };

  const handleDeletePlayer = async (playerId) => {
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) alert(`Не удалось удалить карточку: ${error.message}`);
    else setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
  };

  const handleReorderPlayers = (reorderedPlayers) => setPlayers(reorderedPlayers);

  const handleCardClick = async (clickedPlayer) => {
    const newClicks = (clickedPlayer.clicks || 0) + 1;
    await supabase.from('players').update({ clicks: newClicks }).eq('id', clickedPlayer.id);
  };

  const handlePlayerSelect = (player) => {
    handleCardClick(player);
    navigate(`/player/${player.id}`);
  };

  const handleOpenPack = async (packId) => {
    const pack = packs.find(p => p.id === packId);
    if (!profile || !pack || profile.coins < pack.price) {
      alert("Недостаточно коинов или вы не авторизованы!");
      return null;
    }
    
    const newBalance = profile.coins - pack.price;
    const pool = players.filter(p => pack.playerPool.includes(p.id));
    if (pool.length < pack.cardsInPack) return [];

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const revealedCards = shuffled.slice(0, pack.cardsInPack);
    const revealedCardIds = revealedCards.map(c => c.id);
    const newCollection = [...(profile.collection || []), ...revealedCardIds];

    const updatedProfile = await updateProfile({ coins: newBalance, collection: newCollection });
    if (updatedProfile) return revealedCards;

    return null;
  };

  const handleAddEvent = async (title) => {
    const { data, error } = await supabase.from('pickem_events').insert({ title, matches: [] }).select().single();
    if (error) console.error(error);
    else setPickemEvents(prev => [...prev, data]);
  };
  const handleDeleteEvent = async (id) => {
    const { error } = await supabase.from('pickem_events').delete().eq('id', id);
    if (error) console.error(error);
    else setPickemEvents(prev => prev.filter(e => e.id !== id));
  };
  const handleSaveMatch = async (eventId, matchData) => {
    const event = pickemEvents.find(e => e.id === eventId);
    if (!event) return;
    const matchExists = event.matches.some(m => m.id === matchData.id);
    const updatedMatches = matchExists ? event.matches.map(m => m.id === matchData.id ? matchData : m) : [...event.matches, { ...matchData, id: uuidv4() }];
    const { data, error } = await supabase.from('pickem_events').update({ matches: updatedMatches }).eq('id', eventId).select().single();
    if (error) console.error(error);
    else setPickemEvents(prev => prev.map(e => e.id === data.id ? data : e));
  };
  const handleDeleteMatch = async (eventId, matchId) => {
    const event = pickemEvents.find(e => e.id === eventId);
    if (!event) return;
    const updatedMatches = event.matches.filter(m => m.id !== matchId);
    const { data, error } = await supabase.from('pickem_events').update({ matches: updatedMatches }).eq('id', eventId).select().single();
    if (error) console.error(error);
    else setPickemEvents(prev => prev.map(e => e.id === data.id ? data : e));
  };

  const handleUserPick = async (eventId, matchId, team) => {
    if (!profile) { alert("Войдите, чтобы сделать прогноз!"); return; }
    
    const currentEventPicks = userPicks[eventId] || {};
    const updatedPicks = { ...currentEventPicks, [matchId]: team };

    const { error } = await supabase.from('user_picks').upsert({
        user_id: profile.id,
        event_id: eventId,
        picks: updatedPicks
    }, { onConflict: 'user_id, event_id' });

    if (error) console.error("Ошибка сохранения прогноза:", error);
    else setUserPicks(prev => ({ ...prev, [eventId]: updatedPicks }));
  };

  const filteredAndSortedPlayers = useMemo(() => {
    let processedPlayers = [...players];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      processedPlayers = processedPlayers.filter(p => p.nickname?.toLowerCase().includes(q) || p.team?.toLowerCase().includes(q));
    }
    if (filterByTeam !== 'All Teams') {
      processedPlayers = processedPlayers.filter(p => p.team === filterByTeam);
    }
    processedPlayers.sort((a, b) => {
      switch (sortBy) {
        case 'popularity': return (b.clicks || 0) - (a.clicks || 0);
        case 'rating_desc': return b.ovr - a.ovr;
        case 'rating_asc': return a.ovr - b.ovr;
        default: return 0;
      }
    });
    return processedPlayers;
  }, [players, sortBy, filterByTeam, searchQuery]);

  const uniqueTeams = useMemo(() => ['All Teams', ...Array.from(new Set(players.map(p => p.team).filter(Boolean))).sort()], [players]);

  const PlayerDetailWrapper = () => {
    const { playerId } = useParams();
    const player = players.find(p => p.id.toString() === playerId);
    return player ? <PlayerDetailPage player={player} /> : <h2>Игрок не найден!</h2>;
  };

  const getNavLinkClass = ({ isActive }) => "nav-button" + (isActive ? " active" : "");
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px', backgroundColor: '#1a1a21', color: 'white' }}>Загрузка...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <nav className="main-nav">
          <NavLink to="/" end className={getNavLinkClass}>Карточки</NavLink>
          <NavLink to="/shop" className={getNavLinkClass}>Магазин</NavLink>
          <NavLink to="/pickem" className={getNavLinkClass}>Pick'em</NavLink>
          <NavLink to="/minigame" className={getNavLinkClass}>Мини-игры</NavLink>
        </nav>
        <div className="header-right">
          {profile && <NavLink to="/profile" className="nav-button user-profile-link">Профиль</NavLink>}
          <div className="user-coins">{profile ? `${profile.coins.toLocaleString('ru-RU')} коинов` : ''}</div>
          {session ? (
            <>
              {isAdmin && <NavLink to="/admin/cards" className="admin-toggle-button">Админ</NavLink>}
              <button className="logout-button" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <NavLink to="/login" className="login-button">Войти</NavLink>
          )}
        </div>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <>
              <FilterControls
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterByTeam={filterByTeam}
                setFilterByTeam={setFilterByTeam}
                uniqueTeams={uniqueTeams}
              />
              <PlayerList players={filteredAndSortedPlayers} onPlayerSelect={handlePlayerSelect} />
            </>
          } />
          <Route path="/player/:playerId" element={<PlayerDetailWrapper />} />
          <Route path="/shop" element={<ShopPage packs={packs} userCoins={profile?.coins || 0} onOpenPack={handleOpenPack} onAddCoins={handleAddCoins} />} />
          <Route path="/pickem" element={<PickemPage events={pickemEvents} userPicks={userPicks} onPick={handleUserPick} />} />
          <Route path="/minigame" element={<MiniGamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Админка */}
          <Route path="/admin" element={<ProtectedRoute />}>
              <Route path="cards" element={<AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} />} />
              <Route path="packs" element={<AdminPacks packs={packs} players={players} onAddPack={(pack) => setPacks(prev => [...prev, pack])} onUpdatePack={(pack) => setPacks(prev => prev.map(p => p.id === pack.id ? pack : p))} onDeletePack={(id) => setPacks(prev => prev.filter(p => p.id !== id))} onAddCoins={handleAddCoins} />} />
              <Route path="pickem" element={<AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;