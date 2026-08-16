import { useLocation, useNavigate } from "react-router";
import { GitBranch, Wallet, ClipboardList, FileText, Receipt, CreditCard, Clock, BarChart3, Calculator, Award } from "lucide-react";
import ChartOfAccounts from "@/pages/ChartOfAccounts";
import Treasury from "@/pages/Treasury";
import OpeningBalances from "@/pages/OpeningBalances";
import Vouchers from "@/pages/Vouchers";
import Invoices from "@/pages/Invoices";
import Expenses from "@/pages/Expenses";
import AgingCredit from "@/pages/AgingCredit";
import FinancialReport from "@/pages/FinancialReport";
import Payroll from "@/pages/Payroll";
import PieceRate from "@/pages/PieceRate";
import Advances from "@/pages/Advances";
import BonusPenalties from "@/pages/BonusPenalties";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "chart-of-accounts", name: "شجرة الحسابات", icon: GitBranch, component: ChartOfAccounts, path: "/chart-of-accounts" },
  { id: "treasury", name: "إدارة الخزينة", icon: Wallet, component: Treasury, path: "/treasury" },
  { id: "opening-balances", name: "الأرصدة الافتتاحية", icon: ClipboardList, component: OpeningBalances, path: "/opening-balances" },
  { id: "vouchers", name: "سندات القيود", icon: FileText, component: Vouchers, path: "/vouchers" },
  { id: "invoices", name: "الفواتير", icon: Receipt, component: Invoices, path: "/invoices" },
  { id: "expenses", name: "المصروفات", icon: CreditCard, component: Expenses, path: "/expenses" },
  { id: "aging-credit", name: "أعمار الديون", icon: Clock, component: AgingCredit, path: "/aging-credit" },
  { id: "financial-report", name: "التقارير المالية", icon: BarChart3, component: FinancialReport, path: "/financial" },
  { id: "payroll", name: "كشف الرواتب", icon: CreditCard, component: Payroll, path: "/payroll" },
  { id: "piece-rate", name: "أجر القطعة", icon: Calculator, component: PieceRate, path: "/piece-rate" },
  { id: "advances", name: "السلف", icon: Wallet, component: Advances, path: "/advances" },
  { id: "bonuses", name: "المكافآت والخصومات", icon: Award, component: BonusPenalties, path: "/bonuses" },
];

export default function AccountingHub() {
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
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>الحسابات العامة والمالية والرواتب</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة دفتر الأستاذ العام، سندات الصرف والقبض، القيود المحاسبية، الرواتب والأجور</p>
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
