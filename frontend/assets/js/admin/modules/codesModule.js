// ==========================================
// CODES-MODULE.JS - Módulo de Códigos
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import { NOTIFICATION_TYPES } from "../config.js";

class CodesModule {
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
              onclick="window.codesModule.loadData()" 
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
            onclick="window.codesModule.copy('${code.codigo}')" 
            class="flex-1 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
          >
            <i data-lucide="copy" class="w-4 h-4 inline mr-1"></i>
            Copiar
          </button>
          ${
            code.estado === "activo" ? this.renderDeactivateButton(code.id) : ""
          }
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

  renderDeactivateButton(codeId) {
    return `
      <button 
        onclick="window.codesModule.deactivate(${codeId})" 
        class="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
      >
        <i data-lucide="x-circle" class="w-4 h-4 inline"></i>
      </button>
    `;
  }

  copy(code) {
    uiService.copyToClipboard(code, "✅ Código copiado al portapapeles");
  }

  async deactivate(codeId) {
    if (!confirm("¿Estás seguro de desactivar este código?")) return;

    try {
      const data = await apiService.deactivateCode(codeId);

      if (data.success) {
        uiService.showNotification(
          "✅ Código desactivado exitosamente",
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
      console.error("Error desactivando código:", error);
      uiService.showNotification(
        "❌ Error al desactivar código",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }
}

export default new CodesModule();
