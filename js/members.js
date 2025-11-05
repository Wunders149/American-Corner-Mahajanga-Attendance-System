// Members Management System
class MembersSystem {
    constructor() {
        // No initialization needed
    }

    loadMembersPage() {
        const container = document.getElementById('membersContainer');
        container.innerHTML = '';
        
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
    }

    viewMemberProfile(registrationNumber) {
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            alert(`Profil de ${member.firstName} ${member.lastName}\n\n` +
                  `Numéro: ${member.registrationNumber}\n` +
                  `Occupation: ${utils.formatOccupation(member.occupation)}\n` +
                  `Téléphone: ${member.phoneNumber || 'Non spécifié'}\n` +
                  `Lieu: ${member.studyOrWorkPlace || 'Non spécifié'}\n` +
                  `Date d'adhésion: ${utils.formatDate(member.joinDate)}`);
        }
    }
}

// Create global instance
const members = new MembersSystem();