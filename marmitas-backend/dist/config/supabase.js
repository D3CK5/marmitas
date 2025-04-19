import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
}
if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
}
/**
 * Supabase client com a chave de serviço do backend
 *
 * Este cliente tem permissões elevadas e bypass das políticas RLS,
 * deve ser usado apenas no servidor backend e nunca exposto para o frontend.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
export default supabase;
//# sourceMappingURL=supabase.js.map