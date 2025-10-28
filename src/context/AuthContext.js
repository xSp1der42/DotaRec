// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      console.time("AuthCheck");

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.timeEnd("AuthCheck");

        if (sessionError) throw sessionError;

        setSession(session);

        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Ошибка при загрузке профиля пользователя:", profileError);
            setProfile(null);
          } else {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.warn("Ошибка при получении сессии или профиля:", error.message);
        setSession(null);
        setProfile(null);
      }
    };

    // === Новый механизм: без ложных ошибок, с умным таймаутом ===
    const timeoutMs = navigator.connection?.effectiveType === '4g' ? 8000 : 15000;
    const timeoutPromise = new Promise(resolve => 
      setTimeout(() => {
        console.warn(`[AuthProvider] Проверка авторизации заняла более ${timeoutMs / 1000} секунд. Продолжаем без ожидания.`);
        resolve();
      }, timeoutMs)
    );

    Promise.race([getSessionAndProfile(), timeoutPromise])
      .finally(() => {
        setLoading(false);
      });

    // === Подписка на изменения авторизации ===
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Ошибка при обновлении профиля после изменения auth:", error);
            setProfile(null);
          } else {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
