import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  default_address: Address | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  total_spent: number;
  last_purchase: string | null;
}

interface Address {
  id: string;
  user_id: string;
  receiver: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    title: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_address: Address;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    },
    enabled: !!user,
    staleTime: 1000 * 60 // 1 minute
  });

  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    error: addressesError
  } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user?.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching addresses:", error);
        return [];
      }

      return data as Address[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 // 1 minute
  });

  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: ordersError
  } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_orders_with_items", {
        p_user_id: user?.id
      });

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }

      return data as Order[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 // 1 minute
  });

  const { mutateAsync: updateProfile } = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    }
  });

  const { mutateAsync: updatePassword } = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating password:", error);
      toast.error("Erro ao atualizar senha. Tente novamente.");
    }
  });

  const { mutateAsync: uploadAvatar } = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("O arquivo deve ter no máximo 2MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      toast.success("Avatar atualizado com sucesso!");
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error) => {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar. Tente novamente.");
    }
  });

  const { mutateAsync: addAddress } = useMutation({
    mutationFn: async (address: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (address.is_default) {
        await supabase.rpc("clear_default_addresses", {
          p_user_id: user?.id
        });
      }

      const { data, error } = await supabase
        .from("user_addresses")
        .insert({ ...address, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;

      toast.success("Endereço adicionado com sucesso!");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
    onError: (error) => {
      console.error("Error adding address:", error);
      toast.error("Erro ao adicionar endereço. Tente novamente.");
    }
  });

  const { mutateAsync: updateAddress } = useMutation({
    mutationFn: async ({ id, ...address }: Partial<Address> & { id: string }) => {
      if (address.is_default) {
        await supabase.rpc("clear_default_addresses", {
          p_user_id: user?.id,
          p_exclude_address_id: id
        });
      }

      const { error } = await supabase
        .from("user_addresses")
        .update(address)
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Endereço atualizado com sucesso!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
    onError: (error) => {
      console.error("Error updating address:", error);
      toast.error("Erro ao atualizar endereço. Tente novamente.");
    }
  });

  const { mutateAsync: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_addresses")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Endereço removido com sucesso!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
    onError: (error) => {
      console.error("Error deleting address:", error);
      toast.error("Erro ao remover endereço. Tente novamente.");
    }
  });

  return {
    profile,
    addresses,
    orders,
    isLoading: isLoadingProfile || isLoadingAddresses || isLoadingOrders,
    error: profileError || addressesError || ordersError,
    updateProfile,
    updatePassword,
    uploadAvatar,
    addAddress,
    updateAddress,
    deleteAddress
  };
} 