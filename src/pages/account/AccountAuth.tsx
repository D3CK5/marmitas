import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from 'react-imask';

// Schema de validação do login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// Schema de validação do cadastro - Passo 1
const step1Schema = z.object({
  phone: z.string().min(14, "Telefone inválido"),
  verificationCode: z.string().length(6, "Código inválido"),
});

// Schema de validação do cadastro - Passo 2
const step2Schema = z.object({
  full_name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema de validação do cadastro - Passo 3
const step3Schema = z.object({
  zipCode: z.string().min(9, "CEP inválido"),
  street: z.string().min(3, "Rua inválida"),
  number: z.string().min(1, "Número inválido"),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, "Bairro inválido"),
  city: z.string().min(3, "Cidade inválida"),
  state: z.string().length(2, "Estado inválido"),
});

// Função para extrair a mensagem de erro
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message && typeof error.message === 'string') return error.message;
  return 'Erro no campo';
};

export function AccountAuth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerData, setRegisterData] = useState({});

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Cadastro forms
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
  });

  const step3Form = useForm({
    resolver: zodResolver(step3Schema),
  });

  // Função para enviar código de verificação
  const handleSendVerificationCode = async (phone: string) => {
    try {
      // Implementar envio de SMS
      toast.success("Código enviado para " + phone);
    } catch (error) {
      toast.error("Erro ao enviar código");
    }
  };

  // Função para buscar endereço por CEP
  const handleZipCodeSearch = async (zipCode: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      step3Form.setValue("street", data.logradouro);
      step3Form.setValue("neighborhood", data.bairro);
      step3Form.setValue("city", data.localidade);
      step3Form.setValue("state", data.uf);
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    }
  };

  // Handler do login
  const handleLogin = async (data: any) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      navigate("/minhaconta");
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler do cadastro - Passo 1
  const handleStep1 = async (data: any) => {
    setRegisterData({ ...registerData, ...data });
    setRegisterStep(2);
  };

  // Handler do cadastro - Passo 2
  const handleStep2 = async (data: any) => {
    setRegisterData({ ...registerData, ...data });
    setRegisterStep(3);
  };

  // Handler do cadastro - Passo 3
  const handleStep3 = async (data: any) => {
    try {
      setIsLoading(true);
      const finalData = { ...registerData, ...data };
      await signUp(finalData);
      navigate("/minhaconta");
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Cadastro</TabsTrigger>
        </TabsList>

        {/* Tab de Login */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Fazer Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage(loginForm.formState.errors.email)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password"
                    type="password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage(loginForm.formState.errors.password)}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Cadastro */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Criar Conta - Passo {registerStep}/3</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Passo 1 - Telefone e Verificação */}
              {registerStep === 1 && (
                <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      {...step1Form.register("phone")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {step1Form.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step1Form.formState.errors.phone)}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleSendVerificationCode(step1Form.getValues("phone"))}
                  >
                    Enviar código
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Código de verificação</Label>
                    <Input 
                      id="verificationCode"
                      {...step1Form.register("verificationCode")}
                    />
                    {step1Form.formState.errors.verificationCode && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step1Form.formState.errors.verificationCode)}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Próximo
                  </Button>
                </form>
              )}

              {/* Passo 2 - Dados pessoais */}
              {registerStep === 2 && (
                <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input 
                      id="full_name"
                      {...step2Form.register("full_name")}
                    />
                    {step2Form.formState.errors.full_name && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step2Form.formState.errors.full_name)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      {...step2Form.register("email")}
                    />
                    {step2Form.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step2Form.formState.errors.email)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input 
                      id="password"
                      type="password"
                      {...step2Form.register("password")}
                    />
                    {step2Form.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step2Form.formState.errors.password)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input 
                      id="confirmPassword"
                      type="password"
                      {...step2Form.register("confirmPassword")}
                    />
                    {step2Form.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step2Form.formState.errors.confirmPassword)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setRegisterStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Próximo
                    </Button>
                  </div>
                </form>
              )}

              {/* Passo 3 - Endereço */}
              {registerStep === 3 && (
                <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <IMaskInput
                      mask="00000-000"
                      {...step3Form.register("zipCode")}
                      onAccept={(value) => {
                        if (value.length === 9) {
                          handleZipCodeSearch(value);
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {step3Form.formState.errors.zipCode && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step3Form.formState.errors.zipCode)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input 
                        id="street"
                        {...step3Form.register("street")}
                      />
                      {step3Form.formState.errors.street && (
                        <p className="text-sm text-destructive">
                          {getErrorMessage(step3Form.formState.errors.street)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input 
                        id="number"
                        {...step3Form.register("number")}
                      />
                      {step3Form.formState.errors.number && (
                        <p className="text-sm text-destructive">
                          {getErrorMessage(step3Form.formState.errors.number)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input 
                      id="complement"
                      {...step3Form.register("complement")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input 
                      id="neighborhood"
                      {...step3Form.register("neighborhood")}
                    />
                    {step3Form.formState.errors.neighborhood && (
                      <p className="text-sm text-destructive">
                        {getErrorMessage(step3Form.formState.errors.neighborhood)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input 
                        id="city"
                        {...step3Form.register("city")}
                      />
                      {step3Form.formState.errors.city && (
                        <p className="text-sm text-destructive">
                          {getErrorMessage(step3Form.formState.errors.city)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input 
                        id="state"
                        maxLength={2}
                        {...step3Form.register("state")}
                      />
                      {step3Form.formState.errors.state && (
                        <p className="text-sm text-destructive">
                          {getErrorMessage(step3Form.formState.errors.state)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setRegisterStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 