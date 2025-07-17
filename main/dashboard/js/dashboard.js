/**
 * Dashboard JavaScript - Market Overview
 * Handles all dashboard interactions and data updates
 */

class Dashboard {
    constructor() {
        this.currentSection = 'overview';
        this.refreshInterval = 60000; // 1 minute default
        this.refreshTimer = null;
        this.charts = {};
        this.userData = null;
        this.settings = {
            theme: 'dark',
            autoRefresh: true,
            refreshInterval: 60,
            soundNotifications: true
        };

        this.init();
    }

    init() {
        this.loadUserData();
        this.loadSettings();
        this.setupEventListeners();
        this.setupCharts();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    // User Authentication & Data
    async loadUserData() {
        try {
            const response = await fetch('http://localhost/MARKET/main/database/users/credentials.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: 'action=get_user',
                credentials: 'include' // Include cookies for session handling
            });

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                this.redirectToLogin();
                return;
            }

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    this.userData = data.user;
                    this.updateUserInterface();
                } else {
                    console.log('User not logged in:', data.message);
                    this.redirectToLogin();
                }
            } catch (jsonError) {
                console.error('Invalid JSON response:', responseText);
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.redirectToLogin();
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('http://localhost/MARKET/main/database/users/credentials.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: 'action=logout',
                credentials: 'include' // Include cookies for session handling
            });

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                this.redirectToLogin();
                return;
            }

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    console.log('Logout successful');
                } else {
                    console.error('Logout failed:', data.message);
                }
            } catch (jsonError) {
                console.error('Invalid JSON response during logout:', responseText);
            }

            this.redirectToLogin();
        } catch (error) {
            console.error('Error logging out:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        // Clear any local storage
        localStorage.removeItem('dashboardSettings');
        // Use relative path for redirect
        window.location.href = '../../login/html/login.html';
    }

    updateUserInterface() {
        if (this.userData) {
            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = this.userData.first_name || this.userData.username || 'User';
            }

            // Update profile modal
            const profileEmail = document.getElementById('profileEmail');
            const profileUsername = document.getElementById('profileUsername');
            const profileFirstName = document.getElementById('profileFirstName');
            const profileLastName = document.getElementById('profileLastName');

            if (profileEmail) profileEmail.value = this.userData.email || '';
            if (profileUsername) profileUsername.value = this.userData.username || '';
            if (profileFirstName) profileFirstName.value = this.userData.first_name || '';
            if (profileLastName) profileLastName.value = this.userData.last_name || '';
        }
    }

    // Settings Management
    loadSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        this.applySettings();
    }

    saveSettings() {
        localStorage.setItem('dashboardSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Apply theme
        document.body.setAttribute('data-theme', this.settings.theme);

        // Update refresh interval
        this.refreshInterval = this.settings.refreshInterval * 1000;

        // Update UI elements (with null checks)
        const themeSelect = document.getElementById('themeSelect');
        const refreshInterval = document.getElementById('refreshInterval');
        const soundNotifications = document.getElementById('soundNotifications');

        if (themeSelect) themeSelect.value = this.settings.theme;
        if (refreshInterval) refreshInterval.value = this.settings.refreshInterval;
        if (soundNotifications) soundNotifications.checked = this.settings.soundNotifications;

        // Restart auto-refresh with new interval
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.startAutoRefresh();
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Profile form
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }

        // Settings form
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.updateSettings();
            });
        }

        // Quick actions
        const refreshDataBtn = document.getElementById('refreshDataBtn');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }

        const addStockBtn = document.getElementById('addStockBtn');
        if (addStockBtn) {
            addStockBtn.addEventListener('click', () => {
                this.addToWatchlist();
            });
        }

        const addAlertBtn = document.getElementById('addAlertBtn');
        if (addAlertBtn) {
            addAlertBtn.addEventListener('click', () => {
                this.createAlert();
            });
        }

        // News refresh
        const refreshNewsBtn = document.getElementById('refreshNewsBtn');
        if (refreshNewsBtn) {
            refreshNewsBtn.addEventListener('click', () => {
                this.loadNews();
            });
        }

        // Chart timeframe
        const chartTimeframe = document.getElementById('chartTimeframe');
        if (chartTimeframe) {
            chartTimeframe.addEventListener('change', (e) => {
                this.updateChartTimeframe(e.target.value);
            });
        }

        // Sidebar toggle for mobile
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Add mobile menu toggle if needed
        if (window.innerWidth <= 992) {
            const navbar = document.querySelector('.navbar');
            const sidebar = document.getElementById('sidebar');

            if (navbar && sidebar) {
                const menuToggle = document.createElement('button');
                menuToggle.className = 'navbar-toggler';
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('show');
                });
                navbar.appendChild(menuToggle);
            }
        }
    }

    // Section Navigation
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    // Data Loading
    async loadDashboardData() {
        this.showLoading();

        try {
            const response = await fetch('http://localhost/MARKET/main/dashboard/php/dashboard_data.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: 'action=get_dashboard_data',
                credentials: 'include' // Include cookies for session handling
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();

            try {
                const data = JSON.parse(responseText);
                if (data.success) {
                    this.updateQuickStats(data.stats);
                    this.updateTopMovers(data.movers);
                    this.updateRecentActivity(data.activity);
                    this.updateMarketStatus(data.market_status);
                } else {
                    console.error('Dashboard data request failed:', data.message);
                    if (data.message === 'Not authenticated') {
                        this.redirectToLogin();
                    }
                }
            } catch (jsonError) {
                console.error('Invalid JSON response from dashboard data:', responseText);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'portfolio':
                await this.loadPortfolio();
                break;
            case 'watchlist':
                await this.loadWatchlist();
                break;
            case 'news':
                await this.loadNews();
                break;
            case 'alerts':
                await this.loadAlerts();
                break;
        }
    }

    // Quick Stats Update
    updateQuickStats(stats) {
        if (stats) {
            const portfolioValue = document.getElementById('portfolioValue');
            const portfolioChange = document.getElementById('portfolioChange');
            const dayPL = document.getElementById('dayPL');
            const dayPLChange = document.getElementById('dayPLChange');
            const activePositions = document.getElementById('activePositions');
            const watchlistCount = document.getElementById('watchlistCount');

            if (portfolioValue) portfolioValue.textContent = this.formatCurrency(stats.portfolio_value);
            if (portfolioChange) portfolioChange.textContent = `${stats.portfolio_change >= 0 ? '+' : ''}${stats.portfolio_change}%`;
            if (dayPL) dayPL.textContent = this.formatCurrency(stats.day_pl);
            if (dayPLChange) dayPLChange.textContent = `${stats.day_pl_percent >= 0 ? '+' : ''}${stats.day_pl_percent}%`;
            if (activePositions) activePositions.textContent = stats.active_positions;
            if (watchlistCount) watchlistCount.textContent = stats.watchlist_count;
        }
    }

    updateTopMovers(movers) {
        if (movers) {
            this.populateMoversSection('topGainers', movers.gainers);
            this.populateMoversSection('topLosers', movers.losers);
            this.populateMoversSection('mostActive', movers.active);
        }
    }

    populateMoversSection(elementId, data) {
        const container = document.getElementById(elementId);
        if (container && data) {
            container.innerHTML = data.map(item => `
                <div class="mover-item">
                    <span class="symbol">${item.symbol}</span>
                    <span class="change ${item.change >= 0 ? 'positive' : 'negative'}">
                        ${item.change >= 0 ? '+' : ''}${item.change}%
                    </span>
                </div>
            `).join('');
        }
    }

    updateRecentActivity(activity) {
        const container = document.getElementById('recentActivity');
        if (container && activity) {
            container.innerHTML = activity.map(item => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${item.icon} ${item.color}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${item.description}</p>
                        <small>${this.formatTimestamp(item.timestamp)}</small>
                    </div>
                </div>
            `).join('');
        }
    }

    updateMarketStatus(status) {
        // Update market status in sidebar
        const marketStatusItems = document.querySelectorAll('.status-item');
        marketStatusItems.forEach(item => {
            const badge = item.querySelector('.status-badge');
            if (badge) {
                badge.className = `status-badge status-${status.status}`;
                badge.textContent = status.status.charAt(0).toUpperCase() + status.status.slice(1);
            }
        });
    }

    // Utility Methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        console.error(message);
        // You can implement a toast notification here
    }

    startAutoRefresh() {
        if (this.settings.autoRefresh) {
            this.refreshTimer = setInterval(() => {
                this.loadDashboardData();
            }, this.refreshInterval);
        }
    }

    refreshAllData() {
        this.loadDashboardData();
        this.loadSectionData(this.currentSection);
    }

    // Placeholder methods for incomplete functionality
    setupCharts() {
        // Chart setup code would go here
    }

    async loadPortfolio() {
        // Portfolio loading code would go here
    }

    async loadWatchlist() {
        // Watchlist loading code would go here
    }

    async loadNews() {
        // News loading code would go here
    }

    async loadAlerts() {
        // Alerts loading code would go here
    }

    saveProfile() {
        // Profile saving code would go here
    }

    updateSettings() {
        // Settings update code would go here
    }

    addToWatchlist() {
        // Add to watchlist code would go here
    }

    createAlert() {
        // Create alert code would go here
    }

    updateChartTimeframe(timeframe) {
        // Chart timeframe update code would go here
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});