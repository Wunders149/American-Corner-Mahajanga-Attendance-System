// American Corner Mahajanga - Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.validPages = ['home', 'about', 'attendance', 'qr-generator', 'members', 'contact', 'profile'];
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
            
            // Afficher le statut système
            this.showSystemStatus();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showErrorPage('Erreur lors du démarrage de l\'application');
        }
    }

    async initializeApp() {
        try {
            console.log('🔄 Initialisation des services...');
            
            // 1. Charger les membres (ne pas attendre si l'API est lente)
            this.loadMembers().then(() => {
                console.log('✅ Chargement des membres terminé');
            }).catch(error => {
                console.warn('⚠️ Chargement des membres en arrière-plan:', error);
            });
            
            // 2. Initialiser les modules
            await this.initializeModules();
            
            // 3. Charger la page initiale
            const hash = window.location.hash.substring(1);
            const initialPage = hash && this.validPages.includes(hash) ? hash : 'home';
            await this.loadPage(initialPage);
            
        } catch (error) {
            console.error('❌ Erreur initialisation app:', error);
            throw error;
        }
    }

    // Méthode loadMembers améliorée
    async loadMembers() {
        try {
            if (typeof apiService !== 'undefined') {
                console.log('⏳ Chargement des données membres...');
                await apiService.fetchMembers();
                console.log(`📊 ${apiService.members.length} membres disponibles`);
            } else {
                console.warn('⚠️ Service API non disponible');
            }
        } catch (error) {
            console.warn('⚠️ Avertissement chargement membres:', error);
            // Continuer avec les données démo
        }
    }

    // Dans app.js - méthode initializeModules()
    async initializeModules() {
        console.log('🔧 Initialisation des modules...');
        
        // Initialize scanner module
        if (typeof qrScanner !== 'undefined') {
            this.modules.scanner = qrScanner;
            console.log('🔍 Module Scanner détecté');
        } else {
            console.warn('❌ Module Scanner non disponible');
        }
        
        // Initialize QR generator module
        if (typeof qrGenerator !== 'undefined') {
            this.modules.qrGenerator = qrGenerator;
            console.log('📱 Module QR Generator détecté');
        } else {
            console.warn('❌ Module QR Generator non disponible');
        }
        
        // Initialize members module - CORRECTION ICI
        if (typeof membersSystem !== 'undefined') {
            this.modules.members = membersSystem;
            console.log('👥 Module MembersSystem détecté');
        } else if (typeof members !== 'undefined') {
            this.modules.members = members;
            console.log('👥 Module Members (legacy) détecté');
        } else {
            console.warn('❌ Module Members non disponible');
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

        // Online/offline detection
        window.addEventListener('online', () => {
            this.showNotification('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connexion perdue - Mode hors ligne', 'warning');
        });
    }

    // Main page loading function
    async loadPage(pageId) {
        try {
            if (!this.validPages.includes(pageId)) {
                throw new Error(`Page invalide: ${pageId}`);
            }

            console.log(`📄 Chargement de la page: ${pageId}`);
            
            // Afficher un indicateur de chargement
            this.showLoadingIndicator();
            
            const response = await fetch(`pages/${pageId}.html`);
            if (!response.ok) {
                throw new Error('Page non trouvée');
            }

            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            this.showPage(pageId);
            await this.initializePage(pageId);
            
            // Masquer l'indicateur de chargement
            this.hideLoadingIndicator();
            
        } catch (error) {
            console.error(`Erreur chargement page ${pageId}:`, error);
            this.hideLoadingIndicator();
            this.showErrorPage(`Impossible de charger la page ${pageId}`);
        }
    }

    showLoadingIndicator() {
        // Vous pouvez ajouter un indicateur de chargement global ici
        document.documentElement.style.cursor = 'wait';
    }

    hideLoadingIndicator() {
        document.documentElement.style.cursor = 'default';
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
            
            // Update document title
            document.title = this.getPageTitle(pageId) + ' - American Corner Mahajanga';
        }
    }

    getPageTitle(pageId) {
        const titles = {
            'home': 'Accueil',
            'about': 'À Propos',
            'attendance': 'Présence',
            'qr-generator': 'Générateur QR',
            'members': 'Membres',
            'contact': 'Contact',
            'profile': 'Profil'
        };
        return titles[pageId] || 'American Corner Mahajanga';
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
            case 'profile':
                await this.initializeProfilePage();
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

    async initializeProfilePage() {
        console.log('👤 Initialisation de la page profil...');
        
        try {
            // Attendre un peu que le DOM soit complètement chargé
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Initialiser le système de profil de manière contrôlée
            if (typeof initializeProfileSystem === 'function') {
                window.profileSystem = initializeProfileSystem();
                console.log('✅ Système profil initialisé via appController');
            } else if (typeof ProfileSystem !== 'undefined') {
                // Fallback
                window.profileSystem = new ProfileSystem();
                await window.profileSystem.init();
                console.log('✅ Système profil initialisé via fallback');
            } else {
                console.error('❌ Aucun système profil disponible');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation page profil:', error);
        }
    }

    async initializeProfileSystem() {
        try {
            // Vérifier que profileSystem existe
            if (typeof ProfileSystem !== 'undefined') {
                window.profileSystem = new ProfileSystem();
                await window.profileSystem.init();
            } else {
                console.error('❌ ProfileSystem non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation profil:', error);
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

    // Dans app.js - méthode initializeMembersPage()
    async initializeMembersPage() {
        // Load members if available
        if (this.modules.members) {
            try {
                console.log('👥 Initialisation de la page membres...');
                
                // Essayer différentes méthodes d'initialisation
                if (typeof this.modules.members.loadMembersPage === 'function') {
                    await this.modules.members.loadMembersPage();
                    console.log('✅ Page membres chargée avec loadMembersPage()');
                } else if (typeof this.modules.members.loadMembers === 'function') {
                    await this.modules.members.loadMembers();
                    console.log('✅ Page membres chargée avec loadMembers()');
                } else if (typeof this.modules.members.init === 'function') {
                    await this.modules.members.init();
                    console.log('✅ Page membres chargée avec init()');
                } else {
                    console.log('👥 Module membres prêt à utiliser');
                }
                
            } catch (error) {
                console.error('❌ Erreur initialisation members:', error);
                this.showNotification('Erreur lors du chargement des membres', 'error');
                this.showMembersFallback();
            }
        } else {
            console.warn('⚠️ Gestionnaire de membres non disponible');
            this.showMembersFallback();
        }
    }

    // Nouvelle méthode de fallback
    showMembersFallback() {
        const container = document.getElementById('membersContainer');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card text-center py-5">
                        <div class="card-body">
                            <i class="fas fa-exclamation-triangle fa-4x text-warning mb-4"></i>
                            <h3 class="text-warning">Système de membres temporairement indisponible</h3>
                            <p class="text-muted mb-4">Le chargement des profils de membres rencontre des difficultés techniques.</p>
                            <div class="d-flex gap-2 justify-content-center flex-wrap">
                                <button class="btn btn-primary" onclick="appController.loadPage('home')">
                                    <i class="fas fa-home me-2"></i>Retour à l'accueil
                                </button>
                                <button class="btn btn-outline-primary" onclick="appController.loadPage('members')">
                                    <i class="fas fa-sync me-2"></i>Réessayer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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
            const target = parseInt(counter.getAttribute('data-target')) || 0;
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
            max-width: 500px;
        `;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${icons[type] || 'fa-info-circle'} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
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

    // Nouvelle méthode pour surveiller l'état du système
    showSystemStatus() {
        const status = {
            api: typeof apiService !== 'undefined',
            members: apiService ? apiService.members.length : 0,
            demoMode: apiService ? apiService.useDemoData : true,
            modules: Object.keys(this.modules).length,
            online: navigator.onLine
        };
        
        console.log('📊 Statut système:', status);
        
        if (status.demoMode) {
            setTimeout(() => {
                this.showNotification('Mode démo actif - Données locales utilisées', 'info');
            }, 2000);
        }
        
        if (!status.online) {
            this.showNotification('Mode hors ligne - Fonctionnalités limitées', 'warning');
        }
    }

    // Méthode pour rafraîchir toutes les données
    async refreshAllData() {
        console.log('🔄 Rafraîchissement de toutes les données...');
        
        if (window.apiService && typeof apiService.refreshData === 'function') {
            await apiService.refreshData();
        }
        
        if (this.modules.members && typeof this.modules.members.refreshData === 'function') {
            await this.modules.members.refreshData();
        }
        
        this.showNotification('Données mises à jour', 'success');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});

// Quick start function for immediate feedback
(function() {
    // Masquer immédiatement l'indicateur de chargement initial
    const loadingElement = document.querySelector('.spinner-border');
    if (loadingElement) {
        setTimeout(() => {
            loadingElement.style.display = 'none';
            loadingElement.nextElementSibling.style.display = 'none';
        }, 500);
    }
})();