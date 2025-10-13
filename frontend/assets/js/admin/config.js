// ==========================================
// CONFIG.JS - Configuración Global
// ==========================================

export const CONFIG = {
  API_URL: "http://localhost:4000/api",
  STORAGE_KEYS: {
    ADMIN_TOKEN: "adminToken",
  },
  NOTIFICATION_DURATION: 3000,
  CHART_COLORS: {
    primary: "rgba(59, 130, 246, 0.8)",
    success: "rgba(34, 197, 94, 0.8)",
    warning: "rgba(245, 158, 11, 0.8)",
    purple: "rgba(168, 85, 247, 0.8)",
    danger: "rgba(239, 68, 68, 0.8)",
  },
};

export const ROUTES = {
  LOGIN: "login.html",
  HOME: "../../../../frontend/index.html",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};
