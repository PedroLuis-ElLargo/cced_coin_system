// ==========================================
// MODAL-HANDLER.JS - Manejador de Modales
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import navigationModule from "./navigationModule.js";
import dashboardModule from "../modules/dashboardModule.js";
import { NOTIFICATION_TYPES } from "../config.js";

class ModalHandler {
  init() {
    this.initNewStudentModal();
    this.initNewTaskModal();
    this.initGenerateCodeModal();
  }

  // ==========================================
  // MODAL: NUEVO ESTUDIANTE
  // ==========================================
  initNewStudentModal() {
    const closeBtn = document.getElementById("closeNewStudentModal");
    const cancelBtn = document.getElementById("cancelNewStudent");
    const form = document.getElementById("newStudentForm");

    // Usar delegación de eventos para botones dinámicos
    document.addEventListener("click", (e) => {
      if (
        e.target.id === "openNewStudentModal" ||
        e.target.closest("#openNewStudentModal")
      ) {
        uiService.openModal("newStudentModal");
      }
    });

    closeBtn?.addEventListener("click", () => {
      uiService.closeModal("newStudentModal");
    });

    cancelBtn?.addEventListener("click", () => {
      uiService.closeModal("newStudentModal");
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleNewStudent();
    });
  }

  async handleNewStudent() {
    const nombre = document.getElementById("studentName").value;
    const email = document.getElementById("studentEmail").value;
    const password = document.getElementById("studentPassword").value;

    if (!nombre || !email || !password) {
      uiService.showNotification(
        "Por favor completa todos los campos",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    if (password.length < 6) {
      uiService.showNotification(
        "La contraseña debe tener al menos 6 caracteres",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const data = await apiService.createStudent({ nombre, email, password });

      if (data.success) {
        uiService.showNotification(
          "✅ Estudiante creado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        uiService.closeModal("newStudentModal");
        document.getElementById("newStudentForm").reset();

        // Recargar datos según la sección actual
        const currentSection = navigationModule.getCurrentSection();
        if (currentSection === "dashboard") {
          await dashboardModule.loadStats();
        } else if (currentSection === "estudiantes") {
          const studentsModule = await import("../modules/studentsModule.js");
          await studentsModule.default.loadData();
        }
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error creando estudiante:", error);
      uiService.showNotification(
        "❌ Error al crear estudiante",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // MODAL: NUEVA TAREA
  // ==========================================
  initNewTaskModal() {
    const closeBtn = document.getElementById("closeNewTaskModal");
    const cancelBtn = document.getElementById("cancelNewTask");
    const form = document.getElementById("newTaskForm");

    // Usar delegación de eventos para botones dinámicos
    document.addEventListener("click", (e) => {
      if (
        e.target.id === "openNewTaskModal" ||
        e.target.closest("#openNewTaskModal")
      ) {
        uiService.openModal("newTaskModal");
      }
    });

    closeBtn?.addEventListener("click", () => {
      uiService.closeModal("newTaskModal");
    });

    cancelBtn?.addEventListener("click", () => {
      uiService.closeModal("newTaskModal");
    });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleNewTask();
    });
  }

  async handleNewTask() {
    const titulo = document.getElementById("taskTitle").value;
    const descripcion = document.getElementById("taskDescription").value;
    const recompensa = document.getElementById("taskReward").value;
    const fecha_limite = document.getElementById("taskDueDate").value;

    if (!titulo || !recompensa) {
      uiService.showNotification(
        "Por favor completa el título y la recompensa",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    try {
      const data = await apiService.createTask({
        titulo,
        descripcion,
        recompensa: parseFloat(recompensa),
        fecha_limite: fecha_limite || null,
        dificultad: "media",
      });

      if (data.success) {
        uiService.showNotification(
          "✅ Tarea creada exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
        uiService.closeModal("newTaskModal");
        document.getElementById("newTaskForm").reset();

        // Recargar datos según la sección actual
        const currentSection = navigationModule.getCurrentSection();
        if (currentSection === "dashboard") {
          await dashboardModule.loadStats();
        } else if (currentSection === "tareas") {
          const tasksModule = await import("../modules/tasksModule.js");
          await tasksModule.default.loadData();
        }
      } else {
        uiService.showNotification(
          "❌ " + data.message,
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error creando tarea:", error);
      uiService.showNotification(
        "❌ Error al crear tarea",
        NOTIFICATION_TYPES.ERROR
      );
    }
  }

  // ==========================================
  // MODAL: GENERAR CÓDIGO
  // ==========================================
  initGenerateCodeModal() {
    const closeBtn = document.getElementById("closeGenerateCodeModal");
    const cancelBtn = document.getElementById("cancelGenerateCode");
    const generateBtn = document.getElementById("generateNewCode");
    const copyBtn = document.getElementById("copyCodeButton");

    // Usar delegación de eventos para botones dinámicos
    document.addEventListener("click", (e) => {
      if (
        e.target.id === "openGenerateCodeModal" ||
        e.target.closest("#openGenerateCodeModal") ||
        e.target.id === "openGenerateCodeModalEmpty" ||
        e.target.closest("#openGenerateCodeModalEmpty")
      ) {
        uiService.openModal("generateCodeModal");
        this.generateCode();
      }
    });

    closeBtn?.addEventListener("click", () => {
      uiService.closeModal("generateCodeModal");
    });

    cancelBtn?.addEventListener("click", () => {
      uiService.closeModal("generateCodeModal");
    });

    generateBtn?.addEventListener("click", () => {
      this.generateCode();
    });

    copyBtn?.addEventListener("click", () => {
      const code = document.getElementById("generatedCode").textContent;
      uiService.copyToClipboard(code, "✅ Código copiado al portapapeles");
    });
  }

  async generateCode() {
    try {
      const expirationDate = document.getElementById("codeExpiration")?.value;
      let dias_validos = null;

      if (expirationDate) {
        const expDate = new Date(expirationDate);
        const today = new Date();
        const diffTime = expDate - today;
        dias_validos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const data = await apiService.generateCode({ dias_validos });

      if (data.success) {
        const codeEl = document.getElementById("generatedCode");
        if (codeEl) {
          codeEl.textContent = data.code;
        }
        uiService.showNotification(
          "✅ Código generado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );
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
    }
  }
}

export default new ModalHandler();
