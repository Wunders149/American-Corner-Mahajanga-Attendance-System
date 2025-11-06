// Members Management System
class MembersSystem {
    constructor() {
        // No initialization needed
    }

    async loadMembersPage() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Attendre que les membres soient chargés
        if (apiService.members.length === 0) {
            await apiService.fetchMembers();
        }
        
        if (apiService.members.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-users fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">Aucun membre disponible</h4>
                    <p class="text-muted">Les membres seront affichés ici une fois chargés depuis l'API</p>
                    <button class="btn btn-primary mt-3" onclick="apiService.fetchMembers().then(() => members.loadMembersPage())">
                        <i class="fas fa-sync me-2"></i>Rafraîchir
                    </button>
                </div>
            `;
            return;
        }
        
        apiService.members.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'col-md-6 col-lg-4 col-xl-3';
            
            const initials = utils.getInitials(member.firstName, member.lastName);
            const profileImageUrl = apiService.getProfileImageUrl(member.profileImage);
            
            memberCard.innerHTML = `
                <div class="card member-card h-100">
                    <div class="card-body text-center">
                        <div class="initials-avatar mx-auto mb-3">
                            ${profileImageUrl ? 
                                `<img src="${profileImageUrl}" alt="${member.firstName} ${member.lastName}" class="profile-image" onerror="this.style.display='none'; this.parentNode.innerHTML='${initials}'">` : 
                                initials
                            }
                        </div>
                        <h5 class="card-title">${member.firstName} ${member.lastName}</h5>
                        <span class="badge bg-primary mb-2">${utils.formatOccupation(member.occupation)}</span>
                        <p class="card-text">
                            <small class="text-muted member-id-display">${member.registrationNumber}</small>
                        </p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="members.viewMemberProfile('${member.registrationNumber}')">
                                <i class="fas fa-eye me-1"></i>Voir Profil
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="qrGenerator.generateSampleQR('${member.registrationNumber}'); showPage('qr-generator');">
                                <i class="fas fa-qrcode me-1"></i>Générer QR
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(memberCard);
        });
        
        console.log(`✅ ${apiService.members.length} membres affichés`);
    }

    viewMemberProfile(registrationNumber) {
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            const profileHtml = `
                <div class="row">
                    <div class="col-md-3 text-center">
                        <div class="initials-avatar large mx-auto mb-3">
                            ${utils.getInitials(member.firstName, member.lastName)}
                        </div>
                    </div>
                    <div class="col-md-9">
                        <table class="table table-borderless">
                            <tr>
                                <td><strong>Nom complet:</strong></td>
                                <td>${member.firstName} ${member.lastName}</td>
                            </tr>
                            <tr>
                                <td><strong>Numéro d'enregistrement:</strong></td>
                                <td><span class="member-id-display">${member.registrationNumber}</span></td>
                            </tr>
                            <tr>
                                <td><strong>Occupation:</strong></td>
                                <td>${utils.formatOccupation(member.occupation)}</td>
                            </tr>
                            <tr>
                                <td><strong>Téléphone:</strong></td>
                                <td>${member.phoneNumber || 'Non spécifié'}</td>
                            </tr>
                            <tr>
                                <td><strong>Lieu d'étude/travail:</strong></td>
                                <td>${member.studyOrWorkPlace || 'Non spécifié'}</td>
                            </tr>
                            <tr>
                                <td><strong>Date d'adhésion:</strong></td>
                                <td>${utils.formatDate(member.joinDate)}</td>
                            </tr>
                            <tr>
                                <td><strong>Adresse:</strong></td>
                                <td>${member.address || 'Non spécifié'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
            
            // Créer une modal Bootstrap pour afficher le profil
            const modalHtml = `
                <div class="modal fade" id="memberProfileModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Profil de ${member.firstName} ${member.lastName}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${profileHtml}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                                <button type="button" class="btn btn-primary" onclick="qrGenerator.generateSampleQR('${member.registrationNumber}'); showPage('qr-generator'); $('#memberProfileModal').modal('hide');">
                                    <i class="fas fa-qrcode me-1"></i>Générer QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Ajouter la modal au DOM si elle n'existe pas
            let modal = document.getElementById('memberProfileModal');
            if (modal) {
                modal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const memberModal = new bootstrap.Modal(document.getElementById('memberProfileModal'));
            memberModal.show();
        }
    }
}

// Create global instance
const members = new MembersSystem();