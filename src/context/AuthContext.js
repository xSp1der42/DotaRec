// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Эта функция содержит логику получения сессии и профиля.
    // Она остается без изменений.
    const getSessionAndProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
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
    };

    // ================= НАЧАЛО ИСПРАВЛЕНИЯ =================
    // Мы запускаем "гонку": либо getSessionAndProfile() успеет выполниться,
    // либо сработает таймер через 5 секунд.
    Promise.race([
      getSessionAndProfile(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Проверка авторизации заняла слишком много времени')), 5000)
      )
    ]).catch(error => {
      // Логируем ошибку, если она была (включая таймаут)
      console.warn('Проблема при инициализации AuthProvider:', error.message);
    }).finally(() => {
      // ЭТО САМЫЙ ВАЖНЫЙ БЛОК:
      // Он выполнится в ЛЮБОМ СЛУЧАЕ - при успехе, ошибке или таймауте.
      // Это гарантирует, что бесконечная загрузка прекратится.
      setLoading(false);
    });
    // ================= КОНЕЦ ИСПРАВЛЕНИЯ =================


    // Эта часть кода, которая слушает изменения (логин/логаут),
    // остается без изменений. Она работает правильно.
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
        // Убираем загрузку и здесь, на случай если первое событие 
        // придет раньше, чем закончится getSessionAndProfile
        setLoading(false);
      }
    );

    // Отписываемся от слушателя при размонтировании компонента
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