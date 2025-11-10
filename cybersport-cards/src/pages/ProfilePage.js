import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import PlayerCard from '../components/cards/PlayerCard';
import LockedCard from '../components/cards/LockedCard';
import Loader from '../components/shared/Loader';
import ProfileSettings from '../components/profile/ProfileSettings';
import StorageTab from '../components/profile/StorageTab';
import MarketplaceTab from '../components/profile/MarketplaceTab';
import SeasonSelector from '../components/profile/SeasonSelector';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';

// Компонент для приватного профиля
const PrivateProfile = ({ profile }) => (
    <div className="private-profile-container">
        <img src={getFullImageUrl(profile.avatarUrl)} alt={profile.nickname} className="private-profile-avatar" />
        <h2>{profile.nickname}</h2>
        <p>🔒 Этот профиль является приватным.</p>
    </div>
);


const ProfilePage = () => {
    const { userId } = useParams();
    const { user: currentUser } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    
    const [activeTab, setActiveTab] = useState('collection');
    const [sortBy, setSortBy] = useState('collected');
    const [currentSeason, setCurrentSeason] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState(null);
    
    const isOwner = useMemo(() => currentUser?.id === userId, [currentUser, userId]);

    useEffect(() => {
        setActiveTab('collection');
    }, [userId]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                setError('');
                setIsPrivate(false);
                const [profileRes, seasonRes] = await Promise.all([
                    api.get(`/api/profile/${userId}${selectedSeason ? `?season=${selectedSeason}` : ''}`),
                    api.get('/api/seasons/active')
                ]);
                setProfileData(profileRes.data);
                if (seasonRes.data) {
                    setCurrentSeason(seasonRes.data.seasonNumber);
                    if (!selectedSeason) {
                        setSelectedSeason(seasonRes.data.seasonNumber);
                    }
                }
            } catch (err) {
                const errorData = err.response?.data;
                if (errorData?.isPrivate) {
                    setIsPrivate(true);
                    setProfileData(errorData.profile);
                } else {
                    setError(errorData?.message || "Не удалось загрузить профиль.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId, currentUser, selectedSeason]);

    const handleSeasonChange = (seasonNumber) => {
        setSelectedSeason(seasonNumber);
    };

    const handleSeasonCleanInventory = async (seasonNumber) => {
        if (!isOwner) return;
        if (!window.confirm('Внимание! При переходе на новый сезон весь инвентарь будет очищен. Сбросить?')) return;
        try {
            setLoading(true);
            setError('');
            // API-запрос для чистки инвентаря, либо эмулируем на клиенте:
            await api.post(`/api/profile/${userId}/reset-inventory`, { season: seasonNumber })
            // Перезагрузка профиля
            const profileRes = await api.get(`/api/profile/${userId}?season=${seasonNumber}`);
            setProfileData(profileRes.data);
            alert('Инвентарь очищен. Карточки других сезонов недоступны!');
        } catch (err) {
            setError('Не удалось очистить инвентарь: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Коллекция - только уникальные карточки (не стакаются)
    const cardCounts = useMemo(() => {
        if (!profileData?.collection) return new Map();
        // В коллекции только 1 карточка каждого типа
        const uniqueCards = new Set(profileData.collection.map(c => c._id?.toString() || c.toString()));
        const counts = new Map();
        uniqueCards.forEach(cardId => {
            counts.set(cardId, 1); // Всегда 1, так как не стакаются
        });
        return counts;
    }, [profileData]);
    
    // Хранилище - могут быть дубликаты, но не стакаются
    // (storageCounts не используется, так как в StorageTab карточки отображаются напрямую)

    const stats = useMemo(() => {
        if (!profileData || isPrivate) return { 
            collected: 0, 
            total: 0, 
            percentage: 0, 
            storageCount: 0,
            rarestCard: null 
        };

        const collection = profileData.collection || [];
        const storage = profileData.storage || [];
        
        const collectedIds = new Set(collection.map(c => c._id?.toString() || c.toString()));
        const collectedCount = collectedIds.size;
        const totalPossible = profileData.allPossibleCards?.length || 0;
        const percentage = totalPossible > 0 ? ((collectedCount / totalPossible) * 100).toFixed(0) : 0;
        
        const rarestCard = collection.length > 0
            ? collection.reduce((rarest, current) => {
                const currentCard = typeof current === 'object' ? current : null;
                const rarestCard = typeof rarest === 'object' ? rarest : null;
                if (!currentCard) return rarest;
                if (!rarestCard || currentCard.ovr > rarestCard.ovr) return currentCard;
                return rarest;
            })
            : null;

        return {
            collected: collectedCount,
            total: totalPossible,
            percentage,
            storageCount: storage.length,
            rarestCard: rarestCard
        };
    }, [profileData, isPrivate]);

    const displayedCards = useMemo(() => {
        if (!profileData?.allPossibleCards) return [];
        
        let processed = profileData.allPossibleCards.map(card => ({
            ...card,
            isCollected: cardCounts.has(card._id),
            count: cardCounts.get(card._id) || 0,
        }));

        processed.sort((a, b) => {
            switch (sortBy) {
                case 'ovr_desc': return b.ovr - a.ovr;
                case 'ovr_asc': return a.ovr - b.ovr;
                case 'name': return a.nickname.localeCompare(b.nickname);
                case 'collected':
                default:
                    if (a.isCollected && !b.isCollected) return -1;
                    if (!a.isCollected && b.isCollected) return 1;
                    return b.ovr - a.ovr;
            }
        });
        
        return processed;
    }, [profileData, sortBy, cardCounts]);

    if (loading) return <Loader />;
    if (error) return <div className="empty-inventory-message">{error}</div>;
    if (!profileData) return null;
    
    if (isPrivate && !isOwner) {
        return <PrivateProfile profile={profileData} />;
    }

    return (
        <div className="profile-page">
            <div className="profile-header-stat">
                <div className="profile-avatar-container">
                    <img src={getFullImageUrl(profileData.avatarUrl)} alt={profileData.nickname} className="profile-avatar" />
                </div>
            
                <div className="profile-user-info">
                    <h1>{profileData.nickname}</h1>
                    <span className="profile-coins-stat">
                        Баланс: {profileData.coins?.toLocaleString('ru-RU') || 0} коинов
                    </span>
                </div>

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-value">{stats.collected}</span>
                        <span className="stat-label">В коллекции</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.storageCount}</span>
                        <span className="stat-label">В хранилище</span>
                    </div>
                    {currentSeason && (
                        <div className="stat-item season-badge">
                            <span className="stat-value">Сезон {selectedSeason || currentSeason}</span>
                            <span className="stat-label">{selectedSeason === currentSeason ? 'Текущий сезон' : 'Архивный сезон'}</span>
                        </div>
                    )}
                    {stats.collected > 0 && stats.rarestCard && (
                        <div className="stat-item">
                            <span className="stat-value rarest">{stats.rarestCard.nickname || '-'}</span>
                            <span className="stat-label">Самая редкая</span>
                        </div>
                    )}
                </div>

                <div className="profile-progress">
                    <h3>Прогресс коллекции</h3>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${stats.percentage}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">
                        {stats.collected} / {stats.total} ({stats.percentage}%)
                    </div>
                </div>
            </div>

            {isOwner && (
                <>
                    <SeasonSelector 
                        currentSeason={currentSeason} 
                        onSeasonChange={handleSeasonChange}
                    />
                    
                    <div className="profile-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'collection' ? 'active' : ''}`}
                            onClick={() => setActiveTab('collection')}
                        >
                            Коллекция
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'storage' ? 'active' : ''}`}
                            onClick={() => setActiveTab('storage')}
                        >
                            Хранилище ({stats.storageCount}/100)
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'marketplace' ? 'active' : ''}`}
                            onClick={() => setActiveTab('marketplace')}
                        >
                            Торговая площадка
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            Настройки
                        </button>
                    </div>
                    {isOwner && (
                        <button className="season-reset-btn"
                            onClick={() => handleSeasonCleanInventory(selectedSeason || currentSeason)}
                            style={{ margin: '15px 0', background: '#b71c1c', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px' }}
                        >
                            Сбросить инвентарь для этого сезона
                        </button>
                    )}
                </>
            )}
            
            {activeTab === 'collection' && (
                <>
                    <div className="collection-controls">
                        <h2>Каталог карточек</h2>
                        <div className="sort-buttons">
                            <span>Сортировать:</span>
                            <button onClick={() => setSortBy('collected')} className={sortBy === 'collected' ? 'active' : ''}>По наличию</button>
                            <button onClick={() => setSortBy('ovr_desc')} className={sortBy === 'ovr_desc' ? 'active' : ''}>Рейтинг ↓</button>
                            <button onClick={() => setSortBy('ovr_asc')} className={sortBy === 'ovr_asc' ? 'active' : ''}>Рейтинг ↑</button>
                            <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>Имя (А-Я)</button>
                        </div>
                    </div>

                    {displayedCards.length > 0 ? (
                        <div className="inventory-grid">
                            {displayedCards.map((card) => (
                                <div key={card._id} className="inventory-item-wrapper">
                                    {card.isCollected ? (
                                        <PlayerCard player={card} isClickable={false} />
                                    ) : (
                                        <LockedCard card={card} />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="empty-inventory-message">
                            В вашей коллекции пока нет карточек. <br />
                            Посетите <a href="/shop">магазин</a>, чтобы открыть свой первый пак!
                        </p>
                    )}
                </>
            )}

            {activeTab === 'storage' && isOwner && (
                <StorageTab 
                    storage={profileData?.storage || []}
                    allCards={profileData?.allPossibleCards || []}
                    onUpdate={() => {
                        // Обновляем профиль
                        api.get(`/api/profile/${userId}`).then(({ data }) => {
                            setProfileData(data);
                        });
                    }}
                />
            )}

            {activeTab === 'marketplace' && isOwner && (
                <MarketplaceTab 
                    onUpdate={() => {
                        // Обновляем профиль
                        api.get(`/api/profile/${userId}`).then(({ data }) => {
                            setProfileData(data);
                        });
                    }}
                />
            )}

            {activeTab === 'settings' && isOwner && (
                <ProfileSettings userProfile={profileData} />
            )}
        </div>
    );
};

export default ProfilePage;