// ==========================================
// UI-SERVICE.JS - Servicio de UI
// ==========================================

import { CONFIG, NOTIFICATION_TYPES } from "../config.js";

class UIService {
  showNotification(message, type = NOTIFICATION_TYPES.INFO) {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 translate-x-full`;

    const colors = {
      [NOTIFICATION_TYPES.SUCCESS]: "bg-green-500 text-white",
      [NOTIFICATION_TYPES.ERROR]: "bg-red-500 text-white",
      [NOTIFICATION_TYPES.INFO]: "bg-blue-500 text-white",
      [NOTIFICATION_TYPES.WARNING]: "bg-yellow-500 text-white",
    };

    const icons = {
      [NOTIFICATION_TYPES.SUCCESS]: "check-circle",
      [NOTIFICATION_TYPES.ERROR]: "alert-circle",
      [NOTIFICATION_TYPES.INFO]: "info",
      [NOTIFICATION_TYPES.WARNING]: "alert-triangle",
    };

    notification.className +=
      " " + (colors[type] || colors[NOTIFICATION_TYPES.INFO]);
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <i data-lucide="${
          icons[type] || icons[NOTIFICATION_TYPES.INFO]
        }" class="w-5 h-5"></i>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => {
      notification.classList.remove("translate-x-full");
      notification.classList.add("translate-x-0");
    }, 10);

    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, CONFIG.NOTIFICATION_DURATION);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.add("opacity-100");
      const content = modal.querySelector(".modal-content");
      if (content) {
        content.classList.remove("scale-95", "opacity-0");
        content.classList.add("scale-100", "opacity-100");
      }
    }, 10);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const content = modal.querySelector(".modal-content");
    if (content) {
      content.classList.add("scale-95", "opacity-0");
      content.classList.remove("scale-100", "opacity-100");
    }

    setTimeout(() => {
      modal.classList.remove("opacity-100");
      modal.classList.add("hidden");
    }, 300);
  }

  updateMainContent(htmlContent) {
    const mainContent = document.querySelector("main");
    const currentTitle = mainContent.querySelector("h1");
    const titleHTML = currentTitle
      ? currentTitle.outerHTML
      : '<h1 class="text-2xl sm:text-3xl font-semibold text-slate-800 mb-6">Panel de Administración</h1>';

    mainContent.innerHTML = titleHTML + htmlContent;
    lucide.createIcons();
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      overlay.classList.toggle("hidden");
    }
  }

  closeSidebarMobile() {
    if (window.innerWidth < 1024) {
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebarOverlay");

      if (sidebar && overlay) {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
      }
    }
  }

  copyToClipboard(text, successMessage = "✅ Copiado al portapapeles") {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.showNotification(successMessage, NOTIFICATION_TYPES.SUCCESS);
      })
      .catch((err) => {
        console.error("Error copiando:", err);
        this.showNotification("❌ Error al copiar", NOTIFICATION_TYPES.ERROR);
      });
  }
}

export default new UIService();
