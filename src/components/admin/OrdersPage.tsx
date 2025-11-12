import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";

const OrdersPage = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: orderItemsCounts } = useQuery({
    queryKey: ["orderItemsCounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((item) => {
        counts[item.order_id] = (counts[item.order_id] || 0) + 1;
      });
      return counts;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Indlæser ordrer...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ordrer</h1>
          <p className="text-muted-foreground">Administrer indgående ordrer og opdater deres status</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Ny ordre
        </Button>
      </div>

      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-6 py-4 font-semibold text-foreground">Ordre #</th>
              <th className="px-6 py-4 font-semibold text-foreground">Kunde</th>
              <th className="px-6 py-4 font-semibold text-foreground">Varer</th>
              <th className="px-6 py-4 font-semibold text-foreground">I alt</th>
              <th className="px-6 py-4 font-semibold text-foreground">Metode</th>
              <th className="px-6 py-4 font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 font-semibold text-foreground">Dato</th>
              <th className="px-6 py-4 font-semibold text-foreground">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-medium">{order.order_number}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{order.customers?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{order.customers?.phone || "N/A"}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{orderItemsCounts?.[order.id] || 0}</td>
                <td className="px-6 py-4 font-semibold">{order.total_amount} kr.</td>
                <td className="px-6 py-4 capitalize">{order.delivery_method}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                    {order.order_status === "pending" ? "Afventer" : order.order_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {format(new Date(order.created_at), "MMM d, HH:mm", { locale: da })}
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Ingen ordrer endnu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
