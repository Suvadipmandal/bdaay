/**
 * Budget Management Application - Main JavaScript File
 * Handles all UI interactions and application logic
 */

class BudgetApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.editingTransaction = null;
        this.editingBudget = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.populateCategories();
        this.loadDashboard();
        this.setDefaultDates();
        
        // Initialize charts when analytics tab is first opened
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.chartManager) {
                    window.chartManager.initializeCharts();
                }
            }, 100);
        });
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Quick action buttons
        document.querySelector('.add-income')?.addEventListener('click', () => {
            this.openTransactionModal('income');
        });

        document.querySelector('.add-expense')?.addEventListener('click', () => {
            this.openTransactionModal('expense');
        });

        document.querySelector('.set-budget')?.addEventListener('click', () => {
            this.openBudgetModal();
        });

        // Transaction management
        document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('transaction-form')?.addEventListener('submit', (e) => {
            this.handleTransactionSubmit(e);
        });

        // Budget management
        document.getElementById('add-budget-btn')?.addEventListener('click', () => {
            this.openBudgetModal();
        });

        document.getElementById('budget-form')?.addEventListener('submit', (e) => {
            this.handleBudgetSubmit(e);
        });

        // Modal controls
        document.querySelectorAll('.close, #cancel-transaction, #cancel-budget').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Filter controls
        document.getElementById('filter-category')?.addEventListener('change', () => {
            this.loadTransactions();
        });

        document.getElementById('filter-type')?.addEventListener('change', () => {
            this.loadTransactions();
        });

        // Analytics period selector
        document.getElementById('analytics-period')?.addEventListener('change', (e) => {
            if (window.chartManager) {
                window.chartManager.updateChartsForPeriod(e.target.value);
            }
        });

        // Report generation
        document.getElementById('generate-report-btn')?.addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('export-csv-btn')?.addEventListener('click', () => {
            this.exportToCSV();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Transaction type change
        document.getElementById('transaction-type')?.addEventListener('change', (e) => {
            this.updateCategoriesForType(e.target.value);
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load specific tab content
        switch (tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'budgets':
                this.loadBudgets();
                break;
            case 'analytics':
                if (window.chartManager) {
                    setTimeout(() => window.chartManager.refreshAllCharts(), 100);
                }
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    /**
     * Load dashboard data
     */
    loadDashboard() {
        const totalIncome = window.storageManager.getTotalIncome();
        const totalExpenses = window.storageManager.getTotalExpenses();
        const netBalance = totalIncome - totalExpenses;

        // Update balance cards
        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('net-balance').textContent = this.formatCurrency(netBalance);

        // Update balance card classes based on positive/negative
        const balanceCard = document.querySelector('.balance-card.balance');
        if (balanceCard) {
            const amountElement = balanceCard.querySelector('.amount');
            amountElement.className = 'amount';
            if (netBalance >= 0) {
                amountElement.classList.add('income');
            } else {
                amountElement.classList.add('expense');
            }
        }

        this.loadRecentTransactions();
        this.loadBudgetOverview();
    }

    /**
     * Load recent transactions for dashboard
     */
    loadRecentTransactions() {
        const transactions = window.storageManager.getTransactions()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const container = document.getElementById('recent-transactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #6b7280; padding: 2rem;">No transactions yet. Add your first transaction to get started!</p>';
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-desc">${transaction.description}</div>
                    <div class="transaction-meta">${transaction.category} • ${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">${this.formatCurrency(transaction.amount)}</div>
            </div>
        `).join('');
    }

    /**
     * Load budget overview for dashboard
     */
    loadBudgetOverview() {
        const budgetData = window.storageManager.getBudgetVsActual();
        const container = document.getElementById('budget-overview');
        if (!container) return;

        if (budgetData.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #6b7280; padding: 2rem;">No budgets set. Create your first budget to track spending!</p>';
            return;
        }

        container.innerHTML = budgetData.slice(0, 4).map(budget => `
            <div class="budget-item">
                <div class="budget-header">
                    <span class="budget-name">${budget.category}</span>
                    <span class="budget-amounts">${this.formatCurrency(budget.actualSpent)} / ${this.formatCurrency(budget.budgetAmount)}</span>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill" style="width: ${Math.min(budget.percentage, 100)}%"></div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load all transactions
     */
    loadTransactions() {
        let transactions = window.storageManager.getTransactions();
        
        // Apply filters
        const categoryFilter = document.getElementById('filter-category')?.value;
        const typeFilter = document.getElementById('filter-type')?.value;

        if (categoryFilter) {
            transactions = transactions.filter(t => t.category === categoryFilter);
        }

        if (typeFilter) {
            transactions = transactions.filter(t => t.type === typeFilter);
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 2rem; color: #6b7280;">
                        No transactions found. ${categoryFilter || typeFilter ? 'Try adjusting your filters.' : 'Add your first transaction to get started!'}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${this.formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td>
                    <span class="badge ${transaction.type}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td class="transaction-amount ${transaction.type}">${this.formatCurrency(transaction.amount)}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="budgetApp.editTransaction('${transaction.id}')">Edit</button>
                    <button class="btn-danger btn-sm" onclick="budgetApp.deleteTransaction('${transaction.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Load all budgets
     */
    loadBudgets() {
        const budgets = window.storageManager.getBudgets();
        const budgetData = window.storageManager.getBudgetVsActual();
        const container = document.getElementById('budgets-grid');
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem; color: #6b7280;">
                    <h3>No budgets created yet</h3>
                    <p>Create your first budget to start tracking your spending goals.</p>
                    <button class="btn-primary mt-2" onclick="budgetApp.openBudgetModal()">Create Budget</button>
                </div>
            `;
            return;
        }

        container.innerHTML = budgetData.map(budget => {
            const budgetInfo = budgets.find(b => b.category === budget.category);
            const isOverBudget = budget.percentage > 100;
            const progressColor = budget.percentage > 80 ? (isOverBudget ? '#ef4444' : '#fbbf24') : '#22c55e';

            return `
                <div class="budget-card">
                    <div class="budget-card-header">
                        <span class="budget-category">${budget.category}</span>
                        <span class="budget-period">${budgetInfo.period}</span>
                    </div>
                    <div class="budget-amount">${this.formatCurrency(budget.budgetAmount)}</div>
                    <div class="budget-spent">
                        Spent: ${this.formatCurrency(budget.actualSpent)} 
                        <span style="color: ${progressColor};">(${budget.percentage.toFixed(1)}%)</span>
                    </div>
                    <div class="budget-progress-bar">
                        <div class="budget-progress-fill" style="width: ${Math.min(budget.percentage, 100)}%; background-color: ${progressColor};"></div>
                    </div>
                    <div class="budget-actions">
                        <button class="btn-secondary btn-sm" onclick="budgetApp.editBudget('${budgetInfo.id}')">Edit</button>
                        <button class="btn-danger btn-sm" onclick="budgetApp.deleteBudget('${budgetInfo.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Load reports tab
     */
    loadReports() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('report-start-date').value = this.formatDateForInput(firstDayOfMonth);
        document.getElementById('report-end-date').value = this.formatDateForInput(today);
    }

    /**
     * Populate category dropdowns
     */
    populateCategories() {
        const categories = window.storageManager.getCategories();
        const allCategories = [...(categories.expense || []), ...(categories.income || [])];
        
        // Populate filter dropdown
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Categories</option>' +
                allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        // Populate transaction category dropdown
        this.updateCategoriesForType('expense'); // Default to expense

        // Populate budget category dropdown
        const budgetCategorySelect = document.getElementById('budget-category');
        if (budgetCategorySelect) {
            budgetCategorySelect.innerHTML = (categories.expense || [])
                .map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    }

    /**
     * Update category dropdown based on transaction type
     */
    updateCategoriesForType(type) {
        const categories = window.storageManager.getCategoriesByType(type);
        const categorySelect = document.getElementById('transaction-category');
        if (categorySelect) {
            categorySelect.innerHTML = categories
                .map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    }

    /**
     * Set default dates for various inputs
     */
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const transactionDate = document.getElementById('transaction-date');
        const budgetStartDate = document.getElementById('budget-start-date');
        
        if (transactionDate) transactionDate.value = today;
        if (budgetStartDate) budgetStartDate.value = today;
    }

    /**
     * Open transaction modal
     */
    openTransactionModal(type = 'expense') {
        this.editingTransaction = null;
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('transaction-modal-title');
        
        if (title) title.textContent = 'Add Transaction';
        if (form) form.reset();
        
        document.getElementById('transaction-type').value = type;
        this.updateCategoriesForType(type);
        this.setDefaultDates();
        
        if (modal) modal.style.display = 'block';
    }

    /**
     * Open budget modal
     */
    openBudgetModal() {
        this.editingBudget = null;
        const modal = document.getElementById('budget-modal');
        const form = document.getElementById('budget-form');
        const title = document.getElementById('budget-modal-title');
        
        if (title) title.textContent = 'Add Budget';
        if (form) form.reset();
        
        this.setDefaultDates();
        
        if (modal) modal.style.display = 'block';
    }

    /**
     * Close all modals
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.editingTransaction = null;
        this.editingBudget = null;
    }

    /**
     * Handle transaction form submission
     */
    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            description: document.getElementById('transaction-description').value,
            date: document.getElementById('transaction-date').value
        };

        if (this.editingTransaction) {
            transaction.id = this.editingTransaction;
        }

        if (window.storageManager.saveTransaction(transaction)) {
            this.closeModals();
            this.loadDashboard();
            if (this.currentTab === 'transactions') {
                this.loadTransactions();
            }
            if (this.currentTab === 'analytics' && window.chartManager) {
                window.chartManager.refreshAllCharts();
            }
            this.showNotification('Transaction saved successfully!', 'success');
        } else {
            this.showNotification('Error saving transaction. Please try again.', 'error');
        }
    }

    /**
     * Handle budget form submission
     */
    handleBudgetSubmit(e) {
        e.preventDefault();
        
        const budget = {
            category: document.getElementById('budget-category').value,
            amount: parseFloat(document.getElementById('budget-amount').value),
            period: document.getElementById('budget-period').value,
            startDate: document.getElementById('budget-start-date').value
        };

        if (this.editingBudget) {
            budget.id = this.editingBudget;
        }

        if (window.storageManager.saveBudget(budget)) {
            this.closeModals();
            this.loadDashboard();
            if (this.currentTab === 'budgets') {
                this.loadBudgets();
            }
            if (this.currentTab === 'analytics' && window.chartManager) {
                window.chartManager.refreshAllCharts();
            }
            this.showNotification('Budget saved successfully!', 'success');
        } else {
            this.showNotification('Error saving budget. Please try again.', 'error');
        }
    }

    /**
     * Edit transaction
     */
    editTransaction(transactionId) {
        const transaction = window.storageManager.getTransactionById(transactionId);
        if (!transaction) return;

        this.editingTransaction = transactionId;
        
        // Populate form
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-date').value = transaction.date;
        
        this.updateCategoriesForType(transaction.type);
        setTimeout(() => {
            document.getElementById('transaction-category').value = transaction.category;
        }, 50);
        
        document.getElementById('transaction-modal-title').textContent = 'Edit Transaction';
        document.getElementById('transaction-modal').style.display = 'block';
    }

    /**
     * Delete transaction
     */
    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            if (window.storageManager.deleteTransaction(transactionId)) {
                this.loadDashboard();
                if (this.currentTab === 'transactions') {
                    this.loadTransactions();
                }
                if (this.currentTab === 'analytics' && window.chartManager) {
                    window.chartManager.refreshAllCharts();
                }
                this.showNotification('Transaction deleted successfully!', 'success');
            } else {
                this.showNotification('Error deleting transaction. Please try again.', 'error');
            }
        }
    }

    /**
     * Edit budget
     */
    editBudget(budgetId) {
        const budget = window.storageManager.getBudgetById(budgetId);
        if (!budget) return;

        this.editingBudget = budgetId;
        
        // Populate form
        document.getElementById('budget-category').value = budget.category;
        document.getElementById('budget-amount').value = budget.amount;
        document.getElementById('budget-period').value = budget.period;
        document.getElementById('budget-start-date').value = budget.startDate;
        
        document.getElementById('budget-modal-title').textContent = 'Edit Budget';
        document.getElementById('budget-modal').style.display = 'block';
    }

    /**
     * Delete budget
     */
    deleteBudget(budgetId) {
        if (confirm('Are you sure you want to delete this budget?')) {
            if (window.storageManager.deleteBudget(budgetId)) {
                this.loadDashboard();
                if (this.currentTab === 'budgets') {
                    this.loadBudgets();
                }
                if (this.currentTab === 'analytics' && window.chartManager) {
                    window.chartManager.refreshAllCharts();
                }
                this.showNotification('Budget deleted successfully!', 'success');
            } else {
                this.showNotification('Error deleting budget. Please try again.', 'error');
            }
        }
    }

    /**
     * Generate report
     */
    generateReport() {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        if (!startDate || !endDate) {
            this.showNotification('Please select both start and end dates.', 'error');
            return;
        }

        const transactions = window.storageManager.getTransactionsByDateRange(startDate, endDate);
        const totalIncome = transactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const netBalance = totalIncome - totalExpenses;

        const spendingByCategory = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + parseFloat(t.amount);
        });

        const container = document.getElementById('report-content');
        container.innerHTML = `
            <div class="report-summary">
                <div class="report-stat">
                    <div class="report-stat-value" style="color: #22c55e;">${this.formatCurrency(totalIncome)}</div>
                    <div class="report-stat-label">Total Income</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value" style="color: #ef4444;">${this.formatCurrency(totalExpenses)}</div>
                    <div class="report-stat-label">Total Expenses</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value" style="color: ${netBalance >= 0 ? '#22c55e' : '#ef4444'};">${this.formatCurrency(netBalance)}</div>
                    <div class="report-stat-label">Net Balance</div>
                </div>
                <div class="report-stat">
                    <div class="report-stat-value">${transactions.length}</div>
                    <div class="report-stat-label">Total Transactions</div>
                </div>
            </div>
            
            <h4>Spending by Category</h4>
            <div class="category-breakdown">
                ${Object.entries(spendingByCategory).map(([category, amount]) => `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-desc">${category}</div>
                        </div>
                        <div class="transaction-amount expense">${this.formatCurrency(amount)}</div>
                    </div>
                `).join('')}
            </div>
            
            <h4>Recent Transactions</h4>
            <div class="transaction-list">
                ${transactions.slice(0, 10).map(transaction => `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-desc">${transaction.description}</div>
                            <div class="transaction-meta">${transaction.category} • ${this.formatDate(transaction.date)}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type}">${this.formatCurrency(transaction.amount)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        const transactions = window.storageManager.getTransactions();
        
        if (transactions.length === 0) {
            this.showNotification('No transactions to export.', 'error');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                `"${t.description}"`,
                `"${t.category}"`,
                t.type,
                t.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('Transactions exported successfully!', 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#22c55e';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format date for input fields
     */
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.budgetApp = new BudgetApp();
});