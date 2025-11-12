import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import yoloLogo from "@/assets/yolo-logo.jpeg";

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={yoloLogo} alt="Yolo Pizza" className="h-12 w-12 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Yolo Pizza</h1>
              <p className="text-sm text-muted-foreground">Spor din ordre</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="border-2 border-secondary text-secondary">
            Tilbage
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-card p-8 rounded-2xl border-2 border-border shadow-lg">
          <h2 className="text-3xl font-bold text-primary mb-4">Spor Din Ordre</h2>
          <p className="text-muted-foreground mb-8">
            Indtast dit ordrenummer og telefonnummer for at se status på din ordre
          </p>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ordrenummer
              </label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="202511120001"
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefonnummer
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 12 34 56 78"
                className="bg-background border-border"
              />
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Spor Ordre
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
