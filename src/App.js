// src/App.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route, NavLink, useNavigate, useParams, Navigate } from 'react-router-dom';
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
import Loader from './components/shared/Loader';

// Страницы
import PlayerDetailPage from './pages/PlayerDetailPage';
import ProfilePage from './pages/ProfilePage';

// Layout
import AdminLayout from './components/admin/AdminLayout';

// Стили
import './styles/App.css';

function App() {
  const { session, profile, isAdmin, updateProfile, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState([]);
  const [packs, setPacks] = useState([]);
  const [pickemEvents, setPickemEvents] = useState([]);
  const [userPicks, setUserPicks] = useState({});
  const [appLoading, setAppLoading] = useState(true);

  const [sortBy, setSortBy] = useState('popularity');
  const [filterByTeam, setFilterByTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // === Универсальная и отказоустойчивая загрузка данных ===
  const fetchData = useCallback(() => {
    setAppLoading(true);

    const fetchCoreData = async () => {
      // Используем Promise.all для параллельной загрузки
      const [playersRes, eventsRes, packsRes] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('pickem_events').select('*'),
        supabase.from('packs').select('*'),
      ]);

      if (playersRes.error) throw playersRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (packsRes.error) throw packsRes.error;

      setPlayers(playersRes.data || []);
      setPickemEvents(eventsRes.data || []);
      setPacks(packsRes.data || []);
    };

    // Оборачиваем загрузку в Promise.race с таймаутом, чтобы избежать "зависшей" загрузки
    Promise.race([
      fetchCoreData(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Загрузка публичных данных заняла слишком много времени')), 8000)
      )
    ]).catch(error => {
      console.warn('Проблема при загрузке данных приложения:', error.message);
    }).finally(() => {
      setAppLoading(false);
    });
  }, []);

  // === Подгружаем данные сразу после запуска ===
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === Прогнозы пользователя ===
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

  // === Баланс и обновления профиля ===
  const handleAddCoins = async (amount) => {
    const numericAmount = parseInt(amount, 10);
    if (!profile || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Пожалуйста, войдите в аккаунт и введите корректное число.");
      return;
    }
    const newBalance = (profile.coins || 0) + numericAmount;
    const updated = await updateProfile({ coins: newBalance });
    if (updated) {
      alert(`${numericAmount.toLocaleString('ru-RU')} коинов успешно добавлено!`);
    } else {
      alert('Не удалось обновить баланс.');
    }
  };

  // === Работа с игроками ===
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
    else setPlayers(prev => prev.filter(p => p.id !== playerId));
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

  // === Админка: паки ===
  const handleAddPack = async (packData) => {
    const { data, error } = await supabase.from('packs').insert(packData).select().single();
    if (error) alert(`Ошибка при добавлении пака: ${error.message}`);
    else if (data) setPacks(prev => [...prev, data]);
  };

  const handleUpdatePack = async (packData) => {
    const { data, error } = await supabase.from('packs').update(packData).eq('id', packData.id).select().single();
    if (error) alert(`Ошибка при обновлении пака: ${error.message}`);
    else if (data) setPacks(prev => prev.map(p => (p.id === data.id ? data : p)));
  };

  const handleDeletePack = async (id) => {
    const { error } = await supabase.from('packs').delete().eq('id', id);
    if (error) alert(`Ошибка при удалении пака: ${error.message}`);
    else setPacks(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenPack = async (packId) => {
    const pack = packs.find(p => p.id === packId);
    if (!profile || !pack || profile.coins < pack.price) {
      alert("Недостаточно коинов или вы не авторизованы!");
      return null;
    }

    const pool = players.filter(p => pack.player_pool.includes(p.id));
    if (pool.length < pack.cards_in_pack) {
      alert("В пуле этого пака недостаточно игроков. Обратитесь к администратору.");
      return [];
    }

    const chosen = pool.sort(() => 0.5 - Math.random()).slice(0, pack.cards_in_pack);
    const revealedIds = chosen.map(c => c.id);
    const newBalance = profile.coins - pack.price;
    const newCollection = [...(profile.collection || []), ...revealedIds];
    const updated = await updateProfile({ coins: newBalance, collection: newCollection });

    return updated ? chosen : null;
  };

  // === Pick'em ===
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
    const updated = event.matches.some(m => m.id === matchData.id)
      ? event.matches.map(m => (m.id === matchData.id ? matchData : m))
      : [...event.matches, { ...matchData, id: uuidv4() }];
    const { data, error } = await supabase.from('pickem_events').update({ matches: updated }).eq('id', eventId).select().single();
    if (error) console.error(error);
    else setPickemEvents(prev => prev.map(e => (e.id === data.id ? data : e)));
  };

  const handleDeleteMatch = async (eventId, matchId) => {
    const event = pickemEvents.find(e => e.id === eventId);
    if (!event) return;
    const updated = event.matches.filter(m => m.id !== matchId);
    const { data, error } = await supabase.from('pickem_events').update({ matches: updated }).eq('id', eventId).select().single();
    if (error) console.error(error);
    else setPickemEvents(prev => prev.map(e => (e.id === data.id ? data : e)));
  };

  const handleUserPick = async (eventId, matchId, team) => {
    if (!profile) return alert('Войдите, чтобы сделать прогноз!');
    const current = userPicks[eventId] || {};
    const updated = { ...current, [matchId]: team };

    const { error } = await supabase.from('user_picks').upsert(
      { user_id: profile.id, event_id: eventId, picks: updated },
      { onConflict: 'user_id, event_id' }
    );

    if (error) console.error('Ошибка прогноза:', error);
    else setUserPicks(prev => ({ ...prev, [eventId]: updated }));
  };

  // === Мемоизированные значения для фильтрации и UI ===
  const filteredAndSortedPlayers = useMemo(() => {
    let res = [...players];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(p => p.nickname?.toLowerCase().includes(q) || p.team?.toLowerCase().includes(q));
    }
    if (filterByTeam !== 'All Teams') res = res.filter(p => p.team === filterByTeam);
    res.sort((a, b) => {
      switch (sortBy) {
        case 'popularity': return (b.clicks || 0) - (a.clicks || 0);
        case 'rating_desc': return b.ovr - a.ovr;
        case 'rating_asc': return a.ovr - b.ovr;
        default: return 0;
      }
    });
    return res;
  }, [players, sortBy, filterByTeam, searchQuery]);

  const uniqueTeams = useMemo(
    () => ['All Teams', ...Array.from(new Set(players.map(p => p.team).filter(Boolean))).sort()],
    [players]
  );

  const PlayerDetailWrapper = () => {
    const { playerId } = useParams();
    const player = players.find(p => p.id.toString() === playerId);
    return player ? <PlayerDetailPage player={player} /> : <h2>Игрок не найден!</h2>;
  };

  const getNavLinkClass = ({ isActive }) => "nav-button" + (isActive ? " active" : "");
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (authLoading) {
    return <div className="loading-fullscreen">Загрузка сессии...</div>;
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
          <div className="user-coins">{profile ? `${(profile.coins || 0).toLocaleString('ru-RU')} коинов` : ''}</div>
          {session ? (
            <>
              {isAdmin && <NavLink to="/admin" className="admin-toggle-button">Админ</NavLink>}
              <button className="logout-button" onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <NavLink to="/login" className="login-button">Войти</NavLink>
          )}
        </div>
      </header>

      <main className="main-content">
        {appLoading && players.length === 0 ? <Loader /> : (
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
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="cards" replace />} />
                <Route path="cards" element={<AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} />} />
                <Route path="packs" element={<AdminPacks packs={packs} players={players} onAddPack={handleAddPack} onUpdatePack={handleUpdatePack} onDeletePack={handleDeletePack} onAddCoins={handleAddCoins} />} />
                <Route path="pickem" element={<AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} />} />
              </Route>
            </Route>
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;