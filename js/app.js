// Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        await this.loadMembers();
        this.setupEventListeners();
        this.initializeDemoData();
        this.showWelcomeMessage();
    }

    async loadMembers() {
        try {
            await apiService.fetchMembers();
            console.log('Membres chargés:', apiService.members.length);
        } catch (error) {
            console.error('Erreur lors du chargement des membres:', error);
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

        // Session form
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                attendance.startSession();
            });
        }

        // QR Generator form
        const qrGeneratorForm = document.getElementById('qrGeneratorForm');
        if (qrGeneratorForm) {
            qrGeneratorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                qrGenerator.generateQRCode();
            });
        }
    }

    initializeDemoData() {
        if (!localStorage.getItem('recentSessions')) {
            const demoSession = {
                id: 'demo-1',
                memberId: 'ACM001',
                name: 'Linus Torvalds',
                purpose: 'Study',
                topic: 'English Practice',
                startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                duration: '60m'
            };
            localStorage.setItem('recentSessions', JSON.stringify([demoSession]));
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            if (document.getElementById('attendanceAlert')) {
                attendance.showAlert('Bienvenue au système de présence ACM!', 'info');
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
            members.loadMembersPage();
            break;
        case 'attendance':
            attendance.initializeAttendanceSystem();
            break;
        case 'qr-generator':
            qrGenerator.initializeQRGenerator();
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
    window.app = new AppController();
});