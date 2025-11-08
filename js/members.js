// members.js - Complete member management system for American Corner Mahajanga - VERSION WITH PROFILE NAVIGATION
class MembersSystem {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isInitialized = false;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isOnline = navigator.onLine;
        this.isMobile = this.detectMobile();
        
        this.init();
        
        // Initialize QR linkage
        setTimeout(() => {
            this.initializeQRLinkage();
        }, 2000);
    }

    detectMobile() {
        return window.innerWidth <= 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async init() {
        console.log('👥 Initializing member system...');
        this.setupMobileOptimizations();
        this.setupNetworkListeners();
        await this.loadMembers();
        this.isInitialized = true;
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            this.viewMode = 'list';
            this.enableTouchOptimizations();
        }
    }

    enableTouchOptimizations() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        if (e.target.closest('.member-card')) {
            e.target.closest('.member-card').classList.add('touch-active');
        }
    }

    handleTouchEnd(e) {
        document.querySelectorAll('.member-card.touch-active').forEach(card => {
            card.classList.remove('touch-active');
        });
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.isOnline = true;
            this.showNotification('Internet connection restored', 'success');
            document.body.classList.remove('network-offline');
        });

        window.addEventListener('offline', () => {
            console.log('📴 Connection lost');
            this.isOnline = false;
            this.showNotification('Offline mode activated', 'warning');
            document.body.classList.add('network-offline');
        });
    }

    // ==================== QR GENERATOR LINKAGE ====================

    /**
     * Checks and initializes QR linkage
     */
    initializeQRLinkage() {
        console.log('🔗 Initializing QR linkage...');
        
        // Periodically check if QR generator is available
        const qrCheckInterval = setInterval(() => {
            if (window.qrGenerator) {
                clearInterval(qrCheckInterval);
                this.setupQRLinkage();
                console.log('🎯 QR Generator detected, linkage activated');
            }
        }, 500);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(qrCheckInterval);
            if (!window.qrGenerator) {
                console.warn('⚠️ QR Generator not detected after 10s');
            }
        }, 10000);
    }

    /**
     * Linkage system between members and QR generator
     */
    setupQRLinkage() {
        console.log('🔗 Configuring QR linkage...');
        
        // Expose methods globally for HTML calls
        window.generateMemberQR = (registrationNumber) => {
            this.generateMemberQR(registrationNumber);
        };
        
        window.generateQuickQR = (registrationNumber) => {
            this.generateQuickQR(registrationNumber);
        };
        
        console.log('✅ QR linkage configured');
    }

    /**
     * Generates a QR code for a member with redirection to QR page
     * @param {string} registrationNumber - Member registration number
     */
    generateMemberQR(registrationNumber) {
        const member = this.members.find(m => m.registrationNumber === registrationNumber);
        if (!member) {
            this.showNotification('Member not found', 'error');
            return;
        }

        console.log('🎯 Generating QR for:', member.firstName, member.lastName);

        // Check if we're already on the QR page
        const currentPage = this.getCurrentPage();
        
        if (currentPage === 'qr-generator') {
            // We're already on QR page, pre-fill the form
            if (window.qrGenerator && typeof window.qrGenerator.prefillForm === 'function') {
                window.qrGenerator.prefillForm(member);
            } else {
                this.prefillForm(member);
            }
        } else {
            // Redirect to QR page
            this.navigateToQRGenerator(member);
        }
    }

    /**
     * Directly generates a QR code for a member (quick method)
     * @param {string} registrationNumber - Member registration number
     */
    generateQuickQR(registrationNumber) {
        console.log('⚡ Quick QR generation for:', registrationNumber);
        
        const member = this.members.find(m => m.registrationNumber === registrationNumber);
        if (!member) {
            this.showNotification('Member not found', 'error');
            return;
        }

        if (window.qrGenerator && typeof window.qrGenerator.quickGenerateQR === 'function') {
            // Use QR generator's quick method
            window.qrGenerator.quickGenerateQR(registrationNumber);
            
            // Check if we need to redirect
            const currentPage = this.getCurrentPage();
            if (currentPage !== 'qr-generator') {
                this.navigateToQRGenerator(member);
            }
        } else {
            // Fallback: redirect to QR page with pre-fill
            this.prefillForm(member);
        }
    }

    /**
     * Pre-fills QR form with member data
     * @param {Object} member - Member data
     */
    prefillForm(member) {
        console.log('📝 Pre-filling QR form for:', member.registrationNumber);
        
        if (!member) {
            console.error('❌ No member provided for pre-fill');
            return;
        }

        try {
            // Wait for QR generator to initialize
            const waitForQRGenerator = setInterval(() => {
                if (window.qrGenerator && typeof window.qrGenerator.fillFormFields === 'function') {
                    clearInterval(waitForQRGenerator);
                    
                    // Pre-fill form fields
                    window.qrGenerator.fillFormFields({
                        registrationNumber: member.registrationNumber,
                        firstName: member.firstName,
                        lastName: member.lastName,
                        occupation: member.occupation || 'student',
                        phoneNumber: member.phoneNumber || '',
                        studyWorkPlace: member.studyOrWorkPlace || ''
                    });
                    
                    console.log('✅ QR form pre-filled successfully');
                    
                    // Optional: Automatically generate QR code
                    setTimeout(() => {
                        if (window.qrGenerator.generateQRCode) {
                            window.qrGenerator.generateQRCode();
                        }
                    }, 500);
                    
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(waitForQRGenerator);
                console.warn('⚠️ QR generator wait timeout');
            }, 5000);

        } catch (error) {
            console.error('❌ Form pre-fill error:', error);
            this.showNotification('Error pre-filling QR form', 'error');
        }
    }

    /**
     * Navigates to QR Generator page with member data
     * @param {Object} member - Member data
     */
    navigateToQRGenerator(member) {
        console.log('🧭 Navigating to QR Generator for:', member.registrationNumber);
        
        if (window.appController && typeof window.appController.loadPage === 'function') {
            // Use existing application controller
            sessionStorage.setItem('qrPrefillData', JSON.stringify(member));
            window.appController.loadPage('qr-generator');
            this.showNotification(`Redirecting to QR generator for ${member.firstName} ${member.lastName}`, 'info');
        } else if (window.router && typeof window.router.navigate === 'function') {
            // Use alternative router
            sessionStorage.setItem('qrPrefillData', JSON.stringify(member));
            window.router.navigate('qr-generator');
        } else {
            // Basic hash fallback
            sessionStorage.setItem('qrPrefillData', JSON.stringify(member));
            window.location.hash = 'qr-generator';
            this.showNotification('Loading QR generator...', 'info');
            
            // Pre-fill after delay
            setTimeout(() => {
                this.prefillForm(member);
            }, 1000);
        }
    }

    /**
     * Detects currently displayed page
     * @returns {string|null} Current page ID
     */
    getCurrentPage() {
        // Method to detect current page
        const pages = document.querySelectorAll('.page-section');
        for (let page of pages) {
            if (page.style.display === 'block' || page.classList.contains('active')) {
                return page.id;
            }
        }
        
        // Also check URL hash
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            return hash;
        }
        
        return null;
    }

    // ==================== PROFILE PAGE NAVIGATION ====================

    /**
     * Navigates to member profile page in new tab
     * @param {Object} member - Member data
     */
    navigateToProfilePage(member) {
        console.log('🧭 Navigating to profile of:', member.registrationNumber);
        
        // Store member data for profile page
        sessionStorage.setItem('currentMemberProfile', JSON.stringify(member));
        
        // Use the specific URL format requested
        const profileUrl = `https://acm-attendance-system.netlify.app/#profile${member.registrationNumber}`;
        
        console.log('🔗 Opening profile URL:', profileUrl);
        
        // Open in new tab/window
        window.open(profileUrl, '_blank');
        
        this.showNotification(`Profile of ${member.firstName} ${member.lastName} opened in new tab`, 'info');
    }

    /**
     * Alternative method to open profile in current tab
     */
    navigateToProfilePageCurrentTab(member) {
        console.log('🧭 Navigating to profile in current tab:', member.registrationNumber);
        
        // Store member data for profile page
        sessionStorage.setItem('currentMemberProfile', JSON.stringify(member));
        
        // Use the specific URL format requested
        const profileUrl = `https://acm-attendance-system.netlify.app/#profile${member.registrationNumber}`;
        
        console.log('🔗 Redirecting to profile URL:', profileUrl);
        
        // Redirect current tab
        window.location.href = profileUrl;
    }

    /**
     * Displays detailed member profile
     * @param {number} memberId - Member ID
     */
    viewMemberDetails(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            console.log('👤 Displaying profile:', member.registrationNumber);
            this.navigateToProfilePage(member);
        } else {
            this.showNotification('Member not found', 'error');
        }
    }

    // ==================== EXISTING FUNCTIONS (WITH UPDATES) ====================

    async loadMembers() {
        this.isLoading = true;
        
        try {
            console.log('🔄 Loading member data...');
            
            // Priority 1: Use API if available and loaded
            if (window.apiService && window.apiService.members && window.apiService.members.length > 0) {
                this.members = window.apiService.members;
                console.log(`✅ ${this.members.length} members loaded from API`);
            } 
            // Priority 2: Wait for API to load
            else if (window.apiService && typeof window.apiService.fetchMembers === 'function') {
                console.log('⏳ Loading members from API...');
                await window.apiService.fetchMembers();
                
                if (window.apiService.members && window.apiService.members.length > 0) {
                    this.members = window.apiService.members;
                    console.log(`✅ ${this.members.length} members loaded from API after fetch`);
                } else {
                    throw new Error('API returned empty list');
                }
            } 
            // Priority 3: Mock data fallback
            else {
                console.warn('⚠️ API unavailable, loading mock data');
                this.members = await this.loadMockMembers();
                console.log(`📦 ${this.members.length} mock members loaded`);
            }
            
            this.filteredMembers = [...this.members];
            this.isLoading = false;
            
        } catch (error) {
            console.error('❌ Member loading error:', error);
            this.isLoading = false;
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
                
                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
                this.showNotification(`Retry attempt (${this.retryCount}/${this.maxRetries})...`, 'info');
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.loadMembers();
            } else {
                this.showNetworkError();
                this.useOfflineData();
            }
        }
    }

    showNetworkError() {
        const container = document.getElementById('membersContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12">
                <div class="card text-center border-warning">
                    <div class="card-body py-5">
                        <i class="fas fa-wifi fa-4x text-warning mb-4"></i>
                        <h3 class="text-warning mb-3">Connection Problem</h3>
                        <p class="text-muted mb-4">
                            Unable to load data from server. 
                            Check your internet connection.
                        </p>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <button class="btn btn-warning" onclick="membersSystem.retryLoad()">
                                <i class="fas fa-sync me-2"></i>Retry
                            </button>
                            <button class="btn btn-outline-secondary" onclick="membersSystem.useOfflineData()">
                                <i class="fas fa-users me-2"></i>Use local data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    useOfflineData() {
        console.log('📴 Using offline data...');
        
        try {
            const cachedData = localStorage.getItem('cachedMembers');
            if (cachedData) {
                this.members = JSON.parse(cachedData);
                this.filteredMembers = [...this.members];
                this.renderMembers();
                this.showNotification('Local data loaded', 'info');
            } else {
                this.loadMockMembers().then(mockMembers => {
                    this.members = mockMembers;
                    this.filteredMembers = [...this.members];
                    this.renderMembers();
                    this.showNotification('Demo data loaded', 'warning');
                });
            }
        } catch (error) {
            console.error('❌ Cache data loading error:', error);
            this.loadMockMembers().then(mockMembers => {
                this.members = mockMembers;
                this.filteredMembers = [...this.members];
                this.renderMembers();
                this.showNotification('Demo data loaded', 'warning');
            });
        }
    }

    // Utility functions
    formatOccupation(occupation) {
        if (!occupation) return 'Not specified';
        const occupations = {
            'student': 'Student',
            'employee': 'Employee',
            'entrepreneur': 'Entrepreneur',
            'unemployed': 'Unemployed',
            'other': 'Other'
        };
        return occupations[occupation] || occupation;
    }

    getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (firstInitial + lastInitial).substring(0, 2);
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    getOccupationIcon(occupation) {
        const icons = {
            'student': 'fa-graduation-cap',
            'employee': 'fa-briefcase',
            'entrepreneur': 'fa-lightbulb',
            'unemployed': 'fa-user',
            'other': 'fa-user'
        };
        return icons[occupation] || 'fa-user';
    }

    getOccupationColor(occupation) {
        const colors = {
            'student': 'success',
            'employee': 'info',
            'entrepreneur': 'warning',
            'unemployed': 'secondary',
            'other': 'dark'
        };
        return colors[occupation] || 'primary';
    }

    getAvatarColor(member) {
        const colors = [
            '#007bff', '#28a745', '#17a2b8', '#ffc107', 
            '#dc3545', '#6f42c1', '#e83e8c', '#fd7e14',
            '#20c997', '#0dcaf0', '#6610f2', '#d63384'
        ];
        const colorIndex = (member.id || Math.floor(Math.random() * colors.length)) % colors.length;
        return colors[colorIndex];
    }

    // ROBUST VERSION - Using CSS for avatars
    getProfileImage(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const bgColor = this.getAvatarColor(member);
        const occupationIcon = this.getOccupationIcon(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);

        // Check if image exists
        if (member.profileImage && member.profileImage.trim() !== '') {
            let imageUrl;
            
            if (window.apiService && typeof window.apiService.getProfileImageUrl === 'function') {
                imageUrl = window.apiService.getProfileImageUrl(member.profileImage);
            } else {
                imageUrl = member.profileImage;
            }
            
            // CSS fallback for failed images
            const fallbackHTML = `
                <div class="avatar-fallback" style="background-color: ${bgColor};">
                    <span class="avatar-initials">${initials}</span>
                </div>
            `;
            
            return `
                <div class="member-avatar-container">
                    <img src="${imageUrl}" 
                         alt="${member.firstName} ${member.lastName}"
                         class="member-photo actual-photo"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                         onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                    ${fallbackHTML}
                    <div class="occupation-icon bg-${occupationColor}">
                        <i class="fas ${occupationIcon} text-white"></i>
                    </div>
                </div>
            `;
        }
        
        // If no photo, use CSS fallback directly
        return `
            <div class="member-avatar-container">
                <div class="avatar-fallback" style="background-color: ${bgColor};">
                    <span class="avatar-initials">${initials}</span>
                </div>
                <div class="occupation-icon bg-${occupationColor}">
                    <i class="fas ${occupationIcon} text-white"></i>
                </div>
            </div>
        `;
    }

    // Enhanced main interface
    async loadMembersPage() {
        console.log('📄 Loading members page...');
        const container = document.getElementById('membersContainer');
        if (!container) {
            console.error('❌ Members container not found');
            return;
        }
        
        // Show enhanced loading
        container.innerHTML = this.getEnhancedLoadingHTML();
        
        // Ensure members are loaded
        if (this.members.length === 0) {
            await this.loadMembers();
        }
        
        if (this.members.length === 0) {
            container.innerHTML = this.getNoMembersHTML();
            return;
        }
        
        // Update statistics
        this.updateQuickStats();
        
        // Initialize filtered members
        this.filteredMembers = [...this.members];
        
        // Display complete interface
        this.renderEnhancedControls();
        this.renderMembers();
        
        console.log(`✅ ${this.members.length} members loaded, ${this.filteredMembers.length} displayed`);
    }

    getEnhancedLoadingHTML() {
        return `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="loading-spinner mb-4">
                        <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;"></div>
                    </div>
                    <h3 class="text-primary mb-3">Loading Members</h3>
                    <p class="text-muted mb-4">Preparing our community profiles</p>
                    <div class="progress mb-3" style="height: 6px; max-width: 300px; margin: 0 auto;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 75%"></div>
                    </div>
                    <div class="mt-4">
                        <button class="btn btn-outline-primary btn-lg" onclick="membersSystem.retryLoad()">
                            <i class="fas fa-sync me-2"></i>Refresh
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateQuickStats() {
        const total = this.members.length;
        const active = this.members.filter(m => {
            const joinDate = new Date(m.joinDate);
            const monthsDiff = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff <= 6; // Active if member for less than 6 months
        }).length;
        
        const newMembers = this.members.filter(m => {
            const joinDate = new Date(m.joinDate);
            const daysDiff = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30; // New if member for less than 30 days
        }).length;

        // Update DOM elements
        const totalEl = document.getElementById('totalMembers');
        const activeEl = document.getElementById('activeMembers');
        const newEl = document.getElementById('newMembers');

        if (totalEl) this.animateCounter(totalEl, total);
        if (activeEl) this.animateCounter(activeEl, active);
        if (newEl) this.animateCounter(newEl, newMembers);
    }

    animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 30);
    }

    async retryLoad() {
        console.log('🔄 Retrying load...');
        await this.loadMembers();
        await this.loadMembersPage();
    }

    getNoMembersHTML() {
        return `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="fas fa-users fa-4x text-muted mb-4"></i>
                        <h3 class="text-muted">No members available</h3>
                        <p class="text-muted mb-4">Members will appear here once loaded from the system</p>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <button class="btn btn-primary" onclick="membersSystem.retryLoad()">
                                <i class="fas fa-sync me-2"></i>Refresh
                            </button>
                            <button class="btn btn-outline-secondary" onclick="appController?.loadPage('home')">
                                <i class="fas fa-home me-2"></i>Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEnhancedControls() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        const stats = this.getStats();
        const controlsHTML = `
            <div class="col-12 mb-4">
                <div class="card controls-card">
                    <div class="card-body p-4">
                        <!-- Header with counter and view mode -->
                        <div class="row align-items-center mb-4">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <div class="section-icon me-3">
                                        <i class="fas fa-users fa-2x text-primary"></i>
                                    </div>
                                    <div>
                                        <h4 class="card-title mb-0">Member Management</h4>
                                        <p class="text-muted mb-0" id="membersSubtitle">${this.getFilteredMembersText()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <div class="d-flex align-items-center justify-content-md-end gap-3">
                                    <span class="badge bg-primary fs-6" id="membersCount">${this.filteredMembers.length}/${this.members.length}</span>
                                    ${stats.demoMode ? '<span class="badge bg-warning demo-badge">Demo Mode</span>' : ''}
                                    
                                    <!-- View selector -->
                                    <div class="btn-group view-toggle" role="group">
                                        <button type="button" class="btn btn-outline-secondary ${this.viewMode === 'grid' ? 'active' : ''}" 
                                                onclick="membersSystem.setViewMode('grid')" title="Grid View">
                                            <i class="fas fa-th"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary ${this.viewMode === 'list' ? 'active' : ''}" 
                                                onclick="membersSystem.setViewMode('list')" title="List View">
                                            <i class="fas fa-list"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Enhanced search bar -->
                        <div class="row mb-4">
                            <div class="col-12">
                                <div class="search-container">
                                    <div class="input-group input-group-lg">
                                        <span class="input-group-text">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" 
                                               class="form-control" 
                                               id="membersSearch" 
                                               placeholder="Search member by name, number, phone, email..."
                                               value="${this.searchQuery}">
                                        <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn" ${!this.searchQuery ? 'disabled' : ''}>
                                            <i class="fas fa-times"></i> Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Enhanced filters and sorting -->
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="d-flex flex-wrap align-items-center gap-3">
                                    <span class="text-muted fw-bold">Filter by:</span>
                                    <div class="filter-group d-flex flex-wrap">
                                        ${this.renderEnhancedFilterButtons()}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex justify-content-md-end gap-2 align-items-center">
                                    <div class="sort-dropdown">
                                        ${this.renderEnhancedSortDropdown()}
                                    </div>
                                    <button class="btn btn-success" onclick="membersSystem.refreshData()" title="Refresh data">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                    <button class="btn btn-info" onclick="membersSystem.exportMembers()" title="Export members">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="row g-4" id="membersGridContainer"></div>
            </div>
        `;
        
        container.innerHTML = controlsHTML;
        
        // Setup event listeners
        this.setupEnhancedControlsEventListeners();
        
        // Focus on search bar
        const searchInput = document.getElementById('membersSearch');
        if (searchInput) {
            searchInput.focus();
        }
    }

    getStats() {
        return {
            demoMode: window.apiService ? window.apiService.isUsingDemoData() : true,
            total: this.members.length,
            filtered: this.filteredMembers.length
        };
    }

    renderEnhancedFilterButtons() {
        const filters = [
            { value: 'all', label: 'All', icon: 'fa-users', color: 'primary' },
            { value: 'student', label: 'Students', icon: 'fa-graduation-cap', color: 'success' },
            { value: 'employee', label: 'Employees', icon: 'fa-briefcase', color: 'info' },
            { value: 'entrepreneur', label: 'Entrepreneurs', icon: 'fa-lightbulb', color: 'warning' },
            { value: 'other', label: 'Others', icon: 'fa-user', color: 'secondary' }
        ];
        
        return filters.map(filter => `
            <button type="button" 
                    class="btn btn-${this.currentFilter === filter.value ? filter.color : 'outline-' + filter.color}" 
                    data-filter="${filter.value}"
                    title="${filter.label}">
                <i class="fas ${filter.icon} me-2"></i>${filter.label}
            </button>
        `).join('');
    }

    renderEnhancedSortDropdown() {
        const sortOptions = [
            { value: 'name', label: 'Name A-Z', icon: 'fa-sort-alpha-down' },
            { value: 'name-desc', label: 'Name Z-A', icon: 'fa-sort-alpha-down-alt' },
            { value: 'recent', label: 'Most Recent', icon: 'fa-calendar-plus' },
            { value: 'oldest', label: 'Oldest', icon: 'fa-calendar-minus' },
            { value: 'occupation', label: 'By Occupation', icon: 'fa-briefcase' }
        ];
        
        const currentSortOption = sortOptions.find(opt => opt.value === this.currentSort) || sortOptions[0];
        
        return `
            <div class="dropdown">
                <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas ${currentSortOption.icon} me-2"></i>${currentSortOption.label}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    ${sortOptions.map(option => `
                        <li>
                            <a class="dropdown-item ${this.currentSort === option.value ? 'active' : ''}" 
                               href="#" data-sort="${option.value}">
                                <i class="fas ${option.icon} me-2"></i>${option.label}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    setupEnhancedControlsEventListeners() {
        // Search
        const searchInput = document.getElementById('membersSearch');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Filters
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.closest('[data-filter]').getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
        
        // Sorting
        document.querySelectorAll('[data-sort]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sort = e.target.closest('[data-sort]').getAttribute('data-sort');
                this.setSort(sort);
            });
        });
    }

    handleSearch(query) {
        this.searchQuery = query.trim();
        
        // Update clear button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.disabled = !this.searchQuery;
        }
        
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    clearSearch() {
        this.searchQuery = '';
        const searchInput = document.getElementById('membersSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.disabled = true;
        }
        
        this.applyFilters();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.applyFilters();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.applyFilters();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.renderMembers();
        this.updateViewModeButtons();
    }

    updateViewModeButtons() {
        document.querySelectorAll('.view-toggle .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.view-toggle .btn[onclick*="${this.viewMode}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    applyFilters() {
        let filtered = this.filterBySearch(this.members);
        filtered = this.filterByOccupation(filtered);
        filtered = this.sortMembers(filtered);
        
        this.filteredMembers = filtered;
        this.renderMembers();
        this.updateMembersCount();
        this.updateControlsState();
    }

    filterBySearch(members) {
        if (!this.searchQuery) return members;
        
        const query = this.searchQuery.toLowerCase();
        return members.filter(member => 
            (member.firstName && member.firstName.toLowerCase().includes(query)) ||
            (member.lastName && member.lastName.toLowerCase().includes(query)) ||
            (member.registrationNumber && member.registrationNumber.toLowerCase().includes(query)) ||
            (member.email && member.email.toLowerCase().includes(query)) ||
            (member.phoneNumber && member.phoneNumber.toLowerCase().includes(query)) ||
            (member.studyOrWorkPlace && member.studyOrWorkPlace.toLowerCase().includes(query)) ||
            (member.address && member.address.toLowerCase().includes(query))
        );
    }

    filterByOccupation(members) {
        if (this.currentFilter === 'all') return members;
        return members.filter(member => member.occupation === this.currentFilter);
    }

    sortMembers(members) {
        switch (this.currentSort) {
            case 'name':
                return members.sort((a, b) => 
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                );
            case 'name-desc':
                return members.sort((a, b) => 
                    `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
                );
            case 'recent':
                return members.sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0));
            case 'oldest':
                return members.sort((a, b) => new Date(a.joinDate || 0) - new Date(b.joinDate || 0));
            case 'occupation':
                return members.sort((a, b) => 
                    this.formatOccupation(a.occupation).localeCompare(this.formatOccupation(b.occupation))
                );
            default:
                return members;
        }
    }

    updateMembersCount() {
        const countElement = document.getElementById('membersCount');
        if (countElement) {
            countElement.textContent = `${this.filteredMembers.length}/${this.members.length}`;
        }
    }

    updateControlsState() {
        // Update active filter buttons
        document.querySelectorAll('[data-filter]').forEach(button => {
            const filter = button.getAttribute('data-filter');
            const filterConfig = {
                'all': { color: 'primary' },
                'student': { color: 'success' },
                'employee': { color: 'info' },
                'entrepreneur': { color: 'warning' },
                'other': { color: 'secondary' }
            };
            
            const config = filterConfig[filter] || { color: 'primary' };
            
            if (filter === this.currentFilter) {
                button.className = button.className.replace(/btn-outline-\w+/, `btn-${config.color}`);
            } else {
                button.className = button.className.replace(/btn-\w+/, `btn-outline-${config.color}`);
            }
        });
        
        // Update info text
        const infoElement = document.getElementById('membersSubtitle');
        if (infoElement) {
            infoElement.textContent = this.getFilteredMembersText();
        }
        
        // Update clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.disabled = !this.searchQuery;
        }
    }

    getFilteredMembersText() {
        if (this.searchQuery && this.currentFilter !== 'all') {
            return `Results for "${this.searchQuery}" among ${this.getFilterLabel(this.currentFilter).toLowerCase()}`;
        } else if (this.searchQuery) {
            return `Results for "${this.searchQuery}"`;
        } else if (this.currentFilter !== 'all') {
            return `${this.getFilterLabel(this.currentFilter)} only`;
        }
        return 'All members of our community';
    }

    getFilterLabel(filter) {
        const labels = {
            'all': 'All members',
            'student': 'Students',
            'employee': 'Employees',
            'entrepreneur': 'Entrepreneurs',
            'other': 'Others'
        };
        return labels[filter] || 'Filter';
    }

    renderMembers() {
        const container = document.getElementById('membersGridContainer');
        if (!container) return;
        
        if (this.filteredMembers.length === 0) {
            container.innerHTML = this.getEnhancedNoResultsHTML();
            return;
        }
        
        if (this.viewMode === 'list') {
            container.innerHTML = this.filteredMembers.map(member => 
                this.createMemberListCard(member)
            ).join('');
        } else {
            container.innerHTML = this.filteredMembers.map((member, index) => 
                this.createMemberGridCard(member, index)
            ).join('');
        }
    }

    getEnhancedNoResultsHTML() {
        let message = 'No members found';
        let suggestion = 'Check filters or search';
        let actions = '';
        
        if (this.searchQuery && this.currentFilter !== 'all') {
            message = `No results for "${this.searchQuery}" among ${this.getFilterLabel(this.currentFilter).toLowerCase()}`;
            suggestion = 'Try modifying your search or filters';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.clearSearch()">
                    <i class="fas fa-times me-1"></i>Clear search
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.setFilter('all')">
                    <i class="fas fa-users me-1"></i>View all members
                </button>
            `;
        } else if (this.searchQuery) {
            message = `No results for "${this.searchQuery}"`;
            suggestion = 'Check spelling or try other terms';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.clearSearch()">
                    <i class="fas fa-times me-1"></i>Clear search
                </button>
            `;
        } else if (this.currentFilter !== 'all') {
            message = `No ${this.getFilterLabel(this.currentFilter).toLowerCase()} found`;
            suggestion = 'Try another filter or view all members';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.setFilter('all')">
                    <i class="fas fa-users me-1"></i>View all members
                </button>
            `;
        } else {
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.retryLoad()">
                    <i class="fas fa-sync me-1"></i>Refresh
                </button>
            `;
        }
        
        return `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="no-results-icon mb-4">
                        <i class="fas fa-search fa-4x text-muted"></i>
                    </div>
                    <h3 class="text-muted mb-3">${message}</h3>
                    <p class="text-muted mb-4">${suggestion}</p>
                    <div class="d-flex gap-2 justify-content-center flex-wrap">
                        ${actions}
                    </div>
                </div>
            </div>
        `;
    }

    createMemberGridCard(member, index) {
        const profileImage = this.getProfileImage(member);
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);

        const highlightText = (text) => {
            if (!this.searchQuery || !text) return text;
            const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<mark class="search-highlight">$1</mark>');
        };

        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="card member-card h-100" style="animation-delay: ${index * 0.1}s">
                <div class="card-body p-4">
                    <!-- ... contenu existant de la carte ... -->
                </div>
                
                <!-- Actions AVEC BOUTON SPA -->
                <div class="card-footer bg-transparent border-top-0 pt-0 member-actions">
                    <div class="d-grid gap-2">
                        <!-- Bouton SPA pour ouvrir le profil -->
                        <button class="btn btn-primary btn-sm" 
                                onclick="membersSystem.openMemberProfile('${member.registrationNumber}')"
                                title="View member profile">
                            <i class="fas fa-eye me-1"></i>View Profile
                        </button>
                        
                        <!-- Les autres boutons QR restent identiques -->
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-success btn-sm" 
                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}')"
                                    title="Generate Custom QR Code">
                                <i class="fas fa-qrcode me-1"></i>QR Code
                            </button>
                            <button class="btn btn-outline-info btn-sm" 
                                    onclick="membersSystem.generateQuickQR('${member.registrationNumber}')"
                                    title="Quick Generation">
                                <i class="fas fa-bolt me-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    createMemberListCard(member) {
        const profileImage = this.getProfileImage(member);
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);

        const highlightText = (text) => {
            if (!this.searchQuery || !text) return text;
            const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<mark class="search-highlight">$1</mark>');
        };

        return `
            <div class="col-12 mb-3">
            <div class="card member-card">
                <div class="card-body py-3">
                    <div class="row align-items-center">
                        <!-- ... autres colonnes ... -->
                        <div class="col-md-2 text-end">
                            <div class="btn-group btn-group-sm">
                                <!-- Bouton SPA pour le profil -->
                                <button class="btn btn-outline-primary"
                                        onclick="membersSystem.openMemberProfile('${member.registrationNumber}')"
                                        title="View profile">
                                    <i class="fas fa-eye"></i>
                                </button>
                                
                                <!-- Les autres boutons restent identiques -->
                                <button class="btn btn-outline-success" 
                                        onclick="membersSystem.generateMemberQR('${member.registrationNumber}')"
                                        title="Generate QR Code">
                                    <i class="fas fa-qrcode"></i>
                                </button>
                                <!-- ... autres boutons ... -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    showMemberModal(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const profileImageUrl = window.apiService ? 
            window.apiService.getProfileImageUrl(member.profileImage) : 
            member.profileImage;
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);
        const hasProfileImage = !!member.profileImage && member.profileImage.trim() !== '';
        const bgColor = this.getAvatarColor(member);
        
        const profileImageHTML = hasProfileImage ? `
            <div class="member-avatar-container" style="width: 120px; height: 120px;">
                <img src="${profileImageUrl}" 
                    alt="${member.firstName} ${member.lastName}"
                    class="member-photo actual-photo"
                    style="border: 6px solid #fff; box-shadow: 0 8px 25px rgba(0,0,0,0.15);"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="avatar-fallback" style="background-color: ${bgColor}; display: none;">
                    <span class="avatar-initials" style="font-size: 2.5rem;">${initials}</span>
                </div>
                <div class="occupation-icon bg-${occupationColor}" style="width: 36px; height: 36px;">
                    <i class="fas ${this.getOccupationIcon(member.occupation)} text-white"></i>
                </div>
            </div>
        ` : `
            <div class="member-avatar-container" style="width: 120px; height: 120px;">
                <div class="avatar-fallback" style="background-color: ${bgColor};">
                    <span class="avatar-initials" style="font-size: 2.5rem;">${initials}</span>
                </div>
                <div class="occupation-icon bg-${occupationColor}" style="width: 36px; height: 36px;">
                    <i class="fas ${this.getOccupationIcon(member.occupation)} text-white"></i>
                </div>
            </div>
        `;
        
        const modalHTML = `
            <div class="modal fade" id="memberProfileModal" tabindex="-1" aria-labelledby="memberProfileModalLabel" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="memberProfileModalLabel">
                                <i class="fas fa-user-circle me-2"></i>
                                Member Profile - ${member.firstName} ${member.lastName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close window"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row align-items-center mb-4">
                                <div class="col-md-3 text-center">
                                    ${profileImageHTML}
                                </div>
                                <div class="col-md-9">
                                    <h3 class="mb-2" id="memberName">${member.firstName} ${member.lastName}</h3>
                                    <span class="badge bg-${occupationColor} fs-6 mb-3">${occupation}</span>
                                    <div class="row">
                                        <div class="col-sm-6">
                                            <p class="text-muted mb-2">
                                                <i class="fas fa-id-card me-2"></i>
                                                <strong>Registration Number:</strong> 
                                                <span class="member-id-display">${member.registrationNumber}</span>
                                            </p>
                                        </div>
                                        <div class="col-sm-6">
                                            <p class="text-muted mb-0">
                                                <i class="fas fa-calendar me-2"></i>
                                                <strong>Member since:</strong> ${joinDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-info-circle me-2 text-primary"></i>Personal Information</h5>
                                    <div class="info-grid">
                                        ${member.phoneNumber ? `
                                            <div class="info-item">
                                                <i class="fas fa-phone text-muted"></i>
                                                <div>
                                                    <strong>Phone</strong>
                                                    <div>${member.phoneNumber}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                        ${member.email ? `
                                            <div class="info-item">
                                                <i class="fas fa-envelope text-muted"></i>
                                                <div>
                                                    <strong>Email</strong>
                                                    <div>${member.email}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                        ${member.address ? `
                                            <div class="info-item">
                                                <i class="fas fa-map-marker-alt text-muted"></i>
                                                <div>
                                                    <strong>Address</strong>
                                                    <div>${member.address}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-briefcase me-2 text-primary"></i>Professional Activity</h5>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <i class="fas fa-user-tie text-muted"></i>
                                            <div>
                                                <strong>Occupation</strong>
                                                <div>${occupation}</div>
                                            </div>
                                        </div>
                                        ${member.studyOrWorkPlace ? `
                                            <div class="info-item">
                                                <i class="fas fa-building text-muted"></i>
                                                <div>
                                                    <strong>Study/Work Place</strong>
                                                    <div>${member.studyOrWorkPlace}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                        <div class="info-item">
                                            <i class="fas fa-calendar-alt text-muted"></i>
                                            <div>
                                                <strong>Join Date</strong>
                                                <div>${joinDate}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Close
                            </button>
                            <button type="button" class="btn btn-primary" id="generateQRBtn"
                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}'); bootstrap.Modal.getInstance(document.getElementById('memberProfileModal')).hide();">
                                <i class="fas fa-qrcode me-1"></i>Generate QR card
                            </button>
                            <!-- Nouveau bouton pour ouvrir le profil complet -->
                            <a href="https://acm-attendance-system.netlify.app/#profile${member.registrationNumber}" 
                               target="_blank"
                               class="btn btn-success">
                                <i class="fas fa-external-link-alt me-1"></i>Open Full Profile
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modal
        const existingModal = document.getElementById('memberProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById('memberProfileModal');
        
        // CORRECTION: Use correct Bootstrap options for accessibility
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Corrected event handling
        modalElement.addEventListener('show.bs.modal', () => {
            // Ensure aria-hidden is correct before display
            modalElement.removeAttribute('aria-hidden');
        });
        
        modalElement.addEventListener('shown.bs.modal', () => {
            // Corrected focus management
            const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]');
            if (closeButton) {
                closeButton.focus();
            }
            
            // Ensure body has correct class
            document.body.classList.add('modal-open');
            document.body.style.paddingRight = '0px'; // Avoid scrollbar shift
        });
        
        modalElement.addEventListener('hide.bs.modal', () => {
            // Prepare for closing
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Complete cleanup after closing
            modalElement.remove();
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            
            // Restore focus to element that opened modal
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('member-card')) {
                activeElement.focus();
            }
        });
        
        // Keyboard handling
        modalElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.hide();
            }
            
            // Trap focus inside modal (accessibility)
            if (e.key === 'Tab') {
                const focusableElements = modalElement.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length === 0) return;
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        // Show modal
        modal.show();
    }

    quickContact(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        const contactOptions = [];
        if (member.email) contactOptions.push(`📧 Email: ${member.email}`);
        if (member.phoneNumber) contactOptions.push(`📞 Phone: ${member.phoneNumber}`);
        
        if (contactOptions.length === 0) {
            this.showNotification('No contact information available', 'warning');
            return;
        }

        const modalHTML = `
            <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel" aria-modal="true" role="dialog">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="contactModalLabel">
                                <i class="fas fa-envelope me-2"></i>
                                Contact ${member.firstName} ${member.lastName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="contact-options">
                                ${contactOptions.map(option => `
                                    <div class="contact-option mb-3 p-3 border rounded">
                                        <div class="d-flex align-items-center">
                                            <i class="fas ${option.includes('Email') ? 'fa-envelope text-primary' : 'fa-phone text-success'} me-3 fa-lg"></i>
                                            <div>
                                                <strong>${option.split(': ')[0]}</strong>
                                                <div class="text-muted">${option.split(': ')[1]}</div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('contactModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById('contactModal');
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Configure accessibility
        modalElement.addEventListener('shown.bs.modal', () => {
            const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]');
            if (closeButton) {
                closeButton.focus();
            }
        });
        
        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
        modal.show();
    }

    async refreshData() {
        console.log('🔄 Refreshing member data...');
        this.showNotification('Updating data...', 'info');
        
        await this.loadMembers();
        await this.loadMembersPage();
        
        this.showNotification('Data updated successfully', 'success');
    }

    exportMembers() {
        if (this.filteredMembers.length === 0) {
            this.showNotification('No members to export', 'warning');
            return;
        }

        const data = this.filteredMembers.map(member => ({
            'Number': member.registrationNumber,
            'Last Name': member.lastName,
            'First Name': member.firstName,
            'Occupation': this.formatOccupation(member.occupation),
            'Email': member.email || '',
            'Phone': member.phoneNumber || '',
            'Study/Work Place': member.studyOrWorkPlace || '',
            'Address': member.address || '',
            'Join Date': this.formatDate(member.joinDate)
        }));

        // Create CSV file
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `american_corner_members_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification(`List of ${this.filteredMembers.length} members exported successfully`, 'success');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');
        
        return '\uFEFF' + csv; // BOM for Excel
    }

    showStats() {
        const stats = this.calculateStats();
        const modalHTML = `
            <div class="modal fade" id="statsModal" tabindex="-1" aria-labelledby="statsModalLabel" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="statsModalLabel">
                                <i class="fas fa-chart-bar me-2"></i>
                                Member Statistics
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="border-bottom pb-2">Occupation Distribution</h6>
                                    <div id="occupationChart">
                                        ${Object.entries(stats.byOccupation)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([occ, count]) => {
                                                const percentage = ((count / stats.total) * 100).toFixed(1);
                                                const occupationColor = this.getOccupationColor(occ);
                                                return `
                                                <div class="mb-3">
                                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                                        <span class="fw-medium">${this.formatOccupation(occ)}</span>
                                                        <div>
                                                            <span class="badge bg-${occupationColor} me-2">${count}</span>
                                                            <small class="text-muted">${percentage}%</small>
                                                        </div>
                                                    </div>
                                                    <div class="progress" style="height: 8px;">
                                                        <div class="progress-bar bg-${occupationColor}" 
                                                             style="width: ${percentage}%"
                                                             role="progressbar">
                                                        </div>
                                                    </div>
                                                </div>
                                            `}).join('')}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="border-bottom pb-2">General Information</h6>
                                    <div class="list-group">
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <span>Total members</span>
                                            <strong class="text-primary">${stats.total}</strong>
                                        </div>
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <span>With profile photo</span>
                                            <div>
                                                <strong>${stats.withProfileImage}</strong>
                                                <small class="text-muted ms-2">(${((stats.withProfileImage / stats.total) * 100).toFixed(1)}%)</small>
                                            </div>
                                        </div>
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <span>Recent members (30d)</span>
                                            <strong class="text-success">${stats.recentMembers}</strong>
                                        </div>
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <span>Active members (6 months)</span>
                                            <strong class="text-info">${stats.activeMembers}</strong>
                                        </div>
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <span>Data mode</span>
                                            <strong class="${stats.demoMode ? 'text-warning' : 'text-success'}">
                                                ${stats.demoMode ? 'Demo' : 'Live'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="membersSystem.exportMembers()">
                                <i class="fas fa-download me-1"></i>Export data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Handle existing modal
        const existingModal = document.getElementById('statsModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById('statsModal');
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Configure accessibility
        modalElement.addEventListener('shown.bs.modal', () => {
            const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]');
            if (closeButton) {
                closeButton.focus();
            }
        });
        
        modalElement.addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
        modal.show();
    }

    calculateStats() {
        const stats = {
            total: this.members.length,
            byOccupation: {},
            withProfileImage: 0,
            recentMembers: 0,
            activeMembers: 0,
            demoMode: window.apiService ? window.apiService.isUsingDemoData() : true
        };

        this.members.forEach(member => {
            const occupation = member.occupation || 'other';
            stats.byOccupation[occupation] = (stats.byOccupation[occupation] || 0) + 1;
            
            if (member.profileImage && member.profileImage.trim() !== '') {
                stats.withProfileImage++;
            }
            
            const joinDate = new Date(member.joinDate);
            const daysSinceJoin = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
            if (daysSinceJoin <= 30) stats.recentMembers++;
            if (daysSinceJoin <= 180) stats.activeMembers++; // 6 months
        });

        return stats;
    }

    async loadMockMembers() {
        // Backup mock data
        return [
            {
                id: 1,
                registrationNumber: 'ACM001',
                firstName: 'Linus',
                lastName: 'Torvalds',
                email: 'linus@linux.org',
                occupation: 'entrepreneur',
                phoneNumber: '+261 34 11 223 34',
                address: 'Mahajanga, Madagascar',
                studyOrWorkPlace: 'Linux Foundation',
                joinDate: new Date('2023-01-15').toISOString(),
                profileImage: null
            },
            {
                id: 2,
                registrationNumber: 'ACM002',
                firstName: 'Marie',
                lastName: 'Curie', 
                email: 'marie.curie@univ-mg.mg',
                occupation: 'student',
                phoneNumber: '+261 34 55 667 78',
                address: 'Mahajanga, Madagascar',
                studyOrWorkPlace: 'University of Mahajanga',
                joinDate: new Date('2023-03-20').toISOString(),
                profileImage: null
            },
            {
                id: 3,
                registrationNumber: 'ACM003',
                firstName: 'Jean',
                lastName: 'Rakoto',
                email: 'jean.rakoto@company.mg',
                occupation: 'employee',
                phoneNumber: '+261 32 44 556 67',
                address: 'Mahajanga, Madagascar',
                studyOrWorkPlace: 'ABC Company',
                joinDate: new Date('2023-06-10').toISOString(),
                profileImage: null
            },
            {
                id: 4,
                registrationNumber: 'ACM004',
                firstName: 'Emily',
                lastName: 'Johnson',
                email: 'emily.johnson@campus.edu',
                occupation: 'student',
                phoneNumber: '+261 33 987 6543',
                address: 'Mahajanga, Madagascar',
                studyOrWorkPlace: 'UCLA',
                joinDate: new Date('2023-01-12').toISOString(),
                profileImage: null
            }
        ];
    }

    showNotification(message, type = 'info') {
        if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification(message, type);
        } else {
            console.log(`💬 ${type.toUpperCase()}: ${message}`);
            // Simple fallback
            const alertClass = type === 'error' ? 'alert-danger' : 
                             type === 'success' ? 'alert-success' : 
                             type === 'warning' ? 'alert-warning' : 'alert-info';
            
            const alert = document.createElement('div');
            alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
            alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            alert.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
                    <div class="flex-grow-1">${message}</div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            document.body.appendChild(alert);
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

// Create and expose global instance
const membersSystem = new MembersSystem();
window.membersSystem = membersSystem;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Member system ready with Profile navigation');
});