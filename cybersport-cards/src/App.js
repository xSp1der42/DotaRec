// cybersport-cards/src/App.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams, Navigate } from 'react-router-dom';
import api from './services/api';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Компоненты
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PlayerList from './components/cards/PlayerList';
import AdminPanel from './components/admin/AdminPanel';
import ShopPage from './components/shop/ShopPage';
import AdminPacks from './components/admin/AdminPacks';
import PickemPage from './components/pickem/PickemPage';
import AdminPickemDashboard from './components/admin/AdminPickemDashboard';
// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
import FantasyPage from './components/fantasy/FantasyPage'; // <-- Импортируем новую страницу
import AdminFantasyPanel from './components/admin/AdminFantasyPanel'; // <-- Импортируем новую админ-панель
import AdminPredictorPanel from './components/admin/AdminPredictorPanel';
// --- КОНЕЦ ИЗМЕНЕНИЯ ---
import FilterControls from './components/shared/FilterControls';
import Loader from './components/shared/Loader';

// Страницы
import PlayerDetailPage from './pages/PlayerDetailPage';
import ProfilePage from './pages/ProfilePage';
import MarketplacePage from './pages/MarketplacePage';
import PredictorPage from './pages/PredictorPage';
import PredictorMatchPage from './pages/PredictorMatchPage';
import PredictorHistoryPage from './pages/PredictorHistoryPage';

// Layout
import AdminLayout from './components/admin/AdminLayout';

// Predictor Components
import NotificationBell from './components/predictor/NotificationBell';

// Shared Components
import ToastContainer from './components/shared/ToastContainer';

// Стили
import './styles/App.css';

function App() {
    const { user, isAdmin, updateUser, logout, loading: authLoading } = useAuth();
    const [players, setPlayers] = useState([]);
    const [packs, setPacks] = useState([]);
    const [pickemEvents, setPickemEvents] = useState([]);
    const [userPicks, setUserPicks] = useState({});
    const [appLoading, setAppLoading] = useState(true);

    const [sortBy, setSortBy] = useState('popularity');
    const [filterByTeam, setFilterByTeam] = useState('All Teams');
    const [searchQuery, setSearchQuery] = useState('');

    const navigate = useNavigate();

    // === Загрузка публичных данных ===
    const fetchData = useCallback(async () => {
        setAppLoading(true);
        try {
            const [playersRes, eventsRes, packsRes] = await Promise.all([
                api.get('/api/players'),
                api.get('/api/pickem/events'),
                api.get('/api/packs'),
            ]);
            setPlayers(playersRes.data.map(p => ({...p, id: p._id})));
            setPickemEvents(eventsRes.data.map(e => ({...e, id: e._id})));
            setPacks(packsRes.data.map(p => ({...p, id: p._id})));
        } catch (error) {
            console.error('Failed to fetch app data:', error);
        } finally {
            setAppLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // === Прогнозы пользователя ===
    useEffect(() => {
        if (user) {
            const fetchUserPicks = async () => {
                try {
                    const { data } = await api.get('/api/pickem/picks');
                    const picksMap = data.reduce((acc, pick) => {
                        acc[pick.event_id] = pick.picks;
                        return acc;
                    }, {});
                    setUserPicks(picksMap);
                } catch (error) {
                    console.error("Ошибка при загрузке прогнозов:", error);
                }
            };
            fetchUserPicks();
        } else {
            setUserPicks({});
        }
    }, [user]);

    // === Баланс ===
    const handleAddCoins = async (amount) => {
        if (!user) {
            alert("Пожалуйста, войдите в аккаунт.");
            return;
        }
        try {
            const { data } = await api.put('/api/profile/coins', { amount });
            await updateUser({ coins: data.coins }); // Обновляем баланс в AuthContext
            alert(`${Number(amount).toLocaleString('ru-RU')} коинов успешно добавлено!`);
        } catch (error) {
            alert('Не удалось обновить баланс.');
        }
    };

    // === Работа с игроками ===
    const handleAddPlayer = async (playerData, imageFile) => {
        const formData = new FormData();
        formData.append('playerData', JSON.stringify(playerData));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        try {
            const { data } = await api.post('/api/players', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPlayers(prev => [...prev, {...data, id: data._id}]);
        } catch (error) {
            alert(`Не удалось создать карточку: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleUpdatePlayer = async (playerData, imageFile) => {
        const formData = new FormData();
        formData.append('playerData', JSON.stringify(playerData));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        try {
            const { data } = await api.put(`/api/players/${playerData.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPlayers(prev => prev.map(p => (p.id === data._id ? {...data, id: data._id} : p)));
        } catch (error) {
            alert(`Не удалось обновить карточку: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeletePlayer = async (playerId) => {
        try {
            await api.delete(`/api/players/${playerId}`);
            setPlayers(prev => prev.filter(p => p.id !== playerId));
        } catch (error) {
            alert(`Не удалось удалить карточку: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleReorderPlayers = async (reorderedPlayers) => {
        setPlayers(reorderedPlayers);
        const orderedIds = reorderedPlayers.map(p => p.id);
        try {
            await api.post('/api/players/reorder', { orderedIds });
        } catch (error) {
            console.error('Failed to save new order:', error);
            fetchData();
        }
    };

    const handleCardClick = async (clickedPlayer) => {
        try {
            await api.post(`/api/players/${clickedPlayer.id}/click`);
        } catch (error) {
            console.warn("Could not update player click count", error);
        }
    };

    const handlePlayerSelect = (player) => {
        handleCardClick(player);
        navigate(`/player/${player.id}`);
    };

    // === Админка: паки ===
    const handleAddPack = async (packData) => {
        try {
            const { data } = await api.post('/api/packs', packData);
            setPacks(prev => [...prev, {...data, id: data._id}]);
        } catch (error) {
            alert(`Ошибка при добавлении пака: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleUpdatePack = async (packData) => {
        try {
            const { data } = await api.put(`/api/packs/${packData.id}`, packData);
            setPacks(prev => prev.map(p => (p.id === data._id ? {...data, id: data._id} : p)));
        } catch (error) {
            alert(`Ошибка при обновлении пака: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDeletePack = async (packId) => {
        try {
            await api.delete(`/api/packs/${packId}`);
            setPacks(prev => prev.filter(p => p.id !== packId));
        } catch (error) {
            alert(`Ошибка при удалении пака: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleOpenPack = async (packId) => {
        if (!user) {
            alert("Вы не авторизованы!");
            return null;
        }
        try {
            const { data } = await api.post('/api/profile/open-pack', { packId });
            await updateUser({ coins: data.newBalance });
            return data.revealedCards;
        } catch (error) {
            alert(`Не удалось открыть пак: ${error.response?.data?.message || error.message}`);
            return null;
        }
    };

    // === Pick'em ===
    const handleAddEvent = async (title) => {
        try {
            const { data } = await api.post('/api/pickem/events', { title });
            setPickemEvents(prev => [...prev, {...data, id: data._id}]);
        } catch(e){ console.error(e) }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await api.delete(`/api/pickem/events/${id}`);
            setPickemEvents(prev => prev.filter(e => e.id !== id));
        } catch(e){ console.error(e) }
    };

    const handleSaveMatch = async (eventId, matchData) => {
        try {
            const { data: updatedEvent } = await api.post(`/api/pickem/events/${eventId}/matches`, matchData);
            setPickemEvents(prev => prev.map(e => (e.id === eventId ? {...updatedEvent, id: updatedEvent._id} : e)));
        } catch(e){ console.error(e) }
    };

    const handleDeleteMatch = async (eventId, matchId) => {
        try {
            const { data: updatedEvent } = await api.delete(`/api/pickem/events/${eventId}/matches/${matchId}`);
            setPickemEvents(prev => prev.map(e => (e.id === eventId ? {...updatedEvent, id: updatedEvent._id} : e)));
        } catch(e){ console.error(e) }
    };

    const handleUserPick = async (eventId, matchId, team) => {
        if (!user) return alert('Войдите, чтобы сделать прогноз!');
        
        const currentPicks = userPicks[eventId] || {};
        const updatedPicks = { ...currentPicks, [matchId]: team };

        try {
            await api.post('/api/pickem/picks', { eventId, picks: updatedPicks });
            setUserPicks(prev => ({ ...prev, [eventId]: updatedPicks }));
        } catch (error) {
            console.error('Ошибка прогноза:', error);
        }
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
                default: return (a.order || 0) - (b.order || 0);
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
    const handleLogout = () => { logout(); navigate('/'); };

    if (authLoading) {
        return <div className="loading-fullscreen">Загрузка сессии...</div>;
    }

    return (
        <NotificationProvider>
            <div className="App">
                <ToastContainer />
                <header className="app-header">
                <nav className="main-nav">
                    <NavLink to="/" end className={getNavLinkClass}>Карточки</NavLink>
                    <NavLink to="/shop" className={getNavLinkClass}>Магазин</NavLink>
                    <NavLink to="/marketplace" className={getNavLinkClass}>Торговая площадка</NavLink>
                    <NavLink to="/pickem" className={getNavLinkClass}>Pick'em</NavLink>
                    <NavLink to="/fantasy" className={getNavLinkClass}>Фэнтези</NavLink>
                    <NavLink to="/predictor" className={getNavLinkClass}>Предсказания</NavLink>
                </nav>
                <div className="header-right">
                    {user && <NavLink to={`/profile/${user.id}`} className="nav-button user-profile-link">Профиль</NavLink>}
                    <div className="user-coins">{user ? `${(user.coins || 0).toLocaleString('ru-RU')} коинов` : ''}</div>
                    {user && <NotificationBell />}
                    {user ? (
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
                    <Route path="/shop" element={<ShopPage packs={packs} userCoins={user?.coins || 0} onOpenPack={handleOpenPack} onAddCoins={handleAddCoins} />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/pickem" element={<PickemPage events={pickemEvents} userPicks={userPicks} onPick={handleUserPick} />} />
                    <Route path="/fantasy" element={<FantasyPage />} />
                    <Route path="/predictor" element={<PredictorPage />} />
                    <Route path="/predictor/match/:matchId" element={<PredictorMatchPage />} />
                    <Route path="/predictor/history" element={<PredictorHistoryPage />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/admin" element={<ProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        <Route index element={<Navigate to="cards" replace />} />
                        <Route path="cards" element={<AdminPanel players={players} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onReorderPlayers={handleReorderPlayers} />} />
                        <Route path="packs" element={<AdminPacks packs={packs} players={players} onAddPack={handleAddPack} onUpdatePack={handleUpdatePack} onDeletePack={handleDeletePack} onAddCoins={handleAddCoins} />} />
                        <Route path="pickem" element={<AdminPickemDashboard events={pickemEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} onSaveMatch={handleSaveMatch} onDeleteMatch={handleDeleteMatch} />} />
                        {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
                        <Route path="fantasy" element={<AdminFantasyPanel />} />
                        <Route path="predictor" element={<AdminPredictorPanel />} />
                        {/* --- КОНЕЦ ИЗМЕНЕНИЯ --- */}
                      </Route>
                    </Route>
                  </Routes>
                )}
            </main>
            </div>
        </NotificationProvider>
    );
}

export default App;