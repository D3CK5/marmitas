#!/usr/bin/env node
/**
 * Script para verificar pré-requisitos para o pipeline CI/CD
 * 
 * Este script verifica se o ambiente local e/ou remoto está corretamente configurado
 * para o pipeline CI/CD, incluindo verificação de scripts necessários, configurações
 * do GitHub, e permissões.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para saída do console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[OK]${colors.reset}`,
    warn: `${colors.yellow}[WARN]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    header: `${colors.bright}${colors.blue}`,
  };
  
  console.log(`${prefix[type] || ''} ${message}${type === 'header' ? colors.reset : ''}`);
}

/**
 * Verifica se um arquivo existe no caminho especificado
 */
function checkFileExists(filePath, description, required = true) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✅ ${description} encontrado: ${filePath}`, 'success');
  } else if (required) {
    log(`❌ ${description} não encontrado: ${filePath}`, 'error');
  } else {
    log(`⚠️ ${description} não encontrado (opcional): ${filePath}`, 'warn');
  }
  
  return exists;
}

/**
 * Verifica scripts no package.json
 */
function checkPackageScripts(packagePath, scripts) {
  try {
    const pkg = require(path.resolve(process.cwd(), packagePath));
    let allScriptsPresent = true;
    
    log(`Verificando scripts em ${packagePath}:`);
    
    scripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        log(`✅ Script '${script}' presente`, 'success');
      } else {
        log(`❌ Script '${script}' não encontrado`, 'error');
        allScriptsPresent = false;
      }
    });
    
    return allScriptsPresent;
  } catch (err) {
    log(`❌ Erro ao verificar scripts em ${packagePath}: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Verifica configurações do GitHub Actions
 */
function checkGitHubWorkflows() {
  const workflowFiles = [
    '.github/workflows/ci-cd.yml',
    'marmitas-backend/.github/workflows/ci-cd.yml',
    'marmitas-frontend/.github/workflows/ci-cd.yml'
  ];
  
  log('Verificando configurações do GitHub Actions:');
  
  const mainWorkflowExists = checkFileExists(
    workflowFiles[0], 
    'Workflow unificado do GitHub Actions',
    true
  );
  
  const backendWorkflowExists = checkFileExists(
    workflowFiles[1], 
    'Workflow do backend',
    false
  );
  
  const frontendWorkflowExists = checkFileExists(
    workflowFiles[2], 
    'Workflow do frontend',
    false
  );
  
  if (mainWorkflowExists) {
    if (backendWorkflowExists || frontendWorkflowExists) {
      log('⚠️ Foi encontrado o workflow unificado junto com workflows individuais. Isso pode causar execuções duplicadas do CI/CD.', 'warn');
    } else {
      log('✅ Configuração de workflow correta (usando workflow unificado)', 'success');
    }
  } else if (backendWorkflowExists && frontendWorkflowExists) {
    log('⚠️ Usando workflows separados para backend e frontend. Considere usar o workflow unificado.', 'warn');
  } else {
    log('❌ Configuração de workflow incompleta.', 'error');
  }
}

/**
 * Verifica documentação do CI/CD
 */
function checkDocumentation() {
  const docFiles = [
    'docs/cicd-process.md',
    'marmitas-backend/docs/cicd-process.md',
    'marmitas-frontend/docs/cicd-process.md'
  ];
  
  log('Verificando documentação do CI/CD:');
  
  const mainDocExists = checkFileExists(
    docFiles[0], 
    'Documentação unificada do CI/CD',
    true
  );
  
  const backendDocExists = checkFileExists(
    docFiles[1], 
    'Documentação do CI/CD do backend',
    true
  );
  
  const frontendDocExists = checkFileExists(
    docFiles[2], 
    'Documentação do CI/CD do frontend',
    true
  );
  
  return mainDocExists && backendDocExists && frontendDocExists;
}

/**
 * Verifica scripts de migração do banco de dados
 */
function checkMigrationScripts() {
  const scriptFiles = [
    'marmitas-backend/supabase/migrations',
    'marmitas-backend/supabase/seeds',
    'marmitas-backend/scripts/db-setup.js',
    'marmitas-backend/scripts/test-migrations.js',
    'marmitas-backend/scripts/run-migrations.js'
  ];
  
  log('Verificando scripts de migração do banco de dados:');
  
  let allScriptsPresent = true;
  
  scriptFiles.forEach(file => {
    const exists = checkFileExists(
      file, 
      `Arquivo ou diretório de migração: ${file}`,
      true
    );
    
    if (!exists) {
      allScriptsPresent = false;
    }
  });
  
  return allScriptsPresent;
}

/**
 * Verificação principal
 */
function main() {
  log('VERIFICAÇÃO DE PRÉ-REQUISITOS DO CI/CD', 'header');
  log('=======================================', 'header');
  log('');
  
  // Verificar arquivos de configuração do GitHub Actions
  checkGitHubWorkflows();
  log('');
  
  // Verificar scripts no package.json do backend
  checkPackageScripts('marmitas-backend/package.json', [
    'test',
    'test:watch',
    'test:coverage',
    'build:dev',
    'build:prod',
    'db:setup:test',
    'db:migration:test',
    'db:migrate'
  ]);
  log('');
  
  // Verificar scripts no package.json do frontend
  checkPackageScripts('marmitas-frontend/package.json', [
    'test',
    'test:watch',
    'build:dev',
    'build:prod'
  ]);
  log('');
  
  // Verificar documentação do CI/CD
  checkDocumentation();
  log('');
  
  // Verificar scripts de migração do banco de dados
  checkMigrationScripts();
  log('');
  
  log('VERIFICAÇÃO CONCLUÍDA', 'header');
  log('===================', 'header');
}

// Executar a verificação
main(); 