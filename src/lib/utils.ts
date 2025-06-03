import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatFoodChanges(notes: string): string {
  if (!notes || !notes.includes("Trocas:")) {
    return notes;
  }

  // Extrair a parte das trocas
  const parts = notes.split("Trocas:");
  if (parts.length < 2) return notes;

  const beforeTrocas = parts[0].trim();
  const trocasText = parts[1].trim();

  // Processar cada troca
  const trocas = trocasText.split(",").map(troca => {
    const [alimento, substituto] = troca.split(":").map(s => s.trim());
    
    // Se o alimento e substituto são iguais, mostrar "mantém"
    if (alimento === substituto) {
      return `${alimento} mantém`;
    }
    
    // Caso contrário, mostrar a troca
    return `${alimento}: ${substituto}`;
  });

  // Reconstruir a string
  const formattedTrocas = `Trocas: ${trocas.join(", ")}`;
  
  return beforeTrocas ? `${beforeTrocas} | ${formattedTrocas}` : formattedTrocas;
}

/**
 * Gera um ID único para itens do carrinho baseado no produto e suas configurações
 * @param productId ID do produto
 * @param notes Observações do item (incluindo trocas)
 * @returns String única para identificar o item no carrinho
 */
export function generateCartItemId(productId: number, notes?: string): string {
  // Se não há observações, retorna apenas o ID do produto
  if (!notes || notes.trim() === "") {
    return `product_${productId}`;
  }
  
  // Criar hash simples das observações para garantir unicidade
  const notesHash = notes
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_:,]/g, '')
    .substring(0, 50); // Limitar tamanho
  
  return `product_${productId}_${notesHash}`;
}
