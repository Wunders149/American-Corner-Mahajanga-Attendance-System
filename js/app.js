// Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        // Effacer les données locales
        this.clearLocalData();
        
        await this.loadMembers();
        this.setupEventListeners();
        this.initializeDemoData();
        this.showWelcomeMessage();
        
        // Rendre disponible globalement
        window.appController = this;
        
        console.log('🚀 Application American Corner initialisée');
    }

    clearLocalData() {
        // Effacer uniquement les sessions, garder les autres préférences
        if (localStorage.getItem('recentSessions')) {
            localStorage.removeItem('recentSessions');
            console.log('🗑️ Données de sessions effacées');
        }
    }

    async loadMembers() {
        try {
            await apiService.fetchMembers();
            console.log(`📊 ${apiService.members.length} membres chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement membres:', error);
        }
    }

    setupEventListeners() {
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm();
            });
        }

        console.log('📝 Événements globaux configurés');
    }

    initializeDemoData() {
        // Pas de données de démo préchargées
        console.log('🔧 Mode démo disponible si nécessaire');
    }

    showWelcomeMessage() {
        setTimeout(() => {
            if (document.getElementById('attendanceAlert') && window.attendance) {
                attendance.showAlert('Bienvenue au système de présence ACM! 🎉', 'info');
            }
        }, 1000);
    }

    handleContactForm() {
        alert('Merci pour votre message! Nous vous répondrons bientôt.');
        document.getElementById('contactForm').reset();
    }
}

// Page Management
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(pageId)) {
            link.classList.add('active');
        }
    });
    
    // Page-specific initialization
    switch(pageId) {
        case 'members':
            if (window.members) {
                members.loadMembersPage();
            }
            break;
        case 'attendance':
            if (window.attendance) {
                attendance.initializeAttendanceSystem();
            }
            break;
        case 'qr-generator':
            if (window.qrGenerator) {
                qrGenerator.initializeQRGenerator();
            }
            break;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Utility Functions
const utils = {
    getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return firstInitial + lastInitial;
    },

    formatOccupation(occupation) {
        if (!occupation) return 'Non spécifié';
        const occupations = {
            'student': 'Étudiant',
            'employee': 'Employé',
            'entrepreneur': 'Entrepreneur',
            'unemployed': 'Sans emploi',
            'other': 'Autre'
        };
        return occupations[occupation] || occupation.charAt(0).toUpperCase() + occupation.slice(1);
    },

    formatDate(dateString) {
        if (!dateString) return 'Non spécifié';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        } catch (e) {
            return dateString;
        }
    },

    formatTime(dateString) {
        if (!dateString) return '';
        try {
            const options = { hour: '2-digit', minute: '2-digit', hour12: false };
            return new Date(dateString).toLocaleTimeString('fr-FR', options);
        } catch (e) {
            return '';
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});