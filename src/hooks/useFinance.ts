import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  is_recurring: boolean;
  recurrence_type?: 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SupplyOrder {
  id: number;
  supplier_id: number;
  description: string;
  amount: number;
  quantity?: string;
  delivery_date: string;
  status: 'pending' | 'delivered' | 'overdue' | 'cancelled' | 'today';
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  supplier?: {
    name: string;
    phone?: string;
  };
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  monthlyBalance: number;
  ordersCount: number;
  expensesCount: number;
}

export function useFinance(expenseFilters?: { month?: number; year?: number }, supplyOrderFilters?: { month?: number; year?: number }, revenueFilters?: { month?: number; year?: number }) {
  const queryClient = useQueryClient();

  // Buscar resumo financeiro
  const { data: financialSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["financial-summary"],
    queryFn: async (): Promise<FinancialSummary> => {
      try {
        // Buscar receitas (pedidos concluídos do mês atual)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total, status')
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString())
          .is('deleted_at', null);

        if (ordersError) throw ordersError;

        // Buscar despesas do mês atual (incluindo pedidos / entregas entregues)
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .is('deleted_at', null);

        if (expensesError) throw expensesError;

        // Buscar pedidos / entregas do mês atual
        const { data: deliveredSupplyOrders, error: supplyOrdersError } = await supabase
          .from('supply_orders')
          .select('amount')
          .eq('status', 'delivered')
          .gte('delivery_date', startOfMonth.toISOString().split('T')[0])
          .is('deleted_at', null);

        if (supplyOrdersError) throw supplyOrdersError;

        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const expensesTotal = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
        const supplyOrdersTotal = deliveredSupplyOrders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
        const totalExpenses = expensesTotal + supplyOrdersTotal;
        
        return {
          totalRevenue,
          totalExpenses,
          monthlyBalance: totalRevenue - totalExpenses,
          ordersCount: orders?.length || 0,
          expensesCount: (expenses?.length || 0) + (deliveredSupplyOrders?.length || 0),
        };
      } catch (error) {
        console.error('Erro ao buscar resumo financeiro:', error);
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          monthlyBalance: 0,
          ordersCount: 0,
          expensesCount: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar fornecedores
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .is('deleted_at', null)
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return [];
      }
    },
  });

  // Buscar despesas (com ou sem filtros)
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", expenseFilters],
    queryFn: async (): Promise<(Expense & { source_type: 'expense' | 'supply_order' })[]> => {
      try {
        let expenseQuery = supabase
          .from('expenses')
          .select('*')
          .is('deleted_at', null);

        let supplyOrderQuery = supabase
          .from('supply_orders')
          .select(`
            id,
            description,
            amount,
            delivery_date,
            created_at,
            updated_at,
            supplier:suppliers!inner(name)
          `)
          .eq('status', 'delivered')
          .is('deleted_at', null);

        // Aplicar filtros se fornecidos
        if (expenseFilters?.month || expenseFilters?.year) {
          const currentYear = expenseFilters?.year || new Date().getFullYear();
          const currentMonth = expenseFilters?.month;
          
          if (currentMonth) {
            // Filtrar por mês específico
            const startDate = new Date(currentYear, currentMonth - 1, 1);
            const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            expenseQuery = expenseQuery
              .gte('date', startDateStr)
              .lte('date', endDateStr);
              
            supplyOrderQuery = supplyOrderQuery
              .gte('delivery_date', startDateStr)
              .lte('delivery_date', endDateStr);
          } else if (expenseFilters?.year) {
            // Filtrar apenas por ano
            const startDate = new Date(expenseFilters.year, 0, 1);
            const endDate = new Date(expenseFilters.year, 11, 31, 23, 59, 59, 999);
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            expenseQuery = expenseQuery
              .gte('date', startDateStr)
              .lte('date', endDateStr);
              
            supplyOrderQuery = supplyOrderQuery
              .gte('delivery_date', startDateStr)
              .lte('delivery_date', endDateStr);
          }
        }

        const [{ data: expenses, error: expensesError }, { data: supplyOrders, error: supplyOrdersError }] = await Promise.all([
          expenseQuery.order('date', { ascending: false }),
          supplyOrderQuery.order('delivery_date', { ascending: false })
        ]);

        if (expensesError) throw expensesError;
        if (supplyOrdersError) throw supplyOrdersError;

        // Formatar despesas regulares
        const formattedExpenses = (expenses || []).map(expense => ({
          ...expense,
          source_type: 'expense' as const
        }));

        // Formatar pedidos / entregas como despesas
        const formattedSupplyOrders = (supplyOrders || []).map(order => ({
          id: order.id,
          description: `${order.description} (${order.supplier?.name})`,
          amount: order.amount,
          category: 'supplies',
          date: order.delivery_date, // Usar delivery_date diretamente
          is_recurring: false,
          recurrence_type: undefined,
          created_at: order.created_at,
          updated_at: order.updated_at,
          deleted_at: undefined,
          source_type: 'supply_order' as const
        }));

        // Combinar e ordenar por data
        const allExpenses = [...formattedExpenses, ...formattedSupplyOrders]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return allExpenses;
      } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        return [];
      }
    },
  });

  // Buscar pedidos / entregas
  const { data: supplyOrders, isLoading: loadingSupplyOrders } = useQuery({
    queryKey: ["supply-orders", supplyOrderFilters],
    queryFn: async (): Promise<SupplyOrder[]> => {
      try {
        let supplyOrderQuery = supabase
          .from('supply_orders')
          .select(`
            *,
            supplier:suppliers!inner(name, phone)
          `)
          .is('deleted_at', null);

        // Aplicar filtros se fornecidos
        if (supplyOrderFilters?.month || supplyOrderFilters?.year) {
          const currentYear = supplyOrderFilters?.year || new Date().getFullYear();
          const currentMonth = supplyOrderFilters?.month;
          
          if (currentMonth) {
            // Filtrar por mês específico
            const startDate = new Date(currentYear, currentMonth - 1, 1);
            const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            supplyOrderQuery = supplyOrderQuery
              .gte('delivery_date', startDateStr)
              .lte('delivery_date', endDateStr);
          } else if (supplyOrderFilters?.year) {
            // Filtrar apenas por ano
            const startDate = new Date(supplyOrderFilters.year, 0, 1);
            const endDate = new Date(supplyOrderFilters.year, 11, 31, 23, 59, 59, 999);
            
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            supplyOrderQuery = supplyOrderQuery
              .gte('delivery_date', startDateStr)
              .lte('delivery_date', endDateStr);
          }
        }

        const { data, error } = await supplyOrderQuery.order('delivery_date', { ascending: false });

        if (error) throw error;

        // Atualizar status de pedidos baseado na data
        const today = new Date().toISOString().split('T')[0];
        const ordersToUpdate: { id: number; status: SupplyOrder['status'] }[] = [];

        data?.forEach(order => {
          if (order.status === 'pending' || order.status === 'today' || order.status === 'overdue') {
            if (order.delivery_date === today) {
              // Entrega hoje
              if (order.status !== 'today') {
                ordersToUpdate.push({ id: order.id, status: 'today' });
                order.status = 'today';
              }
            } else if (order.delivery_date < today) {
              // Atrasado
              if (order.status !== 'overdue') {
                ordersToUpdate.push({ id: order.id, status: 'overdue' });
                order.status = 'overdue';
              }
            } else {
              // Pendente (data futura)
              if (order.status !== 'pending') {
                ordersToUpdate.push({ id: order.id, status: 'pending' });
                order.status = 'pending';
              }
            }
          }
        });

        // Atualizar status no banco de dados se necessário
        if (ordersToUpdate.length > 0) {
          for (const update of ordersToUpdate) {
            await supabase
              .from('supply_orders')
              .update({ status: update.status })
              .eq('id', update.id);
          }
        }

        return data || [];
      } catch (error) {
        console.error('Erro ao buscar pedidos / entregas:', error);
        return [];
      }
    },
  });

  // Buscar receitas (pedidos concluídos)
  const { data: revenues, isLoading: loadingRevenues } = useQuery({
    queryKey: ["revenues", revenueFilters],
    queryFn: async () => {
      try {
        let revenueQuery = supabase
          .from('orders')
          .select(`
            id,
            total,
            created_at,
            status,
            user_id
          `)
          .eq('status', 'completed')
          .is('deleted_at', null);

        // Aplicar filtros se fornecidos
        if (revenueFilters?.month || revenueFilters?.year) {
          const currentYear = revenueFilters?.year || new Date().getFullYear();
          const currentMonth = revenueFilters?.month;
          
          if (currentMonth) {
            // Filtrar por mês específico
            const startDate = new Date(currentYear, currentMonth - 1, 1);
            const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
            
            revenueQuery = revenueQuery
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
          } else if (revenueFilters?.year) {
            // Filtrar apenas por ano
            const startDate = new Date(revenueFilters.year, 0, 1);
            const endDate = new Date(revenueFilters.year, 11, 31, 23, 59, 59, 999);
            
            revenueQuery = revenueQuery
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());
          }
        }

        const { data: orders, error } = await revenueQuery.order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
          return [];
        }

        // Buscar dados dos usuários separadamente
        const userIds = [...new Set(orders.map(order => order.user_id))];
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Combinar dados
        const revenuesWithUsers = orders.map(order => ({
          ...order,
          user: users?.find(user => user.id === order.user_id) || { full_name: 'Usuário não encontrado' }
        }));

        return revenuesWithUsers;
      } catch (error) {
        console.error('Erro ao buscar receitas:', error);
        return [];
      }
    },
  });

  // Criar fornecedor
  const createSupplier = useMutation({
    mutationFn: async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar fornecedor: " + (error.message || "Erro desconhecido"));
    }
  });

  // Atualizar fornecedor
  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplierData }: Partial<Supplier> & { id: number }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar fornecedor: " + (error.message || "Erro desconhecido"));
    }
  });

  // Excluir fornecedor
  const deleteSupplier = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir fornecedor: " + (error.message || "Erro desconhecido"));
    }
  });

  // Criar despesa
  const createExpense = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar despesa: " + (error.message || "Erro desconhecido"));
    }
  });

  // Excluir despesa
  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir despesa: " + (error.message || "Erro desconhecido"));
    }
  });

  // Função para buscar despesas com filtros específicos
  const getFilteredExpenses = (filters: { month?: number; year?: number }) => {
    // Esta função agora apenas retorna os dados já filtrados
    return { data: expenses, isLoading: loadingExpenses };
  };

  // Criar pedido de insumo
  const createSupplyOrder = useMutation({
    mutationFn: async (orderData: Omit<SupplyOrder, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'supplier'>) => {
      const { error } = await supabase
        .from('supply_orders')
        .insert([orderData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] }); // Invalidar despesas também
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Pedido de insumo criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar pedido de insumo: " + (error.message || "Erro desconhecido"));
    }
  });

  // Atualizar status do pedido de insumo
  const updateSupplyOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: SupplyOrder['status'] }) => {
      const { error } = await supabase
        .from('supply_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] }); // Invalidar despesas também
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + (error.message || "Erro desconhecido"));
    }
  });

  // Atualizar pedido de insumo
  const updateSupplyOrder = useMutation({
    mutationFn: async ({ id, ...orderData }: Partial<SupplyOrder> & { id: number }) => {
      const { error } = await supabase
        .from('supply_orders')
        .update(orderData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] }); // Invalidar despesas também
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Pedido atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar pedido: " + (error.message || "Erro desconhecido"));
    }
  });

  // Excluir pedido de insumo
  const deleteSupplyOrder = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('supply_orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] }); // Invalidar despesas também
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Pedido excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir pedido: " + (error.message || "Erro desconhecido"));
    }
  });

  return {
    // Data
    financialSummary,
    suppliers,
    expenses,
    supplyOrders,
    revenues,
    
    // Loading states
    loadingSummary,
    loadingSuppliers,
    loadingExpenses,
    loadingSupplyOrders,
    loadingRevenues,
    
    // Mutations
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createExpense,
    deleteExpense,
    createSupplyOrder,
    updateSupplyOrderStatus,
    updateSupplyOrder,
    deleteSupplyOrder,

    // Additional functions
    getFilteredExpenses,
  };
} 