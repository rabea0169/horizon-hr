import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
};

export function useToast() {
  const toast = (options: ToastOptions) => {
    const { title, description, variant } = options;
    const message = description ? `${title}\n${description}` : (title || "");

    switch (variant) {
      case "destructive":
        sonnerToast.error(title, { description });
        break;
      case "success":
        sonnerToast.success(title, { description });
        break;
      case "warning":
        sonnerToast.warning(title, { description });
        break;
      default:
        sonnerToast(title, { description });
    }
  };

  return { toast };
}
