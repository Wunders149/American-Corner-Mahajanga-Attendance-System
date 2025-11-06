// Members Management System - Interface améliorée
class MembersSystem {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'name';
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
        
        // Afficher les contrôles de filtre et tri
        this.renderControls();
        
        // Afficher les membres
        this.renderMembers();
        
        console.log(`✅ ${apiService.members.length} membres affichés avec interface améliorée`);
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

    renderControls() {
        const container = document.getElementById('membersContainer');
        
        const controlsHTML = `
            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-users me-2 text-primary"></i>
                                    Nos Membres
                                    <span class="badge bg-primary ms-2">${apiService.members.length}</span>
                                </h5>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex gap-2 justify-content-md-end">
                                    <div class="dropdown">
                                        <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-filter me-1"></i>
                                            ${this.getFilterLabel(this.currentFilter)}
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item ${this.currentFilter === 'all' ? 'active' : ''}" href="#" onclick="members.setFilter('all')">Tous les membres</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item ${this.currentFilter === 'student' ? 'active' : ''}" href="#" onclick="members.setFilter('student')">Étudiants</a></li>
                                            <li><a class="dropdown-item ${this.currentFilter === 'employee' ? 'active' : ''}" href="#" onclick="members.setFilter('employee')">Employés</a></li>
                                            <li><a class="dropdown-item ${this.currentFilter === 'entrepreneur' ? 'active' : ''}" href="#" onclick="members.setFilter('entrepreneur')">Entrepreneurs</a></li>
                                        </ul>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-sort me-1"></i>
                                            ${this.getSortLabel(this.currentSort)}
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item ${this.currentSort === 'name' ? 'active' : ''}" href="#" onclick="members.setSort('name')">Nom A-Z</a></li>
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
    }

    getFilterLabel(filter) {
        const labels = {
            'all': 'Tous',
            'student': 'Étudiants',
            'employee': 'Employés',
            'entrepreneur': 'Entrepreneurs'
        };
        return labels[filter] || 'Filtrer';
    }

    getSortLabel(sort) {
        const labels = {
            'name': 'Nom A-Z',
            'recent': 'Récents',
            'oldest': 'Anciens'
        };
        return labels[sort] || 'Trier';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.renderMembers();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.renderMembers();
    }

    renderMembers() {
        const container = document.getElementById('membersContainer');
        const membersContainer = document.createElement('div');
        membersContainer.className = 'col-12';
        
        // Filtrer et trier les membres
        let filteredMembers = this.filterMembers(apiService.members);
        filteredMembers = this.sortMembers(filteredMembers);
        
        if (filteredMembers.length === 0) {
            membersContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">Aucun membre trouvé</h4>
                    <p class="text-muted">Aucun membre ne correspond aux critères sélectionnés</p>
                    <button class="btn btn-outline-primary" onclick="members.setFilter('all')">
                        Voir tous les membres
                    </button>
                </div>
            `;
            container.appendChild(membersContainer);
            return;
        }
        
        const membersGrid = document.createElement('div');
        membersGrid.className = 'row g-4';
        membersGrid.id = 'membersGrid';
        
        filteredMembers.forEach(member => {
            const memberCard = this.createMemberCard(member);
            membersGrid.appendChild(memberCard);
        });
        
        membersContainer.appendChild(membersGrid);
        container.appendChild(membersContainer);
    }

    filterMembers(members) {
        if (this.currentFilter === 'all') return members;
        return members.filter(member => member.occupation === this.currentFilter);
    }

    sortMembers(members) {
        switch (this.currentSort) {
            case 'name':
                return members.sort((a, b) => 
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                );
            case 'recent':
                return members.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
            case 'oldest':
                return members.sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
            default:
                return members;
        }
    }

    createMemberCard(member) {
        const memberCol = document.createElement('div');
        memberCol.className = 'col-md-6 col-lg-4 col-xl-3';
        
        const initials = utils.getInitials(member.firstName, member.lastName);
        const profileImageUrl = apiService.getProfileImageUrl(member.profileImage);
        const joinDate = member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : 'Date inconnue';
        const occupationIcon = this.getOccupationIcon(member.occupation);
        
        memberCol.innerHTML = `
            <div class="card member-card h-100">
                <div class="card-body">
                    <!-- En-tête du profil -->
                    <div class="text-center mb-3">
                        <div class="member-avatar position-relative mx-auto">
                            ${profileImageUrl ? 
                                `<img src="${profileImageUrl}" alt="${member.firstName} ${member.lastName}" 
                                      class="profile-image" 
                                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                ''
                            }
                            <div class="initials-avatar ${profileImageUrl ? 'd-none' : ''}">
                                ${initials}
                            </div>
                            <div class="occupation-badge">
                                <i class="fas ${occupationIcon}"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Informations principales -->
                    <div class="text-center mb-3">
                        <h5 class="card-title mb-1">${member.firstName} ${member.lastName}</h5>
                        <span class="badge bg-primary mb-2">${utils.formatOccupation(member.occupation)}</span>
                        <p class="card-text">
                            <small class="text-muted member-id-display">
                                <i class="fas fa-id-card me-1"></i>${member.registrationNumber}
                            </small>
                        </p>
                    </div>
                    
                    <!-- Informations secondaires -->
                    <div class="member-details small text-muted mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><i class="fas fa-phone me-1"></i></span>
                            <span>${member.phoneNumber || 'Non renseigné'}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span><i class="fas fa-building me-1"></i></span>
                            <span class="text-end">${member.studyOrWorkPlace || 'Non renseigné'}</span>
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
                                        ${profileImageUrl ? 
                                            `<img src="${profileImageUrl}" alt="${member.firstName} ${member.lastName}" 
                                                  class="profile-image large"
                                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                            ''
                                        }
                                        <div class="initials-avatar large ${profileImageUrl ? 'd-none' : ''}">
                                            ${initials}
                                        </div>
                                        <div class="occupation-badge large">
                                            <i class="fas ${occupationIcon}"></i>
                                        </div>
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
                            
                            <!-- Statistiques (si disponibles) -->
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h5 class="mb-3"><i class="fas fa-chart-bar me-2 text-primary"></i>Activité récente</h5>
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        Les statistiques de présence seront disponibles prochainement.
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
}

// Create global instance
const members = new MembersSystem();