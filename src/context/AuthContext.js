import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Загрузка начинается по умолчанию

  useEffect(() => {
    // onAuthStateChange - это единый источник правды. Он срабатывает
    // как минимум один раз при загрузке страницы с текущей сессией (или null).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        // Если есть сессия, пытаемся загрузить профиль пользователя
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Ошибка при загрузке профиля пользователя:", error);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } else {
        // Если сессии нет, то и профиля нет
        setProfile(null);
      }
      
      // ВАЖНО: Этот код выполнится в любом случае (успех, ошибка, нет сессии),
      // гарантируя, что вечная загрузка невозможна.
      setLoading(false);
    });

    // Эта функция вызывается, когда компонент "умирает", чтобы отписаться от слушателя
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Пустой массив зависимостей означает, что этот эффект запустится только один раз

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
    loading,
    updateProfile,
    isAdmin: profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};