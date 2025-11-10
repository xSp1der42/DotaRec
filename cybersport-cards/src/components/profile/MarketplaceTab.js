// cybersport-cards/src/components/profile/MarketplaceTab.js

import React, { useState, useEffect } from 'react';
import PlayerCard from '../cards/PlayerCard';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getFullImageUrl } from '../../utils/imageUtils';
import '../../styles/MarketplaceTab.css';

const MarketplaceTab = ({ onUpdate }) => {
  const { user, updateUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('browse'); // 'browse' or 'my'
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchListings();
    if (user) {
      fetchMyListings();
    }
  }, [user, sortBy]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/marketplace?sortBy=${sortBy}`);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const { data } = await api.get('/api/marketplace/my/listings');
      setMyListings(data);
    } catch (error) {
      console.error('Error fetching my listings:', error);
    }
  };

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
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return <div className="marketplace-loading">Загрузка...</div>;
  }

  return (
    <div className="marketplace-tab">
      <div className="marketplace-header">
        <h2>Торговая площадка</h2>
        <div className="marketplace-tabs">
          <button
            className={`marketplace-tab-btn ${activeView === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveView('browse')}
          >
            Просмотр
          </button>
          {user && (
            <button
              className={`marketplace-tab-btn ${activeView === 'my' ? 'active' : ''}`}
              onClick={() => setActiveView('my')}
            >
              Мои объявления
            </button>
          )}
        </div>
      </div>

      {activeView === 'browse' && (
        <>
          <div className="marketplace-controls">
            <div className="sort-buttons">
              <span>Сортировать:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={sortBy === 'newest' ? 'active' : ''}
              >
                Новые
              </button>
              <button
                onClick={() => setSortBy('price_asc')}
                className={sortBy === 'price_asc' ? 'active' : ''}
              >
                Цена ↑
              </button>
              <button
                onClick={() => setSortBy('price_desc')}
                className={sortBy === 'price_desc' ? 'active' : ''}
              >
                Цена ↓
              </button>
            </div>
          </div>

          {listings.length === 0 ? (
            <p className="empty-marketplace-message">
              На торговой площадке пока нет объявлений.
            </p>
          ) : (
            <div className="marketplace-grid">
              {listings.map((listing) => (
                <div key={listing._id} className="marketplace-item">
                  <PlayerCard player={listing.card} isClickable={false} />
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeView === 'my' && user && (
        <>
          {myListings.length === 0 ? (
            <p className="empty-marketplace-message">
              У вас нет активных объявлений.
            </p>
          ) : (
            <div className="marketplace-grid">
              {myListings
                .filter(l => l.status === 'active')
                .map((listing) => (
                  <div key={listing._id} className="marketplace-item">
                    <PlayerCard player={listing.card} isClickable={false} />
                    <div className="listing-info">
                      <div className="listing-price">
                        {listing.price.toLocaleString('ru-RU')} коинов
                      </div>
                      <div className="listing-status">
                        Статус: {listing.status === 'active' ? 'Активно' : listing.status}
                      </div>
                      {listing.status === 'active' && (
                        <button
                          onClick={() => handleCancel(listing._id)}
                          className="cancel-listing-btn"
                        >
                          Отменить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplaceTab;

