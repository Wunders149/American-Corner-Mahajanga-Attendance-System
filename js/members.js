// members.js - Système complet de gestion des membres American Corner Mahajanga
class MembersSystem {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('👥 Initialisation du système des membres...');
        await this.loadMembers();
        this.isInitialized = true;
    }

    async loadMembers() {
        try {
            console.log('🔄 Chargement des données membres...');
            
            // Priorité 1: Utiliser l'API si disponible et chargée
            if (window.apiService && window.apiService.members && window.apiService.members.length > 0) {
                this.members = window.apiService.members;
                console.log(`✅ ${this.members.length} membres chargés depuis API`);
            } 
            // Priorité 2: Attendre que l'API se charge
            else if (window.apiService && typeof window.apiService.fetchMembers === 'function') {
                console.log('⏳ Chargement des membres depuis API...');
                await window.apiService.fetchMembers();
                
                if (window.apiService.members && window.apiService.members.length > 0) {
                    this.members = window.apiService.members;
                    console.log(`✅ ${this.members.length} membres chargés depuis API après fetch`);
                } else {
                    throw new Error('API retourne une liste vide');
                }
            } 
            // Priorité 3: Données mock en fallback
            else {
                console.warn('⚠️ API non disponible, chargement des données mock');
                this.members = await this.loadMockMembers();
                console.log(`📦 ${this.members.length} membres mock chargés`);
            }
            
            this.filteredMembers = [...this.members];
            
        } catch (error) {
            console.error('❌ Erreur chargement membres:', error);
            // Fallback aux données mock en cas d'erreur
            this.members = await this.loadMockMembers();
            this.filteredMembers = [...this.members];
            console.log(`🔄 ${this.members.length} membres de secours chargés`);
        }
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
        return firstInitial + lastInitial;
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

    // Interface principale
    async loadMembersPage() {
        console.log('📄 Chargement de la page membres...');
        const container = document.getElementById('membersContainer');
        if (!container) {
            console.error('❌ Conteneur membres non trouvé');
            return;
        }
        
        // Afficher le loading
        container.innerHTML = this.getLoadingHTML();
        
        // S'assurer que les membres sont chargés
        if (this.members.length === 0) {
            await this.loadMembers();
        }
        
        if (this.members.length === 0) {
            container.innerHTML = this.getNoMembersHTML();
            return;
        }
        
        // Vérifier les images de profil
        this.checkProfileImages();
        
        // Initialiser les membres filtrés
        this.filteredMembers = [...this.members];
        
        // Afficher l'interface complète
        this.renderControls();
        this.renderMembers();
        
        console.log(`✅ ${this.members.length} membres chargés, ${this.filteredMembers.length} affichés`);
    }

    getLoadingHTML() {
        return `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <h4 class="text-primary">Chargement des membres...</h4>
                    <p class="text-muted">Récupération des profils en cours</p>
                    <div class="mt-3">
                        <button class="btn btn-outline-primary btn-sm" onclick="membersSystem.retryLoad()">
                            <i class="fas fa-sync me-1"></i>Réessayer
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async retryLoad() {
        console.log('🔄 Nouvelle tentative de chargement...');
        await this.loadMembers();
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

    checkProfileImages() {
        const membersWithImage = this.members.filter(member => 
            member.profileImage && member.profileImage.trim() !== ''
        ).length;
        
        console.log(`📊 Statistiques images: ${membersWithImage}/${this.members.length} membres avec image`);
        return membersWithImage;
    }

    renderControls() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        const stats = this.getStats();
        const controlsHTML = `
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-body">
                        <!-- En-tête avec compteur -->
                        <div class="row align-items-center mb-3">
                            <div class="col-md-6">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-users me-2 text-primary"></i>
                                    Nos Membres
                                    <span class="badge bg-primary ms-2" id="membersCount">${this.filteredMembers.length}/${this.members.length}</span>
                                    ${stats.demoMode ? '<span class="badge bg-warning ms-1">Démo</span>' : ''}
                                </h5>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <small class="text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    ${this.getFilteredMembersText()}
                                </small>
                            </div>
                        </div>
                        
                        <!-- Barre de recherche -->
                        <div class="row mb-3">
                            <div class="col-12">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                    <input type="text" 
                                           class="form-control" 
                                           id="membersSearch" 
                                           placeholder="Rechercher un membre par nom, numéro, téléphone..."
                                           value="${this.searchQuery}">
                                    <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn" ${!this.searchQuery ? 'disabled' : ''}>
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Filtres et tris -->
                        <div class="row">
                            <div class="col-md-8">
                                <div class="d-flex flex-wrap gap-2 align-items-center">
                                    <span class="text-muted small">Filtrer:</span>
                                    <div class="btn-group" role="group">
                                        ${this.renderFilterButtons()}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex justify-content-md-end gap-2">
                                    ${this.renderSortDropdown()}
                                    <button class="btn btn-outline-success btn-sm" onclick="membersSystem.refreshData()" title="Rafraîchir les données">
                                        <i class="fas fa-sync"></i>
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
        
        // Configurer les événements
        this.setupControlsEventListeners();
        
        // Focus sur la barre de recherche
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

    renderFilterButtons() {
        const filters = [
            { value: 'all', label: 'Tous', icon: 'fa-users' },
            { value: 'student', label: 'Étudiants', icon: 'fa-graduation-cap' },
            { value: 'employee', label: 'Employés', icon: 'fa-briefcase' },
            { value: 'entrepreneur', label: 'Entrepreneurs', icon: 'fa-lightbulb' },
            { value: 'other', label: 'Autres', icon: 'fa-user' }
        ];
        
        return filters.map(filter => `
            <button type="button" 
                    class="btn btn-sm ${this.currentFilter === filter.value ? 'btn-primary' : 'btn-outline-primary'}" 
                    data-filter="${filter.value}"
                    title="${filter.label}">
                <i class="fas ${filter.icon} me-1"></i>${filter.label}
            </button>
        `).join('');
    }

    renderSortDropdown() {
        const sortOptions = [
            { value: 'name', label: 'Nom A-Z', icon: 'fa-sort-alpha-down' },
            { value: 'name-desc', label: 'Nom Z-A', icon: 'fa-sort-alpha-down-alt' },
            { value: 'recent', label: 'Récents', icon: 'fa-calendar-plus' },
            { value: 'oldest', label: 'Anciens', icon: 'fa-calendar-minus' }
        ];
        
        const currentSortOption = sortOptions.find(opt => opt.value === this.currentSort) || sortOptions[0];
        
        return `
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="fas ${currentSortOption.icon} me-1"></i>${currentSortOption.label}
                </button>
                <ul class="dropdown-menu">
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

    setupControlsEventListeners() {
        // Recherche
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
        
        // Filtres
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.closest('[data-filter]').getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
        
        // Tri
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
        
        // Mettre à jour le bouton clear
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
        // Mettre à jour les boutons de filtre actifs
        document.querySelectorAll('[data-filter]').forEach(button => {
            const filter = button.getAttribute('data-filter');
            if (filter === this.currentFilter) {
                button.classList.replace('btn-outline-primary', 'btn-primary');
            } else {
                button.classList.replace('btn-primary', 'btn-outline-primary');
            }
        });
        
        // Mettre à jour le texte d'information
        const infoElement = document.querySelector('.text-muted i')?.parentElement;
        if (infoElement) {
            infoElement.innerHTML = `<i class="fas fa-info-circle me-1"></i>${this.getFilteredMembersText()}`;
        }
        
        // Mettre à jour le bouton clear search
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
        return 'Tous les membres';
    }

    getFilterLabel(filter) {
        const labels = {
            'all': 'Tous',
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
            container.innerHTML = this.getNoResultsHTML();
            return;
        }
        
        container.innerHTML = this.filteredMembers.map(member => 
            this.createMemberCard(member)
        ).join('');
    }

    getNoResultsHTML() {
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
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">${message}</h4>
                    <p class="text-muted mb-4">${suggestion}</p>
                    <div class="d-flex gap-2 justify-content-center flex-wrap">
                        ${actions}
                    </div>
                </div>
            </div>
        `;
    }

    createMemberCard(member) {
        const profileImage = this.getProfileImage(member);
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const occupationIcon = this.getOccupationIcon(member.occupation);

        // Mise en évidence de la recherche
        const highlightText = (text) => {
            if (!this.searchQuery || !text) return text;
            const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<mark class="bg-warning px-1 rounded">$1</mark>');
        };

        return `
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="card member-card h-100 shadow-sm">
                    <div class="card-body text-center p-4">
                        <!-- Photo de profil -->
                        <div class="member-avatar mb-3 position-relative mx-auto" style="width: 80px;">
                            ${profileImage}
                            <div class="occupation-icon position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm">
                                <i class="fas ${occupationIcon} text-primary small"></i>
                            </div>
                        </div>
                        
                        <!-- Informations principales -->
                        <h5 class="member-name mb-1">${highlightText(member.firstName)} ${highlightText(member.lastName)}</h5>
                        <div class="member-id text-primary fw-bold mb-2">${highlightText(member.registrationNumber)}</div>
                        
                        <!-- Occupation -->
                        <div class="member-occupation mb-2">
                            <span class="badge bg-light text-dark border">${occupation}</span>
                        </div>
                        
                        <!-- Informations de contact -->
                        <div class="member-contact text-muted small mb-3">
                            ${member.email ? `<div class="text-truncate" title="${member.email}"><i class="fas fa-envelope me-1"></i>${highlightText(member.email)}</div>` : ''}
                            ${member.phoneNumber ? `<div><i class="fas fa-phone me-1"></i>${highlightText(member.phoneNumber)}</div>` : ''}
                        </div>
                        
                        <!-- Lieu d'étude/travail -->
                        ${member.studyOrWorkPlace ? `
                            <div class="member-location text-muted small mb-3">
                                <i class="fas fa-building me-1"></i>
                                <span class="text-truncate d-inline-block" style="max-width: 200px;" title="${member.studyOrWorkPlace}">
                                    ${highlightText(member.studyOrWorkPlace)}
                                </span>
                            </div>
                        ` : ''}
                        
                        <!-- Date d'adhésion -->
                        <div class="member-join-date text-muted small">
                            <i class="fas fa-calendar-alt me-1"></i>Membre depuis ${joinDate}
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="card-footer bg-transparent border-top-0 pt-0">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" 
                                    onclick="membersSystem.viewMemberDetails(${member.id})">
                                <i class="fas fa-eye me-1"></i>Voir profil
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="membersSystem.generateMemberQR('${member.registrationNumber}')">
                                <i class="fas fa-qrcode me-1"></i>Générer QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileImage(member) {
        // Vérifier si l'image existe
        if (member.profileImage && member.profileImage.trim() !== '') {
            let imageUrl;
            
            if (window.apiService && typeof window.apiService.getProfileImageUrl === 'function') {
                imageUrl = window.apiService.getProfileImageUrl(member.profileImage);
            } else {
                imageUrl = member.profileImage;
            }
            
            // Encoder les initiales pour l'image de fallback SVG
            const initials = this.getInitials(member.firstName, member.lastName);
            const svgFallback = this.generateAvatarSVG(initials, '#6C7580');
            
            return `
                <img src="${imageUrl}" 
                     alt="${member.firstName} ${member.lastName}"
                     class="rounded-circle member-photo w-100 h-100"
                     style="object-fit: cover; border: 3px solid #f8f9fa;"
                     onerror="this.onerror=null; this.src='${svgFallback}';"
                     onload="this.style.display='block';">
            `;
        }
        
        // Avatar SVG avec initiales si pas de photo
        const colors = ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#dc3545'];
        const colorIndex = (member.id || Math.floor(Math.random() * colors.length)) % colors.length;
        const bgColor = colors[colorIndex];
        const initials = this.getInitials(member.firstName, member.lastName);
        
        return this.generateAvatarSVG(initials, bgColor);
    }

    generateAvatarSVG(initials, backgroundColor) {
        const svg = `
            <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="80" fill="${backgroundColor}" rx="40"/>
                <text x="40" y="45" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="bold">
                    ${initials}
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
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

        // Rediriger vers le générateur QR
        if (window.appController) {
            window.appController.loadPage('qr-generator');
            // Pré-remplir le formulaire
            setTimeout(() => {
                if (window.qrGenerator && typeof window.qrGenerator.prefillForm === 'function') {
                    window.qrGenerator.prefillForm(member);
                }
            }, 500);
        } else {
            this.showNotification('Redirection vers le générateur QR...', 'info');
        }
    }

    async refreshData() {
        console.log('🔄 Rafraîchissement des données membres...');
        await this.loadMembers();
        await this.loadMembersPage();
        this.showNotification('Données mises à jour', 'success');
    }

    showMemberModal(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const profileImageUrl = window.apiService ? 
            window.apiService.getProfileImageUrl(member.profileImage) : 
            member.profileImage;
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const hasProfileImage = !!member.profileImage && member.profileImage.trim() !== '';
        
        // Générer l'image de profil pour la modal
        const profileImageHTML = hasProfileImage ? 
            `<img src="${profileImageUrl}" 
                  alt="${member.firstName} ${member.lastName}" 
                  class="rounded-circle w-100 h-100"
                  style="object-fit: cover;"
                  onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  onload="this.style.display='block'; this.nextElementSibling.style.display='none';">` : 
            '';
        
        const avatarSVG = this.generateAvatarSVG(initials, '#6C7580');
        
        const modalHTML = `
            <div class="modal fade" id="memberProfileModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-circle me-2"></i>
                                Profil du Membre
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- En-tête du profil -->
                            <div class="row align-items-center mb-4">
                                <div class="col-md-3 text-center">
                                    <div class="position-relative mx-auto" style="width: 100px; height: 100px;">
                                        ${profileImageHTML}
                                        <div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${hasProfileImage ? 'd-none' : ''}"
                                             style="width: 100px; height: 100px; font-size: 2rem; background-color: #6C7580;">
                                            ${initials}
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-9">
                                    <h3 class="mb-1">${member.firstName} ${member.lastName}</h3>
                                    <span class="badge bg-primary fs-6 mb-2">${occupation}</span>
                                    <p class="text-muted mb-2">
                                        <i class="fas fa-id-card me-1"></i>
                                        <strong>Numéro d'enregistrement:</strong> 
                                        <span class="member-id-display">${member.registrationNumber}</span>
                                    </p>
                                    <p class="text-muted mb-0">
                                        <i class="fas fa-calendar me-1"></i>
                                        <strong>Membre depuis:</strong> ${joinDate}
                                    </p>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <!-- Informations détaillées -->
                            <div class="row">
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-info-circle me-2 text-primary"></i>Informations personnelles</h5>
                                    <table class="table table-borderless">
                                        <tr>
                                            <td width="40%"><strong><i class="fas fa-phone me-2 text-muted"></i>Téléphone:</strong></td>
                                            <td>${member.phoneNumber || '<span class="text-muted">Non renseigné</span>'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="fas fa-envelope me-2 text-muted"></i>Email:</strong></td>
                                            <td>${member.email || '<span class="text-muted">Non renseigné</span>'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="fas fa-map-marker-alt me-2 text-muted"></i>Adresse:</strong></td>
                                            <td>${member.address || '<span class="text-muted">Non renseigné</span>'}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h5 class="mb-3"><i class="fas fa-briefcase me-2 text-primary"></i>Activité professionnelle</h5>
                                    <table class="table table-borderless">
                                        <tr>
                                            <td width="40%"><strong><i class="fas fa-user-tie me-2 text-muted"></i>Occupation:</strong></td>
                                            <td>${occupation}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="fas fa-building me-2 text-muted"></i>Lieu d'étude/travail:</strong></td>
                                            <td>${member.studyOrWorkPlace || '<span class="text-muted">Non renseigné</span>'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="fas fa-calendar-alt me-2 text-muted"></i>Date d'adhésion:</strong></td>
                                            <td>${joinDate}</td>
                                        </tr>
                                    </table>
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
        
        // Gérer la modal existante
        const existingModal = document.getElementById('memberProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const memberModal = new bootstrap.Modal(document.getElementById('memberProfileModal'));
        memberModal.show();
        
        // Nettoyer la modal après fermeture
        document.getElementById('memberProfileModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    async loadMockMembers() {
        // Données mock de secours (sans images pour éviter les 404)
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
            }
        ];
    }

    showNotification(message, type = 'info') {
        if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification(message, type);
        } else {
            console.log(`💬 ${type.toUpperCase()}: ${message}`);
            // Fallback simple
            const alertClass = type === 'error' ? 'alert-danger' : 
                             type === 'success' ? 'alert-success' : 
                             type === 'warning' ? 'alert-warning' : 'alert-info';
            
            const alert = document.createElement('div');
            alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
            alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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

// Créer et exposer l'instance globale
const membersSystem = new MembersSystem();
window.membersSystem = membersSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Système membres prêt');
});