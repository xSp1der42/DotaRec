import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import PlayerCard from '../components/cards/PlayerCard';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!profile || !profile.collection || profile.collection.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .in('id', profile.collection);

      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        const fullInventory = profile.collection.map(playerId => 
            players.find(p => p.id === playerId)
        ).filter(Boolean);
        setInventory(fullInventory);
      }
      setLoading(false);
    };

    fetchInventory();
  }, [profile]);

  if (loading) {
    return <div className="profile-page"><h2>Загрузка инвентаря...</h2></div>;
  }

  if (!profile) {
    return <div className="profile-page"><h2>Пожалуйста, войдите, чтобы увидеть свой профиль.</h2></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Мой Профиль</h1>
        <div className="profile-info">
          <span>Email: {profile.id ? profile.id.split('@')[0] + '@...' : '...'}</span>
          <span className="profile-coins">Баланс: {profile.coins?.toLocaleString('ru-RU') || 0} коинов</span>
        </div>
      </div>

      <h2>Моя коллекция ({inventory.length} шт.)</h2>
      {inventory.length > 0 ? (
        <div className="inventory-grid">
          {inventory.map((player, index) => (
            <PlayerCard key={`${player.id}-${index}`} player={player} isClickable={false} />
          ))}
        </div>
      ) : (
        <p className="empty-inventory-message">
          Ваша коллекция пуста. Отправляйтесь в <a href="/shop">магазин</a>, чтобы открыть свой первый пак!
        </p>
      )}
    </div>
  );
};

export default ProfilePage;