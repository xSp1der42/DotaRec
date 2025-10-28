// src/services/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Используем REACT_APP_ переменные, корректно работающие в Create React App
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

// Логи для отладки
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "❌ NOT LOADED");
console.log("Supabase Key from env:", supabaseAnonKey ? "Loaded" : "❌ NOT LOADED");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase URL or Anon Key is missing.\n" +
    "Проверь файл .env и убедись, что там есть:\n" +
    "REACT_APP_SUPABASE_URL=https://xxxx.supabase.co\n" +
    "REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJI..."
  );
}

// Создание клиента Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Проверим соединение при запуске
(async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.warn("⚠️ Supabase подключен, но есть ошибка при тестовом запросе:", error.message);
    } else {
      console.log("✅ Supabase клиент успешно инициализирован и отвечает.");
    }
  } catch (err) {
    console.error("❌ Ошибка при проверке подключения к Supabase:", err.message);
  }
})();
