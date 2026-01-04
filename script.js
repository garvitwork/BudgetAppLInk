const API_BASE_URL = 'https://budgetingapp-q0wr.onrender.com';

// Store budget allocation globally for use in combined goals
let currentBudgetAllocation = null;

// ADD THIS CODE TO THE TOP OF YOUR script.js FILE (after API_BASE_URL declaration)

// ============================================================================
// MOBILE MENU & TABLE SCROLL HANDLING
// ============================================================================

// Toggle sidebar menu
function toggleMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Close sidebar
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Setup sidebar navigation
function setupSidebarNav() {
    // Clone desktop tabs to sidebar if not already done
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const desktopTabs = document.querySelectorAll('.tabs .tab-btn');
    
    // Clear existing buttons in sidebar (except header)
    const existingButtons = sidebar.querySelectorAll('.tab-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Add tab buttons to sidebar
    desktopTabs.forEach(tab => {
        const sidebarBtn = tab.cloneNode(true);
        sidebarBtn.addEventListener('click', () => {
            const tabName = sidebarBtn.dataset.tab;
            
            // Update active states
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Activate selected tab
            document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(b => b.classList.add('active'));
            document.getElementById(tabName).classList.add('active');
            
            // Close sidebar
            closeSidebar();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        sidebar.appendChild(sidebarBtn);
    });
}

// Handle table horizontal scroll detection
function setupTableScroll() {
    const tableScrolls = document.querySelectorAll('.table-scroll');
    
    tableScrolls.forEach(scroll => {
        scroll.addEventListener('scroll', function() {
            const isScrolled = this.scrollLeft > 20;
            if (isScrolled) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });
        
        // Check initial scroll state
        if (scroll.scrollLeft > 20) {
            scroll.classList.add('scrolled');
        }
    });
}

// Wrap all tables in proper containers
function wrapTables() {
    // Find all tables that aren't already wrapped
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        // Check if already wrapped
        if (table.closest('.table-wrapper')) return;
        
        // Create wrappers
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        
        const scroll = document.createElement('div');
        scroll.className = 'table-scroll';
        
        // Wrap the table
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(scroll);
        scroll.appendChild(table);
    });
    
    // Setup scroll detection
    setupTableScroll();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupSidebarNav();
    wrapTables();
    
    // Setup overlay click to close sidebar
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
    
    // Watch for dynamically added tables
    const observer = new MutationObserver(() => {
        wrapTables();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// ============================================================================
// UPDATE DISPLAY FUNCTIONS TO USE TABLE WRAPPERS
// ============================================================================

// Update the displayBudgetResult function
function displayBudgetResult(result) {
    const allocation = result.allocation;
    const projections = result.projections;
    
    let html = '<h3>Monthly Allocation</h3>';
    html += '<div class="table-wrapper"><div class="table-scroll"><table>';
    html += '<thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>';
    
    for (const [category, amount] of Object.entries(allocation)) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td><td>${formatCurrency(amount)}</td></tr>`;
    }
    html += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${formatCurrency(result.total_allocated)}</strong></td></tr>`;
    html += '</tbody></table></div></div>';
    
    html += '<h3>Projections</h3>';
    html += '<div class="table-wrapper"><div class="table-scroll"><table>';
    html += '<thead><tr><th>Category</th>';
    for (const period of Object.keys(projections)) {
        html += `<th>${period}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    const categories = Object.keys(allocation);
    for (const category of categories) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>`;
        for (const period of Object.keys(projections)) {
            html += `<td>${formatCurrency(projections[period][category])}</td>`;
        }
        html += '</tr>';
    }
    
    html += '<tr class="total-row"><td><strong>Total</strong></td>';
    for (const period of Object.keys(projections)) {
        const total = Object.values(projections[period]).reduce((sum, val) => sum + val, 0);
        html += `<td><strong>${formatCurrency(total)}</strong></td>`;
    }
    html += '</tr></tbody></table></div></div>';
    
    html += '<div class="success">✅ Budget calculated! Now you can analyze your goals below.</div>';
    
    document.getElementById('budgetResult').innerHTML = html;
    wrapTables();
}

// Update displayCombinedGoalsResult
function displayCombinedGoalsResult(result) {
    let html = '<h3>Goal Analysis</h3>';
    html += '<div class="table-wrapper"><div class="table-scroll"><table>';
    html += '<thead><tr><th>Goal Type</th><th>Required Monthly</th><th>Current Allocation</th><th>Gap</th></tr></thead><tbody>';
    
    const savingsStatus = result.savings_gap >= 0 ? '✔' : '✗';
    const savingsGapStr = result.savings_gap >= 0 ? formatCurrency(result.savings_gap) : `-${formatCurrency(Math.abs(result.savings_gap))}`;
    html += `<tr><td>${savingsStatus} Savings</td><td>${formatCurrency(result.required_monthly_savings)}</td><td>${formatCurrency(result.current_allocation.savings)}</td><td>${savingsGapStr}</td></tr>`;
    
    const investmentStatus = result.investment_gap >= 0 ? '✔' : '✗';
    const investmentGapStr = result.investment_gap >= 0 ? formatCurrency(result.investment_gap) : `-${formatCurrency(Math.abs(result.investment_gap))}`;
    html += `<tr><td>${investmentStatus} Investments</td><td>${formatCurrency(result.required_monthly_investment)}</td><td>${formatCurrency(result.current_allocation.investments)}</td><td>${investmentGapStr}</td></tr>`;
    
    html += '</tbody></table></div></div>';
    
    if (result.goals_met) {
        html += '<div class="success">✅ Your current allocations meet both goals!</div>';
    } else {
        html += `<div class="warning">⚠️ Total Shortfall: ${formatCurrency(result.total_shortfall)}/month</div>`;
        
        if (result.new_allocation) {
            html += '<h3>Unified Reallocation Plan</h3>';
            html += '<div class="table-wrapper"><div class="table-scroll"><table>';
            html += '<thead><tr><th>Category</th><th>Current</th><th>Suggested</th><th>Change</th></tr></thead><tbody>';
            
            const categories = ['savings', 'investments', 'personal', 'misc'];
            for (const cat of categories) {
                const current = result.current_allocation[cat];
                const suggested = result.new_allocation[cat];
                const change = suggested - current;
                const changeStr = change > 0 ? `+${formatCurrency(change)}` : change < 0 ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(0);
                html += `<tr><td>${cat.charAt(0).toUpperCase() + cat.slice(1)}</td><td>${formatCurrency(current)}</td><td>${formatCurrency(suggested)}</td><td>${changeStr}</td></tr>`;
            }
            html += '</tbody></table></div></div>';
        }
    }
    
    const analysis = result.ai_analysis;
    html += `<h3>AI Financial Advisor</h3><div class="ai-box">`;
    html += `<p><strong>Allocation Health:</strong> ${analysis.allocation_health}</p>`;
    
    if (analysis.identified_leaks && analysis.identified_leaks.length > 0) {
        html += '<p><strong>Identified Issues:</strong></p><ul>';
        analysis.identified_leaks.forEach(leak => html += `<li>${leak}</li>`);
        html += '</ul>';
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += '<p><strong>Recommendations:</strong></p><ul>';
        analysis.recommendations.forEach(rec => html += `<li>${rec}</li>`);
        html += '</ul>';
    }
    
    if (analysis.priority_actions && analysis.priority_actions.length > 0) {
        html += '<p><strong>Priority Actions:</strong></p><ul>';
        analysis.priority_actions.forEach(action => html += `<li>${action}</li>`);
        html += '</ul>';
    }
    
    html += '</div>';
    
    document.getElementById('combinedGoalsResult').innerHTML = html;
    wrapTables();
}

// Update displayTaxHarvesting
function displayTaxHarvesting(result) {
    if (!result.has_opportunities || !result.opportunities || result.opportunities.length === 0) {
        document.getElementById('taxHarvestingResult').innerHTML = '<div class="success">✅ No tax-loss harvesting opportunities (all investments performing well)</div>';
        return;
    }
    
    let html = '<h3>Tax-Loss Harvesting Opportunities</h3>';
    html += '<div class="table-wrapper"><div class="table-scroll"><table>';
    html += '<thead><tr><th>Investment</th><th>Loss</th><th>Loss %</th><th>Tax Benefit</th></tr></thead><tbody>';
    
    let totalBenefit = 0;
    result.opportunities.forEach(opp => {
        html += `<tr><td>${opp.name}</td><td>${formatCurrency(opp.loss_amount)}</td><td>${opp.loss_pct.toFixed(1)}%</td><td>${formatCurrency(opp.tax_offset_benefit)}</td></tr>`;
        totalBenefit += opp.tax_offset_benefit;
    });
    
    html += `<tr class="total-row"><td><strong>Total Tax Benefit</strong></td><td></td><td></td><td><strong>${formatCurrency(totalBenefit)}</strong></td></tr>`;
    html += '</tbody></table></div></div>';
    html += `<p class="info">💡 Selling these before year-end can offset ${formatCurrency(totalBenefit)} in taxes</p>`;
    
    document.getElementById('taxHarvestingResult').innerHTML = html;
    wrapTables();
}

// Update displayMicroSavings
function displayMicroSavings(result) {
    if (!result.has_savings || !result.data || !result.data.triggers || result.data.triggers.length === 0) {
        document.getElementById('microSavingsResult').innerHTML = '<div class="success">✅ No micro-savings opportunities this period</div>';
        return;
    }
    
    let html = '<h3>Micro-Savings Triggers</h3>';
    html += '<div class="table-wrapper"><div class="table-scroll"><table>';
    html += '<thead><tr><th>Category</th><th>Budgeted</th><th>Actual</th><th>Saved</th><th>Action</th></tr></thead><tbody>';
    
    result.data.triggers.forEach(trigger => {
        html += `<tr><td>${trigger.category}</td><td>${formatCurrency(trigger.budgeted)}</td><td>${formatCurrency(trigger.actual)}</td><td>${formatCurrency(trigger.saved)}</td><td>${trigger.action}</td></tr>`;
    });
    
    html += `<tr class="total-row"><td><strong>Total Micro-Savings</strong></td><td></td><td></td><td><strong>${formatCurrency(result.data.total_micro_savings)}</strong></td><td></td></tr>`;
    html += '</tbody></table></div></div>';
    html += `<p class="highlight">💰 Auto-transfer ${formatCurrency(result.data.total_micro_savings)} to investments</p>`;
    
    document.getElementById('microSavingsResult').innerHTML = html;
    wrapTables();
}
// ============================================================================
// PROFILE STORAGE
// ============================================================================

// Add these functions to your existing script.js file

// ============================================================================
// MOBILE OPTIMIZATION HELPERS
// ============================================================================

// Wrap all tables in scrollable containers
function wrapTablesForMobile() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Smooth scroll for tab navigation on mobile
function setupMobileTabs() {
    const tabs = document.querySelector('.tabs');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Scroll active tab into view on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }, 100);
            }
        });
    });
}

// Detect mobile and add class to body
function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile || window.innerWidth <= 768) {
        document.body.classList.add('mobile-device');
    }
    
    // Update on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
        }
    });
}

// Prevent zoom on input focus for iOS
function preventIOSZoom() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                this.style.fontSize = '16px';
            }
        });
    });
}

// Add scroll indicators for tables on mobile
function addScrollIndicators() {
    const tableContainers = document.querySelectorAll('.table-container');
    
    tableContainers.forEach(container => {
        container.addEventListener('scroll', function() {
            const scrollLeft = this.scrollLeft;
            const maxScroll = this.scrollWidth - this.clientWidth;
            
            // Hide scroll indicator when fully scrolled
            if (scrollLeft >= maxScroll - 10) {
                this.classList.add('scrolled-end');
            } else {
                this.classList.remove('scrolled-end');
            }
        });
    });
}

// Initialize mobile optimizations
document.addEventListener('DOMContentLoaded', () => {
    detectMobile();
    setupMobileTabs();
    preventIOSZoom();
    
    // Wrap tables after any content loads
    const observer = new MutationObserver(() => {
        wrapTablesForMobile();
        addScrollIndicators();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Update existing display functions to wrap tables
function displayBudgetResult(result) {
    const allocation = result.allocation;
    const projections = result.projections;
    
    let html = '<h3>Monthly Allocation</h3><div class="table-container"><table><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>';
    
    for (const [category, amount] of Object.entries(allocation)) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td><td>${formatCurrency(amount)}</td></tr>`;
    }
    html += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${formatCurrency(result.total_allocated)}</strong></td></tr>`;
    html += '</tbody></table></div>';
    
    html += '<h3>Projections</h3><div class="table-container"><table><thead><tr><th>Category</th>';
    for (const period of Object.keys(projections)) {
        html += `<th>${period}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    const categories = Object.keys(allocation);
    for (const category of categories) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>`;
        for (const period of Object.keys(projections)) {
            html += `<td>${formatCurrency(projections[period][category])}</td>`;
        }
        html += '</tr>';
    }
    
    html += '<tr class="total-row"><td><strong>Total</strong></td>';
    for (const period of Object.keys(projections)) {
        const total = Object.values(projections[period]).reduce((sum, val) => sum + val, 0);
        html += `<td><strong>${formatCurrency(total)}</strong></td>`;
    }
    html += '</tr></tbody></table></div>';
    
    html += '<div class="success">✅ Budget calculated! Now you can analyze your goals below.</div>';
    
    document.getElementById('budgetResult').innerHTML = html;
}

function displayCombinedGoalsResult(result) {
    let html = '<h3>Goal Analysis</h3><div class="table-container"><table><thead><tr><th>Goal Type</th><th>Required Monthly</th><th>Current Allocation</th><th>Gap</th></tr></thead><tbody>';
    
    const savingsStatus = result.savings_gap >= 0 ? '✔' : '✗';
    const savingsGapStr = result.savings_gap >= 0 ? formatCurrency(result.savings_gap) : `-${formatCurrency(Math.abs(result.savings_gap))}`;
    html += `<tr><td>${savingsStatus} Savings</td><td>${formatCurrency(result.required_monthly_savings)}</td><td>${formatCurrency(result.current_allocation.savings)}</td><td>${savingsGapStr}</td></tr>`;
    
    const investmentStatus = result.investment_gap >= 0 ? '✔' : '✗';
    const investmentGapStr = result.investment_gap >= 0 ? formatCurrency(result.investment_gap) : `-${formatCurrency(Math.abs(result.investment_gap))}`;
    html += `<tr><td>${investmentStatus} Investments</td><td>${formatCurrency(result.required_monthly_investment)}</td><td>${formatCurrency(result.current_allocation.investments)}</td><td>${investmentGapStr}</td></tr>`;
    
    html += '</tbody></table></div>';
    
    if (result.goals_met) {
        html += '<div class="success">✅ Your current allocations meet both goals!</div>';
    } else {
        html += `<div class="warning">⚠️ Total Shortfall: ${formatCurrency(result.total_shortfall)}/month</div>`;
        
        if (result.new_allocation) {
            html += '<h3>Unified Reallocation Plan</h3><div class="table-container"><table><thead><tr><th>Category</th><th>Current</th><th>Suggested</th><th>Change</th></tr></thead><tbody>';
            
            const categories = ['savings', 'investments', 'personal', 'misc'];
            for (const cat of categories) {
                const current = result.current_allocation[cat];
                const suggested = result.new_allocation[cat];
                const change = suggested - current;
                const changeStr = change > 0 ? `+${formatCurrency(change)}` : change < 0 ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(0);
                html += `<tr><td>${cat.charAt(0).toUpperCase() + cat.slice(1)}</td><td>${formatCurrency(current)}</td><td>${formatCurrency(suggested)}</td><td>${changeStr}</td></tr>`;
            }
            html += '</tbody></table></div>';
        }
    }
    
    const analysis = result.ai_analysis;
    html += `<h3>AI Financial Advisor</h3><div class="ai-box">`;
    html += `<p><strong>Allocation Health:</strong> ${analysis.allocation_health}</p>`;
    
    if (analysis.identified_leaks && analysis.identified_leaks.length > 0) {
        html += '<p><strong>Identified Issues:</strong></p><ul>';
        analysis.identified_leaks.forEach(leak => html += `<li>${leak}</li>`);
        html += '</ul>';
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += '<p><strong>Recommendations:</strong></p><ul>';
        analysis.recommendations.forEach(rec => html += `<li>${rec}</li>`);
        html += '</ul>';
    }
    
    if (analysis.priority_actions && analysis.priority_actions.length > 0) {
        html += '<p><strong>Priority Actions:</strong></p><ul>';
        analysis.priority_actions.forEach(action => html += `<li>${action}</li>`);
        html += '</ul>';
    }
    
    html += '</div>';
    
    document.getElementById('combinedGoalsResult').innerHTML = html;
}

function displayTaxHarvesting(result) {
    if (!result.has_opportunities || !result.opportunities || result.opportunities.length === 0) {
        document.getElementById('taxHarvestingResult').innerHTML = '<div class="success">✅ No tax-loss harvesting opportunities (all investments performing well)</div>';
        return;
    }
    
    let html = '<h3>Tax-Loss Harvesting Opportunities</h3><div class="table-container"><table><thead><tr><th>Investment</th><th>Loss</th><th>Loss %</th><th>Tax Benefit</th></tr></thead><tbody>';
    
    let totalBenefit = 0;
    result.opportunities.forEach(opp => {
        html += `<tr><td>${opp.name}</td><td>${formatCurrency(opp.loss_amount)}</td><td>${opp.loss_pct.toFixed(1)}%</td><td>${formatCurrency(opp.tax_offset_benefit)}</td></tr>`;
        totalBenefit += opp.tax_offset_benefit;
    });
    
    html += `<tr class="total-row"><td><strong>Total Tax Benefit</strong></td><td></td><td></td><td><strong>${formatCurrency(totalBenefit)}</strong></td></tr></tbody></table></div>`;
    html += `<p class="info">💡 Selling these before year-end can offset ${formatCurrency(totalBenefit)} in taxes</p>`;
    
    document.getElementById('taxHarvestingResult').innerHTML = html;
}

function displayMicroSavings(result) {
    if (!result.has_savings || !result.data || !result.data.triggers || result.data.triggers.length === 0) {
        document.getElementById('microSavingsResult').innerHTML = '<div class="success">✅ No micro-savings opportunities this period</div>';
        return;
    }
    
    let html = '<h3>Micro-Savings Triggers</h3><div class="table-container"><table><thead><tr><th>Category</th><th>Budgeted</th><th>Actual</th><th>Saved</th><th>Action</th></tr></thead><tbody>';
    
    result.data.triggers.forEach(trigger => {
        html += `<tr><td>${trigger.category}</td><td>${formatCurrency(trigger.budgeted)}</td><td>${formatCurrency(trigger.actual)}</td><td>${formatCurrency(trigger.saved)}</td><td>${trigger.action}</td></tr>`;
    });
    
    html += `<tr class="total-row"><td><strong>Total Micro-Savings</strong></td><td></td><td></td><td><strong>${formatCurrency(result.data.total_micro_savings)}</strong></td><td></td></tr></tbody></table></div>`;
    html += `<p class="highlight">💰 Auto-transfer ${formatCurrency(result.data.total_micro_savings)} to investments</p>`;
    
    document.getElementById('microSavingsResult').innerHTML = html;
}

function saveProfile() {
    const profile = {
        totalAmount: document.getElementById('totalAmount').value,
        savingsPct: document.getElementById('savingsPct').value,
        investmentPct: document.getElementById('investmentPct').value,
        personalPct: document.getElementById('personalPct').value,
        miscPct: document.getElementById('miscPct').value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('financeProfile', JSON.stringify(profile));
    showNotification('✅ Profile saved successfully!');
}

function loadProfile() {
    const saved = localStorage.getItem('financeProfile');
    if (!saved) {
        showNotification('⚠️ No saved profile found');
        return;
    }
    
    const profile = JSON.parse(saved);
    document.getElementById('totalAmount').value = profile.totalAmount;
    document.getElementById('savingsPct').value = profile.savingsPct;
    document.getElementById('investmentPct').value = profile.investmentPct;
    document.getElementById('personalPct').value = profile.personalPct;
    document.getElementById('miscPct').value = profile.miscPct;
    
    const date = new Date(profile.timestamp).toLocaleString();
    showNotification(`✅ Profile loaded (saved: ${date})`);
}

function clearProfile() {
    if (confirm('Are you sure you want to delete your saved profile?')) {
        localStorage.removeItem('financeProfile');
        document.getElementById('totalAmount').value = '';
        document.getElementById('savingsPct').value = '';
        document.getElementById('investmentPct').value = '';
        document.getElementById('personalPct').value = '';
        document.getElementById('miscPct').value = '15';
        showNotification('🗑️ Profile cleared');
    }
}

function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.style.display = 'block';
    setTimeout(() => notif.style.display = 'none', 3000);
}

// Auto-load profile on page load
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('financeProfile');
    if (saved) {
        const profile = JSON.parse(saved);
        const date = new Date(profile.timestamp).toLocaleString();
        document.getElementById('profileStatus').textContent = `Last saved: ${date}`;
    }
});

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Loading overlay functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ============================================================================
// CORE FEATURES
// ============================================================================

// Budget Allocation
document.getElementById('budgetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const data = {
        total_amount: parseFloat(document.getElementById('totalAmount').value),
        savings_pct: parseFloat(document.getElementById('savingsPct').value),
        investment_pct: parseFloat(document.getElementById('investmentPct').value),
        personal_pct: parseFloat(document.getElementById('personalPct').value),
        misc_pct: parseFloat(document.getElementById('miscPct').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/allocate-budget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error calculating budget');
        }
        
        currentBudgetAllocation = result.allocation;
        displayBudgetResult(result);
    } catch (error) {
        document.getElementById('budgetResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayBudgetResult(result) {
    const allocation = result.allocation;
    const projections = result.projections;
    
    let html = '<h3>Monthly Allocation</h3><table><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>';
    
    for (const [category, amount] of Object.entries(allocation)) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td><td>${formatCurrency(amount)}</td></tr>`;
    }
    html += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${formatCurrency(result.total_allocated)}</strong></td></tr>`;
    html += '</tbody></table>';
    
    html += '<h3>Projections</h3><table><thead><tr><th>Category</th>';
    for (const period of Object.keys(projections)) {
        html += `<th>${period}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    const categories = Object.keys(allocation);
    for (const category of categories) {
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>`;
        for (const period of Object.keys(projections)) {
            html += `<td>${formatCurrency(projections[period][category])}</td>`;
        }
        html += '</tr>';
    }
    
    html += '<tr class="total-row"><td><strong>Total</strong></td>';
    for (const period of Object.keys(projections)) {
        const total = Object.values(projections[period]).reduce((sum, val) => sum + val, 0);
        html += `<td><strong>${formatCurrency(total)}</strong></td>`;
    }
    html += '</tr></tbody></table>';
    
    html += '<div class="success">✅ Budget calculated! Now you can analyze your goals below.</div>';
    
    document.getElementById('budgetResult').innerHTML = html;
}

// Combined Goals Analysis
document.getElementById('combinedGoalsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(document.getElementById('totalAmount').value);
    if (!totalAmount || !currentBudgetAllocation) {
        alert('Please calculate your budget allocation first using the Budget Allocation form above!');
        return;
    }
    
    showLoading();
    
    const data = {
        total_income: totalAmount,
        allocation: currentBudgetAllocation,
        savings_target: parseFloat(document.getElementById('savingsTarget').value),
        savings_months: parseInt(document.getElementById('savingsMonths').value),
        investment_target: parseFloat(document.getElementById('investmentTarget').value),
        investment_months: parseInt(document.getElementById('investmentMonths').value),
        annual_return: parseFloat(document.getElementById('annualReturn').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/combined-goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error analyzing goals');
        }
        
        displayCombinedGoalsResult(result);
    } catch (error) {
        document.getElementById('combinedGoalsResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayCombinedGoalsResult(result) {
    let html = '<h3>Goal Analysis</h3><table><thead><tr><th>Goal Type</th><th>Required Monthly</th><th>Current Allocation</th><th>Gap</th></tr></thead><tbody>';
    
    const savingsStatus = result.savings_gap >= 0 ? '✔' : '✗';
    const savingsGapStr = result.savings_gap >= 0 ? formatCurrency(result.savings_gap) : `-${formatCurrency(Math.abs(result.savings_gap))}`;
    html += `<tr><td>${savingsStatus} Savings</td><td>${formatCurrency(result.required_monthly_savings)}</td><td>${formatCurrency(result.current_allocation.savings)}</td><td>${savingsGapStr}</td></tr>`;
    
    const investmentStatus = result.investment_gap >= 0 ? '✔' : '✗';
    const investmentGapStr = result.investment_gap >= 0 ? formatCurrency(result.investment_gap) : `-${formatCurrency(Math.abs(result.investment_gap))}`;
    html += `<tr><td>${investmentStatus} Investments</td><td>${formatCurrency(result.required_monthly_investment)}</td><td>${formatCurrency(result.current_allocation.investments)}</td><td>${investmentGapStr}</td></tr>`;
    
    html += '</tbody></table>';
    
    if (result.goals_met) {
        html += '<div class="success">✅ Your current allocations meet both goals!</div>';
    } else {
        html += `<div class="warning">⚠️ Total Shortfall: ${formatCurrency(result.total_shortfall)}/month</div>`;
        
        if (result.new_allocation) {
            html += '<h3>Unified Reallocation Plan</h3><table><thead><tr><th>Category</th><th>Current</th><th>Suggested</th><th>Change</th></tr></thead><tbody>';
            
            const categories = ['savings', 'investments', 'personal', 'misc'];
            for (const cat of categories) {
                const current = result.current_allocation[cat];
                const suggested = result.new_allocation[cat];
                const change = suggested - current;
                const changeStr = change > 0 ? `+${formatCurrency(change)}` : change < 0 ? `-${formatCurrency(Math.abs(change))}` : formatCurrency(0);
                html += `<tr><td>${cat.charAt(0).toUpperCase() + cat.slice(1)}</td><td>${formatCurrency(current)}</td><td>${formatCurrency(suggested)}</td><td>${changeStr}</td></tr>`;
            }
            html += '</tbody></table>';
        }
    }
    
    const analysis = result.ai_analysis;
    html += `<h3>AI Financial Advisor</h3><div class="ai-box">`;
    html += `<p><strong>Allocation Health:</strong> ${analysis.allocation_health}</p>`;
    
    if (analysis.identified_leaks && analysis.identified_leaks.length > 0) {
        html += '<p><strong>Identified Issues:</strong></p><ul>';
        analysis.identified_leaks.forEach(leak => html += `<li>${leak}</li>`);
        html += '</ul>';
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += '<p><strong>Recommendations:</strong></p><ul>';
        analysis.recommendations.forEach(rec => html += `<li>${rec}</li>`);
        html += '</ul>';
    }
    
    if (analysis.priority_actions && analysis.priority_actions.length > 0) {
        html += '<p><strong>Priority Actions:</strong></p><ul>';
        analysis.priority_actions.forEach(action => html += `<li>${action}</li>`);
        html += '</ul>';
    }
    
    html += '</div>';
    
    document.getElementById('combinedGoalsResult').innerHTML = html;
}

// ============================================================================
// ADVANCED ANALYTICS
// ============================================================================

// Expense Forecasting
document.getElementById('expenseForecastForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const expenseHistory = document.getElementById('expenseHistory').value
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
    
    if (expenseHistory.length < 3) {
        alert('Please enter at least 3 months of expense data');
        hideLoading();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/expense-forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthly_expenses_history: expenseHistory })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error forecasting expenses');
        }
        
        displayExpenseForecast(result.predictions);
    } catch (error) {
        document.getElementById('expenseForecastResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayExpenseForecast(predictions) {
    let html = '<h3>Expense Forecast (2-3 Months)</h3>';
    
    predictions.forEach(pred => {
        html += `<div class="forecast-box">
            <h4>📊 ${pred.type}</h4>
            <p><strong>Expected Amount:</strong> ${formatCurrency(pred.amount)}</p>
            <p><strong>Probability:</strong> ${(pred.probability * 100).toFixed(0)}%</p>
            <p><strong>Timeframe:</strong> ${pred.timeframe}</p>
            <p><strong>💡 Suggestion:</strong> ${pred.suggestion}</p>
        </div>`;
    });
    
    document.getElementById('expenseForecastResult').innerHTML = html;
}

// Income Volatility
document.getElementById('incomeVolatilityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const incomeHistory = document.getElementById('incomeHistory').value
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
    
    if (incomeHistory.length < 2) {
        alert('Please enter at least 2 months of income data');
        hideLoading();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/income-volatility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ income_history: incomeHistory })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error calculating volatility');
        }
        
        displayIncomeVolatility(result);
    } catch (error) {
        document.getElementById('incomeVolatilityResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayIncomeVolatility(result) {
    let html = `<h3>Income Volatility Buffer</h3>
        <p><strong>6-Month Average Income:</strong> ${formatCurrency(result.avg_income)}</p>
        <p><strong>Income Volatility:</strong> ${result.volatility_pct.toFixed(1)}% (${result.recommendation})</p>
        <p><strong>Recommended Safe Budget:</strong> ${formatCurrency(result.safe_budget)}</p>
        <p><strong>Buffer Reserve Needed:</strong> ${formatCurrency(result.buffer_needed)}</p>`;
    
    if (result.volatility_pct > 30) {
        html += `<div class="warning">⚠️ High income volatility detected! Build reserve fund of ${formatCurrency(result.buffer_needed * 3)} (3-month buffer)</div>`;
    } else {
        html += `<div class="success">✅ Moderate volatility. Maintain ${formatCurrency(result.buffer_needed * 2)} buffer</div>`;
    }
    
    document.getElementById('incomeVolatilityResult').innerHTML = html;
}

// Tax-Loss Harvesting
function addInvestmentEntry() {
    const container = document.getElementById('investmentInputs');
    const entry = document.createElement('div');
    entry.className = 'investment-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Investment Name</label>
                <input type="text" class="invName" placeholder="e.g., Tech Stock">
            </div>
            <div class="form-group">
                <label>Purchase Value (₹)</label>
                <input type="number" class="invPurchase" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Current Value (₹)</label>
                <input type="number" class="invCurrent" min="0" step="0.01">
            </div>
        </div>
    `;
    container.appendChild(entry);
}

async function calculateTaxHarvesting() {
    showLoading();
    
    const entries = document.querySelectorAll('.investment-entry');
    const investments = [];
    
    entries.forEach(entry => {
        const name = entry.querySelector('.invName').value;
        const purchase = parseFloat(entry.querySelector('.invPurchase').value);
        const current = parseFloat(entry.querySelector('.invCurrent').value);
        
        if (name && !isNaN(purchase) && !isNaN(current)) {
            investments.push({
                name: name,
                purchase_value: purchase,
                current_value: current
            });
        }
    });
    
    if (investments.length === 0) {
        alert('Please add at least one investment');
        hideLoading();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/tax-harvesting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ investments: investments })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error analyzing tax harvesting');
        }
        
        displayTaxHarvesting(result);
    } catch (error) {
        document.getElementById('taxHarvestingResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function displayTaxHarvesting(result) {
    if (!result.has_opportunities || !result.opportunities || result.opportunities.length === 0) {
        document.getElementById('taxHarvestingResult').innerHTML = '<div class="success">✅ No tax-loss harvesting opportunities (all investments performing well)</div>';
        return;
    }
    
    let html = '<h3>Tax-Loss Harvesting Opportunities</h3><table><thead><tr><th>Investment</th><th>Loss</th><th>Loss %</th><th>Tax Benefit</th></tr></thead><tbody>';
    
    let totalBenefit = 0;
    result.opportunities.forEach(opp => {
        html += `<tr><td>${opp.name}</td><td>${formatCurrency(opp.loss_amount)}</td><td>${opp.loss_pct.toFixed(1)}%</td><td>${formatCurrency(opp.tax_offset_benefit)}</td></tr>`;
        totalBenefit += opp.tax_offset_benefit;
    });
    
    html += `<tr class="total-row"><td><strong>Total Tax Benefit</strong></td><td></td><td></td><td><strong>${formatCurrency(totalBenefit)}</strong></td></tr></tbody></table>`;
    html += `<p class="info">💡 Selling these before year-end can offset ${formatCurrency(totalBenefit)} in taxes</p>`;
    
    document.getElementById('taxHarvestingResult').innerHTML = html;
}

// Opportunity Cost
document.getElementById('opportunityCostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const data = {
        skipped_amount: parseFloat(document.getElementById('skippedAmount').value),
        months: parseInt(document.getElementById('oppMonths').value),
        annual_return_pct: parseFloat(document.getElementById('oppReturn').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/opportunity-cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error calculating opportunity cost');
        }
        
        displayOpportunityCost(result);
    } catch (error) {
        document.getElementById('opportunityCostResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayOpportunityCost(result) {
    const html = `<h3>Opportunity Cost Analysis</h3>
        <p>Skipping ${formatCurrency(result.skipped_monthly)}/month for ${result.months} months at ${result.annual_return.toFixed(1)}% annual return:</p>
        <p><strong>Future Value Lost:</strong> ${formatCurrency(result.lost_future_value)}</p>
        <p><strong>With Compounding:</strong> ${formatCurrency(result.lost_compounded_value)}</p>
        <p class="highlight"><strong>💰 Total Opportunity Cost:</strong> ${formatCurrency(result.total_opportunity_cost)}</p>
        <p class="warning">⚠️ Every month delayed = ${formatCurrency(result.total_opportunity_cost / result.months)} less at goal</p>`;
    
    document.getElementById('opportunityCostResult').innerHTML = html;
}

// ============================================================================
// BEHAVIORAL & OPTIMIZATION
// ============================================================================

// Asset Allocation
document.getElementById('assetAllocationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const monthlyInv = document.getElementById('monthlyInvestment').value;
    const data = {
        age: parseInt(document.getElementById('age').value),
        risk_tolerance: document.getElementById('riskTolerance').value,
        timeline_years: parseInt(document.getElementById('timelineYears').value),
        monthly_investment: monthlyInv ? parseFloat(monthlyInv) : null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/asset-allocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error calculating asset allocation');
        }
        
        displayAssetAllocation(result);
    } catch (error) {
        document.getElementById('assetAllocationResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayAssetAllocation(result) {
    const alloc = result.allocation;
    const monthlyInv = parseFloat(document.getElementById('monthlyInvestment').value);
    
    let html = `<h3>Asset Allocation Optimizer</h3>
        <p><strong>Risk Profile:</strong> ${alloc.risk_profile}</p>
        <h4>Recommended Allocation:</h4>`;
    
    // Check if backend sent breakdown OR calculate it ourselves
    const breakdown = result.monthly_breakdown || (monthlyInv && monthlyInv > 0 ? {
        stocks: (alloc.stocks / 100) * monthlyInv,
        bonds: (alloc.bonds / 100) * monthlyInv,
        cash: (alloc.cash / 100) * monthlyInv
    } : null);
    
    if (breakdown) {
        html += `<p>📈 Stocks: ${alloc.stocks}% (${formatCurrency(breakdown.stocks)})</p>
            <p>📊 Bonds: ${alloc.bonds}% (${formatCurrency(breakdown.bonds)})</p>
            <p>💵 Cash: ${alloc.cash}% (${formatCurrency(breakdown.cash)})</p>`;
    } else {
        html += `<p>📈 Stocks: ${alloc.stocks}%</p>
            <p>📊 Bonds: ${alloc.bonds}%</p>
            <p>💵 Cash: ${alloc.cash}%</p>`;
    }
    
    html += `<p class="info">💡 Rebalance when any category drifts >${alloc.rebalance_trigger}%</p>`;
    
    if (alloc.stocks >= 70) {
        html += '<p class="warning">⚠️ High stock allocation - suitable for long-term aggressive growth</p>';
    } else if (alloc.stocks <= 40) {
        html += '<p class="success">✅ Conservative allocation - suitable for capital preservation</p>';
    } else {
        html += '<p class="success">✅ Balanced allocation - good mix of growth and stability</p>';
    }
    
    document.getElementById('assetAllocationResult').innerHTML = html;
}

// Dynamic Reallocation
document.getElementById('dynamicReallocationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const data = {
        allocation: {
            savings: parseFloat(document.getElementById('allocSavings').value),
            investments: parseFloat(document.getElementById('allocInvestments').value),
            personal: parseFloat(document.getElementById('allocPersonal').value),
            misc: parseFloat(document.getElementById('allocMisc').value)
        },
        actual_spending: {
            savings: parseFloat(document.getElementById('spentSavings').value),
            investments: parseFloat(document.getElementById('spentInvestments').value),
            personal: parseFloat(document.getElementById('spentPersonal').value),
            misc: parseFloat(document.getElementById('spentMisc').value)
        },
        months_tracked: parseInt(document.getElementById('monthsTracked').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/dynamic-reallocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error analyzing reallocation');
        }
        
        displayDynamicReallocation(result);
    } catch (error) {
        document.getElementById('dynamicReallocationResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayDynamicReallocation(result) {
    if (!result.has_suggestions || !result.suggestions || result.suggestions.length === 0) {
        document.getElementById('dynamicReallocationResult').innerHTML = '<div class="success">✅ All categories being used efficiently. No reallocation needed.</div>';
        return;
    }
    
    let html = '<h3>Dynamic Reallocation Suggestions</h3>';
    
    const deficitCoverage = result.suggestions.filter(s => s.type === 'deficit_coverage');
    const surplusRealloc = result.suggestions.filter(s => s.type === 'surplus_reallocation');
    const deficitWarnings = result.suggestions.filter(s => s.type === 'deficit_warning');
    const efficiencyTips = result.suggestions.filter(s => s.type === 'efficiency_tip');
    
    if (deficitCoverage.length > 0) {
        html += '<h4>🔴 Overspending Coverage Plan:</h4>';
        deficitCoverage.forEach(sug => {
            html += `<div class="suggestion-box">
                <p><strong>${sug.category.toUpperCase()}:</strong> Allocated ${formatCurrency(sug.allocated)} | Spent ${formatCurrency(sug.spent)}</p>
                <p>💡 ${sug.action}</p>
            </div>`;
        });
    }
    
    if (surplusRealloc.length > 0) {
        html += '<h4>🟢 Surplus Reallocation:</h4>';
        surplusRealloc.forEach(sug => {
            html += `<div class="suggestion-box">
                <p><strong>${sug.category.toUpperCase()}:</strong> Allocated ${formatCurrency(sug.allocated)} | Spent ${formatCurrency(sug.spent)}</p>
                <p>💡 ${sug.action}</p>
            </div>`;
        });
    }
    
    if (deficitWarnings.length > 0) {
        html += '<h4>⚠️ Budget Overruns:</h4>';
        deficitWarnings.forEach(sug => {
            html += `<div class="suggestion-box warning">
                <p><strong>${sug.category.toUpperCase()}:</strong> Allocated ${formatCurrency(sug.allocated)} | Spent ${formatCurrency(sug.spent)}</p>
                <p>💡 ${sug.action}</p>
            </div>`;
        });
    }
    
    if (efficiencyTips.length > 0) {
        html += '<h4>💡 Efficiency Optimization:</h4>';
        efficiencyTips.forEach(sug => {
            html += `<div class="suggestion-box">
                <p><strong>${sug.category.toUpperCase()}:</strong> Allocated ${formatCurrency(sug.allocated)} | Spent ${formatCurrency(sug.spent)}</p>
                <p>💡 ${sug.action}</p>
            </div>`;
        });
    }
    
    document.getElementById('dynamicReallocationResult').innerHTML = html;
}

// Micro-Savings
function addMicroEntry() {
    const container = document.getElementById('microSavingsInputs');
    const entry = document.createElement('div');
    entry.className = 'micro-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Category</label>
                <input type="text" class="microCategory" placeholder="e.g., Dining">
            </div>
            <div class="form-group">
                <label>Budgeted (₹)</label>
                <input type="number" class="microBudgeted" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Actual Spent (₹)</label>
                <input type="number" class="microActual" min="0" step="0.01">
            </div>
        </div>
    `;
    container.appendChild(entry);
}

async function calculateMicroSavings() {
    showLoading();
    
    const entries = document.querySelectorAll('.micro-entry');
    const transactions = [];
    
    entries.forEach(entry => {
        const category = entry.querySelector('.microCategory').value;
        const budgeted = parseFloat(entry.querySelector('.microBudgeted').value);
        const actual = parseFloat(entry.querySelector('.microActual').value);
        
        if (category && !isNaN(budgeted) && !isNaN(actual)) {
            transactions.push({ category, budgeted, actual });
        }
    });
    
    if (transactions.length === 0) {
        alert('Please add at least one category');
        hideLoading();
        return;
    }
    
    const threshold = parseFloat(document.getElementById('savingsThreshold').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/micro-savings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions, savings_threshold: threshold })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error calculating micro-savings');
        }
        
        displayMicroSavings(result);
    } catch (error) {
        document.getElementById('microSavingsResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function displayMicroSavings(result) {
    if (!result.has_savings || !result.data || !result.data.triggers || result.data.triggers.length === 0) {
        document.getElementById('microSavingsResult').innerHTML = '<div class="success">✅ No micro-savings opportunities this period</div>';
        return;
    }
    
    let html = '<h3>Micro-Savings Triggers</h3><table><thead><tr><th>Category</th><th>Budgeted</th><th>Actual</th><th>Saved</th><th>Action</th></tr></thead><tbody>';
    
    result.data.triggers.forEach(trigger => {
        html += `<tr><td>${trigger.category}</td><td>${formatCurrency(trigger.budgeted)}</td><td>${formatCurrency(trigger.actual)}</td><td>${formatCurrency(trigger.saved)}</td><td>${trigger.action}</td></tr>`;
    });
    
    html += `<tr class="total-row"><td><strong>Total Micro-Savings</strong></td><td></td><td></td><td><strong>${formatCurrency(result.data.total_micro_savings)}</strong></td><td></td></tr></tbody></table>`;
    html += `<p class="highlight">💰 Auto-transfer ${formatCurrency(result.data.total_micro_savings)} to investments</p>`;
    
    document.getElementById('microSavingsResult').innerHTML = html;
}

// Streak Tracking
function generateStreakInputs() {
    const months = parseInt(document.getElementById('streakMonths').value);
    const container = document.getElementById('streakInputs');
    container.innerHTML = '<h4>Did you stay within budget each month?</h4>';
    
    for (let i = 1; i <= months; i++) {
        container.innerHTML += `
            <div class="streak-month">
                <label>Month ${i}:</label>
                <input type="checkbox" class="streakSuccess" data-month="${i}">
                <span>Yes, stayed within budget</span>
            </div>
        `;
    }
}

async function calculateStreak() {
    showLoading();
    
    const checkboxes = document.querySelectorAll('.streakSuccess');
    if (checkboxes.length === 0) {
        alert('Please generate month inputs first');
        hideLoading();
        return;
    }
    
    const monthly_performance = [];
    checkboxes.forEach(cb => {
        monthly_performance.push({ success: cb.checked });
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/streak-tracking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthly_performance, goal_type: 'budget_adherence' })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error tracking streak');
        }
        
        displayStreak(result);
    } catch (error) {
        document.getElementById('streakResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function displayStreak(result) {
    let html = `<h3>Financial Discipline Streak</h3>
        <p class="highlight">🔥 Current Streak: ${result.current_streak} months</p>
        <p>🏆 Longest Streak: ${result.longest_streak} months</p>
        <p>📊 Success Rate: ${result.success_rate.toFixed(1)}% (${result.total_months} months tracked)</p>`;
    
    if (result.milestone) {
        html += `<p class="success">${result.milestone}</p>`;
    }
    
    if (result.current_streak === 0) {
        html += '<p class="info">💪 Start fresh this month! Every expert was once a beginner.</p>';
    } else if (result.current_streak < 3) {
        html += '<p class="info">💪 Keep pushing! Consistency builds wealth.</p>';
    }
    
    document.getElementById('streakResult').innerHTML = html;
}

// ============================================================================
// STRATEGIC INTELLIGENCE
// ============================================================================

// Goal Conflict Resolver
function addGoalEntry() {
    const container = document.getElementById('goalConflictInputs');
    const entry = document.createElement('div');
    entry.className = 'goal-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Goal Name</label>
                <input type="text" class="goalName" placeholder="e.g., Car Purchase">
            </div>
            <div class="form-group">
                <label>Target (₹)</label>
                <input type="number" class="goalTarget" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Timeline (Months)</label>
                <input type="number" class="goalTimeline" min="1">
            </div>
            <div class="form-group">
                <label>Expected Return (%)</label>
                <input type="number" class="goalReturn" min="0" step="0.01" value="0">
            </div>
        </div>
    `;
    container.appendChild(entry);
}

async function resolveGoalConflicts() {
    showLoading();
    
    const income = parseFloat(document.getElementById('conflictIncome').value);
    const allocation = {
        savings: parseFloat(document.getElementById('conflictSavings').value),
        investments: parseFloat(document.getElementById('conflictInvestments').value),
        personal: parseFloat(document.getElementById('conflictPersonal').value),
        misc: parseFloat(document.getElementById('conflictMisc').value)
    };
    
    const entries = document.querySelectorAll('.goal-entry');
    const goals = [];
    
    entries.forEach(entry => {
        const name = entry.querySelector('.goalName').value;
        const target = parseFloat(entry.querySelector('.goalTarget').value);
        const timeline = parseInt(entry.querySelector('.goalTimeline').value);
        const expectedReturn = parseFloat(entry.querySelector('.goalReturn').value);
        
        if (name && !isNaN(target) && !isNaN(timeline)) {
            goals.push({
                name,
                target_amount: target,
                timeline_months: timeline,
                expected_return: expectedReturn
            });
        }
    });
    
    if (goals.length < 2) {
        alert('Please add at least 2 goals');
        hideLoading();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/goal-conflict-resolver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goals, monthly_income: income, current_allocation: allocation })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error resolving goal conflicts');
        }
        
        displayGoalConflict(result);
    } catch (error) {
        document.getElementById('goalConflictResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function displayGoalConflict(result) {
    if (!result.scored_goals || result.scored_goals.length === 0) {
        document.getElementById('goalConflictResult').innerHTML = '<div class="error">❌ No goals to analyze</div>';
        return;
    }
    
    const income = parseFloat(document.getElementById('conflictIncome').value) || 0;
    
    let html = `<h3>Goal Conflict Resolver</h3>
        <p>Total Goals: ${result.total_goals} | Available Income: ${formatCurrency(income)}</p>`;
    
    html += '<div class="goals-list">';
    result.scored_goals.forEach((goal, i) => {
        const priorityClass = goal.priority === 'High' ? 'high-priority' : goal.priority === 'Medium' ? 'medium-priority' : 'low-priority';
        html += `<div class="goal-box ${priorityClass}">
            <h4>#${i + 1} [${goal.priority}] ${goal.name.toUpperCase()}</h4>
            <p><strong>Target:</strong> ${formatCurrency(goal.target_amount)} | <strong>Monthly:</strong> ${formatCurrency(goal.monthly_required)} | <strong>Timeline:</strong> ${goal.deadline_months} months</p>
            <p><strong>📊 Scores:</strong> Urgency ${goal.urgency_score.toFixed(1)} | ROI ${goal.roi_score.toFixed(1)} | Feasibility ${goal.feasibility_score.toFixed(1)} | Total ${goal.total_score.toFixed(1)}</p>
        </div>`;
    });
    html += '</div>';
    
    const topTwoRequired = result.scored_goals.slice(0, Math.min(2, result.scored_goals.length)).reduce((sum, g) => sum + g.monthly_required, 0);
    
    html += `<div class="recommendation">
        <h4>💡 RECOMMENDATION:</h4>
        <p>Focus on top ${Math.min(2, result.total_goals)} goals first for optimal resource allocation</p>`;
    
    if (income > 0) {
        if (topTwoRequired > income) {
            html += `<p class="warning">⚠️ Top 2 goals need ${formatCurrency(topTwoRequired)}/month - consider timeline adjustment</p>`;
        } else {
            html += `<p class="success">✅ Top 2 goals achievable with ${formatCurrency(topTwoRequired)}/month (${((topTwoRequired / income) * 100).toFixed(1)}% of income)</p>`;
        }
    }
    
    html += '</div>';
    
    document.getElementById('goalConflictResult').innerHTML = html;
}

// Market-Aware Advisor
document.getElementById('marketAdvisorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const data = {
        current_market_conditions: {
            status: document.getElementById('marketStatus').value,
            volatility: document.getElementById('volatility').value
        },
        investment_allocation: parseFloat(document.getElementById('marketInvestment').value),
        risk_tolerance: document.getElementById('marketRisk').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/market-advisor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error getting market advice');
        }
        
        displayMarketAdvisor(result);
    } catch (error) {
        document.getElementById('marketAdvisorResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayMarketAdvisor(result) {
    if (!result.recommendations || result.recommendations.length === 0) {
        document.getElementById('marketAdvisorResult').innerHTML = '<div class="error">❌ No market recommendations available</div>';
        return;
    }
    
    let html = `<h3>Market-Aware Advisor</h3>
        <p><strong>📊 Current Market:</strong> ${result.market_status} | <strong>Volatility:</strong> ${result.volatility}</p>`;
    
    html += '<div class="recommendations-list">';
    result.recommendations.forEach(rec => {
        const riskIcon = rec.risk_level === 'High' ? '🔴' : rec.risk_level === 'Medium' ? '🟡' : '🟢';
        html += `<div class="market-rec">
            <h4>${riskIcon} [${rec.type.toUpperCase()}]</h4>
            <p><strong>Action:</strong> ${rec.action}</p>
            <p><strong>Reasoning:</strong> ${rec.reasoning}</p>
        </div>`;
    });
    html += '</div>';
    
    if (result.allocation_adjustments && Object.keys(result.allocation_adjustments).length > 0) {
        html += '<h4>📈 Suggested Adjustments:</h4><ul>';
        for (const [key, value] of Object.entries(result.allocation_adjustments)) {
            html += `<li>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${formatCurrency(value)}</li>`;
        }
        html += '</ul>';
    }
    
    document.getElementById('marketAdvisorResult').innerHTML = html;
}

// Inflation Adjuster
function addInflationGoalEntry() {
    const container = document.getElementById('inflationGoalInputs');
    const entry = document.createElement('div');
    entry.className = 'inflation-goal-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Goal Name</label>
                <input type="text" class="infGoalName" placeholder="e.g., Retirement">
            </div>
            <div class="form-group">
                <label>Target (₹)</label>
                <input type="number" class="infGoalTarget" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Timeline (Months)</label>
                <input type="number" class="infGoalTimeline" min="1">
            </div>
            <div class="form-group">
                <label>Expected Return (%)</label>
                <input type="number" class="infGoalReturn" min="0" step="0.01" value="0">
            </div>
        </div>
    `;
    container.appendChild(entry);
}

async function adjustForInflation() {
    showLoading();
    
    const inflationRate = parseFloat(document.getElementById('inflationRate').value);
    const entries = document.querySelectorAll('.inflation-goal-entry');
    const goals = [];
    
    entries.forEach(entry => {
        const name = entry.querySelector('.infGoalName').value;
        const target = parseFloat(entry.querySelector('.infGoalTarget').value);
        const timeline = parseInt(entry.querySelector('.infGoalTimeline').value);
        const expectedReturn = parseFloat(entry.querySelector('.infGoalReturn').value);
        
        if (name && !isNaN(target) && !isNaN(timeline)) {
            goals.push({
                name,
                target_amount: target,
                timeline_months: timeline,
                expected_return: expectedReturn
            });
        }
    });
    
    if (goals.length === 0) {
        alert('Please add at least one goal');
        hideLoading();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/inflation-adjuster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goals, current_inflation_rate: inflationRate })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error adjusting for inflation');
        }
        
        displayInflationAdjuster(result);
    } catch (error) {
        document.getElementById('inflationResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

function displayInflationAdjuster(result) {
    let html = `<h3>Inflation Adjuster</h3>
        <p><strong>Inflation Rate:</strong> ${result.inflation_rate.toFixed(1)}% annually</p>`;
    
    result.adjusted_goals.forEach(goal => {
        html += `<div class="inflation-box">
            <h4>${goal.name.toUpperCase()} (${goal.timeline_years.toFixed(1)} years)</h4>
            <table>
                <tr><td>Original Target:</td><td>${formatCurrency(goal.original_target)}</td><td>→ Monthly:</td><td>${formatCurrency(goal.original_monthly)}</td></tr>
                <tr class="highlight"><td>Adjusted Target:</td><td>${formatCurrency(goal.adjusted_target)}</td><td>→ Monthly:</td><td>${formatCurrency(goal.adjusted_monthly)}</td></tr>
                <tr><td>Inflation Impact:</td><td>${formatCurrency(goal.inflation_impact)}</td><td>→ Increase:</td><td>${formatCurrency(goal.monthly_increase)}/month</td></tr>
            </table>
        </div>`;
    });
    
    html += `<div class="summary">
        <p><strong>💰 Total Impact:</strong> ${formatCurrency(result.total_impact)} | <strong>Additional Monthly:</strong> ${formatCurrency(result.total_monthly_increase)}</p>
        <p class="info">💡 Targets auto-adjusted to maintain purchasing power</p>
    </div>`;
    
    document.getElementById('inflationResult').innerHTML = html;
}

// Bank Feed Integration
document.getElementById('bankFeedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const data = {
        monthly_income: parseFloat(document.getElementById('bankIncome').value),
        allocation: {
            savings: parseFloat(document.getElementById('bankSavings').value),
            investments: parseFloat(document.getElementById('bankInvestments').value),
            personal: parseFloat(document.getElementById('bankPersonal').value),
            misc: parseFloat(document.getElementById('bankMisc').value)
        },
        variance: parseFloat(document.getElementById('bankVariance').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bank-feed-simulator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'Error simulating bank feed');
        }
        
        displayBankFeed(result);
    } catch (error) {
        document.getElementById('bankFeedResult').innerHTML = `<div class="error">❌ ${error.message}</div>`;
    } finally {
        hideLoading();
    }
});

function displayBankFeed(result) {
    let html = `<h3>Bank Feed Integration (Demo)</h3>
        <p><strong>Total Transactions:</strong> ${result.total_transactions}</p>
        <p><strong>Auto-Categorized:</strong> ${result.auto_categorized_count} (${(result.avg_confidence * 100).toFixed(1)}% avg confidence)</p>`;
    
    html += '<h4>Category Totals</h4><table><thead><tr><th>Category</th><th>Transactions</th><th>Total Amount</th></tr></thead><tbody>';
    
    for (const [category, total] of Object.entries(result.category_totals)) {
        const count = result.transactions.filter(t => t.category === category).length;
        html += `<tr><td>${category.charAt(0).toUpperCase() + category.slice(1)}</td><td>${count}</td><td>${formatCurrency(total)}</td></tr>`;
    }
    
    html += '</tbody></table>';
    html += '<p class="info">💡 All transactions automatically categorized using ML</p>';
    html += '<p class="info">📊 Ready for budget tracking and analysis</p>';
    
    document.getElementById('bankFeedResult').innerHTML = html;
}