// ==========================================
// MODAL-HANDLER.JS - Manejador de Modales
// ==========================================

import apiService from "../services/apiService.js";
import uiService from "../services/uiService.js";
import navigationModule from "./navigationModule.js";
import dashboardModule from "../modules/dashboardModule.js";
import { NOTIFICATION_TYPES } from "../config.js";

class ModalHandler {
  constructor() {
    this.listenersInitialized = false;
    this.isGeneratingCode = false;
  }
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
    const nombre = document.getElementById("studentName")?.value?.trim();
    const email = document.getElementById("studentEmail")?.value?.trim();
    const password = document.getElementById("studentPassword")?.value;

    // Validaciones
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      uiService.showNotification(
        "Por favor ingresa un email válido",
        NOTIFICATION_TYPES.ERROR
      );
      return;
    }

    // Deshabilitar el botón de submit para evitar envíos duplicados
    const submitBtn = document.querySelector(
      '#newStudentForm button[type="submit"]'
    );
    const originalBtnText = submitBtn?.textContent;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i data-lucide="loader" class="w-4 h-4 inline mr-2 animate-spin"></i> Creando...';
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
      }
    }

    try {
      console.log("Enviando datos:", { nombre, email, password: "***" });

      const data = await apiService.createStudent({
        nombre: nombre,
        email: email,
        password: password,
      });

      console.log("Respuesta del servidor:", data);

      if (data.success) {
        uiService.showNotification(
          "✅ Estudiante creado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );

        // Cerrar modal y limpiar formulario
        uiService.closeModal("newStudentModal");
        document.getElementById("newStudentForm").reset();

        // ✅ MÉTODO ROBUSTO: Siempre recargar datos sin importar errores
        try {
          const currentSection = this.getCurrentSection();
          console.log("Sección actual:", currentSection);

          if (currentSection === "dashboard") {
            await dashboardModule.loadStats();
          } else if (currentSection === "students") {
            try {
              const studentsModule = await import(
                "../modules/studentsModule.js"
              );
              if (studentsModule.default && studentsModule.default.loadData) {
                await studentsModule.default.loadData();
              }
            } catch (moduleErr) {
              console.warn(
                "Error recargando módulo de estudiantes:",
                moduleErr
              );
              // ✅ FALLBACK: Recargar página completa si falla
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          }
        } catch (reloadErr) {
          console.error("Error en recarga:", reloadErr);
          // ✅ FALLBACK: Recargar página después de 1.5 segundos
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        uiService.showNotification(
          "❌ " + (data.message || "Error al crear estudiante"),
          NOTIFICATION_TYPES.ERROR
        );
      }
    } catch (error) {
      console.error("Error creando estudiante:", error);
      uiService.showNotification(
        "❌ Error de conexión. Verifica si el estudiante fue creado.",
        NOTIFICATION_TYPES.ERROR
      );

      // ✅ IMPORTANTE: Informar al usuario que revise
      setTimeout(() => {
        uiService.showNotification(
          "🔄 Recargando para verificar cambios...",
          NOTIFICATION_TYPES.INFO
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }, 3000);
    } finally {
      // Rehabilitar botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText || "Agregar Estudiante";
      }
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
  // MODAL: GENERAR CÓDIGO (CORREGIDO)
  // ==========================================
  initGenerateCodeModal() {
    // ✅ Evitar inicializar múltiples veces
    if (this.listenersInitialized) {
      return;
    }
    this.listenersInitialized = true;

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
        this.openGenerateCodeModal();
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
      if (code && code !== "STHELA-2025-XXXX") {
        uiService.copyToClipboard(code, "✅ Código copiado al portapapeles");
      } else {
        uiService.showNotification(
          "❌ No hay código generado para copiar",
          NOTIFICATION_TYPES.ERROR
        );
      }
    });
  }

  openGenerateCodeModal() {
    const dateInput = document.getElementById("codeExpiration");

    // Establecer fecha mínima (mañana)
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split("T")[0];

      // Establecer fecha por defecto (30 días)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      dateInput.value = defaultDate.toISOString().split("T")[0];
    }

    // Resetear código mostrado
    const codeEl = document.getElementById("generatedCode");
    if (codeEl) {
      codeEl.textContent = "STHELA-2025-XXXX";
    }

    uiService.openModal("generateCodeModal");
  }

  async generateCode() {
    // ✅ Prevenir ejecuciones simultáneas
    if (this.isGeneratingCode) {
      return;
    }

    this.isGeneratingCode = true;

    try {
      const dateInput = document.getElementById("codeExpiration");
      const generateBtn = document.getElementById("generateNewCode");

      // Validar que se haya seleccionado una fecha
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

      // Deshabilitar botón mientras se genera
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = "Generando...";
      }

      // Enviar la fecha directamente como string
      const data = await apiService.generateCode(dateInput.value);

      if (data.success) {
        const codeEl = document.getElementById("generatedCode");
        if (codeEl) {
          codeEl.textContent = data.code;
        }

        uiService.showNotification(
          "✅ Código generado exitosamente",
          NOTIFICATION_TYPES.SUCCESS
        );

        // Intentar recargar la lista de códigos
        try {
          const codesModule = await import("../modules/codesModule.js");
          if (codesModule.default && codesModule.default.loadData) {
            await codesModule.default.loadData();
          }
        } catch (err) {
          console.error("Error recargando lista de códigos:", err);
          uiService.showNotification(
            "❌ Error al recargar la lista de códigos",
            NOTIFICATION_TYPES.ERROR
          );
        }
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
      const generateBtn = document.getElementById("generateNewCode");
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generar Nuevo";
      }

      // ✅ Liberar la bandera
      this.isGeneratingCode = false;
    }
  }
}

export default new ModalHandler();
