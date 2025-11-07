// American Corner Mahajanga - Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.validPages = ['home', 'about', 'attendance', 'qr-generator', 'members', 'contact'];
        this.isInitialized = false;
        this.modules = {};
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initialisation American Corner Mahajanga...');
            
            // Set as global reference immediately
            window.appController = this;
            
            // Setup event listeners first
            this.setupEventListeners();
            
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
        
        // Initialize modules
        await this.initializeModules();
        
        // Initialize based on current URL
        const hash = window.location.hash.substring(1);
        if (hash && this.validPages.includes(hash)) {
            await this.loadPage(hash);
        } else {
            await this.loadPage('home');
        }
    }

    async initializeModules() {
        console.log('🔧 Initialisation des modules...');
        
        // Initialize scanner module - VÉRIFICATION CORRECTE
        if (typeof qrScanner !== 'undefined') {
            this.modules.scanner = qrScanner;
            console.log('🔍 Module Scanner détecté:', Object.getOwnPropertyNames(qrScanner));
            
            // Le scanner est déjà initialisé dans son constructeur
            // On vérifie juste qu'il est prêt
            if (qrScanner.libraryLoaded) {
                console.log('✅ Scanner QR prêt à utiliser');
            } else {
                console.warn('⚠️ Scanner QR - bibliothèque non chargée');
            }
        } else {
            console.warn('❌ Module Scanner non disponible');
        }
        
        // Initialize QR generator module
        if (typeof qrGenerator !== 'undefined') {
            this.modules.qrGenerator = qrGenerator;
            console.log('📱 Module QR Generator détecté');
        }
        
        // Initialize members module
        if (typeof membersManager !== 'undefined') {
            this.modules.members = membersManager;
            console.log('👥 Module Members initialisé');
        } else if (typeof members !== 'undefined') {
            this.modules.members = members;
            console.log('👥 Module Members (legacy) initialisé');
        }
    }

    setupEventListeners() {
        // Navigation event delegation - enhanced to handle all dynamic content
        document.addEventListener('click', (e) => {
            // Handle data-page navigation
            const navLink = e.target.closest('[data-page]');
            if (navLink) {
                e.preventDefault();
                const pageId = navLink.getAttribute('data-page');
                this.loadPage(pageId);
                return;
            }
            
            // Handle button clicks with data-page
            const button = e.target.closest('button[data-page]');
            if (button) {
                e.preventDefault();
                const pageId = button.getAttribute('data-page');
                this.loadPage(pageId);
                return;
            }
            
            // Handle logo click
            const logo = e.target.closest('#nav-home');
            if (logo) {
                e.preventDefault();
                this.loadPage('home');
                return;
            }
            
            // Handle back buttons
            const backButton = e.target.closest('.btn-outline-primary');
            if (backButton && backButton.textContent.includes('Retour')) {
                e.preventDefault();
                this.loadPage('home');
                return;
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
        // Initialize scanner if available - CORRECTION ICI
        if (this.modules.scanner) {
            try {
                // Le scanner n'a pas de méthode initialize(), il est déjà prêt
                // On vérifie juste qu'il fonctionne et on met à jour l'UI
                console.log('🔍 Vérification du scanner QR...');
                
                // Mettre à jour l'interface utilisateur
                this.modules.scanner.updateScannerUI('stopped');
                
                // Configurer les écouteurs d'événements pour les boutons du scanner
                this.setupScannerEventListeners();
                
                console.log('✅ Scanner QR prêt - utilisez les boutons pour démarrer');
            } catch (error) {
                console.warn('Avertissement initialisation scanner:', error);
            }
        } else {
            console.warn('QR Scanner non disponible');
        }
    }

    // Nouvelle méthode pour configurer les écouteurs d'événements du scanner
    setupScannerEventListeners() {
        // Écouteur pour le bouton "Activer le Scanner"
        const startBtn = document.getElementById('startScannerBtn');
        if (startBtn && this.modules.scanner) {
            startBtn.addEventListener('click', () => {
                this.modules.scanner.startScanner();
            });
        }

        // Écouteur pour le bouton "Arrêter le Scanner"
        const stopBtn = document.getElementById('stopScannerBtn');
        if (stopBtn && this.modules.scanner) {
            stopBtn.addEventListener('click', () => {
                this.modules.scanner.stopScanner();
            });
        }

        // Écouteur pour le bouton "Entrée Manuelle"
        const manualBtn = document.getElementById('manualEntryBtn');
        if (manualBtn && this.modules.scanner) {
            manualBtn.addEventListener('click', () => {
                this.modules.scanner.startManualEntry();
            });
        }

        // Écouteur pour le bouton de démo
        const demoBtn = document.getElementById('demoScannerBtn');
        if (demoBtn && this.modules.scanner) {
            demoBtn.addEventListener('click', () => {
                this.testScannerWithDemoMember();
            });
        }

        console.log('🎯 Écouteurs d\'événements du scanner configurés');
    }

    async initializeQRGeneratorPage() {
        // Initialize QR generator if available
        if (this.modules.qrGenerator) {
            try {
                // Try different possible initialization methods
                if (typeof this.modules.qrGenerator.initialize === 'function') {
                    await this.modules.qrGenerator.initialize();
                } else if (typeof this.modules.qrGenerator.init === 'function') {
                    await this.modules.qrGenerator.init();
                } else {
                    console.log('📱 QR Generator prêt à utiliser');
                }
                console.log('📱 QR Generator initialisé avec succès');
            } catch (error) {
                console.warn('Erreur initialisation QR Generator:', error);
            }
        } else {
            console.warn('QR Generator non disponible');
        }
    }

    async initializeMembersPage() {
        // Load members if available
        if (this.modules.members) {
            try {
                if (typeof this.modules.members.loadMembers === 'function') {
                    await this.modules.members.loadMembers();
                } else if (typeof this.modules.members.loadMembersPage === 'function') {
                    await this.modules.members.loadMembersPage();
                } else if (typeof this.modules.members.init === 'function') {
                    await this.modules.members.init();
                }
                console.log('👥 Members module initialisé avec succès');
            } catch (error) {
                console.warn('Erreur initialisation members:', error);
            }
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
        console.log('📧 Page Contact initialisée');
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
                    <button class="btn btn-primary mt-2" data-page="home">
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
        
        if (this.modules.scanner && this.modules.scanner.onScanSuccess) {
            this.modules.scanner.onScanSuccess(demoQRData);
        } else {
            console.warn('QR Scanner non disponible pour le test');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});