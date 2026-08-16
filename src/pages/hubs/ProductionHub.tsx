import { useLocation, useNavigate } from "react-router";
import {
  Factory as FactoryIcon, Shirt, Scissors, Layers, QrCode,
  Calculator, Cog, Ruler, GitBranch, Activity
} from "lucide-react";
import Factory from "@/pages/Factory";
import ProductionModels from "@/pages/ProductionModels";
import Cutting from "@/pages/Cutting";
import WorkOrders from "@/pages/WorkOrders";
import QRTracking from "@/pages/QRTracking";
import BOM from "@/pages/BOM";
import Machines from "@/pages/Machines";
import SAMCalculator from "@/pages/SAMCalculator";
import LineBalancing from "@/pages/LineBalancing";
import RealTimeProduction from "@/pages/RealTimeProduction";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "factory", name: "لوحة المصنع", icon: FactoryIcon, component: Factory, path: "/factory" },
  { id: "models", name: "موديلات الإنتاج", icon: Shirt, component: ProductionModels, path: "/production-models" },
  { id: "cutting", name: "أوامر القص", icon: Scissors, component: Cutting, path: "/cutting" },
  { id: "work-orders", name: "أوامر التشغيل", icon: Layers, component: WorkOrders, path: "/work-orders" },
  { id: "qr-tracking", name: "تتبع الحزم QR", icon: QrCode, component: QRTracking, path: "/qr-tracking" },
  { id: "bom", name: "قائمة المواد BOM", icon: Calculator, component: BOM, path: "/bom" },
  { id: "machines", name: "إدارة الماكينات", icon: Cog, component: Machines, path: "/machines" },
  { id: "sam", name: "حساب SAM", icon: Ruler, component: SAMCalculator, path: "/sam-calculator" },
  { id: "balancing", name: "توازن الخطوط", icon: GitBranch, component: LineBalancing, path: "/line-balancing" },
  { id: "telemetry", name: "الإنتاج اللحظي", icon: Activity, component: RealTimeProduction, path: "/realtime-production" },
];

export default function ProductionHub() {
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
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>التخطيط والإنتاج والتصنيع</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة ومراقبة خطوط الإنتاج والقص ومطابقة المواصفات الفنية</p>
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
