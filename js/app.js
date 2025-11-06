// Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation American Corner...');
        
        await this.loadMembers();
        this.setupEventListeners();
        
        window.appController = this;
        console.log('✅ Application initialisée');
    }

    async loadMembers() {
        try {
            await apiService.fetchMembers();
            console.log(`📊 ${apiService.members.length} membres disponibles`);
        } catch (error) {
            console.error('Erreur chargement membres:', error);
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
    }

    handleContactForm() {
        alert('Merci pour votre message! Nous vous répondrons bientôt.');
        document.getElementById('contactForm').reset();
    }
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
        return occupations[occupation] || occupation;
    }
};

// Page Management (fonction globale)
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});