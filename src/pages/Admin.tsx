import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import OrdersPage from "@/components/admin/OrdersPage";
import CustomersPage from "@/components/admin/CustomersPage";
import MenuPage from "@/components/admin/MenuPage";
import AnalyticsPage from "@/components/admin/AnalyticsPage";
import ReportsPage from "@/components/admin/ReportsPage";
import WebhooksPage from "@/components/admin/WebhooksPage";

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Indlæser...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<OrdersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
