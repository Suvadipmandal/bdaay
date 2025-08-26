/**
 * Storage Manager for Budget Management Application
 * Handles local storage operations for transactions, budgets, and categories
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            transactions: 'budget_app_transactions',
            budgets: 'budget_app_budgets',
            categories: 'budget_app_categories'
        };
        
        this.initializeCategories();
    }

    /**
     * Initialize default categories if none exist
     */
    initializeCategories() {
        const categories = this.getCategories();
        if (categories.length === 0) {
            const defaultCategories = {
                expense: [
                    'Food & Dining',
                    'Transportation',
                    'Shopping',
                    'Entertainment',
                    'Bills & Utilities',
                    'Healthcare',
                    'Education',
                    'Travel',
                    'Housing',
                    'Insurance',
                    'Personal Care',
                    'Gifts & Donations',
                    'Other'
                ],
                income: [
                    'Salary',
                    'Freelance',
                    'Business',
                    'Investments',
                    'Rental Income',
                    'Bonuses',
                    'Other Income'
                ]
            };
            this.saveCategories(defaultCategories);
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // TRANSACTIONS
    /**
     * Get all transactions
     */
    getTransactions() {
        return this.loadFromStorage(this.storageKeys.transactions) || [];
    }

    /**
     * Save a new transaction
     */
    saveTransaction(transaction) {
        const transactions = this.getTransactions();
        
        // Add ID and timestamp if new transaction
        if (!transaction.id) {
            transaction.id = this.generateId();
            transaction.createdAt = new Date().toISOString();
        }
        transaction.updatedAt = new Date().toISOString();

        // Check if updating existing transaction
        const existingIndex = transactions.findIndex(t => t.id === transaction.id);
        if (existingIndex !== -1) {
            transactions[existingIndex] = transaction;
        } else {
            transactions.push(transaction);
        }

        return this.saveToStorage(this.storageKeys.transactions, transactions);
    }

    /**
     * Delete a transaction
     */
    deleteTransaction(transactionId) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== transactionId);
        return this.saveToStorage(this.storageKeys.transactions, filteredTransactions);
    }

    /**
     * Get transaction by ID
     */
    getTransactionById(transactionId) {
        const transactions = this.getTransactions();
        return transactions.find(t => t.id === transactionId);
    }

    /**
     * Get transactions by date range
     */
    getTransactionsByDateRange(startDate, endDate) {
        const transactions = this.getTransactions();
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
    }

    /**
     * Get transactions by category
     */
    getTransactionsByCategory(category) {
        const transactions = this.getTransactions();
        return transactions.filter(t => t.category === category);
    }

    /**
     * Get transactions by type (income/expense)
     */
    getTransactionsByType(type) {
        const transactions = this.getTransactions();
        return transactions.filter(t => t.type === type);
    }

    // BUDGETS
    /**
     * Get all budgets
     */
    getBudgets() {
        return this.loadFromStorage(this.storageKeys.budgets) || [];
    }

    /**
     * Save a budget
     */
    saveBudget(budget) {
        const budgets = this.getBudgets();
        
        // Add ID and timestamp if new budget
        if (!budget.id) {
            budget.id = this.generateId();
            budget.createdAt = new Date().toISOString();
        }
        budget.updatedAt = new Date().toISOString();

        // Check if updating existing budget
        const existingIndex = budgets.findIndex(b => b.id === budget.id);
        if (existingIndex !== -1) {
            budgets[existingIndex] = budget;
        } else {
            budgets.push(budget);
        }

        return this.saveToStorage(this.storageKeys.budgets, budgets);
    }

    /**
     * Delete a budget
     */
    deleteBudget(budgetId) {
        const budgets = this.getBudgets();
        const filteredBudgets = budgets.filter(b => b.id !== budgetId);
        return this.saveToStorage(this.storageKeys.budgets, filteredBudgets);
    }

    /**
     * Get budget by ID
     */
    getBudgetById(budgetId) {
        const budgets = this.getBudgets();
        return budgets.find(b => b.id === budgetId);
    }

    /**
     * Get budget by category
     */
    getBudgetByCategory(category) {
        const budgets = this.getBudgets();
        return budgets.find(b => b.category === category);
    }

    // CATEGORIES
    /**
     * Get all categories
     */
    getCategories() {
        return this.loadFromStorage(this.storageKeys.categories) || [];
    }

    /**
     * Save categories
     */
    saveCategories(categories) {
        return this.saveToStorage(this.storageKeys.categories, categories);
    }

    /**
     * Get categories by type (income/expense)
     */
    getCategoriesByType(type) {
        const categories = this.getCategories();
        return categories[type] || [];
    }

    // ANALYTICS HELPERS
    /**
     * Calculate total income
     */
    getTotalIncome(startDate = null, endDate = null) {
        let transactions = this.getTransactionsByType('income');
        
        if (startDate && endDate) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
            });
        }
        
        return transactions.reduce((total, t) => total + parseFloat(t.amount), 0);
    }

    /**
     * Calculate total expenses
     */
    getTotalExpenses(startDate = null, endDate = null) {
        let transactions = this.getTransactionsByType('expense');
        
        if (startDate && endDate) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
            });
        }
        
        return transactions.reduce((total, t) => total + parseFloat(t.amount), 0);
    }

    /**
     * Calculate net balance
     */
    getNetBalance(startDate = null, endDate = null) {
        return this.getTotalIncome(startDate, endDate) - this.getTotalExpenses(startDate, endDate);
    }

    /**
     * Get spending by category
     */
    getSpendingByCategory(startDate = null, endDate = null) {
        let transactions = this.getTransactionsByType('expense');
        
        if (startDate && endDate) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
            });
        }
        
        const categoryTotals = {};
        transactions.forEach(transaction => {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += parseFloat(transaction.amount);
        });
        
        return categoryTotals;
    }

    /**
     * Get monthly spending data for charts
     */
    getMonthlySpendingData(year = new Date().getFullYear()) {
        const transactions = this.getTransactions();
        const monthlyData = {};
        
        // Initialize all months to 0
        for (let i = 0; i < 12; i++) {
            const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getFullYear() === year) {
                const monthKey = `${year}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey][transaction.type] += parseFloat(transaction.amount);
                }
            }
        });
        
        return monthlyData;
    }

    /**
     * Get budget vs actual spending
     */
    getBudgetVsActual() {
        const budgets = this.getBudgets();
        const result = [];
        
        budgets.forEach(budget => {
            const currentDate = new Date();
            let startDate, endDate;
            
            if (budget.period === 'monthly') {
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            } else { // annual
                startDate = new Date(budget.startDate);
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            
            const categoryTransactions = this.getTransactionsByCategory(budget.category)
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate && t.type === 'expense';
                });
            
            const actualSpent = categoryTransactions.reduce((total, t) => total + parseFloat(t.amount), 0);
            
            result.push({
                category: budget.category,
                budgetAmount: parseFloat(budget.amount),
                actualSpent: actualSpent,
                remaining: parseFloat(budget.amount) - actualSpent,
                percentage: (actualSpent / parseFloat(budget.amount)) * 100
            });
        });
        
        return result;
    }

    // EXPORT/IMPORT
    /**
     * Export all data as JSON
     */
    exportData() {
        return {
            transactions: this.getTransactions(),
            budgets: this.getBudgets(),
            categories: this.getCategories(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data from JSON
     */
    importData(data) {
        try {
            if (data.transactions) {
                this.saveToStorage(this.storageKeys.transactions, data.transactions);
            }
            if (data.budgets) {
                this.saveToStorage(this.storageKeys.budgets, data.budgets);
            }
            if (data.categories) {
                this.saveToStorage(this.storageKeys.categories, data.categories);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all data (use with caution)
     */
    clearAllData() {
        localStorage.removeItem(this.storageKeys.transactions);
        localStorage.removeItem(this.storageKeys.budgets);
        localStorage.removeItem(this.storageKeys.categories);
        this.initializeCategories();
    }
}

// Create global instance
window.storageManager = new StorageManager();