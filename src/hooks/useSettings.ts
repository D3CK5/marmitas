import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface PaymentMethods {
  pix: {
    enabled: boolean;
    title: string;
    description: string;
  };
  credit_card: {
    enabled: boolean;
    title: string;
    description: string;
  };
}

export interface AppSettings {
  payment_methods: PaymentMethods;
  checkout_terms: string[];
}

export function useSettings() {
  const queryClient = useQueryClient();

  // Buscar configurações
  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async (): Promise<AppSettings> => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['payment_methods', 'checkout_terms']);

        if (error) throw error;

        // Converter array para objeto
        const settingsObj: any = {};
        data?.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });

        return {
          payment_methods: settingsObj.payment_methods || {
            pix: { enabled: true, title: "PIX", description: "Pagamento instantâneo" },
            credit_card: { enabled: true, title: "Cartão de Crédito", description: "Pagamento com cartão" }
          },
          checkout_terms: settingsObj.checkout_terms || [
            "O prazo de entrega é de até 60 minutos",
            "Não aceitamos trocas ou devoluções após a entrega",
            "Em caso de problemas, entre em contato conosco"
          ]
        };
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
    }
  });

  // Atualizar configuração
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      try {
        // Primeiro, verificar se o registro existe
        const { data: existing, error: selectError } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .maybeSingle(); // Usar maybeSingle ao invés de single para evitar erro se não existir

        if (selectError) {
          console.error('Erro ao verificar configuração existente:', selectError);
          throw selectError;
        }

        if (existing) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('app_settings')
            .update({
              value,
              updated_at: new Date().toISOString()
            })
            .eq('key', key);

          if (updateError) {
            console.error('Erro ao atualizar configuração:', updateError);
            throw updateError;
          }
        } else {
          // Inserir novo registro
          const { error: insertError } = await supabase
            .from('app_settings')
            .insert({
              key,
              value,
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Erro ao inserir configuração:', insertError);
            throw insertError;
          }
        }
      } catch (error) {
        console.error('Erro geral ao atualizar configuração:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      toast.error("Erro ao atualizar configuração: " + (error.message || "Erro desconhecido"));
    }
  });

  // Funcções helper para atualizar configurações específicas
  const updatePaymentMethods = (paymentMethods: PaymentMethods) => {
    return updateSetting.mutateAsync({ key: 'payment_methods', value: paymentMethods });
  };

  const updateCheckoutTerms = (terms: string[]) => {
    return updateSetting.mutateAsync({ key: 'checkout_terms', value: terms });
  };

  return {
    settings,
    isLoading,
    updatePaymentMethods,
    updateCheckoutTerms,
    updateSetting: updateSetting.mutateAsync
  };
} 