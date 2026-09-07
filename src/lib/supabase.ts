import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://juqjxehutxwxkytkpjae.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0mJZy4WlNquiNhWp5q_rFA_xv5FXm1T';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

