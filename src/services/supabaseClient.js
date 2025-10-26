// src/services/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// ИЗМЕНЕНИЕ 1: Используем process.env вместо import.meta.env
// ИЗМЕНЕНИЕ 2: Используем префикс REACT_APP_ вместо VITE_
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Можно оставить логи для проверки, они будут работать
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "!!! NOT LOADED !!!");
console.log("Supabase Key from env:", supabaseAnonKey ? "Loaded" : "!!! NOT LOADED !!!");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure you have REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file and on Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)