// ==========================================
// API-SERVICE.JS - Servicio de API ACTUALIZADO
// ==========================================

import { CONFIG } from "../config.js";
import authService from "./authService.js";

class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_URL;
  }

  getHeaders(includeContentType = false) {
    const headers = {
      Authorization: `Bearer ${authService.getToken()}`,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(options.method !== "GET"),
          ...options.headers,
        },
      });

      return await response.json();
    } catch (error) {
      console.error(`Error en petición ${endpoint}:`, error);
      throw error;
    }
  }

  // Estadísticas
  async getStatistics() {
    return this.request("/admin/statistics");
  }

  // Estudiantes
  async getStudents() {
    return this.request("/admin/students");
  }

  async createStudent(studentData) {
    return this.request("/admin/students", {
      method: "POST",
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id, studentData) {
    return this.request(`/admin/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id) {
    return this.request(`/admin/students/${id}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // TAREAS
  // ==========================================
  async getTasks() {
    return this.request("/admin/tasks");
  }

  async createTask(taskData) {
    return this.request("/admin/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/admin/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/admin/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // ARCHIVOS DE TAREAS (NUEVO)
  // ==========================================

  async uploadTaskFiles(taskId, formData) {
    try {
      const response = await fetch(
        `${this.baseURL}/admin/tasks/${taskId}/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al subir archivos");
      }

      return data;
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      throw error;
    }
  }

  async getTaskFiles(taskId) {
    return this.request(`/admin/tasks/${taskId}/files`);
  }

  async deleteTaskFile(taskId, fileId) {
    return this.request(`/admin/tasks/files/${fileId}`, {
      method: "DELETE",
    });
  }

  getFileDownloadUrl(taskId, fileId) {
    return `${this.baseURL}/admin/tasks/files/${fileId}/download`;
  }

  // ==========================================
  // MÉTODOS DE CÓDIGOS DE REGISTRO
  // ==========================================

  // Generar código de registro
  async generateCode(fechaExpiracion) {
    return this.request("/admin/codes/generate", {
      method: "POST",
      body: JSON.stringify({ fecha_expiracion: fechaExpiracion }),
    });
  }

  // Obtener todos los códigos
  async getCodes() {
    return this.request("/admin/codes", {
      method: "GET",
    });
  }

  // Actualizar fecha de expiración de código
  async updateCodeExpiration(codeId, fechaExpiracion) {
    return this.request(`/admin/codes/${codeId}/expiration`, {
      method: "PUT",
      body: JSON.stringify({ fecha_expiracion: fechaExpiracion }),
    });
  }

  // Eliminar código
  async deleteCode(codeId) {
    return this.request(`/admin/codes/${codeId}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // MONEDAS
  // ==========================================
  async addCoinsToStudent(studentId, amount, reason) {
    return this.request("/admin/coins/add", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        amount: amount,
        reason: reason,
      }),
    });
  }

  async removeCoinsFromStudent(studentId, amount, reason) {
    return this.request("/admin/coins/remove", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        amount: amount,
        reason: reason,
      }),
    });
  }

  async getTransactions() {
    return this.request("/admin/transactions");
  }

  // ==========================================
  // MÉTODOS DE CALIFICACIONES
  // ==========================================

  // Periodos Escolares
  async getPeriodos() {
    return this.request("/admin/periodos", { method: "GET" });
  }

  async getPeriodoActivo() {
    return this.request("/admin/periodos/activo", { method: "GET" });
  }

  async createPeriodo(periodoData) {
    return this.request("/admin/periodos", {
      method: "POST",
      body: JSON.stringify(periodoData),
    });
  }

  // Materias
  async getMaterias(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/materias?${query}`, { method: "GET" });
  }

  async createMateria(materiaData) {
    return this.request("/admin/materias", {
      method: "POST",
      body: JSON.stringify(materiaData),
    });
  }

  // Resultados de Aprendizaje
  async getResultadosAprendizaje(materiaId) {
    return this.request(`/admin/materias/${materiaId}/resultados`, {
      method: "GET",
    });
  }

  async createResultadosAprendizaje(materiaId, resultados) {
    return this.request(`/admin/materias/${materiaId}/resultados`, {
      method: "POST",
      body: JSON.stringify({ resultados }),
    });
  }

  // Inscripciones
  async inscribirEstudiante(inscripcionData) {
    return this.request("/admin/inscripciones", {
      method: "POST",
      body: JSON.stringify(inscripcionData),
    });
  }

  async getInscripcionesEstudiante(estudianteId, periodoId = null) {
    const query = periodoId ? `?periodoId=${periodoId}` : "";
    return this.request(
      `/admin/inscripciones/estudiante/${estudianteId}${query}`,
      {
        method: "GET",
      }
    );
  }

  // Calificaciones Académicas
  async registrarCalificacionAcademica(calificacionData) {
    return this.request("/admin/calificaciones/academicas", {
      method: "POST",
      body: JSON.stringify(calificacionData),
    });
  }

  async getCalificacionesAcademicas(inscripcionId) {
    return this.request(`/admin/calificaciones/academicas/${inscripcionId}`, {
      method: "GET",
    });
  }

  // Calificaciones Módulos Formativos
  async registrarCalificacionModulo(calificacionData) {
    return this.request("/admin/calificaciones/modulos", {
      method: "POST",
      body: JSON.stringify(calificacionData),
    });
  }

  async getCalificacionesModulo(inscripcionId) {
    return this.request(`/admin/calificaciones/modulos/${inscripcionId}`, {
      method: "GET",
    });
  }

  // Reportes
  async getReporteEstudiante(estudianteId, periodoId) {
    return this.request(
      `/admin/reportes/estudiante/${estudianteId}/periodo/${periodoId}`,
      {
        method: "GET",
      }
    );
  }

  async getListadoEstudiantes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/reportes/listado?${query}`, {
      method: "GET",
    });
  }
}

export default new ApiService();
