import { useLocation, useNavigate } from "react-router";
import { ShoppingCart, Users, FileText, GitBranch, TrendingUp, Wallet, ClipboardCheck, Box, Trash2, Truck, Smartphone } from "lucide-react";
import SalesOrders from "@/pages/SalesOrders";
import CRM from "@/pages/CRM";
import Quotation from "@/pages/Quotation";
import SalesPipeline from "@/pages/SalesPipeline";
import SalesForecasting from "@/pages/SalesForecasting";
import SalesCommissions from "@/pages/SalesCommissions";
import Dispatch from "@/pages/Dispatch";
import FinishedGoods from "@/pages/FinishedGoods";
import Wastage from "@/pages/Wastage";
import ShippingDelivery from "@/pages/ShippingDelivery";
import SalesRepApp from "@/pages/SalesRepApp";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "sales-orders", name: "أوامر البيع", icon: ShoppingCart, component: SalesOrders, path: "/sales-orders" },
  { id: "crm", name: "العملاء CRM", icon: Users, component: CRM, path: "/crm" },
  { id: "quotation", name: "عروض الأسعار", icon: FileText, component: Quotation, path: "/quotation" },
  { id: "pipeline", name: "خط البيع والفرص", icon: GitBranch, component: SalesPipeline, path: "/sales-pipeline" },
  { id: "forecasting", name: "التوقعات والذكاء", icon: TrendingUp, component: SalesForecasting, path: "/sales-forecasting" },
  { id: "commissions", name: "العمولات", icon: Wallet, component: SalesCommissions, path: "/sales-commissions" },
  { id: "dispatch", name: "أذونات الصرف", icon: ClipboardCheck, component: Dispatch, path: "/dispatch" },
  { id: "finished-goods", name: "مخزن المنتج النهائي", icon: Box, component: FinishedGoods, path: "/finished-goods" },
  { id: "wastage", name: "مخلفات الهالك والخرق", icon: Trash2, component: Wastage, path: "/wastage" },
  { id: "shipping", name: "الشحن والتوصيل", icon: Truck, component: ShippingDelivery, path: "/shipping-delivery" },
  { id: "sales-rep", name: "تطبيق المندوبين", icon: Smartphone, component: SalesRepApp, path: "/sales-rep-app" },
];

export default function SalesHub() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = TABS.find(t => t.path === location.pathname) || TABS[0];
  const activeTab = currentTab.id;

  const handleTabChange = (val: string) => {
    const targetTab = TABS.find(t => t.id === val);
    if (targetTab) {
      navigate(targetTab.path);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>المبيعات والعملاء والخدمات اللوجستية</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة طلبات المشترين، عروض الأسعار، خطوط التوصيل، وحسابات عمولات مندوبي المبيعات</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-max min-w-full justify-start border-b rounded-none bg-transparent p-0 h-auto" style={{ borderColor: "var(--border-color)" }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent data-[state=active]:border-amber-600 rounded-none bg-transparent hover:text-white transition-all text-sm font-medium"
                  style={{
                    color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TABS.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4 focus-visible:outline-none">
              {activeTab === tab.id && <Component />}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
