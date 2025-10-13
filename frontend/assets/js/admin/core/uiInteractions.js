// ==========================================
// UI-INTERACTIONS.JS - Interacciones de UI
// ==========================================

import authService from "../services/authService.js";
import uiService from "../services/uiService.js";

class UIInteractions {
  init() {
    this.initLogout();
    this.initMobileMenu();
    this.initProfileDropdown();
    this.initSidebarToggle();
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  initLogout() {
    const logoutBtn = document.getElementById("logoutButton");

    logoutBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      authService.logout();
    });
  }

  // ==========================================
  // MOBILE MENU
  // ==========================================
  initMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuButton");
    const overlay = document.getElementById("sidebarOverlay");

    mobileMenuBtn?.addEventListener("click", () => {
      uiService.toggleSidebar();
    });

    overlay?.addEventListener("click", () => {
      uiService.toggleSidebar();
    });
  }

  // ==========================================
  // PROFILE DROPDOWN
  // ==========================================
  initProfileDropdown() {
    const profileBtn = document.getElementById("profileButton");
    const dropdown = document.getElementById("profileDropdown");

    if (!profileBtn || !dropdown) return;

    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown(dropdown);
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
        this.closeDropdown(dropdown);
      }
    });
  }

  toggleDropdown(dropdown) {
    const isHidden = dropdown.classList.contains("pointer-events-none");

    if (isHidden) {
      this.openDropdown(dropdown);
    } else {
      this.closeDropdown(dropdown);
    }
  }

  openDropdown(dropdown) {
    dropdown.classList.remove(
      "pointer-events-none",
      "opacity-0",
      "scale-95",
      "-translate-y-2"
    );
    dropdown.classList.add(
      "pointer-events-auto",
      "opacity-100",
      "scale-100",
      "translate-y-0"
    );
  }

  closeDropdown(dropdown) {
    dropdown.classList.add(
      "pointer-events-none",
      "opacity-0",
      "scale-95",
      "-translate-y-2"
    );
    dropdown.classList.remove(
      "pointer-events-auto",
      "opacity-100",
      "scale-100",
      "translate-y-0"
    );
  }

  // ==========================================
  // SIDEBAR TOGGLE (Collapse/Expand)
  // ==========================================
  initSidebarToggle() {
    const toggleBtn = document.getElementById("sidebarToggle");

    toggleBtn?.addEventListener("click", () => {
      this.toggleSidebarCollapse();
    });
  }

  toggleSidebarCollapse() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const logoText = document.getElementById("sidebarLogoText");
    const menuTexts = document.querySelectorAll(".menu-text");
    const toggleIconOpen = document.getElementById("toggleIconOpen");
    const toggleIconClosed = document.getElementById("toggleIconClosed");

    if (!sidebar || !mainContent) return;

    const isCollapsed = sidebar.classList.contains("w-64");

    if (isCollapsed) {
      // Colapsar sidebar
      sidebar.classList.remove("w-64");
      sidebar.classList.add("w-20");
      mainContent.classList.remove("lg:ml-64");
      mainContent.classList.add("lg:ml-20");
      logoText?.classList.add("hidden");
      menuTexts.forEach((text) => text.classList.add("hidden"));
      toggleIconOpen?.classList.add("hidden");
      toggleIconClosed?.classList.remove("hidden");
    } else {
      // Expandir sidebar
      sidebar.classList.add("w-64");
      sidebar.classList.remove("w-20");
      mainContent.classList.add("lg:ml-64");
      mainContent.classList.remove("lg:ml-20");
      logoText?.classList.remove("hidden");
      menuTexts.forEach((text) => text.classList.remove("hidden"));
      toggleIconOpen?.classList.remove("hidden");
      toggleIconClosed?.classList.add("hidden");
    }
  }
}

export default new UIInteractions();
