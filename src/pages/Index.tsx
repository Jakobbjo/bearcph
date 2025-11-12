import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import yoloLogo from "@/assets/yolo-logo.jpeg";
import pizzaHero from "@/assets/pizza-hero.jpg";

const Index = () => {
  const navigate = useNavigate();

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("available", true)
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const groupedMenu = menuItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={yoloLogo} alt="Yolo Pizza" className="h-12 w-12 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Yolo Pizza</h1>
              <p className="text-sm text-muted-foreground">Administrationsoversigt</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src="https://flagcdn.com/w40/gb.png" alt="English" className="h-6" />
            <Button onClick={() => navigate("/track")} variant="outline" className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              Spor Ordre
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-primary mb-4">Vores Autentiske Pizzaer</h2>
          <p className="text-xl text-secondary mb-12">Håndlavet med kærlighed efter traditionelle italienske opskrifter</p>
          
          <div className="mb-12">
            <img src={pizzaHero} alt="Autentiske pizzaer" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Menu and Order Section */}
      <section className="py-16 px-6 bg-card">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Menu */}
          <div className="bg-background p-8 rounded-2xl border-2 border-border shadow-lg">
            <h3 className="text-3xl font-bold text-secondary mb-4">Vores Menu</h3>
            <p className="text-muted-foreground mb-8">Friske pizzaer lavet med autentiske italienske ingredienser</p>
            
            {Object.entries(groupedMenu).map(([category, items]: [string, any]) => (
              <div key={category} className="mb-8">
                <h4 className="text-2xl font-bold text-primary mb-4 capitalize">{category}</h4>
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">10. {item.name}</p>
                      {item.description && (
                        <p className="text-sm text-secondary">{item.description}</p>
                      )}
                    </div>
                    <p className="font-bold text-secondary">{item.price} kr.</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Order Form */}
          <div className="bg-background p-8 rounded-2xl border-2 border-border shadow-lg">
            <h3 className="text-3xl font-bold text-secondary mb-4">Bestil</h3>
            <p className="text-muted-foreground mb-8">Udfyld dine oplysninger og vælg dine varer</p>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Fulde navn <span className="text-primary">*</span>
                </label>
                <Input placeholder="John Doe" className="bg-card border-border" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Telefonnummer <span className="text-primary">*</span>
                </label>
                <Input placeholder="+45 12 34 56 78" className="bg-card border-border" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Leveringsadresse <span className="text-primary">*</span>
                </label>
                <Textarea placeholder="Gadenavn 123, 2000 Frederiksberg" className="bg-card border-border" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Særlige ønsker eller allergier
                </label>
                <Textarea placeholder="F.eks. ingen løg, glutenfri..." className="bg-card border-border" rows={3} />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
                Ring og bestil nu: +45 12 34 56 78
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
