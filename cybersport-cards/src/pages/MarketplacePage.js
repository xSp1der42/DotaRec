// cybersport-cards/src/pages/MarketplacePage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PlayerCard from '../components/cards/PlayerCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/imageUtils';
import '../styles/MarketplacePage.css';

const MarketplacePage = () => {
  const { user, updateUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('browse'); // 'browse' or 'my'
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/marketplace?sortBy=${sortBy}`);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const fetchMyListings = useCallback(async () => {
    try {
      const { data } = await api.get('/api/marketplace/my/listings');
      setMyListings(data);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchMyListings();
    }
  }, [user, fetchListings, fetchMyListings]);

  const handleBuy = async (listingId) => {
    if (!user) {
      alert('Войдите, чтобы покупать карточки');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите купить эту карточку?')) {
      return;
    }

    try {
      const { data } = await api.post(`/api/marketplace/${listingId}/buy`);
      await updateUser({ coins: data.newBalance });
      alert('Карточка куплена!');
      fetchListings();
      fetchMyListings();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCancel = async (listingId) => {
    if (!window.confirm('Вы уверены, что хотите отменить это объявление?')) {
      return;
    }

    try {
      await api.delete(`/api/marketplace/${listingId}`);
      alert('Объявление отменено');
      fetchMyListings();
      fetchListings();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  // Получаем уникальные команды для фильтра
  const uniqueTeams = useMemo(() => {
    const teams = new Set();
    listings.forEach(listing => {
      if (listing.card?.team) {
        teams.add(listing.card.team);
      }
    });
    return Array.from(teams).sort();
  }, [listings]);

  // Фильтрация и поиск
  const filteredListings = useMemo(() => {
    let filtered = [...listings];

    // Поиск по имени игрока
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.card?.nickname?.toLowerCase().includes(query) ||
        listing.card?.fullName?.toLowerCase().includes(query)
      );
    }

    // Фильтр по редкости
    if (filterRarity !== 'all') {
      filtered = filtered.filter(listing => listing.card?.rarity === filterRarity);
    }

    // Фильтр по команде
    if (filterTeam !== 'all') {
      filtered = filtered.filter(listing => listing.card?.team === filterTeam);
    }

    return filtered;
  }, [listings, searchQuery, filterRarity, filterTeam]);

  const currentSeason = user?.currentSeason || listings[0]?.card?.season || null;

  if (loading) {
    return <div className="marketplace-loading">Загрузка...</div>;
  }

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h1>Торговая площадка</h1>
        <p className="marketplace-description">
          Покупайте и продавайте карточки с другими игроками
        </p>
      </div>

      <div className="marketplace-tabs">
        <button
          className={`marketplace-tab-btn ${activeView === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveView('browse')}
        >
          Просмотр объявлений
        </button>
        {user && (
          <button
            className={`marketplace-tab-btn ${activeView === 'my' ? 'active' : ''}`}
            onClick={() => setActiveView('my')}
          >
            Мои объявления ({myListings.filter(l => l.status === 'active').length})
          </button>
        )}
      </div>

      {activeView === 'browse' && (
        <>
          <div className="marketplace-controls">
            <div className="search-section">
              <input
                type="text"
                placeholder="Поиск по имени игрока..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="marketplace-search"
              />
            </div>

            <div className="filter-section">
              <div className="filter-group">
                <label>Редкость:</label>
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Все</option>
                  <option value="common">Обычная</option>
                  <option value="rare">Редкая</option>
                  <option value="epic">Эпическая</option>
                  <option value="legendary">Легендарная</option>
                  <option value="icon">Икона</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Команда:</label>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Все команды</option>
                  {uniqueTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Сортировка:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Новые</option>
                  <option value="price_asc">Цена: по возрастанию</option>
                  <option value="price_desc">Цена: по убыванию</option>
                </select>
              </div>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <p className="empty-marketplace-message">
              {searchQuery || filterRarity !== 'all' || filterTeam !== 'all'
                ? 'Ничего не найдено. Попробуйте изменить фильтры.'
                : 'На торговой площадке пока нет объявлений.'}
            </p>
          ) : (
            <>
              <div className="marketplace-stats">
                Найдено объявлений: {filteredListings.length}
              </div>
              <div className="marketplace-grid">
                {filteredListings.map((listing) => (
                  <div key={listing._id} className="marketplace-item">
                    <PlayerCard player={listing.card} isClickable={false} currentSeason={currentSeason} />
                    <div className="listing-info">
                      <div className="seller-info">
                        <img
                          src={getFullImageUrl(listing.seller?.avatarUrl)}
                          alt={listing.seller?.nickname}
                          className="seller-avatar"
                        />
                        <span className="seller-name">{listing.seller?.nickname}</span>
                      </div>
                      <div className="listing-price">
                        {listing.price.toLocaleString('ru-RU')} коинов
                      </div>
                      {user && user.id?.toString() !== listing.seller?._id?.toString() && (
                        <button
                          onClick={() => handleBuy(listing._id)}
                          className="buy-btn"
                          disabled={user.coins < listing.price}
                        >
                          {user.coins < listing.price ? 'Недостаточно коинов' : 'Купить'}
                        </button>
                      )}
                      {user && user.id?.toString() === listing.seller?._id?.toString() && (
                        <div className="own-listing-badge">Ваше объявление</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeView === 'my' && user && (
        <>
          {myListings.length === 0 ? (
            <p className="empty-marketplace-message">
              У вас нет объявлений. Выставьте карточки на продажу из коллекции или хранилища.
            </p>
          ) : (
            <>
              <div className="my-listings-stats">
                <div className="stat-item">
                  <span className="stat-value">{myListings.filter(l => l.status === 'active').length}</span>
                  <span className="stat-label">Активных</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{myListings.filter(l => l.status === 'sold').length}</span>
                  <span className="stat-label">Продано</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{myListings.filter(l => l.status === 'cancelled').length}</span>
                  <span className="stat-label">Отменено</span>
                </div>
              </div>

              <div className="marketplace-grid">
                {myListings.map((listing) => (
                  <div key={listing._id} className={`marketplace-item ${listing.status !== 'active' ? 'inactive' : ''}`}>
                    <PlayerCard player={listing.card} isClickable={false} currentSeason={currentSeason} />
                    <div className="listing-info">
                      <div className="listing-price">
                        {listing.price.toLocaleString('ru-RU')} коинов
                      </div>
                      <div className={`listing-status status-${listing.status}`}>
                        {listing.status === 'active' && 'Активно'}
                        {listing.status === 'sold' && 'Продано'}
                        {listing.status === 'cancelled' && 'Отменено'}
                      </div>
                      {listing.status === 'sold' && listing.buyer && (
                        <div className="buyer-info">
                          Покупатель: {listing.buyer.nickname}
                        </div>
                      )}
                      {listing.status === 'active' && (
                        <button
                          onClick={() => handleCancel(listing._id)}
                          className="cancel-listing-btn"
                        >
                          Отменить объявление
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
