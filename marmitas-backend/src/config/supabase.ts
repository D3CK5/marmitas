import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.utils.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  logger.error('Configuração incompleta: SUPABASE_URL não definida');
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  logger.error('Configuração incompleta: SUPABASE_SERVICE_KEY não definida');
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

// Verificar a conexão com o Supabase ao inicializar
try {
  const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (error) {
    logger.warn(`Conexão com Supabase apresentou erro: ${error.message}`, { error });
  } else {
    logger.info('Conexão com Supabase estabelecida com sucesso');
  }
} catch (err) {
  logger.warn('Não foi possível verificar a conexão com Supabase', { error: err });
}

export default supabase; 