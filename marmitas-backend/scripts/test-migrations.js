/**
 * Script para testar migrações de banco de dados
 * 
 * Este script simula a execução de migrações de banco de dados em um ambiente de teste
 * para verificar se elas serão aplicadas corretamente no ambiente de produção.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(rootDir, '.env.test') });
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

// Função para executar uma única consulta SQL
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

// Função principal para testar migrações
async function testMigrations() {
  console.log('Iniciando teste de migrações...');
  
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
    
    console.log(`Encontrados ${migrationFiles.length} arquivos de migração`);
    
    // Iniciar transação para testar migrações
    await executeQuery('BEGIN;');
    
    try {
      // Aplicar cada migração que ainda não foi aplicada
      for (const file of migrationFiles) {
        const version = path.parse(file).name;
        
        // Pular migrações já aplicadas
        if (appliedMigrations.includes(version)) {
          console.log(`Migração ${version} já aplicada, pulando...`);
          continue;
        }
        
        console.log(`Testando migração: ${file}`);
        
        // Ler o arquivo SQL
        const filePath = path.resolve(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Executar o SQL
        const result = await executeQuery(sql);
        
        if (!result.success) {
          console.error(`Erro ao testar migração ${file}:`, result.error);
          await executeQuery('ROLLBACK;');
          process.exit(1);
        }
        
        console.log(`Migração ${file} testada com sucesso`);
      }
      
      // Sucesso, fazer rollback (é apenas um teste)
      await executeQuery('ROLLBACK;');
      console.log('Teste de migrações concluído com sucesso (rollback realizado)');
      
    } catch (err) {
      await executeQuery('ROLLBACK;');
      console.error('Erro durante o teste de migrações:', err);
      process.exit(1);
    }
    
  } catch (err) {
    console.error('Erro ao testar migrações:', err);
    process.exit(1);
  }
}

// Executar a função principal
testMigrations(); 