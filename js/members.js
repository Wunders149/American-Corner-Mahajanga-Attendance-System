// Members Management System
class MembersSystem {
    constructor() {
        // No initialization needed
    }

    loadMembersPage() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (apiService.members.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-users fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">Aucun membre disponible</h4>
                    <p class="text-muted">Les membres seront affichés ici une fois chargés depuis l'API</p>
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
                <div class="card member-card">
                    <div class="initials-avatar">
                        ${profileImageUrl ? 
                            `<img src="${profileImageUrl}" alt="${member.firstName} ${member.lastName}" class="profile-image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0;">` : 
                            initials
                        }
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${member.firstName} ${member.lastName}</h5>
                        <span class="member-occupation mb-2">${utils.formatOccupation(member.occupation)}</span>
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
                <strong>Nom complet:</strong> ${member.firstName} ${member.lastName}<br>
                <strong>Numéro:</strong> ${member.registrationNumber}<br>
                <strong>Occupation:</strong> ${utils.formatOccupation(member.occupation)}<br>
                <strong>Téléphone:</strong> ${member.phoneNumber || 'Non spécifié'}<br>
                <strong>Lieu d'étude/travail:</strong> ${member.studyOrWorkPlace || 'Non spécifié'}<br>
                <strong>Date d'adhésion:</strong> ${utils.formatDate(member.joinDate)}<br>
                <strong>Adresse:</strong> ${member.address || 'Non spécifié'}
            `;
            
            // Créer une modal Bootstrap pour afficher le profil
            const modalHtml = `
                <div class="modal fade" id="memberProfileModal" tabindex="-1">
                    <div class="modal-dialog">
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