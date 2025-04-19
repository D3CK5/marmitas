/**
 * Script para executar migrações de banco de dados
 * 
 * Este script executa migrações de banco de dados no ambiente especificado,
 * controlando quais migrações já foram aplicadas e aplicando apenas as novas.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

// Obter o ambiente a partir dos argumentos ou usar desenvolvimento como padrão
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || process.env.NODE_ENV || 'development';
const envPath = path.resolve(rootDir, `.env.${env}`);

// Carregar variáveis de ambiente
dotenv.config({ path: envPath });
dotenv.config({ path: path.resolve(rootDir, '.env') });

// Verificar se as variáveis de ambiente necessárias estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para executar uma consulta SQL
async function executeQuery(sql) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

// Função para obter migrações já aplicadas
async function getAppliedMigrations() {
  try {
    // Verificar se a tabela de migrações existe
    const { data: tableExists, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'schema_migrations'
          );
        `
      });
    
    if (tableError) {
      console.error('Erro ao verificar tabela de migrações:', tableError);
      return [];
    }
    
    // Se a tabela não existir, criar
    if (!tableExists || !tableExists.length || !tableExists[0].exists) {
      const createTableResult = await executeQuery(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      if (!createTableResult.success) {
        console.error('Erro ao criar tabela de migrações:', createTableResult.error);
        return [];
      }
      
      return [];
    }
    
    // Buscar migrações aplicadas
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar migrações aplicadas:', error);
      return [];
    }
    
    return data.map(row => row.version);
  } catch (err) {
    console.error('Erro ao obter migrações aplicadas:', err);
    return [];
  }
}

// Função para registrar uma migração como aplicada
async function recordMigration(version) {
  const { error } = await supabase
    .from('schema_migrations')
    .insert([{ version }]);
  
  if (error) {
    console.error(`Erro ao registrar migração ${version}:`, error);
    return false;
  }
  
  return true;
}

// Função principal para executar migrações
async function runMigrations() {
  console.log(`Executando migrações no ambiente: ${env}`);
  
  try {
    // Criar estrutura de tabela para controle de migrações (se não existir)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Obter lista de migrações já aplicadas
    const appliedMigrations = await getAppliedMigrations();
    console.log('Migrações já aplicadas:', appliedMigrations);
    
    // Obter lista de arquivos de migração
    const migrationsDir = path.resolve(rootDir, 'supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn('Diretório de migrações não encontrado');
      process.exit(0);
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('Nenhum arquivo de migração encontrado');
      process.exit(0);
    }
    
    // Variável para contar migrações aplicadas
    let appliedCount = 0;
    
    // Aplicar cada migração que ainda não foi aplicada
    for (const file of migrationFiles) {
      const version = path.parse(file).name;
      
      // Pular migrações já aplicadas
      if (appliedMigrations.includes(version)) {
        console.log(`Migração ${version} já aplicada, pulando...`);
        continue;
      }
      
      console.log(`Aplicando migração: ${file}`);
      
      // Ler o arquivo SQL
      const filePath = path.resolve(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Executar o SQL
      const result = await executeQuery(sql);
      
      if (!result.success) {
        console.error(`Erro ao executar migração ${file}:`, result.error);
        process.exit(1);
      }
      
      // Registrar migração como aplicada
      const recorded = await recordMigration(version);
      if (!recorded) {
        console.error(`Erro ao registrar migração ${version}`);
        process.exit(1);
      }
      
      console.log(`Migração ${file} aplicada com sucesso`);
      appliedCount++;
    }
    
    if (appliedCount === 0) {
      console.log('Nenhuma nova migração para aplicar');
    } else {
      console.log(`${appliedCount} migração(ões) aplicada(s) com sucesso`);
    }
    
  } catch (err) {
    console.error('Erro ao executar migrações:', err);
    process.exit(1);
  }
}

// Executar a função principal
runMigrations(); 