// supabase-config.js
const SUPABASE_URL = 'https://zsolzwwtxjnfzihargzg.supabase.co'; // Ex: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_hd-lVwIPen3N-0dY-9bN9Q_CC0ZgraC'; // Ex: eyJhbGciOiJIUz...

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;