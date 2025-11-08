// profile.js - Gestion de la page de profil individuel
class ProfileSystem {
    constructor() {
        this.member = null;
        this.isInitialized = false;
    }

    async init() {
        console.log('👤 Initialisation du système de profil...');
        
        // Attendre que le DOM soit complètement chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeProfile();
            });
        } else {
            await this.initializeProfile();
        }
    }

    async initializeProfile() {
        try {
            await this.loadMemberData();
            
            // Vérifier que l'élément profileContent existe
            const profileContent = document.getElementById('profileContent');
            if (!profileContent) {
                console.error('❌ Élément profileContent non trouvé dans le DOM');
                this.showError('Erreur d\'affichage du profil');
                return;
            }
            
            this.renderProfile();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Profil initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur initialisation profil:', error);
            this.showError('Erreur lors du chargement du profil');
        }
    }

    /**
     * Charge les données du membre depuis sessionStorage
     */
    async loadMemberData() {
        try {
            const memberData = sessionStorage.getItem('currentMemberProfile');
            if (memberData) {
                this.member = JSON.parse(memberData);
                console.log('✅ Données membre chargées:', this.member.registrationNumber);
            } else {
                console.warn('⚠️ Aucune donnée membre trouvée dans sessionStorage');
                throw new Error('Aucune donnée de membre disponible');
            }
        } catch (error) {
            console.error('❌ Erreur chargement données membre:', error);
            throw error;
        }
    }

    /**
     * Affiche le profil du membre
     */
    renderProfile() {
        if (!this.member) {
            this.showError('Membre non trouvé');
            return;
        }

        const profileContent = document.getElementById('profileContent');
        if (!profileContent) {
            console.error('❌ Impossible de trouver profileContent pour le rendu');
            return;
        }

        const profileHTML = this.createProfileHTML();
        profileContent.innerHTML = profileHTML;
        
        // Mettre à jour le titre de la page
        document.title = `${this.member.firstName} ${this.member.lastName} - Profil Membre | American Corner Mahajanga`;
    }

    /**
     * Crée le HTML du profil
     */
    createProfileHTML() {
        const initials = this.getInitials(this.member.firstName, this.member.lastName);
        const joinDate = this.formatDate(this.member.joinDate);
        const occupation = this.formatOccupation(this.member.occupation);
        const occupationColor = this.getOccupationColor(this.member.occupation);
        const hasProfileImage = !!this.member.profileImage && this.member.profileImage.trim() !== '';
        const bgColor = this.getAvatarColor(this.member);

        const profileImageHTML = hasProfileImage ? `
            <div class="member-avatar-container" style="width: 150px; height: 150px;">
                <img src="${this.getProfileImageUrl(this.member)}" 
                     alt="${this.member.firstName} ${this.member.lastName}"
                     class="member-photo actual-photo"
                     style="border: 6px solid #fff; box-shadow: 0 8px 25px rgba(0,0,0,0.15);"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="avatar-fallback" style="background-color: ${bgColor}; display: none;">
                    <span class="avatar-initials" style="font-size: 3rem;">${initials}</span>
                </div>
                <div class="occupation-icon bg-${occupationColor}" style="width: 45px; height: 45px;">
                    <i class="fas ${this.getOccupationIcon(this.member.occupation)} text-white"></i>
                </div>
            </div>
        ` : `
            <div class="member-avatar-container" style="width: 150px; height: 150px;">
                <div class="avatar-fallback" style="background-color: ${bgColor};">
                    <span class="avatar-initials" style="font-size: 3rem;">${initials}</span>
                </div>
                <div class="occupation-icon bg-${occupationColor}" style="width: 45px; height: 45px;">
                    <i class="fas ${this.getOccupationIcon(this.member.occupation)} text-white"></i>
                </div>
            </div>
        `;

        return `
            <!-- En-tête du profil -->
            <div class="row align-items-center mb-5">
                <div class="col-md-4 text-center">
                    ${profileImageHTML}
                </div>
                <div class="col-md-8">
                    <h1 class="display-5 fw-bold text-primary mb-3">${this.member.firstName} ${this.member.lastName}</h1>
                    <span class="badge bg-${occupationColor} fs-6 mb-3">${occupation}</span>
                    
                    <div class="row mb-3">
                        <div class="col-sm-6">
                            <p class="mb-2">
                                <i class="fas fa-id-card me-2 text-muted"></i>
                                <strong>Numéro d'enregistrement:</strong> 
                                <span class="member-id-display text-primary">${this.member.registrationNumber}</span>
                            </p>
                        </div>
                        <div class="col-sm-6">
                            <p class="mb-2">
                                <i class="fas fa-calendar me-2 text-muted"></i>
                                <strong>Membre depuis:</strong> ${joinDate}
                            </p>
                        </div>
                    </div>

                    <!-- Actions rapides -->
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary" onclick="window.profileSystem.generateQRCode()">
                            <i class="fas fa-qrcode me-2"></i>Générer Carte QR
                        </button>
                        <button class="btn btn-outline-success" onclick="window.profileSystem.quickGenerateQR()">
                            <i class="fas fa-bolt me-2"></i>QR Rapide
                        </button>
                        ${this.member.email || this.member.phoneNumber ? `
                        <button class="btn btn-outline-info" onclick="window.profileSystem.showContactOptions()">
                            <i class="fas fa-envelope me-2"></i>Contacter
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <hr class="my-5">

            <!-- Informations détaillées -->
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>
                                Informations Personnelles
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="info-grid">
                                ${this.member.email ? `
                                    <div class="info-item">
                                        <i class="fas fa-envelope text-primary"></i>
                                        <div>
                                            <strong>Email</strong>
                                            <div>${this.member.email}</div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${this.member.phoneNumber ? `
                                    <div class="info-item">
                                        <i class="fas fa-phone text-success"></i>
                                        <div>
                                            <strong>Téléphone</strong>
                                            <div>${this.member.phoneNumber}</div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${this.member.address ? `
                                    <div class="info-item">
                                        <i class="fas fa-map-marker-alt text-warning"></i>
                                        <div>
                                            <strong>Adresse</strong>
                                            <div>${this.member.address}</div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-briefcase me-2"></i>
                                Activité Professionnelle
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="info-grid">
                                <div class="info-item">
                                    <i class="fas fa-user-tie text-info"></i>
                                    <div>
                                        <strong>Occupation</strong>
                                        <div>${occupation}</div>
                                    </div>
                                </div>
                                
                                ${this.member.studyOrWorkPlace ? `
                                    <div class="info-item">
                                        <i class="fas fa-building text-secondary"></i>
                                        <div>
                                            <strong>Lieu d'étude/travail</strong>
                                            <div>${this.member.studyOrWorkPlace}</div>
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
            </div>

            <!-- Section statistiques -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-chart-bar me-2"></i>
                                Activité du Membre
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-number text-primary">${this.calculateDaysSinceJoin()}</div>
                                        <div class="stat-label">Jours de présence</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-number text-success">${this.getMemberStatus()}</div>
                                        <div class="stat-label">Statut</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-number text-warning">${this.getQRGeneratedCount()}</div>
                                        <div class="stat-label">QR Générés</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-item">
                                        <div class="stat-number text-info">${this.getLastActivity()}</div>
                                        <div class="stat-label">Dernière activité</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Méthodes utilitaires
     */
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

    formatOccupation(occupation) {
        const occupations = {
            'student': 'Étudiant',
            'employee': 'Employé',
            'entrepreneur': 'Entrepreneur',
            'unemployed': 'Sans emploi',
            'other': 'Autre'
        };
        return occupations[occupation] || occupation;
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

    getAvatarColor(member) {
        const colors = [
            '#007bff', '#28a745', '#17a2b8', '#ffc107', 
            '#dc3545', '#6f42c1', '#e83e8c', '#fd7e14',
            '#20c997', '#0dcaf0', '#6610f2', '#d63384'
        ];
        const colorIndex = (member.id || Math.floor(Math.random() * colors.length)) % colors.length;
        return colors[colorIndex];
    }

    getProfileImageUrl(member) {
        if (window.apiService && typeof window.apiService.getProfileImageUrl === 'function') {
            return window.apiService.getProfileImageUrl(member.profileImage);
        }
        return member.profileImage;
    }

    /**
     * Méthodes de calcul pour les statistiques
     */
    calculateDaysSinceJoin() {
        if (!this.member.joinDate) return 'N/A';
        const joinDate = new Date(this.member.joinDate);
        const today = new Date();
        const diffTime = Math.abs(today - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getMemberStatus() {
        if (!this.member.joinDate) return 'Nouveau';
        const joinDate = new Date(this.member.joinDate);
        const monthsDiff = (new Date() - joinDate) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 6 ? 'Actif' : 'Ancien';
    }

    getQRGeneratedCount() {
        try {
            const recentQRCodes = JSON.parse(localStorage.getItem('recentQRCodes') || '[]');
            return recentQRCodes.filter(qr => qr.registrationNumber === this.member.registrationNumber).length;
        } catch {
            return 0;
        }
    }

    getLastActivity() {
        try {
            const recentQRCodes = JSON.parse(localStorage.getItem('recentQRCodes') || '[]');
            const memberQRCodes = recentQRCodes.filter(qr => qr.registrationNumber === this.member.registrationNumber);
            if (memberQRCodes.length > 0) {
                const lastQR = memberQRCodes[0];
                return this.formatDate(lastQR.generatedAt);
            }
        } catch {
            return 'Jamais';
        }
        return 'Jamais';
    }

    /**
     * Actions du profil
     */
    generateQRCode() {
        if (window.membersSystem) {
            window.membersSystem.generateMemberQR(this.member.registrationNumber);
        } else {
            this.showNotification('Système de génération QR non disponible', 'warning');
        }
    }

    quickGenerateQR() {
        if (window.membersSystem) {
            window.membersSystem.generateQuickQR(this.member.registrationNumber);
        } else {
            this.showNotification('Système de génération QR non disponible', 'warning');
        }
    }

    showContactOptions() {
        const contactOptions = [];
        if (this.member.email) contactOptions.push(`📧 Email: ${this.member.email}`);
        if (this.member.phoneNumber) contactOptions.push(`📞 Téléphone: ${this.member.phoneNumber}`);
        
        if (contactOptions.length === 0) {
            this.showNotification('Aucune information de contact disponible', 'warning');
            return;
        }

        alert(`Options de contact pour ${this.member.firstName} ${this.member.lastName}:\n\n${contactOptions.join('\n')}`);
    }

    /**
     * Gestion des événements
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                goBack();
            }
        });
    }

    /**
     * Gestion des erreurs
     */
    showError(message) {
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                    <h3 class="text-warning">Erreur</h3>
                    <p class="text-muted mb-4">${message}</p>
                    <button class="btn btn-primary" onclick="goBack()">
                        <i class="fas fa-arrow-left me-2"></i>Retour aux membres
                    </button>
                </div>
            `;
        } else {
            // Fallback si profileContent n'existe toujours pas
            document.body.innerHTML = `
                <div class="container py-5">
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <h4>Erreur Critique</h4>
                        <p>${message}</p>
                        <button class="btn btn-primary mt-2" onclick="goBack()">
                            Retour aux membres
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification(message, type);
        } else {
            // Fallback simple
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
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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

// Fonction globale pour retourner en arrière
function goBack() {
    if (window.appController && typeof window.appController.loadPage === 'function') {
        window.appController.loadPage('members');
    } else if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html#members';
    }
}

// Initialisation différée
let profileSystem;

// Attendre que le DOM soit complètement chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('👤 DOM chargé, initialisation du profil...');
        profileSystem = new ProfileSystem();
        profileSystem.init();
    });
} else {
    console.log('👤 DOM déjà chargé, initialisation immédiate du profil...');
    profileSystem = new ProfileSystem();
    profileSystem.init();
}

// Exposer globalement
window.profileSystem = profileSystem;
window.goBack = goBack;

console.log('👤 Script profile.js chargé');