import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Lang = "ar" | "en";

const translations: Record<Lang, Record<string, string>> = {
  ar: {
    dashboard: "لوحة التحكم",
    employees: "العمال",
    attendance: "الحضور",
    payroll: "الرواتب",
    inventory: "المخزون",
    sales: "المبيعات",
    production: "الإنتاج",
    quality: "الجودة",
    reports: "التقارير",
    settings: "الإعدادات",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    print: "طباعة",
    total: "الإجمالي",
    status: "الحالة",
    date: "التاريخ",
    name: "الاسم",
    code: "الكود",
    amount: "المبلغ",
    quantity: "الكمية",
    price: "السعر",
    actions: "إجراءات",
    active: "نشط",
    inactive: "غير نشط",
    pending: "معلق",
    approved: "معتمد",
    rejected: "مرفوض",
    completed: "مكتمل",
    yes: "نعم",
    no: "لا",
    confirm: "تأكيد",
    close: "إغلاق",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
  },
  en: {
    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    payroll: "Payroll",
    inventory: "Inventory",
    sales: "Sales",
    production: "Production",
    quality: "Quality",
    reports: "Reports",
    settings: "Settings",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    filter: "Filter",
    export: "Export",
    print: "Print",
    total: "Total",
    status: "Status",
    date: "Date",
    name: "Name",
    code: "Code",
    amount: "Amount",
    quantity: "Quantity",
    price: "Price",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    close: "Close",
    loading: "Loading...",
    noData: "No data available",
    welcome: "Welcome",
    logout: "Logout",
    login: "Login",
    username: "Username",
    password: "Password",
    language: "Language",
    arabic: "العربية",
    english: "English",
  },
};

interface I18nContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const I18nCtx = createContext<I18nContext>({
  lang: "ar",
  setLang: () => {},
  t: (k) => k,
  dir: "rtl",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("hr_lang") as Lang) || "ar";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("hr_lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] || key,
    [lang]
  );

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}
