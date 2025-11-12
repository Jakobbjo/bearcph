import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import yoloLogo from "@/assets/yolo-logo.jpeg";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  if (isAdmin) {
    navigate("/admin");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login succesfuld",
        description: "Du er nu logget ind",
      });
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Login fejl",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={yoloLogo} alt="Yolo Pizza" className="h-20 w-20 mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Log ind for at administrere ordrer</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card p-8 rounded-2xl border-2 border-border shadow-lg space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yolopizza.dk"
              required
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-background border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? "Logger ind..." : "Log ind"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          >
            Tilbage til forsiden
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
