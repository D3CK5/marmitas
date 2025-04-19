/**
 * Script para aplicar políticas RLS no ambiente de desenvolvimento do Supabase
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem ser definidos no arquivo .env');
  process.exit(1);
}

// Criar cliente Supabase com chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Executa script SQL no Supabase
 */
async function executeSQL(sqlContent) {
  console.log('Executando SQL...');
  
  // Split the SQL content into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  // Execute each statement
  for (const statement of statements) {
    try {
      // Add back the semicolon that was removed in the split
      const { error } = await supabase.rpc('exec_sql', { query: `${statement};` });
      
      if (error) {
        console.error(`Erro ao executar SQL: ${statement}`);
        console.error(error);
      }
    } catch (err) {
      console.error(`Exceção ao executar SQL: ${statement}`);
      console.error(err);
    }
  }
  
  console.log('SQL executado com sucesso!');
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('Aplicando políticas RLS no ambiente de desenvolvimento...');
    
    // Caminho para o arquivo SQL
    const rlsFilePath = path.join(process.cwd(), 'supabase', 'rls.sql');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(rlsFilePath)) {
      console.error(`Arquivo não encontrado: ${rlsFilePath}`);
      process.exit(1);
    }
    
    // Ler conteúdo do arquivo
    const sqlContent = fs.readFileSync(rlsFilePath, 'utf8');
    
    // Executar SQL
    await executeSQL(sqlContent);
    
    console.log('Políticas RLS aplicadas com sucesso!');
  } catch (error) {
    console.error('Erro ao aplicar políticas RLS:', error);
    process.exit(1);
  }
}

// Executar função principal
main(); 