import { useLocation, useNavigate } from "react-router";
import { Box, Users, ClipboardList, ShoppingCart, FileText, ClipboardCheck } from "lucide-react";
import Inventory from "@/pages/Inventory";
import Suppliers from "@/pages/Suppliers";
import PurchaseRequests from "@/pages/PurchaseRequests";
import PurchaseOrders from "@/pages/PurchaseOrders";
import RFQ from "@/pages/RFQ";
import GoodsReceipt from "@/pages/GoodsReceipt";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "inventory", name: "المخازن والمواد", icon: Box, component: Inventory, path: "/inventory" },
  { id: "suppliers", name: "الموردين", icon: Users, component: Suppliers, path: "/suppliers" },
  { id: "requests", name: "طلبات الشراء", icon: ClipboardList, component: PurchaseRequests, path: "/purchase-requests" },
  { id: "orders", name: "أوامر الشراء", icon: ShoppingCart, component: PurchaseOrders, path: "/purchase-orders" },
  { id: "rfq", name: "عروض الأسعار RFQ", icon: FileText, component: RFQ, path: "/rfq" },
  { id: "receipts", name: "إشعارات الاستلام", icon: ClipboardCheck, component: GoodsReceipt, path: "/goods-receipt" },
];

export default function InventoryHub() {
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
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>المخازن والمشتريات والمواد</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>متابعة أرصدة المخازن، عروض أسعار الموردين، وإشعارات استلام البضائع</p>
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
