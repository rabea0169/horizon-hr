import { useLocation, useNavigate } from "react-router";
import { Users, Building2, Clock, CalendarDays, Award, Briefcase, CalendarRange } from "lucide-react";
import Employees from "@/pages/Employees";
import Departments from "@/pages/Departments";
import Attendance from "@/pages/Attendance";
import Shifts from "@/pages/Shifts";
import Leaves from "@/pages/Leaves";
import Recruitment from "@/pages/Recruitment";
import Performance from "@/pages/Performance";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "employees", name: "الموظفون", icon: Users, component: Employees, path: "/employees" },
  { id: "departments", name: "الأقسام", icon: Building2, component: Departments, path: "/departments" },
  { id: "attendance", name: "تسجيل الحضور", icon: Clock, component: Attendance, path: "/attendance" },
  { id: "shifts", name: "الورديات", icon: CalendarRange, component: Shifts, path: "/shifts" },
  { id: "leaves", name: "الإجازات", icon: CalendarDays, component: Leaves, path: "/leaves" },
  { id: "recruitment", name: "التوظيف", icon: Briefcase, component: Recruitment, path: "/recruitment" },
  { id: "performance", name: "تقييم الأداء", icon: Award, component: Performance, path: "/performance" },
];

export default function HRHub() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Find active tab based on pathname
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
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>الموارد البشرية وشؤون العاملين</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة شؤون الموظفين، الحضور، الإجازات، والتوظيف في مكان واحد</p>
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
