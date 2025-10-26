import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Эта функция будет проверять сессию и профиль при первой загрузке
    const getSessionAndProfile = async () => {
      try {
        // 1. Пытаемся получить текущую сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);

        // 2. Если сессия есть, пытаемся получить профиль
        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // Ошибку профиля не кидаем дальше, просто его не будет
          if (profileError) {
             console.error("Ошибка при загрузке профиля пользователя:", profileError);
             setProfile(null);
          } else {
             setProfile(userProfile);
          }
        } else {
          // Если сессии нет, профиля тоже нет
          setProfile(null);
        }
      } catch (error) {
        // Ловим любые ошибки на этапе первоначальной загрузки
        console.error("Критическая ошибка в AuthProvider при инициализации:", error);
      } finally {
        // 3. САМОЕ ГЛАВНОЕ: этот блок выполнится ВСЕГДА (и при успехе, и при ошибке)
        // Он убирает вечную загрузку.
        setLoading(false);
      }
    };

    // Запускаем проверку при монтировании компонента
    getSessionAndProfile();

    // Подписываемся на изменения состояния аутентификации (логин/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // При изменении сессии снова запрашиваем профиль
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
        // Устанавливаем loading в false и здесь, на случай если первое событие
        // придет раньше, чем закончится getSessionAndProfile
        setLoading(false);
      }
    );

    // Отписываемся при размонтировании
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
    loading, // Это состояние теперь будет управляться корректно
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