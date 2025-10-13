// ==========================================
// API-SERVICE.JS - Servicio de API
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

  // Tareas
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

  // Códigos
  async getCodes() {
    return this.request("/admin/codes");
  }

  async generateCode(codeData) {
    return this.request("/admin/codes/generate", {
      method: "POST",
      body: JSON.stringify(codeData),
    });
  }

  async deactivateCode(id) {
    return this.request(`/admin/codes/${id}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // MONEDAS (NUEVO)
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
}

export default new ApiService();
