// members.js - Système complet de gestion des membres avec recherche, filtres et interface améliorée
class MembersSystem {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.init();
    }

    async init() {
        console.log('👥 Initialisation du système des membres...');
        await this.loadMembers();
    }

    async loadMembers() {
        try {
            if (window.apiService && window.apiService.members) {
                this.members = window.apiService.members;
                console.log(`✅ ${this.members.length} membres chargés depuis API`);
            } else {
                console.warn('⚠️ API non disponible, chargement des données mock');
                this.members = await this.loadMockMembers();
            }
            
            this.filteredMembers = [...this.members];
            
        } catch (error) {
            console.error('❌ Erreur chargement membres:', error);
        }
    }

    // Fonctions utilitaires locales
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

    // Interface principale
    async loadMembersPage() {
        console.log('📄 Chargement de la page membres...');
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        container.innerHTML = this.getLoadingHTML();
        
        // Attendre que les membres soient chargés
        if (this.members.length === 0) {
            await this.loadMembers();
        }
        
        if (this.members.length === 0) {
            container.innerHTML = this.getNoMembersHTML();
            return;
        }
        
        // Vérifier les images de profil
        await this.checkProfileImages();
        
        // Initialiser les membres filtrés
        this.filteredMembers = [...this.members];
        
        // Afficher les contrôles de filtre, tri et recherche
        this.renderControls();
        
        // Afficher les membres
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
                </div>
            </div>
        `;
    }

    getNoMembersHTML() {
        return `
            <div class="col-12">
                <div class="card text-center py-5">
                    <div class="card-body">
                        <i class="fas fa-users fa-4x text-muted mb-4"></i>
                        <h3 class="text-muted">Aucun membre disponible</h3>
                        <p class="text-muted mb-4">Les membres apparaîtront ici une fois chargés depuis le système</p>
                        <button class="btn btn-primary btn-lg" onclick="membersSystem.loadMembersPage()">
                            <i class="fas fa-sync me-2"></i>Actualiser
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async checkProfileImages() {
        console.log('🖼️ Vérification des images de profil...');
        const membersWithImage = this.members.filter(member => 
            member.profileImage && member.profileImage.trim() !== ''
        ).length;
        
        console.log(`📊 Statistiques images: ${membersWithImage}/${this.members.length} membres avec image`);
        return membersWithImage;
    }

    setupEventListeners() {
        // Filtres
        const filterButtons = document.querySelectorAll('.member-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterMembers(filter);
            });
        });

        // Recherche
        const searchInput = document.getElementById('memberSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchMembers(e.target.value);
            });
        }
    }

    renderControls() {
        const container = document.getElementById('membersContainer');
        
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
                                           value="${this.searchQuery}"
                                           onkeyup="membersSystem.handleSearch(event)">
                                    <button class="btn btn-outline-secondary" type="button" onclick="membersSystem.clearSearch()">
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
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="membersSystem.setFilter('all')">
                                            Tous
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'student' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="membersSystem.setFilter('student')">
                                            Étudiants
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'employee' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="membersSystem.setFilter('employee')">
                                            Employés
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'entrepreneur' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="membersSystem.setFilter('entrepreneur')">
                                            Entrepreneurs
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'other' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="membersSystem.setFilter('other')">
                                            Autres
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex justify-content-md-end">
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-sort me-1"></i>
                                            ${this.getSortLabel(this.currentSort)}
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item ${this.currentSort === 'name' ? 'active' : ''}" href="#" onclick="membersSystem.setSort('name')">Nom A-Z</a></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'name-desc' ? 'active' : ''}" href="#" onclick="membersSystem.setSort('name-desc')">Nom Z-A</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'recent' ? 'active' : ''}" href="#" onclick="membersSystem.setSort('recent')">Plus récents</a></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'oldest' ? 'active' : ''}" href="#" onclick="membersSystem.setSort('oldest')">Plus anciens</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = controlsHTML;
        
        // Focus sur la barre de recherche si query existante
        if (this.searchQuery) {
            const searchInput = document.getElementById('membersSearch');
            if (searchInput) {
                searchInput.focus();
            }
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

    getSortLabel(sort) {
        const labels = {
            'name': 'Nom A-Z',
            'name-desc': 'Nom Z-A',
            'recent': 'Récents',
            'oldest': 'Anciens'
        };
        return labels[sort] || 'Trier';
    }

    handleSearch(event) {
        const query = event.target.value.trim().toLowerCase();
        this.searchQuery = query;
        
        // Débounce pour éviter les recherches trop fréquentes
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
        // Appliquer tous les filtres
        let filtered = this.filterBySearch(this.members);
        filtered = this.filterByOccupation(filtered);
        filtered = this.sortMembers(filtered);
        
        this.filteredMembers = filtered;
        this.renderMembers();
        
        // Mettre à jour le compteur
        this.updateMembersCount();
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

    renderMembers() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        // Trouver ou créer le conteneur des membres
        let membersContainer = document.getElementById('membersGridContainer');
        if (!membersContainer) {
            membersContainer = document.createElement('div');
            membersContainer.className = 'col-12';
            membersContainer.id = 'membersGridContainer';
            container.appendChild(membersContainer);
        }
        
        // Vider le conteneur
        membersContainer.innerHTML = '';
        
        if (this.filteredMembers.length === 0) {
            membersContainer.innerHTML = this.getNoResultsHTML();
            return;
        }
        
        const membersGrid = document.createElement('div');
        membersGrid.className = 'row g-4';
        membersGrid.id = 'membersGrid';
        
        this.filteredMembers.forEach(member => {
            const memberCard = this.createMemberCard(member);
            membersGrid.appendChild(memberCard);
        });
        
        membersContainer.appendChild(membersGrid);
    }

    getNoResultsHTML() {
        let message = 'Aucun membre trouvé';
        let suggestion = 'Vérifiez les filtres ou la recherche';
        
        if (this.searchQuery && this.currentFilter !== 'all') {
            message = `Aucun résultat pour "${this.searchQuery}" parmi les ${this.getFilterLabel(this.currentFilter).toLowerCase()}`;
            suggestion = 'Essayez de modifier votre recherche ou les filtres';
        } else if (this.searchQuery) {
            message = `Aucun résultat pour "${this.searchQuery}"`;
            suggestion = 'Vérifiez l\'orthographe ou essayez d\'autres termes';
        } else if (this.currentFilter !== 'all') {
            message = `Aucun ${this.getFilterLabel(this.currentFilter).toLowerCase()} trouvé`;
            suggestion = 'Essayez un autre filtre ou affichez tous les membres';
        }
        
        return `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">${message}</h4>
                    <p class="text-muted mb-4">${suggestion}</p>
                    <div class="d-flex gap-2 justify-content-center flex-wrap">
                        ${this.searchQuery ? 
                            `<button class="btn btn-outline-primary btn-sm" onclick="membersSystem.clearSearch()">
                                <i class="fas fa-times me-1"></i>Effacer la recherche
                            </button>` : 
                            ''
                        }
                        ${this.currentFilter !== 'all' ? 
                            `<button class="btn btn-outline-primary btn-sm" onclick="membersSystem.setFilter('all')">
                                <i class="fas fa-users me-1"></i>Voir tous les membres
                            </button>` : 
                            ''
                        }
                        <button class="btn btn-outline-secondary btn-sm" onclick="membersSystem.loadMembersPage()">
                            <i class="fas fa-sync me-1"></i>Actualiser
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createMemberCard(member) {
        const memberCol = document.createElement('div');
        memberCol.className = 'col-md-6 col-lg-4 col-xl-3 mb-4';
        
        const profileImage = this.getProfileImage(member);
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const initials = this.getInitials(member.firstName, member.lastName);

        memberCol.innerHTML = `
            <div class="card member-card h-100 shadow-sm">
                <div class="card-body text-center p-4">
                    <!-- Photo de profil -->
                    <div class="member-avatar mb-3">
                        ${profileImage}
                    </div>
                    
                    <!-- Informations principales -->
                    <h5 class="member-name mb-1">${member.firstName} ${member.lastName}</h5>
                    <div class="member-id text-primary fw-bold mb-2">${member.registrationNumber}</div>
                    
                    <!-- Occupation -->
                    <div class="member-occupation mb-2">
                        <span class="badge bg-light text-dark">${occupation}</span>
                    </div>
                    
                    <!-- Informations de contact -->
                    <div class="member-contact text-muted small mb-3">
                        ${member.email ? `<div><i class="fas fa-envelope me-1"></i>${member.email}</div>` : ''}
                        ${member.phoneNumber ? `<div><i class="fas fa-phone me-1"></i>${member.phoneNumber}</div>` : ''}
                    </div>
                    
                    <!-- Lieu d'étude/travail -->
                    ${member.studyOrWorkPlace ? `
                        <div class="member-location text-muted small mb-3">
                            <i class="fas fa-building me-1"></i>${member.studyOrWorkPlace}
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
                                onclick="membersSystem.generateMemberQR(${member.id})">
                            <i class="fas fa-qrcode me-1"></i>Générer QR
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return memberCol;
    }

    getProfileImage(member) {
        if (member.profileImage) {
            const imageUrl = window.apiService ? 
                window.apiService.getProfileImageUrl(member.profileImage) : 
                member.profileImage;
            
            return `
                <img src="${imageUrl}" 
                     alt="${member.firstName} ${member.lastName}"
                     class="rounded-circle member-photo"
                     style="width: 80px; height: 80px; object-fit: cover;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="avatar-placeholder rounded-circle d-none align-items-center justify-content-center bg-secondary text-white"
                     style="width: 80px; height: 80px;">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        // Avatar avec initiales si pas de photo
        const colors = ['primary', 'success', 'info', 'warning', 'danger'];
        const colorIndex = (member.id || Math.random()) % colors.length;
        const bgColor = colors[colorIndex];
        
        return `
            <div class="avatar-initials bg-${bgColor} rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                 style="width: 80px; height: 80px; font-size: 1.5rem;">
                ${this.getInitials(member.firstName, member.lastName)}
            </div>
        `;
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

    viewMemberDetails(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            this.showMemberModal(member);
        }
    }

    generateMemberQR(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        // Rediriger vers le générateur QR avec les données pré-remplies
        if (window.appController) {
            window.appController.loadPage('qr-generator');
            // Pré-remplir le formulaire QR avec les données du membre
            setTimeout(() => {
                this.prefillQRForm(member);
            }, 500);
        }
    }

    prefillQRForm(member) {
        // Implémentez le pré-remplissage du formulaire QR
        console.log('📝 Pré-remplissage formulaire QR pour:', member);
        if (window.qrGenerator && window.qrGenerator.prefillForm) {
            window.qrGenerator.prefillForm(member);
        }
    }

    showMemberModal(member) {
        const initials = this.getInitials(member.firstName, member.lastName);
        const profileImageUrl = window.apiService ? 
            window.apiService.getProfileImageUrl(member.profileImage) : 
            member.profileImage;
        const joinDate = this.formatDate(member.joinDate);
        const occupation = this.formatOccupation(member.occupation);
        const hasProfileImage = !!member.profileImage;
        
        const imageHtml = hasProfileImage ? 
            `<img src="${profileImageUrl}" 
                  alt="${member.firstName} ${member.lastName}" 
                  class="rounded-circle"
                  style="width: 100px; height: 100px; object-fit: cover;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  onload="this.style.display='block'; this.nextElementSibling.style.display='none';">` : 
            '';
        
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
                                    <div class="position-relative mx-auto">
                                        ${imageHtml}
                                        <div class="avatar-initials bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${hasProfileImage ? 'd-none' : ''}"
                                             style="width: 100px; height: 100px; font-size: 2rem;">
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
                                    onclick="membersSystem.generateMemberQR(${member.id}); bootstrap.Modal.getInstance(document.getElementById('memberProfileModal')).hide();">
                                <i class="fas fa-qrcode me-1"></i>Générer carte QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Supprimer la modal existante si elle existe
        const existingModal = document.getElementById('memberProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Ajouter la nouvelle modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Afficher la modal
        const memberModal = new bootstrap.Modal(document.getElementById('memberProfileModal'));
        memberModal.show();
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
                profileImage: 'profiles/linus.jpg'
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
                profileImage: 'profiles/marie.jpg'
            }
        ];
    }

    // Méthode pour exporter la liste des membres
    exportMembersList() {
        const membersToExport = this.filteredMembers.length > 0 ? this.filteredMembers : this.members;
        
        const csvContent = this.convertToCSV(membersToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `membres_acm_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showAlert('Liste des membres exportée avec succès!', 'success');
    }

    convertToCSV(members) {
        const headers = ['Numéro', 'Prénom', 'Nom', 'Occupation', 'Téléphone', 'Email', 'Lieu', 'Date d\'adhésion'];
        const rows = members.map(member => [
            member.registrationNumber,
            member.firstName,
            member.lastName,
            this.formatOccupation(member.occupation),
            member.phoneNumber || '',
            member.email || '',
            member.studyOrWorkPlace || '',
            member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    // Méthode utilitaire pour afficher des alertes
    showAlert(message, type = 'info') {
        if (window.appController && window.appController.showNotification) {
            window.appController.showNotification(message, type);
        } else {
            // Fallback simple
            alert(message);
        }
    }
}

// Créer une instance globale
const membersSystem = new MembersSystem();

// Exposer pour un usage global
window.membersSystem = membersSystem;

// Initialisation quand la page est prête
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Système membres prêt');
});