import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/finance/RevenueChart";
import { ExpenseManagement } from "@/components/admin/finance/ExpenseManagement";
import { SupplyOrderManagement } from "@/components/admin/finance/SupplyOrderManagement";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("revenues");
  const [activeSupplierTab, setActiveSupplierTab] = useState("suppliers");
  const { financialSummary, loadingSummary } = useFinance(undefined, undefined, undefined);

  const getBalanceVariant = () => {
    if (!financialSummary) return "text-muted-foreground";
    if (financialSummary.monthlyBalance > 0) return "text-green-600";
    if (financialSummary.monthlyBalance < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getBalanceIcon = () => {
    if (!financialSummary) return TrendingUp;
    if (financialSummary.monthlyBalance > 0) return TrendingUp;
    if (financialSummary.monthlyBalance < 0) return TrendingDown;
    return TrendingUp;
  };

  const BalanceIcon = getBalanceIcon();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Finanças</h1>
          <p className="text-muted-foreground">
            Gerencie as finanças do seu estabelecimento
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Saldo do Mês
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {loadingSummary 
                  ? "Carregando..." 
                  : formatCurrency(financialSummary?.monthlyBalance || 0)
                }
              </div>
              <p className={`text-xs mt-1 flex items-center ${getBalanceVariant()}`}>
                <BalanceIcon className="h-4 w-4 mr-1" />
                {financialSummary?.monthlyBalance === 0 
                  ? "Neutro este mês"
                  : financialSummary && financialSummary.monthlyBalance > 0
                    ? "Lucro este mês"
                    : "Prejuízo este mês"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Receitas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {loadingSummary 
                  ? "Carregando..." 
                  : formatCurrency(financialSummary?.totalRevenue || 0)
                }
              </div>
              <p className="text-xs text-green-600 mt-1">
                {financialSummary?.ordersCount || 0} pedidos este mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Despesas
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">
                {loadingSummary 
                  ? "Carregando..." 
                  : formatCurrency(financialSummary?.totalExpenses || 0)
                }
              </div>
              <p className="text-xs text-red-600 mt-1">
                {financialSummary?.expensesCount || 0} despesas este mês
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="revenues">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            {(activeTab === "suppliers" || activeTab === "supply-orders") && (
              <TabsTrigger value="supply-orders">/ Pedidos & Entregas</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="revenues" className="space-y-4">
            <RevenueChart />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <ExpenseManagement />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <SupplyOrderManagement activeTab="suppliers" />
          </TabsContent>

          <TabsContent value="supply-orders" className="space-y-4">
            <SupplyOrderManagement activeTab="orders" />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
