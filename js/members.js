// members-enhanced.js - Système complet amélioré de gestion des membres
class EnhancedMembersSystem {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isInitialized = false;
        this.viewMode = 'grid';
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isOnline = navigator.onLine;
        this.isMobile = this.detectMobile();
        
        this.init();
    }

    detectMobile() {
        return window.innerWidth <= 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    async init() {
        console.log('👥 Initialisation du système des membres amélioré...');
        this.setupMobileOptimizations();
        this.setupNetworkListeners();
        await this.loadMembersWithRetry();
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
            console.log('🌐 Connexion rétablie');
            this.isOnline = true;
            this.showNotification('Connexion internet rétablie', 'success');
            document.body.classList.remove('network-offline');
            this.refreshData();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Perte de connexion');
            this.isOnline = false;
            this.showNotification('Mode hors ligne activé', 'warning');
            document.body.classList.add('network-offline');
        });
    }

    async loadMembersWithRetry() {
        this.isLoading = true;
        
        try {
            await this.loadMembers();
            this.retryCount = 0;
            this.isLoading = false;
        } catch (error) {
            console.error('❌ Load members failed:', error);
            this.isLoading = false;
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
                
                console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
                this.showNotification(`Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`, 'info');
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.loadMembersWithRetry();
            } else {
                this.showNetworkError();
                this.useOfflineData();
            }
        }
    }

    async loadMembers() {
        try {
            console.log('🔄 Chargement des données membres...');
            
            if (window.apiService && window.apiService.members && window.apiService.members.length > 0) {
                this.members = window.apiService.members;
                console.log(`✅ ${this.members.length} membres chargés depuis API`);
            } else if (window.apiService && typeof window.apiService.fetchMembers === 'function') {
                console.log('⏳ Chargement des membres depuis API...');
                await window.apiService.fetchMembers();
                
                if (window.apiService.members && window.apiService.members.length > 0) {
                    this.members = window.apiService.members;
                    console.log(`✅ ${this.members.length} membres chargés depuis API après fetch`);
                } else {
                    throw new Error('API retourne une liste vide');
                }
            } else {
                console.warn('⚠️ API non disponible, chargement des données mock');
                this.members = await this.loadMockMembers();
                console.log(`📦 ${this.members.length} membres mock chargés`);
            }
            
            // Pré-valider les images
            await this.preloadProfileImages();
            
            // Cache les données pour une utilisation hors ligne
            this.cacheMembersData();
            
            this.filteredMembers = [...this.members];
            
        } catch (error) {
            console.error('❌ Erreur chargement membres:', error);
            throw error;
        }
    }

    async preloadProfileImages() {
        if (!window.apiService) return;
        
        console.log('🖼️ Pré-validation des images de profil...');
        const validationPromises = this.members.map(async (member) => {
            member.hasValidImage = await window.apiService.validateProfileImage 
                ? await window.apiService.validateProfileImage(member)
                : false;
            return member;
        });
        
        await Promise.allSettled(validationPromises);
        console.log('✅ Pré-validation des images terminée');
    }

    cacheMembersData() {
        try {
            localStorage.setItem('cachedMembers', JSON.stringify(this.members));
            localStorage.setItem('cachedMembersTimestamp', new Date().toISOString());
            console.log('💾 Données membres mises en cache');
        } catch (error) {
            console.warn('❌ Impossible de mettre en cache les données:', error);
        }
    }

    useOfflineData() {
        console.log('📴 Utilisation des données hors ligne...');
        
        try {
            const cachedData = localStorage.getItem('cachedMembers');
            const timestamp = localStorage.getItem('cachedMembersTimestamp');
            
            if (cachedData) {
                this.members = JSON.parse(cachedData);
                this.filteredMembers = [...this.members];
                
                if (timestamp) {
                    const cacheAge = (new Date() - new Date(timestamp)) / (1000 * 60 * 60);
                    console.log(`📅 Données cache âgées de ${cacheAge.toFixed(1)} heures`);
                }
                
                this.showNotification('Données locales chargées', 'info');
                this.renderMembers();
            } else {
                this.loadMockMembers().then(mockMembers => {
                    this.members = mockMembers;
                    this.filteredMembers = [...this.members];
                    this.renderMembers();
                    this.showNotification('Données de démonstration chargées', 'warning');
                });
            }
        } catch (error) {
            console.error('❌ Erreur chargement données cache:', error);
            this.loadMockMembers().then(mockMembers => {
                this.members = mockMembers;
                this.filteredMembers = [...this.members];
                this.renderMembers();
                this.showNotification('Données de démonstration chargées', 'warning');
            });
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
                        <h3 class="text-warning mb-3">Problème de connexion</h3>
                        <p class="text-muted mb-4">
                            Impossible de charger les données depuis le serveur. 
                            Vérifiez votre connexion internet.
                        </p>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <button class="btn btn-warning" onclick="membersSystem.retryLoad()">
                                <i class="fas fa-sync me-2"></i>Réessayer
                            </button>
                            <button class="btn btn-outline-secondary" onclick="membersSystem.useOfflineData()">
                                <i class="fas fa-users me-2"></i>Utiliser les données locales
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Fonctions utilitaires
    formatOccupation(occupation) {
        if (!occupation) return 'Non spécifié';
        const occupations = {
            'student': 'Étudiant',
            'employee': 'Employé',
            'entrepreneur': 'Entrepreneur',
            'unemployed': 'Sans emploi',
            'other': 'Autre'
        };
        return occupations[occupation] || occupation;
    }

    getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (firstInitial + lastInitial).substring(0, 2);
    }

    formatDate(dateString) {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
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

    // SYSTEME D'AVATAR ROBUSTE AMÉLIORÉ
    getProfileImage(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const bgColor = this.getAvatarColor(member);
        const occupationIcon = this.getOccupationIcon(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);

        // Vérifier si l'image existe et est valide
        const hasValidImage = member.profileImage && member.profileImage.trim() !== '' && 
                             (member.hasValidImage === undefined || member.hasValidImage === true);

        if (hasValidImage) {
            let imageUrl;
            
            if (window.apiService && typeof window.apiService.getProfileImageUrl === 'function') {
                imageUrl = window.apiService.getProfileImageUrl(member.profileImage);
            } else {
                imageUrl = member.profileImage;
            }
            
            return `
                <div class="member-avatar-container">
                    <img src="${imageUrl}" 
                         alt="${member.firstName} ${member.lastName}"
                         class="member-photo actual-photo"
                         loading="lazy"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                         onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                    <div class="avatar-fallback" style="background-color: ${bgColor}; display: none;">
                        <span class="avatar-initials">${initials}</span>
                    </div>
                    <div class="occupation-icon bg-${occupationColor}">
                        <i class="fas ${occupationIcon} text-white"></i>
                    </div>
                </div>
            `;
        }
        
        // Si pas de photo valide, utiliser le fallback CSS directement
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

    // Interface principale améliorée
    async loadMembersPage() {
        console.log('📄 Chargement de la page membres améliorée...');
        const container = document.getElementById('membersContainer');
        if (!container) {
            console.error('❌ Conteneur membres non trouvé');
            return;
        }
        
        // Afficher le skeleton loading
        container.innerHTML = this.getSkeletonLoadingHTML();
        
        // S'assurer que les membres sont chargés
        if (this.members.length === 0 && !this.isLoading) {
            await this.loadMembersWithRetry();
        }
        
        if (this.members.length === 0) {
            container.innerHTML = this.getNoMembersHTML();
            return;
        }
        
        // Mettre à jour les statistiques
        this.updateQuickStats();
        
        // Initialiser les membres filtrés
        this.filteredMembers = [...this.members];
        
        // Afficher l'interface complète
        this.renderEnhancedControls();
        this.renderMembers();
        
        console.log(`✅ ${this.members.length} membres chargés, ${this.filteredMembers.length} affichés`);
    }

    getSkeletonLoadingHTML() {
        const skeletonCount = this.isMobile ? 4 : 8;
        return Array.from({ length: skeletonCount }, (_, i) => `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card member-card skeleton-card" style="animation-delay: ${i * 0.1}s">
                    <div class="card-body p-4">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-line skeleton-name"></div>
                        <div class="skeleton-line skeleton-id"></div>
                        <div class="skeleton-line skeleton-occupation"></div>
                        <div class="skeleton-line skeleton-contact"></div>
                        <div class="skeleton-line skeleton-contact short"></div>
                        <div class="skeleton-line skeleton-date"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateQuickStats() {
        const total = this.members.length;
        const active = this.members.filter(m => {
            const joinDate = new Date(m.joinDate);
            const monthsDiff = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff <= 6;
        }).length;
        
        const newMembers = this.members.filter(m => {
            const joinDate = new Date(m.joinDate);
            const daysDiff = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
        }).length;

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
        console.log('🔄 Nouvelle tentative de chargement...');
        await this.loadMembersWithRetry();
        await this.loadMembersPage();
    }

    getNoMembersHTML() {
        return `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="fas fa-users fa-4x text-muted mb-4"></i>
                        <h3 class="text-muted">Aucun membre disponible</h3>
                        <p class="text-muted mb-4">Les membres apparaîtront ici une fois chargés depuis le système</p>
                        <div class="d-flex gap-2 justify-content-center flex-wrap">
                            <button class="btn btn-primary" onclick="membersSystem.retryLoad()">
                                <i class="fas fa-sync me-2"></i>Actualiser
                            </button>
                            <button class="btn btn-outline-secondary" onclick="appController?.loadPage('home')">
                                <i class="fas fa-home me-2"></i>Accueil
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
                        <!-- En-tête avec compteur et mode de vue -->
                        <div class="row align-items-center mb-4">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <div class="section-icon me-3">
                                        <i class="fas fa-users fa-2x text-primary"></i>
                                    </div>
                                    <div>
                                        <h4 class="card-title mb-0">Gestion des Membres</h4>
                                        <p class="text-muted mb-0" id="membersSubtitle">${this.getFilteredMembersText()}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <div class="d-flex align-items-center justify-content-md-end gap-3">
                                    <span class="badge bg-primary fs-6" id="membersCount">${this.filteredMembers.length}/${this.members.length}</span>
                                    ${stats.demoMode ? '<span class="badge bg-warning demo-badge">Mode Démo</span>' : ''}
                                    ${!this.isOnline ? '<span class="badge bg-secondary">Hors ligne</span>' : ''}
                                    
                                    <!-- Sélecteur de vue -->
                                    <div class="btn-group view-toggle" role="group">
                                        <button type="button" class="btn btn-outline-secondary ${this.viewMode === 'grid' ? 'active' : ''}" 
                                                onclick="membersSystem.setViewMode('grid')" title="Vue Grille">
                                            <i class="fas fa-th"></i>
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary ${this.viewMode === 'list' ? 'active' : ''}" 
                                                onclick="membersSystem.setViewMode('list')" title="Vue Liste">
                                            <i class="fas fa-list"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Barre de recherche améliorée -->
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
                                               placeholder="Rechercher un membre par nom, numéro, téléphone, email..."
                                               value="${this.searchQuery}">
                                        <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn" ${!this.searchQuery ? 'disabled' : ''}>
                                            <i class="fas fa-times"></i> Effacer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Filtres et tris améliorés -->
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="d-flex flex-wrap align-items-center gap-3">
                                    <span class="text-muted fw-bold">Filtrer par :</span>
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
                                    <button class="btn btn-success" onclick="membersSystem.refreshData()" title="Rafraîchir les données">
                                        <i class="fas fa-sync"></i>
                                    </button>
                                    <button class="btn btn-info" onclick="membersSystem.exportMembers()" title="Exporter les membres">
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
        
        this.setupEnhancedControlsEventListeners();
        
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
            { value: 'all', label: 'Tous', icon: 'fa-users', color: 'primary' },
            { value: 'student', label: 'Étudiants', icon: 'fa-graduation-cap', color: 'success' },
            { value: 'employee', label: 'Employés', icon: 'fa-briefcase', color: 'info' },
            { value: 'entrepreneur', label: 'Entrepreneurs', icon: 'fa-lightbulb', color: 'warning' },
            { value: 'other', label: 'Autres', icon: 'fa-user', color: 'secondary' }
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
            { value: 'name', label: 'Nom A-Z', icon: 'fa-sort-alpha-down' },
            { value: 'name-desc', label: 'Nom Z-A', icon: 'fa-sort-alpha-down-alt' },
            { value: 'recent', label: 'Plus récents', icon: 'fa-calendar-plus' },
            { value: 'oldest', label: 'Plus anciens', icon: 'fa-calendar-minus' },
            { value: 'occupation', label: 'Par occupation', icon: 'fa-briefcase' }
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
        
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.closest('[data-filter]').getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
        
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
        
        const infoElement = document.getElementById('membersSubtitle');
        if (infoElement) {
            infoElement.textContent = this.getFilteredMembersText();
        }
        
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.disabled = !this.searchQuery;
        }
    }

    getFilteredMembersText() {
        if (this.searchQuery && this.currentFilter !== 'all') {
            return `Résultats pour "${this.searchQuery}" parmi les ${this.getFilterLabel(this.currentFilter).toLowerCase()}`;
        } else if (this.searchQuery) {
            return `Résultats pour "${this.searchQuery}"`;
        } else if (this.currentFilter !== 'all') {
            return `${this.getFilterLabel(this.currentFilter)} seulement`;
        }
        return 'Tous les membres de notre communauté';
    }

    getFilterLabel(filter) {
        const labels = {
            'all': 'Tous les membres',
            'student': 'Étudiants',
            'employee': 'Employés',
            'entrepreneur': 'Entrepreneurs',
            'other': 'Autres'
        };
        return labels[filter] || 'Filtrer';
    }

    renderMembers() {
        const container = document.getElementById('membersGridContainer');
        if (!container) return;
        
        if (this.filteredMembers.length === 0) {
            container.innerHTML = this.getEnhancedNoResultsHTML();
            return;
        }
        
        if (this.viewMode === 'list' || this.isMobile) {
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
        let message = 'Aucun membre trouvé';
        let suggestion = 'Vérifiez les filtres ou la recherche';
        let actions = '';
        
        if (this.searchQuery && this.currentFilter !== 'all') {
            message = `Aucun résultat pour "${this.searchQuery}" parmi les ${this.getFilterLabel(this.currentFilter).toLowerCase()}`;
            suggestion = 'Essayez de modifier votre recherche ou les filtres';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.clearSearch()">
                    <i class="fas fa-times me-1"></i>Effacer la recherche
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.setFilter('all')">
                    <i class="fas fa-users me-1"></i>Voir tous les membres
                </button>
            `;
        } else if (this.searchQuery) {
            message = `Aucun résultat pour "${this.searchQuery}"`;
            suggestion = 'Vérifiez l\'orthographe ou essayez d\'autres termes';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.clearSearch()">
                    <i class="fas fa-times me-1"></i>Effacer la recherche
                </button>
            `;
        } else if (this.currentFilter !== 'all') {
            message = `Aucun ${this.getFilterLabel(this.currentFilter).toLowerCase()} trouvé`;
            suggestion = 'Essayez un autre filtre ou affichez tous les membres';
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.setFilter('all')">
                    <i class="fas fa-users me-1"></i>Voir tous les membres
                </button>
            `;
        } else {
            actions = `
                <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.retryLoad()">
                    <i class="fas fa-sync me-1"></i>Actualiser
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
        if (this.isMobile) {
            return this.createMobileMemberCard(member, index);
        }

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
                <div class="card member-card h-100" style="animation-delay: ${index * 0.1}s" tabindex="0">
                    <div class="card-body p-4">
                        ${profileImage}
                        
                        <div class="text-center mb-3">
                            <h5 class="member-name">${highlightText(member.firstName)} ${highlightText(member.lastName)}</h5>
                            <div class="member-id">${highlightText(member.registrationNumber)}</div>
                        </div>
                        
                        <div class="member-occupation text-center mb-3">
                            <span class="badge bg-${occupationColor} text-white">${occupation}</span>
                        </div>
                        
                        <div class="member-contact text-muted small mb-3">
                            ${member.email ? `
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-envelope me-2 text-primary"></i>
                                    <span class="text-truncate" title="${member.email}">${highlightText(member.email)}</span>
                                </div>
                            ` : ''}
                            ${member.phoneNumber ? `
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-phone me-2 text-success"></i>
                                    <span>${highlightText(member.phoneNumber)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${member.studyOrWorkPlace ? `
                            <div class="member-location mb-3">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-building me-2 text-info"></i>
                                    <span class="text-truncate" title="${member.studyOrWorkPlace}">
                                        ${highlightText(member.studyOrWorkPlace)}
                                    </span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="member-join-date text-center">
                            <small class="text-muted">
                                <i class="fas fa-calendar-alt me-1"></i>Membre depuis ${joinDate}
                            </small>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent border-top-0 pt-0 member-actions">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" 
                                    onclick="membersSystem.viewMemberDetails(${member.id})"
                                    aria-label="Voir le profil de ${member.firstName} ${member.lastName}">
                                <i class="fas fa-eye me-1"></i>Voir le Profil
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}')"
                                    aria-label="Générer QR code pour ${member.firstName} ${member.lastName}">
                                <i class="fas fa-qrcode me-1"></i>Carte QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createMobileMemberCard(member, index) {
        const profileImage = this.getProfileImage(member);
        const occupation = this.formatOccupation(member.occupation);

        return `
            <div class="col-12 mb-3">
                <div class="card member-card mobile-member-card" style="animation-delay: ${index * 0.1}s" tabindex="0">
                    <div class="card-body p-3">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <div style="width: 60px; height: 60px;">
                                    ${profileImage}
                                </div>
                            </div>
                            <div class="col">
                                <h6 class="mb-1 fw-bold">${member.firstName} ${member.lastName}</h6>
                                <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
                                    <small class="text-primary">${member.registrationNumber}</small>
                                    <span class="badge bg-${this.getOccupationColor(member.occupation)}">
                                        ${occupation}
                                    </span>
                                </div>
                                ${member.email ? `
                                    <small class="text-muted d-block text-truncate">
                                        <i class="fas fa-envelope me-1"></i>${member.email}
                                    </small>
                                ` : ''}
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-primary btn-sm" 
                                        onclick="membersSystem.viewMemberDetails(${member.id})"
                                        aria-label="Voir le profil de ${member.firstName} ${member.lastName}">
                                    <i class="fas fa-eye"></i>
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
                <div class="card member-card" tabindex="0">
                    <div class="card-body py-3">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <div style="width: 60px; height: 60px;">
                                    ${profileImage}
                                </div>
                            </div>
                            <div class="col">
                                <div class="row align-items-center">
                                    <div class="col-md-3">
                                        <h6 class="mb-1 fw-bold">${highlightText(member.firstName)} ${highlightText(member.lastName)}</h6>
                                        <small class="text-primary">${highlightText(member.registrationNumber)}</small>
                                    </div>
                                    <div class="col-md-2">
                                        <span class="badge bg-${occupationColor}">${occupation}</span>
                                    </div>
                                    <div class="col-md-3">
                                        <small class="text-muted">
                                            <i class="fas fa-envelope me-1"></i>
                                            <span class="text-truncate d-inline-block" style="max-width: 200px;" title="${member.email || ''}">
                                                ${member.email ? highlightText(member.email) : 'Non renseigné'}
                                            </span>
                                        </small>
                                    </div>
                                    <div class="col-md-2">
                                        <small class="text-muted">
                                            <i class="fas fa-calendar me-1"></i>${joinDate}
                                        </small>
                                    </div>
                                    <div class="col-md-2 text-end">
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" 
                                                    onclick="membersSystem.viewMemberDetails(${member.id})"
                                                    title="Voir le profil">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-secondary" 
                                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}')"
                                                    title="Générer QR Code">
                                                <i class="fas fa-qrcode"></i>
                                            </button>
                                            ${member.email || member.phoneNumber ? `
                                            <button class="btn btn-outline-info" 
                                                    onclick="membersSystem.quickContact(${member.id})"
                                                    title="Contacter">
                                                <i class="fas fa-envelope"></i>
                                            </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    viewMemberDetails(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            this.showMemberModal(member);
        } else {
            this.showNotification('Membre non trouvé', 'error');
        }
    }

    generateMemberQR(registrationNumber) {
        const member = this.members.find(m => m.registrationNumber === registrationNumber);
        if (!member) {
            this.showNotification('Membre non trouvé', 'error');
            return;
        }

        if (window.appController) {
            window.appController.loadPage('qr-generator');
            setTimeout(() => {
                if (window.qrGenerator && typeof window.qrGenerator.prefillForm === 'function') {
                    window.qrGenerator.prefillForm(member);
                }
            }, 500);
        } else {
            this.showNotification('Redirection vers le générateur QR...', 'info');
        }
    }

    quickContact(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        const contactOptions = [];
        if (member.email) contactOptions.push(`📧 Email: ${member.email}`);
        if (member.phoneNumber) contactOptions.push(`📞 Téléphone: ${member.phoneNumber}`);
        
        if (contactOptions.length === 0) {
            this.showNotification('Aucune information de contact disponible', 'warning');
            return;
        }

        const modalHTML = `
            <div class="modal fade" id="contactModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-envelope me-2"></i>
                                Contacter ${member.firstName} ${member.lastName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
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
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('contactModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        new bootstrap.Modal(document.getElementById('contactModal')).show();
    }

    async refreshData() {
        console.log('🔄 Rafraîchissement des données membres...');
        this.showNotification('Mise à jour des données en cours...', 'info');
        
        await this.loadMembersWithRetry();
        await this.loadMembersPage();
        
        this.showNotification('Données mises à jour avec succès', 'success');
    }

    exportMembers() {
        if (this.filteredMembers.length === 0) {
            this.showNotification('Aucun membre à exporter', 'warning');
            return;
        }

        const data = this.filteredMembers.map(member => ({
            'Numéro': member.registrationNumber,
            'Nom': member.lastName,
            'Prénom': member.firstName,
            'Occupation': this.formatOccupation(member.occupation),
            'Email': member.email || '',
            'Téléphone': member.phoneNumber || '',
            'Lieu d\'étude/travail': member.studyOrWorkPlace || '',
            'Adresse': member.address || '',
            'Date d\'adhésion': this.formatDate(member.joinDate)
        }));

        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `membres_american_corner_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification(`Liste de ${this.filteredMembers.length} membres exportée avec succès`, 'success');
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
        
        return '\uFEFF' + csv;
    }

    showMemberModal(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const profileImageUrl = window.apiService ? 
            window.apiService.getProfileImageUrl(member.profileImage) : 
            member.profileImage;
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const occupationColor = this.getOccupationColor(member.occupation);
        const hasValidImage = member.profileImage && member.profileImage.trim() !== '' && 
                             (member.hasValidImage === undefined || member.hasValidImage === true);
        const bgColor = this.getAvatarColor(member);
        
        const profileImageHTML = hasValidImage ? `
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
            <div class="modal fade" id="memberProfileModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-circle me-2"></i>
                                Profil du Membre
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row align-items-center mb-4">
                                <div class="col-md-3 text-center">
                                    ${profileImageHTML}
                                </div>
                                <div class="col-md-9">
                                    <h3 class="mb-2">${member.firstName} ${member.lastName}</h3>
                                    <span class="badge bg-${occupationColor} fs-6 mb-3">${occupation}</span>
                                    <div class="row">
                                        <div class="col-sm-6">
                                            <p class="text-muted mb-2">
                                                <i class="fas fa-id-card me-2"></i>
                                                <strong>Numéro d'enregistrement:</strong> 
                                                <span class="member-id-display">${member.registrationNumber}</span>
                                            </p>
                                        </div>
                                        <div class="col-sm-6">
                                            <p class="text-muted mb-0">
                                                <i class="fas fa-calendar me-2"></i>
                                                <strong>Membre depuis:</strong> ${joinDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-info-circle me-2 text-primary"></i>Informations personnelles</h5>
                                    <div class="info-grid">
                                        ${member.phoneNumber ? `
                                            <div class="info-item">
                                                <i class="fas fa-phone text-muted"></i>
                                                <div>
                                                    <strong>Téléphone</strong>
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
                                                    <strong>Adresse</strong>
                                                    <div>${member.address}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-briefcase me-2 text-primary"></i>Activité professionnelle</h5>
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
                                                    <strong>Lieu d'étude/travail</strong>
                                                    <div>${member.studyOrWorkPlace}</div>
                                                </div>
                                            </div>
                                        ` : ''}
                                        <div class="info-item">
                                            <i class="fas fa-calendar-alt text-muted"></i>
                                            <div>
                                                <strong>Date d'adhésion</strong>
                                                <div>${joinDate}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Fermer
                            </button>
                            <button type="button" class="btn btn-primary" 
                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}'); bootstrap.Modal.getInstance(document.getElementById('memberProfileModal')).hide();">
                                <i class="fas fa-qrcode me-1"></i>Générer carte QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('memberProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const memberModal = new bootstrap.Modal(document.getElementById('memberProfileModal'));
        memberModal.show();
        
        document.getElementById('memberProfileModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    async loadMockMembers() {
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
                studyOrWorkPlace: 'Université de Mahajanga',
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
                studyOrWorkPlace: 'Société ABC',
                joinDate: new Date('2023-06-10').toISOString(),
                profileImage: null
            }
        ];
    }

    showNotification(message, type = 'info') {
        if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification(message, type);
        } else {
            console.log(`💬 ${type.toUpperCase()}: ${message}`);
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
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
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

// API Service amélioré avec validation d'images
if (window.apiService && typeof window.apiService.validateProfileImage === 'undefined') {
    window.apiService.validateProfileImage = async function(member) {
        if (!member.profileImage) return false;
        
        try {
            const imageUrl = this.getProfileImageUrl(member.profileImage);
            const response = await fetch(imageUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                return contentType && contentType.startsWith('image/');
            }
            return false;
        } catch (error) {
            console.log('❌ Image validation failed:', error.message);
            return false;
        }
    };
}

// Créer et exposer l'instance globale améliorée
const membersSystem = new EnhancedMembersSystem();
window.membersSystem = membersSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Système membres amélioré prêt');
    
    if (!navigator.onLine) {
        console.log('📴 Mode hors ligne détecté');
        membersSystem.useOfflineData();
    }
});