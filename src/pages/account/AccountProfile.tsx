import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Upload, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IMaskInput } from 'react-imask';
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProfile } from "@/hooks/useProfile";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(15, "Telefone inválido").regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Formato inválido"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Função para extrair a mensagem de erro
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message && typeof error.message === 'string') return error.message;
  return 'Erro no campo';
};

export function AccountProfile() {
  const { user } = useAuth();
  const { 
    isLoading: isProfileLoading, 
    updateProfile, 
    updatePassword, 
    uploadAvatar 
  } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use JPG ou PNG.');
      event.target.value = '';
      return;
    }

    try {
      setIsLoading(true);
      await uploadAvatar(file);
      // Limpar input após upload bem sucedido
      event.target.value = '';
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (data: any) => {
    try {
      await updateProfile({
        id: user?.id,
        ...data
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const handlePasswordSubmit = async (data: any) => {
    try {
      await updatePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meus Dados</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e senha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>
            Sua foto será exibida em seu perfil e em suas avaliações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Input
                id="avatar"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                disabled={isProfileLoading || isLoading}
              />
              <Button 
                variant="outline" 
                className="cursor-pointer" 
                disabled={isProfileLoading || isLoading}
                onClick={() => document.getElementById('avatar')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProfileLoading || isLoading ? 'Enviando...' : 'Alterar foto'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Mantenha seus dados atualizados para receber novidades e promoções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome completo
                </Label>
                <Input 
                  id="full_name"
                  {...profileForm.register("full_name")}
                  disabled={isLoading}
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {getErrorMessage(profileForm.formState.errors.full_name)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input 
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  disabled={isLoading}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {getErrorMessage(profileForm.formState.errors.email)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <IMaskInput
                  id="phone"
                  mask="(00) 00000-0000"
                  placeholder="(00) 00000-0000"
                  value={profileForm.watch("phone") || ""}
                  onAccept={(value) => {
                    profileForm.setValue("phone", value, { shouldValidate: true });
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {getErrorMessage(profileForm.formState.errors.phone)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        "Salvando..."
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Salvar alterações no perfil</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>
            Mantenha sua senha segura e atualizada regularmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditingPassword ? (
            <Button variant="outline" onClick={() => setIsEditingPassword(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Alterar senha
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha atual
                  </Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      {...passwordForm.register("currentPassword")}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPassword.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {getErrorMessage(passwordForm.formState.errors.currentPassword)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="newPassword"
                      type={showPassword.new ? "text" : "password"}
                      {...passwordForm.register("newPassword")}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPassword.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {getErrorMessage(passwordForm.formState.errors.newPassword)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showPassword.confirm ? "text" : "password"}
                      {...passwordForm.register("confirmPassword")}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {getErrorMessage(passwordForm.formState.errors.confirmPassword)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingPassword(false);
                    passwordForm.reset();
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          "Salvando..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Salvar nova senha
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Atualizar senha do perfil</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 