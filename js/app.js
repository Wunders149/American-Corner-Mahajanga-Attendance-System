// American Corner Mahajanga - Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.validPages = ['home', 'about', 'attendance', 'qr-generator', 'members', 'contact'];
        this.pages = {};
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initialisation American Corner Mahajanga...');
            
            // Setup event listeners first
            this.setupEventListeners();
            
            // Set as global reference immediately
            window.appController = this;
            
            // Initialize the application
            await this.initializeApp();
            
            this.isInitialized = true;
            console.log('✅ Application initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showErrorPage('Erreur lors du démarrage de l\'application');
        }
    }

    async initializeApp() {
        // Load members data
        await this.loadMembers();
        
        // Initialize based on current URL
        const hash = window.location.hash.substring(1);
        if (hash && this.validPages.includes(hash)) {
            await this.loadPage(hash);
        } else {
            await this.loadPage('home');
        }
    }

    setupEventListeners() {
        // Navigation event delegation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const pageId = navLink.getAttribute('data-page');
                this.loadPage(pageId);
            }
            
            // Handle logo click
            const logo = e.target.closest('#nav-home');
            if (logo) {
                e.preventDefault();
                this.loadPage('home');
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.loadPage(event.state.page);
            }
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
        });
    }

    async loadMembers() {
        try {
            if (typeof apiService !== 'undefined') {
                await apiService.fetchMembers();
                console.log(`📊 ${apiService.members.length} membres chargés`);
            }
        } catch (error) {
            console.warn('Avertissement chargement membres:', error);
        }
    }

    // Main page loading function
    async loadPage(pageId) {
        try {
            if (!this.validPages.includes(pageId)) {
                throw new Error(`Page invalide: ${pageId}`);
            }

            console.log(`📄 Chargement de la page: ${pageId}`);
            
            // Use fetch for external pages or internal cache
            const response = await fetch(`pages/${pageId}.html`);
            if (!response.ok) {
                throw new Error('Page non trouvée');
            }

            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            this.showPage(pageId);
            await this.initializePage(pageId);
            
        } catch (error) {
            console.error(`Erreur chargement page ${pageId}:`, error);
            this.showErrorPage(`Impossible de charger la page ${pageId}`);
        }
    }

    // Show page and update navigation
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
        });
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show the selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update active nav link
            const navLinks = document.querySelectorAll(`[data-page="${pageId}"]`);
            navLinks.forEach(link => {
                link.classList.add('active');
            });
            
            this.currentPage = pageId;
            
            // Update browser history
            history.pushState({page: pageId}, '', `#${pageId}`);
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    }

    // Initialize page-specific functionality
    async initializePage(pageId) {
        console.log(`🔧 Initialisation page: ${pageId}`);
        
        switch(pageId) {
            case 'home':
                await this.initializeHomePage();
                break;
            case 'about':
                await this.initializeAboutPage();
                break;
            case 'attendance':
                await this.initializeAttendancePage();
                break;
            case 'qr-generator':
                await this.initializeQRGeneratorPage();
                break;
            case 'members':
                await this.initializeMembersPage();
                break;
            case 'contact':
                await this.initializeContactPage();
                break;
        }
    }

    async initializeHomePage() {
        // KPI Counter Animation
        this.animateKPICounters();
        
        // Service cards interaction
        this.setupServiceCards();
    }

    async initializeAboutPage() {
        // FAQ accordion is handled by Bootstrap
        console.log('📖 Page À Propos initialisée');
    }

    async initializeAttendancePage() {
        // Initialize scanner if available
        if (typeof qrScanner !== 'undefined') {
            await qrScanner.initialize();
        } else {
            console.warn('QR Scanner non disponible');
        }
    }

    async initializeQRGeneratorPage() {
        // Initialize QR generator if available
        if (typeof qrGenerator !== 'undefined') {
            await qrGenerator.initialize();
        } else {
            console.warn('QR Generator non disponible');
        }
    }

    async initializeMembersPage() {
        // Load members if available
        if (typeof membersManager !== 'undefined') {
            await membersManager.loadMembers();
        } else if (typeof members !== 'undefined') {
            await members.loadMembersPage();
        } else {
            console.warn('Gestionnaire de membres non disponible');
        }
    }

    async initializeContactPage() {
        // Contact form initialization
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm();
            });
        }
    }

    // KPI Counter Animation
    animateKPICounters() {
        const kpiCounters = document.querySelectorAll('.kpi-counter');
        kpiCounters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    }

    // Service cards interaction
    setupServiceCards() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                this.loadPage('about');
            });
            
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.loadPage('about');
                }
            });
        });
    }

    // Contact form handler
    handleContactForm() {
        const form = document.getElementById('contactForm');
        const formData = new FormData(form);
        
        console.log('📧 Envoi du formulaire:', {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        });
        
        this.showNotification('Merci pour votre message! Nous vous répondrons bientôt.', 'success');
        form.reset();
    }

    // Error page display
    showErrorPage(message) {
        document.getElementById('main-content').innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h4>Erreur</h4>
                    <p>${message}</p>
                    <button class="btn btn-primary mt-2" onclick="window.appController.loadPage('home')">
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        `;
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility function for testing scanner
    testScannerWithDemoMember() {
        console.log('🧪 Test avec membre démo ACM001');
        
        const demoQRData = JSON.stringify({
            registrationNumber: "ACM001",
            firstName: "Linus",
            lastName: "Torvalds",
            occupation: "entrepreneur",
            phoneNumber: "+261 34 11 223 34",
            studyOrWorkPlace: "Linux Foundation",
            timestamp: new Date().toISOString()
        });
        
        if (window.qrScanner && window.qrScanner.onScanSuccess) {
            window.qrScanner.onScanSuccess(demoQRData);
        } else {
            console.warn('QR Scanner non disponible pour le test');
        }
    }
}

// Utility Functions
const AppUtils = {
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
    },

    formatDate(dateString) {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
};

// Global utility functions
window.utils = AppUtils;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Erreur non gérée:', event.error);
});

// Make appController globally available
window.AppController = AppController;