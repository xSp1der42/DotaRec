// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// ----- ВОТ ЭТИ ДВЕ СТРОКИ -----
console.log("Supabase URL from env:", supabaseUrl ? "Loaded" : "!!! NOT LOADED !!!");
console.log("Supabase Key from env:", supabaseAnonKey ? "Loaded" : "!!! NOT LOADED !!!");
// ------------------------------------

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)