import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import yoloLogo from "@/assets/yolo-logo.jpeg";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const tabs = [
    { name: "Ordrer", path: "/admin" },
    { name: "Kunder", path: "/admin/customers" },
    { name: "Menu", path: "/admin/menu" },
    { name: "Analyse", path: "/admin/analytics" },
    { name: "Rapporter", path: "/admin/reports" },
    { name: "Webhooks", path: "/admin/webhooks" },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Fejl ved logout",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

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
            <Button onClick={handleLogout} variant="outline" className="border-2 border-secondary text-secondary">
              Log ud
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-muted border-b border-border px-6 py-2">
        <div className="max-w-7xl mx-auto flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              variant={location.pathname === tab.path ? "default" : "ghost"}
              className={
                location.pathname === tab.path
                  ? "bg-primary text-primary-foreground rounded-full px-8"
                  : "text-secondary hover:bg-secondary/10 rounded-full px-8"
              }
            >
              {tab.name}
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
