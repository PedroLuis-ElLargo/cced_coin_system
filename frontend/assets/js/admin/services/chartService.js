// ==========================================
// CHART-SERVICE.JS - Servicio de Gráficos
// ==========================================

import { CONFIG } from "../config.js";

class ChartService {
  constructor() {
    this.charts = {};
  }

  createCoinsDistributionChart(students) {
    const ctx = document.getElementById("coinsDistributionChart");
    if (!ctx) return;

    if (this.charts.coinsDistribution) {
      this.charts.coinsDistribution.destroy();
    }

    const top5 = students.slice(0, 5);

    this.charts.coinsDistribution = new Chart(ctx, {
      type: "line",
      data: {
        labels: top5.map((s) => s.nombre),
        datasets: [
          {
            label: "CCED Coins",
            data: top5.map((s) => s.balance),
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            borderColor: "rgba(245, 158, 11, 1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + " CCED";
              },
            },
          },
        },
      },
    });
  }

  createTopStudentsChart(students) {
    const ctx = document.getElementById("topStudentsChart");
    if (!ctx) return;

    if (this.charts.topStudents) {
      this.charts.topStudents.destroy();
    }

    const top5 = students.slice(0, 5);

    this.charts.topStudents = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: top5.map((s) => s.nombre),
        datasets: [
          {
            data: top5.map((s) => s.tareas_completadas),
            backgroundColor: [
              CONFIG.CHART_COLORS.primary,
              CONFIG.CHART_COLORS.success,
              CONFIG.CHART_COLORS.warning,
              CONFIG.CHART_COLORS.purple,
              CONFIG.CHART_COLORS.danger,
            ],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "Tareas Completadas",
          },
        },
      },
    });
  }

  destroyAll() {
    Object.values(this.charts).forEach((chart) => chart.destroy());
    this.charts = {};
  }
}

export default new ChartService();
