// js/supabase-config.js

const supabaseUrl = 'https://blblkcalqkdkbxocbrfo.supabase.co';
const supabaseKey = 'sb_publishable_TF6QurY4qkS6j1hKBHpl0A_Ax6mBE5S';

// Le cambiamos el nombre a "clienteSupabase" para evitar el choque
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);