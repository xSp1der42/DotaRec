// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Загрузка начинается как true

  useEffect(() => {
    // onAuthStateChange - это лучший и самый надежный способ управлять состоянием.
    // Он срабатывает ОДИН РАЗ при первоначальной загрузке страницы,
    // а затем при каждом входе или выходе из системы.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        
        // Если есть сессия (пользователь залогинен), получаем его профиль.
        if (session?.user) {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("AuthContext: Ошибка при загрузке профиля:", error.message);
            setProfile(null);
          } else {
            setProfile(userProfile);
          }
        } else {
          // Если сессии нет (пользователь не залогинен или вышел), профиль точно null.
          setProfile(null);
        }
        
        // ВАЖНО: Убираем экран загрузки ПОСЛЕ того, как все проверки завершены.
        setLoading(false);
      }
    );

    // Эта функция нужна для того, чтобы отписаться от слушателя, 
    // когда компонент будет удален со страницы (чтобы избежать утечек памяти).
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Пустой массив зависимостей означает, что этот эффект запустится только один раз при монтировании.

  const updateProfile = async (updates) => {
    if (!profile) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error.message);
      return null;
    }
  };
  
  const value = {
    session,
    profile,
    loading, // Это состояние теперь будет управляться идеально.
    updateProfile,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};