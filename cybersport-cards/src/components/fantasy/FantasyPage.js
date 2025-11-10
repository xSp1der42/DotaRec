// cybersport-cards/src/components/fantasy/FantasyPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../shared/Loader';
import FantasyPlayerSlot from './FantasyPlayerSlot';
import PlayerSelectionModal from './PlayerSelectionModal';
import EditPlayerModal from './EditPlayerModal';
import '../../styles/FantasyPage.css';

const FantasyPage = () => {
    const { user } = useAuth();
    const [activeEvent, setActiveEvent] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [availablePlayers, setAvailablePlayers] = useState([]);
    const [fantasySettings, setFantasySettings] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [currentRoleToSelect, setCurrentRoleToSelect] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRoleToEdit, setCurrentRoleToEdit] = useState(null);

    const fetchFantasyData = useCallback(async () => {
        try {
            setLoading(true);
            const [eventsRes, settingsRes] = await Promise.all([
                api.get('/api/fantasy/events'),
                api.get('/api/fantasy-settings')
            ]);

            setFantasySettings(settingsRes.data);
            const activeEvents = eventsRes.data;

            if (activeEvents.length > 0) {
                const currentEvent = activeEvents[0];
                setActiveEvent(currentEvent);

                if (user) {
                    const [teamRes, availablePlayersRes] = await Promise.all([
                        api.get(`/api/fantasy/my-team/${currentEvent._id}`),
                        api.get('/api/fantasy/available-players')
                    ]);
                    setMyTeam(teamRes.data);
                    setAvailablePlayers(availablePlayersRes.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch fantasy data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFantasyData();
    }, [fetchFantasyData]);

    const handleOpenSelector = (role) => {
        setCurrentRoleToSelect(role);
        setIsSelectionModalOpen(true);
    };

    const handleCloseSelector = () => {
        setIsSelectionModalOpen(false);
        setCurrentRoleToSelect(null);
    };
    
    const generateDefaultBannerForPlayer = (player) => {
        const role = ['POS 1', 'POS 3'].includes(player.position) ? 'core' :
                     ['POS 2'].includes(player.position) ? 'mid' : 'support';
        
        let colors = [];
        if (role === 'core') colors = ['red', 'red', 'green'];
        else if (role === 'mid') colors = ['red', 'green', 'blue'];
        else colors = ['blue', 'blue', 'green'];

        return colors.map(color => ({
            color: color,
            stat: 'TBD',
            quality: 1,
            property: 'nesgibaemaya'
        }));
    };

    const handlePlayerSelected = (role, player) => {
        setMyTeam(prevTeam => {
            const newTeam = prevTeam ? { ...prevTeam } : { 
                players: { core: null, mid: null, support: null },
                replacementTokens: 40 // Начальное количество токенов
            };
            newTeam.players = {
                ...newTeam.players,
                [role]: { 
                    player: player,
                    title: { adjective: '', noun: '' },
                    banner: generateDefaultBannerForPlayer(player)
                }
            };
            return newTeam;
        });
        handleCloseSelector();
    };
    
    const handleOpenEditor = (role) => {
        if (!myTeam?.players[role]?.player) {
            alert("Сначала выберите игрока!");
            return;
        }
        setCurrentRoleToEdit(role);
        setIsEditModalOpen(true);
    };

    const handleCloseEditor = () => {
        setIsEditModalOpen(false);
        setCurrentRoleToEdit(null);
    };
    
    const handleSaveChangesFromModal = (updatedSlot, tokensSpent) => {
      setMyTeam(prev => ({
        ...prev,
        replacementTokens: prev.replacementTokens - tokensSpent,
        players: {
          ...prev.players,
          [currentRoleToEdit]: updatedSlot
        }
      }));
    };

    const handleSaveTeam = async () => {
        if (!user || !activeEvent) return;
        
        // Создаем глубокую копию объекта, чтобы безопасно его изменять
        const teamPayload = JSON.parse(JSON.stringify(myTeam));

        // Очищаем полные данные игрока, оставляя только ID
        Object.keys(teamPayload.players).forEach(role => {
          const slot = teamPayload.players[role];
          if (slot && slot.player) {
            slot.player = slot.player._id;
          } else {
            // Если слота нет, отправляем null, чтобы сервер его очистил
            teamPayload.players[role] = null;
          }
        });

        try {
            const { data } = await api.put(`/api/fantasy/my-team/${activeEvent._id}`, teamPayload);
            setMyTeam(data); // Обновляем состояние данными с сервера (с populated игроками)
            alert('Команда успешно сохранена!');
        } catch (error) {
            // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
            // НЕ вызываем fetchFantasyData() здесь, чтобы не затирать изменения пользователя!
            alert(`Не удалось сохранить команду: ${error.response?.data?.message || error.message}`);
        }
    };

    if (loading) return <Loader />;

    if (!activeEvent) {
        return (
            <div className="fantasy-page"><h1>Фэнтези-лига</h1><p>Нет активных событий.</p></div>
        );
    }
    
    return (
        <>
            <PlayerSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={handleCloseSelector}
                availablePlayers={availablePlayers}
                role={currentRoleToSelect}
                onPlayerSelect={handlePlayerSelected}
            />
            <EditPlayerModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditor}
                playerSlot={currentRoleToEdit && myTeam ? myTeam.players[currentRoleToEdit] : null}
                fantasySettings={fantasySettings}
                onSave={handleSaveChangesFromModal}
                remainingTokens={myTeam?.replacementTokens || 0}
            />
            <div className="fantasy-page">
                <h1>Фэнтези-лига: {activeEvent.title}</h1>
                <div className="roster-lock-timer">
                    <p>Составы закроются: {new Date(activeEvent.rosterLockDate).toLocaleString('ru-RU')}</p>
                </div>
                {user ? (
                    // Мы всегда показываем слоты, даже если myTeam еще null
                    <>
                        <div className="team-slots">
                            <FantasyPlayerSlot role="core" roleName="Основа" playerSlot={myTeam?.players?.core} onSelectClick={handleOpenSelector} onEditClick={handleOpenEditor} />
                            <FantasyPlayerSlot role="mid" roleName="Центр" playerSlot={myTeam?.players?.mid} onSelectClick={handleOpenSelector} onEditClick={handleOpenEditor} />
                            <FantasyPlayerSlot role="support" roleName="Поддержка" playerSlot={myTeam?.players?.support} onSelectClick={handleOpenSelector} onEditClick={handleOpenEditor} />
                        </div>
                        {myTeam && (
                            <button onClick={handleSaveTeam} className="fantasy-button primary save-button">Сохранить команду</button>
                        )}
                    </>
                ) : (
                    <div className="login-prompt"><p>Войдите в аккаунт, чтобы собрать свою команду!</p></div>
                )}
            </div>
        </>
    );
};

export default FantasyPage;