import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  // Изначально ставим loading в true, пока не проверим сессию
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        // Получаем текущую сессию. Эта функция не бросает ошибку, а возвращает ее в объекте.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);

        if (session?.user) {
          // Если сессия есть, пытаемся загрузить профиль
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // Явно проверяем ошибку при загрузке профиля.
          // Если профиль не найден (например, в базе данных еще нет записи), это тоже считается ошибкой.
          if (profileError) {
             console.error("Ошибка при загрузке профиля пользователя:", profileError);
             setProfile(null); // Сбрасываем профиль в случае ошибки
          } else {
             setProfile(userProfile);
          }
        } else {
          // Если сессии нет, то и профиля быть не может
          setProfile(null);
        }
      } catch (error) {
        // Ловим любые другие непредвиденные ошибки
        console.error("Критическая ошибка в AuthProvider при инициализации:", error);
        setSession(null);
        setProfile(null);
      } finally {
        // Этот блок выполнится ВСЕГДА: и после успешного выполнения, и после любой ошибки.
        // Это гарантирует, что ваше приложение не "зависнет" на экране загрузки.
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Повторно получаем профиль, чтобы данные были актуальны
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (error) {
            console.error("Ошибка при обновлении профиля после изменения аутентификации:", error);
            setProfile(null); // Если ошибка, лучше сбросить профиль
          } else {
             setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }
        // Устанавливаем loading в false и здесь, на случай если это первое событие
        setLoading(false);
      }
    );

    // Очистка подписки при размонтировании компонента
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
      
      setProfile(data); // Обновляем локальное состояние профиля
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