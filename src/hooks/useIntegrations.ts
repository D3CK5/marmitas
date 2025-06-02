import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface IntegrationsSettings {
  id: string;
  google_analytics_id: string | null;
  hotjar_id: string | null;
  facebook_pixel_id: string | null;
  google_tag_manager_id: string | null;
  whatsapp_number: string | null;
  is_google_analytics_enabled: boolean;
  is_hotjar_enabled: boolean;
  is_facebook_pixel_enabled: boolean;
  is_google_tag_manager_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useIntegrations() {
  const [settings, setSettings] = useState<IntegrationsSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Se não existir configuração, criar uma nova
      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from('integrations_settings')
          .insert({})
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newData);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de integrações:', error);
      toast.error('Erro ao carregar configurações de integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<IntegrationsSettings>) => {
    if (!settings) return;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('integrations_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast.success('Configurações atualizadas com sucesso!');
      
      // Recarregar a página para aplicar as mudanças nos scripts
      if (updates.google_analytics_id !== undefined || 
          updates.hotjar_id !== undefined ||
          updates.is_google_analytics_enabled !== undefined ||
          updates.is_hotjar_enabled !== undefined) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateGoogleAnalytics = (id: string, enabled: boolean) => {
    return updateSettings({
      google_analytics_id: id,
      is_google_analytics_enabled: enabled
    });
  };

  const updateHotjar = (id: string, enabled: boolean) => {
    return updateSettings({
      hotjar_id: id,
      is_hotjar_enabled: enabled
    });
  };

  const updateFacebookPixel = (id: string, enabled: boolean) => {
    return updateSettings({
      facebook_pixel_id: id,
      is_facebook_pixel_enabled: enabled
    });
  };

  const updateGoogleTagManager = (id: string, enabled: boolean) => {
    return updateSettings({
      google_tag_manager_id: id,
      is_google_tag_manager_enabled: enabled
    });
  };

  return {
    settings,
    isLoading,
    isUpdating,
    updateSettings,
    updateGoogleAnalytics,
    updateHotjar,
    updateFacebookPixel,
    updateGoogleTagManager,
    refetch: fetchSettings
  };
} 