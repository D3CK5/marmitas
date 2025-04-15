import { supabase } from "./supabase";

/**
 * Upload de arquivo para um bucket específico no Supabase Storage
 * @param bucket Nome do bucket
 * @param path Caminho do arquivo
 * @param file Arquivo a ser enviado
 * @param onProgress Função de callback para acompanhar o progresso do upload
 * @returns 
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        ...(onProgress && {
          onUploadProgress: (progress) => {
            const percent = (progress.uploadedBytes / progress.totalBytes) * 100;
            onProgress(Math.round(percent));
          },
        }),
      });

    if (error) throw error;

    // Obter URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    throw error;
  }
}

/**
 * Remove um arquivo do Supabase Storage
 * @param bucket Nome do bucket
 * @param path Caminho do arquivo
 */
export async function removeFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao remover arquivo:", error);
    return false;
  }
}

/**
 * Extrai o nome do arquivo de uma URL
 * @param url URL completa do arquivo
 * @returns Nome do arquivo
 */
export function getFileNameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    return url.split("/").pop() || null;
  } catch {
    return null;
  }
}

/**
 * Gera um nome único para o arquivo baseado no ID do usuário e timestamp
 * @param userId ID do usuário
 * @param fileOriginalName Nome original do arquivo
 * @returns Nome único do arquivo
 */
export function generateUniqueFileName(userId: string, fileOriginalName: string): string {
  const fileExt = fileOriginalName.split(".").pop();
  return `${userId}_${Date.now()}.${fileExt}`;
} 