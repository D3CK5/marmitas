import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountLayout } from "@/components/account/account-layout";
import { useCustomer } from "@/hooks/useCustomer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadFile, removeFile, getFileNameFromUrl, generateUniqueFileName } from "@/lib/storage-helpers";
import { Progress } from "@/components/ui/progress";

export default function Profile() {
  const { customer, isLoading, mutate } = useCustomer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.full_name || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
    }
  }, [customer]);

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AccountLayout>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phone,
        })
        .eq("id", customer.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      mutate();
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    // Aciona o clique no input de arquivo oculto
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer) return;

    // Validar tipo de arquivo (apenas imagens)
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Gerar nome único para o arquivo
      const fileName = generateUniqueFileName(customer.id, file.name);

      // Upload para o bucket "avatars"
      const uploadResult = await uploadFile(
        "avatars", 
        fileName, 
        file,
        (progress) => setUploadProgress(progress)
      );

      // Atualizar o perfil do usuário com a URL do avatar
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: uploadResult.url,
        })
        .eq("id", customer.id);

      if (updateError) throw updateError;

      // Remover foto antiga se existir e for diferente da foto padrão
      if (customer.avatar_url && !customer.avatar_url.includes("default-avatar")) {
        const oldFileName = getFileNameFromUrl(customer.avatar_url);
        if (oldFileName) {
          await removeFile("avatars", oldFileName);
        }
      }

      toast.success("Foto de perfil atualizada com sucesso!");
      mutate(); // Atualizar os dados do cliente
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto:", error);
      toast.error("Erro ao atualizar foto de perfil: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold leading-none tracking-tight">
            Meus Dados
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações pessoais e senha
          </p>
        </div>
        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Avatar 
                  className="h-24 w-24 cursor-pointer border-2 border-muted hover:border-primary transition-colors" 
                  onClick={handleAvatarClick}
                >
                  <AvatarImage 
                    src={customer?.avatar_url || ""} 
                    alt={customer?.full_name || "Usuário"} 
                  />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-12 w-12 text-primary" />
                  </AvatarFallback>
                </Avatar>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg, image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {isUploading ? (
                  <div className="w-full space-y-2">
                    <Progress value={uploadProgress} className="h-2 w-full" />
                    <p className="text-xs text-center text-muted-foreground">
                      Enviando... {uploadProgress}%
                    </p>
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="text-xs"
                    onClick={handleAvatarClick}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Alterar foto
                  </Button>
                )}
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Sua foto será exibida em seu perfil e em suas avaliações
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    placeholder="Seu email"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Seu telefone"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AccountLayout>
  );
} 