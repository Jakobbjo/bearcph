import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="text-center py-8">Indlæser kunder...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kunder</h1>
          <p className="text-muted-foreground">Administrer kundeoplysninger</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Ny kunde
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg kunder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-6 py-4 font-semibold text-foreground">Navn</th>
              <th className="px-6 py-4 font-semibold text-foreground">Telefon</th>
              <th className="px-6 py-4 font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 font-semibold text-foreground">Adresse</th>
              <th className="px-6 py-4 font-semibold text-foreground">Bemærkninger</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer: any) => (
              <tr key={customer.id} className="border-t border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-medium">{customer.name}</td>
                <td className="px-6 py-4">{customer.phone}</td>
                <td className="px-6 py-4">{customer.email || "-"}</td>
                <td className="px-6 py-4">{customer.address || "-"}</td>
                <td className="px-6 py-4">{customer.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "Ingen kunder fundet" : "Ingen kunder endnu"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
