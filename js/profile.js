// profile.js - Système de gestion de profil membre American Corner Mahajanga
class ProfileSystem {
    constructor() {
        this.member = null;
        this.isInitialized = false;
    }

    // ==================== INITIALISATION ====================
    async init() {
        if (this.isInitialized) {
            console.log('👤 Profil déjà initialisé');
            return;
        }

        console.log('👤 Initialisation du système de profil...');
        
        try {
            await this.loadMemberData();
            await this.waitForDOM();
            this.renderProfile();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Profil initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation profil:', error);
            this.showError('Erreur lors du chargement du profil');
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            const checkDOM = () => {
                if (document.getElementById('profileContent')) {
                    resolve();
                } else {
                    setTimeout(checkDOM, 50);
                }
            };
            checkDOM();
        });
    }

    // ==================== GESTION DES DONNÉES ====================
    async loadMemberData() {
        try {
            const memberData = sessionStorage.getItem('currentMemberProfile');
            if (!memberData) {
                throw new Error('Aucune donnée membre trouvée');
            }
            
            this.member = JSON.parse(memberData);
            console.log('✅ Données membre chargées:', this.member.registrationNumber);
        } catch (error) {
            console.error('❌ Erreur chargement données membre:', error);
            throw error;
        }
    }

    // ==================== RENDU DU PROFIL ====================
    renderProfile() {
        if (!this.member) {
            this.showError('Membre non trouvé');
            return;
        }

        const profileContent = document.getElementById('profileContent');
        if (!profileContent) {
            console.error('❌ Élément profileContent non trouvé');
            return;
        }

        profileContent.innerHTML = this.createProfileHTML();
        document.title = `${this.member.firstName} ${this.member.lastName} - Profil Membre | American Corner Mahajanga`;
    }

    createProfileHTML() {
        const { firstName, lastName, registrationNumber, email, phoneNumber, address, studyOrWorkPlace, joinDate, occupation, profileImage } = this.member;
        
        const initials = this.getInitials(firstName, lastName);
        const formattedJoinDate = this.formatDate(joinDate);
        const formattedOccupation = this.formatOccupation(occupation);
        const occupationColor = this.getOccupationColor(occupation);
        const hasProfileImage = !!profileImage && profileImage.trim() !== '';
        const bgColor = this.getAvatarColor(this.member);

        return `
            <!-- En-tête du profil -->
            <div class="profile-header">
                <div class="container">
                    <button class="btn btn-light btn-back" onclick="goBack()">
                        <i class="fas fa-arrow-left me-2"></i>Retour
                    </button>
                    
                    <div class="profile-hero">
                        <div class="profile-avatar-section">
                            ${this.createAvatarHTML(hasProfileImage, bgColor, initials, occupationColor, occupation)}
                        </div>
                        
                        <div class="profile-info-section">
                            <h1 class="profile-name">${firstName} ${lastName}</h1>
                            <div class="profile-badges">
                                ${this.createBadgesHTML(occupationColor, occupation, registrationNumber, formattedJoinDate)}
                            </div>
                            <div class="profile-actions">
                                ${this.createActionsHTML(email, phoneNumber)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenu principal -->
            <div class="container profile-content">
                <div class="row">
                    <!-- Informations personnelles -->
                    <div class="col-lg-6 mb-4">
                        ${this.createInfoCard(
                            'Informations Personnelles',
                            'user-circle',
                            this.createPersonalInfoHTML(email, phoneNumber, address)
                        )}
                    </div>

                    <!-- Activité professionnelle -->
                    <div class="col-lg-6 mb-4">
                        ${this.createInfoCard(
                            'Activité Professionnelle',
                            'briefcase',
                            this.createProfessionalInfoHTML(formattedOccupation, studyOrWorkPlace, formattedJoinDate)
                        )}
                    </div>
                </div>

                <!-- Statistiques d'activité -->
                <div class="row">
                    <div class="col-12">
                        ${this.createStatsCard()}
                    </div>
                </div>
            </div>
        `;
    }

    createAvatarHTML(hasProfileImage, bgColor, initials, occupationColor, occupation) {
        const profileImageUrl = this.getProfileImageUrl(this.member);
        
        return hasProfileImage ? `
            <div class="profile-avatar-container">
                <img src="${profileImageUrl}" 
                     alt="${this.member.firstName} ${this.member.lastName}"
                     class="profile-photo"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="avatar-fallback" style="background: linear-gradient(135deg, ${bgColor}30, ${bgColor});">
                    <span class="avatar-initials">${initials}</span>
                </div>
                <div class="occupation-badge bg-${occupationColor}">
                    <i class="fas ${this.getOccupationIcon(occupation)}"></i>
                </div>
            </div>
        ` : `
            <div class="profile-avatar-container">
                <div class="avatar-fallback" style="background: linear-gradient(135deg, ${bgColor}30, ${bgColor});">
                    <span class="avatar-initials">${initials}</span>
                </div>
                <div class="occupation-badge bg-${occupationColor}">
                    <i class="fas ${this.getOccupationIcon(occupation)}"></i>
                </div>
            </div>
        `;
    }

    createBadgesHTML(occupationColor, occupation, registrationNumber, joinDate) {
        return `
            <span class="badge occupation-badge-lg bg-${occupationColor}">
                <i class="fas ${this.getOccupationIcon(occupation)} me-2"></i>${this.formatOccupation(occupation)}
            </span>
            <span class="badge badge-outline">
                <i class="fas fa-id-card me-2"></i>${registrationNumber}
            </span>
            <span class="badge badge-outline">
                <i class="fas fa-calendar me-2"></i>Membre depuis ${joinDate}
            </span>
        `;
    }

    createActionsHTML(email, phoneNumber) {
        return `
            <button class="btn btn-primary btn-action" onclick="profileSystem.showQRGenerator()">
                <i class="fas fa-qrcode me-2"></i>
                <span>Générer QR</span>
            </button>
            <button class="btn btn-success btn-action" onclick="profileSystem.showQuickQR()">
                <i class="fas fa-bolt me-2"></i>
                <span>QR Rapide</span>
            </button>
            ${email || phoneNumber ? `
            <button class="btn btn-info btn-action" onclick="profileSystem.showContactModal()">
                <i class="fas fa-envelope me-2"></i>
                <span>Contacter</span>
            </button>
            ` : ''}
        `;
    }

    createInfoCard(title, icon, content) {
        return `
            <div class="profile-card">
                <div class="card-header-custom">
                    <i class="fas fa-${icon} me-2"></i>${title}
                </div>
                <div class="card-body-custom">
                    <div class="info-list">${content}</div>
                </div>
            </div>
        `;
    }

    createPersonalInfoHTML(email, phoneNumber, address) {
        let html = '';
        
        if (email) {
            html += this.createInfoItem('envelope', 'Email', email, 'primary');
        }
        
        if (phoneNumber) {
            html += this.createInfoItem('phone', 'Téléphone', phoneNumber, 'success');
        }
        
        if (address) {
            html += this.createInfoItem('map-marker-alt', 'Adresse', address, 'warning');
        }
        
        return html;
    }

    createProfessionalInfoHTML(occupation, studyOrWorkPlace, joinDate) {
        let html = this.createInfoItem('user-tie', 'Occupation', occupation, 'info');
        
        if (studyOrWorkPlace) {
            html += this.createInfoItem('building', 'Lieu d\'étude/travail', studyOrWorkPlace, 'secondary');
        }
        
        html += this.createInfoItem('calendar-alt', 'Date d\'adhésion', joinDate, 'muted');
        
        return html;
    }

    createInfoItem(icon, label, value, color = 'primary') {
        return `
            <div class="info-item">
                <div class="info-icon text-${color}">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="info-content">
                    <label>${label}</label>
                    <div class="info-value">${value}</div>
                </div>
            </div>
        `;
    }

    createStatsCard() {
        return `
            <div class="profile-card">
                <div class="card-header-custom">
                    <i class="fas fa-chart-bar me-2"></i>Activité du Membre
                </div>
                <div class="card-body-custom">
                    <div class="stats-grid">
                        ${this.createStatCard('calendar-day', 'primary', this.calculateDaysSinceJoin(), 'Jours de présence')}
                        ${this.createStatCard('user-check', 'success', this.getMemberStatus(), 'Statut')}
                        ${this.createStatCard('qrcode', 'warning', this.getQRGeneratedCount(), 'QR Générés')}
                        ${this.createStatCard('clock', 'info', this.getLastActivity(), 'Dernière activité')}
                    </div>
                </div>
            </div>
        `;
    }

    createStatCard(icon, color, value, label) {
        return `
            <div class="stat-card">
                <div class="stat-icon bg-${color}">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-number">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    }

    // ==================== MODALS ET POPUPS ====================
    showQRGenerator() {
        if (!this.validateMemberData()) return;

        if (window.membersSystem) {
            window.membersSystem.generateMemberQR(this.member.registrationNumber);
        } else {
            this.showNotification('Système de génération QR non disponible', 'warning');
        }
    }

    showQuickQR() {
        if (!this.validateMemberData()) return;
        this.showQuickQRModal();
    }

    showContactModal() {
        if (!this.validateMemberData()) return;
        this.showContactOptionsModal();
    }

    showQuickQRModal() {
        const modalHTML = `
            <div class="modal fade modal-profile" id="quickQRModal" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-bolt me-2"></i>QR Rapide
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="qr-preview-container">
                                <div class="qr-code-display" id="quickQRCode"></div>
                                <h6>${this.member.firstName} ${this.member.lastName}</h6>
                                <p class="text-muted small">${this.member.registrationNumber}</p>
                                <div class="qr-info">
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Scannez pour enregistrer la présence
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                            <button type="button" class="btn btn-success" onclick="profileSystem.downloadQuickQR()">
                                <i class="fas fa-download me-1"></i>Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'quickQRModal', () => {
            this.generateQuickQRCode();
        });
    }

    showContactOptionsModal() {
        const contactOptions = [];
        
        if (this.member.email) {
            contactOptions.push(this.createContactOption('envelope', 'Email', this.member.email, 'email'));
        }
        
        if (this.member.phoneNumber) {
            contactOptions.push(this.createContactOption('phone', 'Téléphone', this.member.phoneNumber, 'phone'));
        }

        const modalHTML = `
            <div class="modal fade modal-profile" id="contactModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-envelope me-2"></i>Contacter ${this.member.firstName}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="contact-options">${contactOptions.join('')}</div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'contactModal');
    }

    createContactOption(icon, label, value, type) {
        const href = type === 'email' ? `mailto:${value}` : `tel:${value}`;
        const contactClass = type === 'email' ? 'contact-email' : 'contact-phone';
        
        return `
            <a href="${href}" class="contact-option ${contactClass}">
                <div class="contact-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="contact-content">
                    <div class="contact-label">${label}</div>
                    <div class="contact-value">${value}</div>
                </div>
                <i class="fas fa-chevron-right text-muted"></i>
            </a>
        `;
    }

    generateQuickQRCode() {
        const qrData = JSON.stringify({
            registrationNumber: this.member.registrationNumber,
            firstName: this.member.firstName,
            lastName: this.member.lastName,
            timestamp: new Date().toISOString()
        });

        const qrCodeElement = document.getElementById('quickQRCode');
        if (qrCodeElement && window.QRCode) {
            QRCode.toCanvas(qrCodeElement, qrData, {
                width: 200,
                height: 200,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' }
            }, (error) => {
                if (error) {
                    console.error('Erreur génération QR:', error);
                    qrCodeElement.innerHTML = this.createErrorDisplay('Erreur génération QR');
                }
            });
        }
    }

    downloadQuickQR() {
        const canvas = document.querySelector('#quickQRCode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `QR-${this.member.registrationNumber}-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
            this.showNotification('QR code téléchargé avec succès', 'success');
        }
    }

    showModal(html, modalId, onShown = null) {
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', html);
        
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });

        if (onShown) {
            modalElement.addEventListener('shown.bs.modal', onShown);
        }

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    }

    // ==================== UTILITAIRES ====================
    validateMemberData() {
        if (!this.member || !this.member.registrationNumber) {
            this.showNotification('Données membre non disponibles', 'error');
            return false;
        }
        return true;
    }

    getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (firstInitial + lastInitial).substring(0, 2);
    }

    formatDate(dateString) {
        if (!dateString) return 'Date inconnue';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
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
        const colors = ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1'];
        const colorIndex = (member.id || Math.floor(Math.random() * colors.length)) % colors.length;
        return colors[colorIndex];
    }

    getProfileImageUrl(member) {
        if (window.apiService?.getProfileImageUrl) {
            return window.apiService.getProfileImageUrl(member.profileImage);
        }
        return member.profileImage;
    }

    calculateDaysSinceJoin() {
        if (!this.member?.joinDate) return 'N/A';
        const diffTime = Math.abs(new Date() - new Date(this.member.joinDate));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getMemberStatus() {
        if (!this.member?.joinDate) return 'Nouveau';
        const monthsDiff = (new Date() - new Date(this.member.joinDate)) / (1000 * 60 * 60 * 24 * 30);
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
            return memberQRCodes.length > 0 ? this.formatDate(memberQRCodes[0].generatedAt) : 'Jamais';
        } catch {
            return 'Jamais';
        }
    }

    // ==================== GESTION DES ÉVÉNEMENTS ====================
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') goBack();
        });
    }

    // ==================== GESTION DES ERREURS ====================
    showError(message) {
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            profileContent.innerHTML = this.createErrorDisplay(message);
        }
    }

    createErrorDisplay(message) {
        return `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                <h3 class="text-warning">Erreur</h3>
                <p class="text-muted mb-4">${message}</p>
                <button class="btn btn-primary" onclick="goBack()">
                    <i class="fas fa-arrow-left me-2"></i>Retour aux membres
                </button>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        if (window.appController?.showNotification) {
            window.appController.showNotification(message, type);
        } else {
            this.createFallbackNotification(message, type);
        }
    }

    createFallbackNotification(message, type) {
        const alertClass = {
            'error': 'alert-danger',
            'success': 'alert-success', 
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const icon = {
            'error': 'fa-exclamation-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';

        const alert = document.createElement('div');
        alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${icon} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
}

// ==================== GESTION GLOBALE ====================
let profileSystem = null;

function initializeProfileSystem() {
    if (!profileSystem) {
        console.log('👤 Création nouvelle instance ProfileSystem...');
        profileSystem = new ProfileSystem();
        profileSystem.init().catch(console.error);
    } else {
        console.log('👤 Réutilisation instance existante...');
        profileSystem.loadMemberData().then(() => {
            profileSystem.renderProfile();
        });
    }
    return profileSystem;
}

function goBack() {
    if (window.appController?.loadPage) {
        window.appController.loadPage('members');
    } else if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html#members';
    }
}

// Exposition globale
window.profileSystem = { init: initializeProfileSystem };
window.goBack = goBack;
window.initializeProfileSystem = initializeProfileSystem;

console.log('👤 Script profile.js chargé - Prêt pour initialisation');