// Members Management System - Interface améliorée avec recherche
class MembersSystem {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.filteredMembers = [];
        this.searchTimeout = null;
    }

    async loadMembersPage() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        container.innerHTML = this.getLoadingHTML();
        
        // Attendre que les membres soient chargés
        if (apiService.members.length === 0) {
            await apiService.fetchMembers();
        }
        
        if (apiService.members.length === 0) {
            container.innerHTML = this.getNoMembersHTML();
            return;
        }
        
        // Vérifier les images de profil
        await this.checkProfileImages();
        
        // Initialiser les membres filtrés
        this.filteredMembers = [...apiService.members];
        
        // Afficher les contrôles de filtre, tri et recherche
        this.renderControls();
        
        // Afficher les membres
        this.renderMembers();
        
        console.log(`✅ ${apiService.members.length} membres chargés, ${this.filteredMembers.length} affichés`);
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
                        <button class="btn btn-primary btn-lg" onclick="apiService.fetchMembers().then(() => members.loadMembersPage())">
                            <i class="fas fa-sync me-2"></i>Actualiser
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async checkProfileImages() {
        console.log('🖼️ Vérification des images de profil...');
        
        const stats = apiService.getMembersStats();
        console.log(`📊 Statistiques images: ${stats.withProfileImage}/${stats.total} membres avec image`);
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
                                    <span class="badge bg-primary ms-2" id="membersCount">${this.filteredMembers.length}/${apiService.members.length}</span>
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
                                           onkeyup="members.handleSearch(event)">
                                    <button class="btn btn-outline-secondary" type="button" onclick="members.clearSearch()">
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
                                                onclick="members.setFilter('all')">
                                            Tous
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'student' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="members.setFilter('student')">
                                            Étudiants
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'employee' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="members.setFilter('employee')">
                                            Employés
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'entrepreneur' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="members.setFilter('entrepreneur')">
                                            Entrepreneurs
                                        </button>
                                        <button type="button" class="btn btn-sm ${this.currentFilter === 'other' ? 'btn-primary' : 'btn-outline-primary'}" 
                                                onclick="members.setFilter('other')">
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
                                            <li><a class="dropdown-item ${this.currentSort === 'name' ? 'active' : ''}" href="#" onclick="members.setSort('name')">Nom A-Z</a></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'name-desc' ? 'active' : ''}" href="#" onclick="members.setSort('name-desc')">Nom Z-A</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'recent' ? 'active' : ''}" href="#" onclick="members.setSort('recent')">Plus récents</a></li>
                                            <li><a class="dropdown-item ${this.currentSort === 'oldest' ? 'active' : ''}" href="#" onclick="members.setSort('oldest')">Plus anciens</a></li>
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
        let filtered = this.filterBySearch(apiService.members);
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
            countElement.textContent = `${this.filteredMembers.length}/${apiService.members.length}`;
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
                            `<button class="btn btn-outline-primary btn-sm" onclick="members.clearSearch()">
                                <i class="fas fa-times me-1"></i>Effacer la recherche
                            </button>` : 
                            ''
                        }
                        ${this.currentFilter !== 'all' ? 
                            `<button class="btn btn-outline-primary btn-sm" onclick="members.setFilter('all')">
                                <i class="fas fa-users me-1"></i>Voir tous les membres
                            </button>` : 
                            ''
                        }
                        <button class="btn btn-outline-secondary btn-sm" onclick="members.loadMembersPage()">
                            <i class="fas fa-sync me-1"></i>Actualiser
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createMemberCard(member) {
        const memberCol = document.createElement('div');
        memberCol.className = 'col-md-6 col-lg-4 col-xl-3';
        
        const initials = utils.getInitials(member.firstName, member.lastName);
        const profileImageUrl = apiService.getProfileImageUrl(member.profileImage);
        const joinDate = member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : 'Date inconnue';
        const occupationIcon = this.getOccupationIcon(member.occupation);
        
        // Gestion améliorée des images de profil
        const hasProfileImage = !!member.profileImage;
        const imageHtml = hasProfileImage ? 
            `<img src="${profileImageUrl}" 
                  alt="${member.firstName} ${member.lastName}" 
                  class="profile-image"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  onload="this.style.display='block'; this.nextElementSibling.style.display='none';">` : 
            '';
        
        // Mise en évidence de la recherche
        const highlightText = (text) => {
            if (!this.searchQuery || !text) return text;
            const regex = new RegExp(`(${this.searchQuery})`, 'gi');
            return text.replace(regex, '<mark class="bg-warning">$1</mark>');
        };
        
        memberCol.innerHTML = `
            <div class="card member-card h-100">
                <div class="card-body">
                    <!-- En-tête du profil -->
                    <div class="text-center mb-3">
                        <div class="member-avatar position-relative mx-auto">
                            ${imageHtml}
                            <div class="initials-avatar ${hasProfileImage ? 'd-none' : ''}">
                                ${initials}
                            </div>
                            <div class="occupation-badge">
                                <i class="fas ${occupationIcon}"></i>
                            </div>
                            ${!hasProfileImage ? `
                                <div class="no-image-badge" title="Pas de photo de profil">
                                    <i class="fas fa-camera-slash"></i>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Informations principales -->
                    <div class="text-center mb-3">
                        <h5 class="card-title mb-1">
                            ${highlightText(member.firstName)} ${highlightText(member.lastName)}
                        </h5>
                        <span class="badge bg-primary mb-2">${utils.formatOccupation(member.occupation)}</span>
                        <p class="card-text">
                            <small class="text-muted member-id-display">
                                <i class="fas fa-id-card me-1"></i>
                                ${highlightText(member.registrationNumber)}
                            </small>
                        </p>
                    </div>
                    
                    <!-- Informations secondaires -->
                    <div class="member-details small text-muted mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><i class="fas fa-phone me-1"></i></span>
                            <span>${member.phoneNumber ? highlightText(member.phoneNumber) : 'Non renseigné'}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span><i class="fas fa-building me-1"></i></span>
                            <span class="text-end">${member.studyOrWorkPlace ? highlightText(member.studyOrWorkPlace) : 'Non renseigné'}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span><i class="fas fa-calendar me-1"></i></span>
                            <span>Membre depuis ${joinDate}</span>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="members.viewMemberProfile('${member.registrationNumber}')">
                            <i class="fas fa-eye me-1"></i>Voir le profil
                        </button>
                        <button class="btn btn-outline-success btn-sm" 
                                onclick="qrGenerator.generateMemberQR('${member.registrationNumber}'); showPage('qr-generator');">
                            <i class="fas fa-qrcode me-1"></i>Générer carte
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return memberCol;
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

    viewMemberProfile(registrationNumber) {
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            this.showMemberModal(member);
        }
    }

    showMemberModal(member) {
        const initials = utils.getInitials(member.firstName, member.lastName);
        const profileImageUrl = apiService.getProfileImageUrl(member.profileImage);
        const joinDate = member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : 'Non spécifiée';
        const occupationIcon = this.getOccupationIcon(member.occupation);
        const hasProfileImage = !!member.profileImage;
        
        // Gestion améliorée de l'image dans la modal
        const imageHtml = hasProfileImage ? 
            `<img src="${profileImageUrl}" 
                  alt="${member.firstName} ${member.lastName}" 
                  class="profile-image large"
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
                                    <div class="member-avatar large position-relative mx-auto">
                                        ${imageHtml}
                                        <div class="initials-avatar large ${hasProfileImage ? 'd-none' : ''}">
                                            ${initials}
                                        </div>
                                        <div class="occupation-badge large">
                                            <i class="fas ${occupationIcon}"></i>
                                        </div>
                                        ${!hasProfileImage ? `
                                            <div class="no-image-badge large" title="Pas de photo de profil">
                                                <i class="fas fa-camera-slash"></i>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="col-md-9">
                                    <h3 class="mb-1">${member.firstName} ${member.lastName}</h3>
                                    <span class="badge bg-primary fs-6 mb-2">${utils.formatOccupation(member.occupation)}</span>
                                    <p class="text-muted mb-2">
                                        <i class="fas fa-id-card me-1"></i>
                                        <strong>Numéro d'enregistrement:</strong> 
                                        <span class="member-id-display">${member.registrationNumber}</span>
                                    </p>
                                    <p class="text-muted mb-0">
                                        <i class="fas fa-calendar me-1"></i>
                                        <strong>Membre depuis:</strong> ${joinDate}
                                    </p>
                                    ${member.isTemporary ? `
                                        <div class="alert alert-warning mt-2 p-2 small">
                                            <i class="fas fa-info-circle me-1"></i>
                                            Membre temporaire - Données de démonstration
                                        </div>
                                    ` : ''}
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
                                            <td>${utils.formatOccupation(member.occupation)}</td>
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
                            
                            <!-- État du profil -->
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h5 class="mb-3"><i class="fas fa-chart-bar me-2 text-primary"></i>État du profil</h5>
                                    <div class="row text-center">
                                        <div class="col-4">
                                            <div class="card bg-light">
                                                <div class="card-body py-2">
                                                    <i class="fas ${hasProfileImage ? 'fa-check text-success' : 'fa-times text-warning'} fa-2x mb-2"></i>
                                                    <h6>Photo</h6>
                                                    <small class="text-muted">${hasProfileImage ? 'Disponible' : 'Manquante'}</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="card bg-light">
                                                <div class="card-body py-2">
                                                    <i class="fas ${member.phoneNumber ? 'fa-check text-success' : 'fa-times text-warning'} fa-2x mb-2"></i>
                                                    <h6>Contact</h6>
                                                    <small class="text-muted">${member.phoneNumber ? 'Complet' : 'Incomplet'}</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="card bg-light">
                                                <div class="card-body py-2">
                                                    <i class="fas ${member.email ? 'fa-check text-success' : 'fa-times text-warning'} fa-2x mb-2"></i>
                                                    <h6>Email</h6>
                                                    <small class="text-muted">${member.email ? 'Renseigné' : 'Manquant'}</small>
                                                </div>
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
                                    onclick="qrGenerator.generateMemberQR('${member.registrationNumber}'); bootstrap.Modal.getInstance(document.getElementById('memberProfileModal')).hide(); showPage('qr-generator');">
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

    // Méthode pour exporter la liste des membres
    exportMembersList() {
        const membersToExport = this.filteredMembers.length > 0 ? this.filteredMembers : apiService.members;
        
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
            utils.formatOccupation(member.occupation),
            member.phoneNumber || '',
            member.email || '',
            member.studyOrWorkPlace || '',
            member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    // Méthode pour afficher les statistiques
    showStats() {
        const stats = apiService.getMembersStats();
        
        const statsHTML = `
            <div class="modal fade" id="statsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-chart-pie me-2"></i>
                                Statistiques des Membres
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h3 class="text-primary">${stats.total}</h3>
                                            <small class="text-muted">Total membres</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h3 class="text-success">${stats.withProfileImage}</h3>
                                            <small class="text-muted">Avec photo</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h3 class="text-warning">${stats.recentMembers}</h3>
                                            <small class="text-muted">Nouveaux (30j)</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h3 class="text-info">${Object.keys(stats.byOccupation).length}</h3>
                                            <small class="text-muted">Catégories</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6>Répartition par occupation:</h6>
                            <div class="mt-3">
                                ${Object.entries(stats.byOccupation).map(([occupation, count]) => `
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span>${utils.formatOccupation(occupation)}</span>
                                        <span class="badge bg-secondary">${count}</span>
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
        
        const existingModal = document.getElementById('statsModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', statsHTML);
        const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
        statsModal.show();
    }

    // Méthode utilitaire pour afficher des alertes
    showAlert(message, type = 'info') {
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            // Fallback simple
            alert(message);
        }
    }
}

// Create global instance
const members = new MembersSystem();