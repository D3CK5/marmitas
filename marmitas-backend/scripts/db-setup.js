/**
 * Script para configurar o banco de dados para testes
 * 
 * Este script inicializa um banco de dados para testes, criando todas as tabelas
 * e estruturas necessárias para executar os testes.
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

// Função para executar um script SQL
async function executeSqlScript(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Erro ao executar o script SQL ${filePath}:`, error);
      return false;
    }
    
    console.log(`Script SQL ${filePath} executado com sucesso`);
    return true;
  } catch (err) {
    console.error(`Erro ao ler ou executar o script SQL ${filePath}:`, err);
    return false;
  }
}

// Função principal
async function setupTestDatabase() {
  console.log(`Configurando banco de dados para o ambiente: ${env}`);
  
  try {
    // Verificar se o banco de dados está acessível
    const { data, error } = await supabase.from('_schema').select('*').limit(1);
    
    if (error) {
      console.error('Erro ao conectar com o banco de dados:', error);
      process.exit(1);
    }
    
    console.log('Conexão com o banco de dados estabelecida com sucesso');
    
    // Limpar o banco de dados (se necessário)
    if (env === 'test') {
      console.log('Limpando banco de dados de teste...');
      // Aqui você pode adicionar lógica para limpar o banco de dados de teste
    }
    
    // Executar scripts SQL para criar a estrutura do banco de dados
    const schemaDir = path.resolve(rootDir, 'supabase/migrations');
    
    if (fs.existsSync(schemaDir)) {
      const files = fs.readdirSync(schemaDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ordenar arquivos para garantir a ordem correta
      
      for (const file of files) {
        const filePath = path.resolve(schemaDir, file);
        const success = await executeSqlScript(filePath);
        
        if (!success) {
          console.error(`Falha ao executar o script ${file}`);
          process.exit(1);
        }
      }
    } else {
      console.warn('Diretório de migrações não encontrado, pulando criação de esquema');
    }
    
    // Inserir dados de teste (se necessário)
    if (env === 'test') {
      const seedDir = path.resolve(rootDir, 'supabase/seeds');
      
      if (fs.existsSync(seedDir)) {
        const seedFiles = fs.readdirSync(seedDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        for (const file of seedFiles) {
          const filePath = path.resolve(seedDir, file);
          const success = await executeSqlScript(filePath);
          
          if (!success) {
            console.error(`Falha ao executar o seed ${file}`);
            process.exit(1);
          }
        }
      } else {
        console.warn('Diretório de seeds não encontrado, pulando inserção de dados de teste');
      }
    }
    
    console.log(`Configuração do banco de dados para o ambiente ${env} concluída com sucesso`);
  } catch (err) {
    console.error('Erro ao configurar o banco de dados:', err);
    process.exit(1);
  }
}

// Executar a função principal
setupTestDatabase(); 