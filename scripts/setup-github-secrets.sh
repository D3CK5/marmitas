#!/bin/bash
# Script para ajudar a configurar os segredos do GitHub Actions para o pipeline CI/CD
# Requer GitHub CLI (gh) instalado e autenticado

set -e

echo "===== Configuração de Segredos para o GitHub Actions - Projeto Marmitas ====="
echo ""
echo "Este script irá ajudá-lo a configurar os segredos necessários para o pipeline CI/CD."
echo "Certifique-se de ter o GitHub CLI (gh) instalado e estar autenticado."
echo ""

# Verificar se o gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "ERRO: GitHub CLI (gh) não encontrado. Por favor, instale-o primeiro."
    echo "Instruções: https://github.com/cli/cli#installation"
    exit 1
fi

# Verificar se o usuário está autenticado
if ! gh auth status &> /dev/null; then
    echo "ERRO: Você não está autenticado no GitHub CLI."
    echo "Por favor, execute 'gh auth login' para autenticar-se."
    exit 1
fi

# Obter o nome do repositório
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$repo" ]; then
    read -p "Digite o nome do repositório no formato 'dono/repo': " repo
fi

echo "Configurando segredos para o repositório: $repo"
echo ""

# Função para configurar um segredo
configure_secret() {
    local secret_name=$1
    local description=$2
    local default_value=$3
    
    echo "Configurando: $secret_name - $description"
    
    if [ -n "$default_value" ]; then
        read -p "Valor para $secret_name [$default_value]: " secret_value
        secret_value=${secret_value:-$default_value}
    else
        read -p "Valor para $secret_name: " secret_value
    fi
    
    echo "Adicionando segredo $secret_name ao GitHub..."
    echo -n "$secret_value" | gh secret set "$secret_name" --repo "$repo"
    echo "✅ Segredo $secret_name configurado com sucesso."
    echo ""
}

echo "===== Configuração de Segredos para Ambiente de Teste ====="
configure_secret "SUPABASE_TEST_URL" "URL da API Supabase para ambiente de teste" "https://xyztest.supabase.co"
configure_secret "SUPABASE_TEST_KEY" "Chave de serviço do Supabase para ambiente de teste" ""

echo "===== Configuração de Segredos para Ambiente de Desenvolvimento ====="
configure_secret "SUPABASE_DEV_URL" "URL da API Supabase para ambiente de desenvolvimento" "https://xyzdev.supabase.co"
configure_secret "SUPABASE_DEV_KEY" "Chave de serviço do Supabase para ambiente de desenvolvimento" ""
configure_secret "DEV_SSH_KEY" "Chave SSH privada para acesso ao servidor de desenvolvimento" ""
configure_secret "DEV_HOST" "Hostname do servidor de desenvolvimento" "dev.marmitas.exemplo.com"
configure_secret "DEV_USER" "Usuário SSH para o servidor de desenvolvimento" "deploy"

echo "===== Configuração de Segredos para Ambiente de Produção ====="
configure_secret "SUPABASE_PROD_URL" "URL da API Supabase para ambiente de produção" "https://xyzprod.supabase.co"
configure_secret "SUPABASE_PROD_KEY" "Chave de serviço do Supabase para ambiente de produção" ""
configure_secret "PROD_SSH_KEY" "Chave SSH privada para acesso ao servidor de produção" ""
configure_secret "PROD_HOST" "Hostname do servidor de produção" "marmitas.exemplo.com"
configure_secret "PROD_USER" "Usuário SSH para o servidor de produção" "deploy"

echo "===== Configuração de Ambientes no GitHub ====="
echo "Criando ambiente 'development'..."
gh api -X PUT "repos/$repo/environments/development" --silent || echo "Ambiente 'development' já existe ou falha na criação"

echo "Criando ambiente 'production'..."
gh api -X PUT "repos/$repo/environments/production" --silent || echo "Ambiente 'production' já existe ou falha na criação"

echo ""
echo "===== Configuração de Segredos Concluída ====="
echo ""
echo "Todos os segredos necessários foram configurados para o pipeline CI/CD."
echo "Você pode gerenciar os segredos em: https://github.com/$repo/settings/secrets/actions"
echo ""
echo "Para gerenciar as proteções do ambiente de produção, acesse:"
echo "https://github.com/$repo/settings/environments"
echo ""
echo "Configuração concluída com sucesso!" 