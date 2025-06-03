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
import { AccountMenu } from "@/components/account/AccountMenu";

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
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <AccountMenu />
      
      <div className="px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold">Meus Dados</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gerencie suas informações pessoais e senha
        </p>
      </div>

      {/* Foto de Perfil */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Foto de Perfil</CardTitle>
          <CardDescription className="text-sm">
            Sua foto será exibida em seu perfil e em suas avaliações
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-10 w-10 sm:h-12 sm:w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left w-full sm:w-auto">
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
                size="sm"
                className="cursor-pointer w-full sm:w-auto" 
                disabled={isProfileLoading || isLoading}
                onClick={() => document.getElementById('avatar')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProfileLoading || isLoading ? 'Enviando...' : 'Alterar foto'}
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Informações Pessoais</CardTitle>
          <CardDescription className="text-sm">
            Mantenha seus dados atualizados para receber novidades e promoções
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Nome completo
                </Label>
                <Input 
                  id="full_name"
                  {...profileForm.register("full_name")}
                  disabled={isLoading}
                  className="h-10 sm:h-11"
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{getErrorMessage(profileForm.formState.errors.full_name)}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input 
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  disabled={isLoading}
                  className="h-10 sm:h-11"
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{getErrorMessage(profileForm.formState.errors.email)}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
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
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{getErrorMessage(profileForm.formState.errors.phone)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="submit" disabled={isLoading} size="sm">
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

      {/* Alterar Senha */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Alterar Senha</CardTitle>
          <CardDescription className="text-sm">
            Mantenha sua senha segura e atualizada regularmente
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {!isEditingPassword ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditingPassword(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Alterar senha
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Senha atual
                  </Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      {...passwordForm.register("currentPassword")}
                      disabled={isLoading}
                      className="h-10 sm:h-11 pr-12"
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
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{getErrorMessage(passwordForm.formState.errors.currentPassword)}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="newPassword"
                      type={showPassword.new ? "text" : "password"}
                      {...passwordForm.register("newPassword")}
                      disabled={isLoading}
                      className="h-10 sm:h-11 pr-12"
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
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{getErrorMessage(passwordForm.formState.errors.newPassword)}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showPassword.confirm ? "text" : "password"}
                      {...passwordForm.register("confirmPassword")}
                      disabled={isLoading}
                      className="h-10 sm:h-11 pr-12"
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
                    <p className="text-xs sm:text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{getErrorMessage(passwordForm.formState.errors.confirmPassword)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditingPassword(false);
                    passwordForm.reset();
                  }}
                  disabled={isLoading}
                  className="order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="submit" disabled={isLoading} size="sm" className="order-1 sm:order-2">
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