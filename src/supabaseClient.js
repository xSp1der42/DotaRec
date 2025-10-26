// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// МЕНЯЕМ process.env НА import.meta.env и префиксы на VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Наши маячки для проверки
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "!!! NOT LOADED !!!");
console.log("Supabase Key from env:", supabaseAnonKey ? "Loaded" : "!!! NOT LOADED !!!");


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and on Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)