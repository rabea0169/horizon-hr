import { useState, useCallback } from "react";

export interface PrintSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string; // base64 or URL
  taxNumber: string;
  commercialRegister: string;
  headerEnabled: boolean;
  footerEnabled: boolean;
  signaturesEnabled: boolean;
  paperSize: "A4" | "A5" | "Letter";
  orientation: "portrait" | "landscape";
  signatureAccountant: string;
  signatureManager: string;
  signatureAccountantEnabled: boolean;
  signatureManagerEnabled: boolean;
  showDate: boolean;
  showPageNumbers: boolean;
  fontSize: "small" | "medium" | "large";
  notes: string;
}

const DEFAULT_SETTINGS: PrintSettings = {
  companyName: "مصنع سليم للملابس الجاهزة",
  companyAddress: "المنطقة الصناعية الثالثة، العاشر من رمضان، مصر",
  companyPhone: "+20 15 1234 5678",
  companyEmail: "info@selim-garments.com",
  companyLogo: "",
  taxNumber: "123-456-789",
  commercialRegister: "56478",
  headerEnabled: true,
  footerEnabled: true,
  signaturesEnabled: true,
  paperSize: "A4",
  orientation: "portrait",
  signatureAccountant: "المحاسب",
  signatureManager: "مدير المصنع",
  signatureAccountantEnabled: true,
  signatureManagerEnabled: true,
  showDate: true,
  showPageNumbers: true,
  fontSize: "medium",
  notes: "",
};

const STORAGE_KEY = "hr_print_settings";

function loadSettings(): PrintSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function usePrintSettings() {
  const [settings, setSettingsState] = useState<PrintSettings>(loadSettings);

  const setSettings = useCallback((newSettings: PrintSettings) => {
    setSettingsState(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const updateSetting = useCallback(<K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettingsState((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }, []);

  return { settings, setSettings, updateSetting, resetSettings };
}
