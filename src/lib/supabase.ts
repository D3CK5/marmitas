import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Credenciais do Supabase não encontradas');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage // Usar localStorage para persistir a sessão
  }
});

// Bucket names
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  USER_AVATARS: 'user-avatars',
} as const;

export const STORAGE_PATHS = {
  PRODUCT_IMAGES: 'products',
  USER_AVATARS: 'avatars',
} as const;
