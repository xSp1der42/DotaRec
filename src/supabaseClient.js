// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// Этот код теперь будет работать правильно, так как переменные будут называться VITE_*
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Эти логи помогут проверить, что Vercel видит переменные
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "!!! NOT LOADED !!!");
console.log("Supabase Key from env:", supabaseAnonKey ? "Loaded" : "!!! NOT LOADED !!!");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and on Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)