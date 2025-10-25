// ==========================================
// CODES-MODULE.JS - Módulo de Códigos
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class CodesModule {
  constructor() {
    this.lastGeneratedCode = null;
  }

  render() {
    const content = `
      <div class="space-y-6">
        <div class="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
          <h2 class="text-lg font-semibold text-slate-700">Códigos de Registro</h2>
          <button id="openGenerateCodeModal" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm">
            <i data-lucide="key-round" class="w-4 h-4"></i>
            Generar Código
          </button>
        </div>
        <div id="codesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="text-center py-12 col-span-full">
            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400"></i>
            <p class="text-slate-400">Cargando códigos...</p>
          </div>
        </div>
      </div>
    `;

    uiService.updateMainContent(content);
    this.loadData();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      const data = await apiService.getCodes();
      const container = document.getElementById("codesContainer");

      if (!container) return;

      if (data.success && data.codes && data.codes.length > 0) {
        container.innerHTML = data.codes
          .map((code) => this.createCodeCard(code))
          .join("");
      } else {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i data-lucide="key" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
            <p class="text-slate-400 mb-4">No hay códigos generados</p>
            <button 
              id="openGenerateCodeModalEmpty"
              class="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
            >
              <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
              Generar Primer Código
            </button>
          </div>
        `;
      }

      lucide.createIcons();
    } catch (error) {
      console.error("Error cargando códigos:", error);
      const container = document.getElementById("codesContainer");

      if (container) {
        container.innerHTML = `
          <div class="col-span-full bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-red-500"></i>
            <h3 class="text-xl font-semibold text-red-800 mb-2">Error al Cargar Códigos</h3>
            <p class="text-red-700 mb-4">${error.message}</p>
            <button 
              id="retryLoadCodesBtn"
              class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-2"></i>
              Reintentar
            </button>
          </div>
        `;
        lucide.createIcons();
      }
    }
  }

  createCodeCard(code) {
    const stateConfig = this.getStateConfig(code.estado);
    const canModify = code.estado === "activo";

    return `
      <div class="bg-white p-6 rounded-xl shadow-lg border-2 ${
        stateConfig.borderColor
      }">
        <div class="flex justify-between items-start mb-4">
          <code class="text-lg font-mono font-bold text-purple-600 break-all">${
            code.codigo
          }</code>
          <span class="px-2 py-1 text-xs rounded-full ${
            stateConfig.badgeColor
          } ml-2 whitespace-nowrap">
            ${code.estado}
          </span>
        </div>
        <div class="space-y-2 text-sm text-slate-600">
          <p class="flex items-center">
            <i data-lucide="calendar" class="w-4 h-4 inline mr-2"></i> 
            Creado: ${new Date(code.fecha_creacion).toLocaleDateString("es-ES")}
          </p>
          ${this.renderExpiration(code.fecha_expiracion)}
          ${this.renderCreator(code.creado_por_nombre)}
          ${this.renderUsedBy(code.usado, code.usado_por_nombre)}
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <button 
            data-action="copy"
            data-code="${code.codigo}"
            class="flex-1 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
            title="Copiar código"
          >
            <i data-lucide="copy" class="w-4 h-4 inline mr-1"></i>
            Copiar
          </button>
          ${canModify ? this.renderModifyButtons(code.id) : ""}
        </div>
      </div>
    `;
  }

  getStateConfig(estado) {
    const configs = {
      activo: {
        borderColor: "border-green-200",
        badgeColor: "bg-green-100 text-green-700",
      },
      usado: {
        borderColor: "border-blue-200",
        badgeColor: "bg-blue-100 text-blue-700",
      },
      expirado: {
        borderColor: "border-red-200",
        badgeColor: "bg-red-100 text-red-700",
      },
    };

    return (
      configs[estado] || {
        borderColor: "border-slate-200",
        badgeColor: "bg-slate-100 text-slate-600",
      }
    );
  }

  renderExpiration(fecha_expiracion) {
    if (!fecha_expiracion) {
      return '<p class="flex items-center"><i data-lucide="infinity" class="w-4 h-4 inline mr-2"></i> Sin expiración</p>';
    }

    return `
      <p class="flex items-center">
        <i data-lucide="clock" class="w-4 h-4 inline mr-2"></i> 
        Expira: ${new Date(fecha_expiracion).toLocaleDateString("es-ES")}
      </p>
    `;
  }

  renderCreator(creado_por_nombre) {
    if (!creado_por_nombre) return "";

    return `
      <p class="flex items-center">
        <i data-lucide="user" class="w-4 h-4 inline mr-2"></i> 
        Creado por: ${creado_por_nombre}
      </p>
    `;
  }

  renderUsedBy(usado, usado_por_nombre) {
    if (!usado || !usado_por_nombre) return "";

    return `
      <p class="flex items-center text-blue-600">
        <i data-lucide="user-check" class="w-4 h-4 inline mr-2"></i> 
        Usado por: ${usado_por_nombre}
      </p>
    `;
  }

  renderModifyButtons(codeId) {
    return `
      <button 
        data-action="update-expiration"
        data-id="${codeId}"
        class="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
        title="Modificar fecha de expiración"
      >
        <i data-lucide="calendar-clock" class="w-4 h-4 inline"></i>
      </button>
      <button 
        data-action="delete"
        data-id="${codeId}"
        class="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
        title="Eliminar código"
      >
        <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
      </button>
    `;
  }

  // ==========================================
  // CONFIGURAR EVENT LISTENERS
  // ==========================================
  setupEventListeners() {
    // Abrir modal de generar código
    const openGen = document.getElementById("openGenerateCodeModal");
    if (openGen) {
      openGen.addEventListener("click", () => this.openGenerateModal());
    }

    const openGenEmpty = document.getElementById("openGenerateCodeModalEmpty");
    if (openGenEmpty) {
      openGenEmpty.addEventListener("click", () => this.openGenerateModal());
    }

    // Cerrar modal
    const closeModal = document.getElementById("closeGenerateCodeModal");
    if (closeModal) {
      closeModal.addEventListener("click", () => this.closeGenerateModal());
    }

    const cancelBtn = document.getElementById("cancelGenerateCode");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeGenerateModal());
    }

    // Generar código
    const generateBtn = document.getElementById("generateNewCode");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.handleGenerateCode());
    }

    // Copiar código generado
    const copyBtn = document.getElementById("copyCodeButton");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyGeneratedCode());
    }

    // Retry load
    const retryBtn = document.getElementById("retryLoadCodesBtn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => this.loadData());
    }

    // Acciones de códigos (copiar, editar, eliminar)
    const container = document.getElementById("codesContainer");
    if (container) {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        const code = btn.getAttribute("data-code");

        switch (action) {
          case "copy":
            this.copy(code);
            break;
          case "update-expiration":
            this.showUpdateExpirationDialog(Number(id));
            break;
          case "delete":
            this.delete(Number(id));
            break;
        }
      });
    }
  }

  // ==========================================
  // GESTIÓN DEL MODAL DE GENERACIÓN
  // ==========================================
  openGenerateModal() {
    const modal = document.getElementById("generateCodeModal");
    const backdrop = modal;
    const content = modal.querySelector(".modal-content");

    if (!modal) return;

    // Resetear modal
    this.resetGenerateModal();

    // Establecer fecha mínima (hoy)
    const dateInput = document.getElementById("codeExpiration");
    if (dateInput) {
      const today = new Date();
      today.setDate(today.getDate() + 1); // Mínimo mañana
      dateInput.min = today.toISOString().split("T")[0];

      // Establecer fecha por defecto (30 días)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      dateInput.value = defaultDate.toISOString().split("T")[0];
    }

    // Mostrar modal con animación
    modal.classList.remove("hidden");
    setTimeout(() => {
      backdrop.classList.remove("opacity-0");
      content.classList.remove("scale-95", "opacity-0");
    }, 10);

    lucide.createIcons();
  }

  closeGenerateModal() {
    const modal = document.getElementById("generateCodeModal");
    const backdrop = modal;
    const content = modal.querySelector(".modal-content");

    if (!modal) return;

    // Animación de cierre
    backdrop.classList.add("opacity-0");
    content.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  }

  resetGenerateModal() {
    const codeDisplay = document.getElementById("generatedCode");
    if (codeDisplay) {
      codeDisplay.textContent = "STHELA-2024-XXXX";
      codeDisplay.classList.remove("text-purple-600");
      codeDisplay.classList.add("text-slate-400");
    }

    const dateInput = document.getElementById("codeExpiration");
    if (dateInput) {
      dateInput.value = "";
    }

    this.lastGeneratedCode = null;
  }

  async handleGenerateCode() {
    const dateInput = document.getElementById("codeExpiration");
    const generateBtn = document.getElementById("generateNewCode");

    if (!dateInput || !dateInput.value) {
      uiService.showNotification(
        "❌ Debes seleccionar una fecha de expiración",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    // Validar que la fecha sea futura
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      uiService.showNotification(
        "❌ La fecha de expiración debe ser futura",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    // Deshabilitar botón
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `
      <i data-lucide="loader" class="w-4 h-4 inline mr-2 animate-spin"></i>
      Generando...
    `;
      lucide.createIcons();
    }

    try {
      // ✅ ENVIAR LA FECHA COMO STRING (dateInput.value ya es un string "YYYY-MM-DD")
      const data = await apiService.generateCode(dateInput.value);

      if (data.success) {
        // Mostrar código generado
        const codeDisplay = document.getElementById("generatedCode");
        if (codeDisplay) {
          codeDisplay.textContent = data.code;
          codeDisplay.classList.remove("text-slate-400");
          codeDisplay.classList.add("text-purple-600");
        }

        this.lastGeneratedCode = data.code;

        uiService.showNotification(
          "✅ Código generado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );

        // Recargar lista en segundo plano
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error generando código:", error);
      uiService.showNotification(
        "❌ Error al generar código",
        NOTIFICATION_TYPES.ERROR
      );
    } finally {
      // Restaurar botón
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = "Generar Nuevo";
      }
    }
  }

  copyGeneratedCode() {
    if (!this.lastGeneratedCode) {
      uiService.showNotification(
        "❌ No hay código generado para copiar",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    uiService.copyToClipboard(
      this.lastGeneratedCode,
      "✅ Código copiado al portapapeles"
    );
  }

  // ==========================================
  // ACCIONES DE CÓDIGOS
  // ==========================================
  copy(code) {
    uiService.copyToClipboard(code, "✅ Código copiado al portapapeles");
  }

  showUpdateExpirationDialog(codeId) {
    const fecha = prompt(
      "Ingresa la nueva fecha de expiración (formato: YYYY-MM-DD)\nEjemplo: 2025-12-31"
    );

    if (fecha === null) return;

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      uiService.showNotification(
        "❌ Formato de fecha inválido. Usa YYYY-MM-DD",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    // Validar que sea fecha futura
    const selectedDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      uiService.showNotification(
        "❌ La fecha debe ser futura",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    this.updateExpiration(codeId, fecha);
  }

  async updateExpiration(codeId, fechaExpiracion) {
    try {
      const data = await apiService.updateCodeExpiration(
        codeId,
        fechaExpiracion
      );

      if (data.success) {
        uiService.showNotification(
          "✅ Fecha de expiración actualizada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error actualizando fecha de expiración:", error);
      uiService.showNotification(
        "❌ Error al actualizar fecha de expiración",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  async delete(codeId) {
    if (
      !confirm(
        "¿Estás seguro de eliminar este código?\n\nEsta acción no se puede deshacer."
      )
    )
      return;

    try {
      const data = await apiService.deleteCode(codeId);

      if (data.success) {
        uiService.showNotification(
          "✅ Código eliminado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        this.loadData();
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error eliminando código:", error);
      uiService.showNotification(
        "❌ Error al eliminar código",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }
}

export default new CodesModule();
