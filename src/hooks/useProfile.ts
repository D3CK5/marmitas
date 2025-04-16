import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
}

export interface Address {
  id: string;
  user_id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_items: OrderItem[];
}

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuth();

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setIsLoading(true);
      
      // Atualizar perfil no Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Atualizar dados do usuário no contexto
      if (user) {
        setUser({
          ...user,
          full_name: data.full_name || user.full_name,
          phone: data.phone || user.phone,
        });
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsLoading(true);

      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      // Validar tamanho do arquivo (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 2MB.');
      }

      // Gerar nome único para o arquivo com timestamp
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const filePath = `avatars/${user.id}/avatar-${timestamp}.${fileExt}`;

      // Remover avatar anterior se existir
      if (user.avatar_url) {
        try {
          const oldPath = user.avatar_url.split('/').slice(-3).join('/');
          await supabase.storage
            .from('images')
            .remove([oldPath]);
        } catch (error) {
          console.error('Erro ao remover avatar antigo:', error);
        }
      }

      // Upload para o bucket na pasta correta
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Atualizar avatar_url no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Atualizar dados do usuário no contexto
      setUser({
        ...user,
        avatar_url: publicUrl
      });

      toast.success('Foto atualizada com sucesso!');
      return publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao atualizar foto');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      toast.error('Erro ao carregar endereços');
      throw error;
    }
  };

  const addAddress = async (address: Omit<Address, 'id' | 'user_id'>) => {
    try {
      setIsLoading(true);

      // Se o novo endereço for padrão, remover o padrão dos outros
      if (address.is_default) {
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('user_addresses')
        .insert([
          {
            user_id: user?.id,
            ...address
          }
        ]);

      if (error) throw error;
      toast.success('Endereço adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar endereço:', error);
      toast.error('Erro ao adicionar endereço');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (address: Address) => {
    try {
      setIsLoading(true);

      // Se o endereço atualizado for padrão, remover o padrão dos outros
      if (address.is_default) {
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id)
          .neq('id', address.id);

        if (updateError) throw updateError;
      }

      const { error } = await supabase
        .from('user_addresses')
        .update({
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          postal_code: address.postal_code,
          city: address.city,
          state: address.state,
          is_default: address.is_default
        })
        .eq('id', address.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Endereço atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast.error('Erro ao atualizar endereço');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Endereço removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover endereço:', error);
      toast.error('Erro ao remover endereço');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getOrders = async () => {
    try {
      // Consulta simplificada para evitar problemas com joins aninhados
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, status, total')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Para cada pedido, buscar os itens separadamente
      const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id, 
            quantity, 
            price,
            product_id
          `)
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;

        // Buscar detalhes dos produtos para cada item
        const itemsWithProducts = await Promise.all(itemsData.map(async (item) => {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('name')
            .eq('id', item.product_id)
            .single();

          if (productError) return {
            ...item,
            product: { name: 'Produto não encontrado' }
          };

          return {
            ...item,
            product: productData
          };
        }));

        return {
          ...order,
          order_items: itemsWithProducts
        };
      }));

      return ordersWithItems;
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
      throw error;
    }
  };

  return {
    isLoading,
    updateProfile,
    updatePassword,
    uploadAvatar,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getOrders
  };
} 