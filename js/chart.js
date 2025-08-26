/**
 * Chart Manager for Budget Management Application
 * Handles Chart.js visualizations for financial data
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#fbbf24',
            info: '#3b82f6',
            light: '#f8fafc',
            dark: '#374151'
        };
        
        this.categoryColors = [
            '#667eea', '#764ba2', '#22c55e', '#ef4444', '#fbbf24', 
            '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316',
            '#6366f1', '#84cc16', '#06b6d4', '#ec4899', '#14b8a6'
        ];
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.createCategoryChart();
        this.createIncomeExpenseChart();
        this.createTrendChart();
        this.createBudgetChart();
    }

    /**
     * Destroy existing chart if it exists
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * Create spending by category pie chart
     */
    createCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        this.destroyChart('category');

        const spendingData = window.storageManager.getSpendingByCategory();
        const categories = Object.keys(spendingData);
        const amounts = Object.values(spendingData);

        if (categories.length === 0) {
            this.showNoDataMessage(ctx, 'No spending data available');
            return;
        }

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: this.categoryColors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create income vs expenses bar chart
     */
    createIncomeExpenseChart() {
        const ctx = document.getElementById('income-expense-chart');
        if (!ctx) return;

        this.destroyChart('incomeExpense');

        const period = document.getElementById('analytics-period')?.value || 'month';
        const { startDate, endDate } = this.getPeriodDates(period);
        
        const totalIncome = window.storageManager.getTotalIncome(startDate, endDate);
        const totalExpenses = window.storageManager.getTotalExpenses(startDate, endDate);

        this.charts.incomeExpense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [totalIncome, totalExpenses],
                    backgroundColor: [this.defaultColors.success, this.defaultColors.danger],
                    borderWidth: 0,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create monthly trends line chart
     */
    createTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        this.destroyChart('trend');

        const currentYear = new Date().getFullYear();
        const monthlyData = window.storageManager.getMonthlySpendingData(currentYear);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const incomeData = [];
        const expenseData = [];
        
        for (let i = 0; i < 12; i++) {
            const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            incomeData.push(monthlyData[monthKey]?.income || 0);
            expenseData.push(monthlyData[monthKey]?.expense || 0);
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: this.defaultColors.success,
                        backgroundColor: this.defaultColors.success + '20',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: this.defaultColors.danger,
                        backgroundColor: this.defaultColors.danger + '20',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Create budget vs actual horizontal bar chart
     */
    createBudgetChart() {
        const ctx = document.getElementById('budget-chart');
        if (!ctx) return;

        this.destroyChart('budget');

        const budgetData = window.storageManager.getBudgetVsActual();
        
        if (budgetData.length === 0) {
            this.showNoDataMessage(ctx, 'No budget data available');
            return;
        }

        const categories = budgetData.map(b => b.category);
        const budgetAmounts = budgetData.map(b => b.budgetAmount);
        const actualAmounts = budgetData.map(b => b.actualSpent);

        this.charts.budget = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Budget',
                        data: budgetAmounts,
                        backgroundColor: this.defaultColors.primary + '80',
                        borderColor: this.defaultColors.primary,
                        borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: actualAmounts,
                        backgroundColor: this.defaultColors.warning + '80',
                        borderColor: this.defaultColors.warning,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.x.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update charts based on selected period
     */
    updateChartsForPeriod(period) {
        this.createCategoryChart();
        this.createIncomeExpenseChart();
        if (period === 'year' || period === 'all') {
            this.createTrendChart();
        }
        this.createBudgetChart();
    }

    /**
     * Get date range for specified period
     */
    getPeriodDates(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'all':
            default:
                startDate = null;
                endDate = null;
                break;
        }

        return { startDate, endDate };
    }

    /**
     * Show no data message on canvas
     */
    showNoDataMessage(ctx, message) {
        const canvas = ctx.canvas;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Arial';
        context.fillStyle = '#6b7280';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    /**
     * Refresh all charts
     */
    refreshAllCharts() {
        this.createCategoryChart();
        this.createIncomeExpenseChart();
        this.createTrendChart();
        this.createBudgetChart();
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }

    /**
     * Create a simple chart for reports
     */
    createReportChart(canvasId, type, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };

        return new Chart(ctx, {
            type: type,
            data: data,
            options: { ...defaultOptions, ...options }
        });
    }

    /**
     * Export chart as image
     */
    exportChartAsImage(chartId, filename = 'chart.png') {
        if (!this.charts[chartId]) return;

        const link = document.createElement('a');
        link.download = filename;
        link.href = this.charts[chartId].toBase64Image();
        link.click();
    }
}

// Create global instance
window.chartManager = new ChartManager();