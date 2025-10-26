import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        setSession(session);

        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // ИЗМЕНЕНИЕ: Мы теперь явно проверяем ошибку при загрузке профиля
          if (profileError) {
            console.error("Ошибка при загрузке профиля пользователя:", profileError);
            setProfile(null); // Сбрасываем профиль в случае ошибки
          } else {
            setProfile(userProfile);
          }
        } else {
          setProfile(null); // Если нет сессии, профиля тоже нет
        }
      } catch (error) {
        // ИЗМЕНЕНИЕ: Ловим любые ошибки, которые могли произойти
        console.error("Критическая ошибка в AuthProvider:", error);
      } finally {
        // ИЗМЕНЕНИЕ: Этот блок выполнится ВСЕГДА, даже если была ошибка.
        // Это гарантирует, что ваше приложение не "зависнет" на загрузке.
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
          }
          setProfile(userProfile || null);
        } else {
          setProfile(null);
        }
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

  // ИЗМЕНЕНИЕ: Убрали !loading из условия, теперь компонент сам решает,
  // показывать загрузчик или нет. Это более гибко.
  // Защита от рендера теперь внутри самого App через проверку loading.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};