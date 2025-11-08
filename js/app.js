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
            
            // 3. Charger la page initiale - CORRECTION ICI
            const hash = window.location.hash.substring(1);
            console.log('🔗 Hash initial:', hash);
            
            let initialPage;
            if (hash && hash.startsWith('profile')) {
                initialPage = hash; // Garder 'profileACM001' complet
            } else if (hash && this.validPages.includes(hash)) {
                initialPage = hash;
            } else {
                initialPage = 'home';
            }
            
            console.log('📄 Page initiale:', initialPage);
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

        // Initialize profile module
        if (typeof ProfileSystem !== 'undefined') {
            this.modules.profile = ProfileSystem;
            console.log('👤 Module ProfileSystem détecté');
        } else {
            console.warn('❌ Module ProfileSystem non disponible');
        }
    }

    setupEventListeners() {
        // Navigation event delegation - enhanced to handle all dynamic content
        document.addEventListener('click', (e) => {
            // NE PAS INTERCEPTER les liens avec target="_blank" ou href externes
            const externalLink = e.target.closest('a[target="_blank"]');
            if (externalLink) {
                // Laisser le navigateur gérer les liens externes
                console.log('🔗 Lien externe détecté, laisser le navigateur gérer:', externalLink.href);
                return; // NE PAS faire e.preventDefault()
            }

            // Handle data-page navigation - ONLY for internal SPA navigation
            const navLink = e.target.closest('[data-page]');
            if (navLink && !navLink.hasAttribute('href')) {
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

        // Gestion du changement d'hash pour la navigation SPA - CORRECTION
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            console.log('🔗 Hash change détecté:', hash);
            
            if (hash) {
                // Vérifier si c'est une page valide (profile, members, etc.)
                const basePage = this.extractBasePageFromHash(hash);
                if (basePage && this.validPages.includes(basePage)) {
                    this.loadPage(hash); // Charger avec l'hash complet
                }
            }
        });
    }

    // Nouvelle méthode pour extraire la page de base depuis l'hash
    extractBasePageFromHash(hash) {
        if (hash.startsWith('profile')) {
            return 'profile';
        }
        // Ajouter d'autres cas si nécessaire
        return this.validPages.includes(hash) ? hash : null;
    }

    // Main page loading function
    async loadPage(pageId) {
        try {
            console.log('📄 loadPage appelé avec:', pageId);
            
            // Déterminer la page de base à charger
            let basePageId;
            let registrationNumber = null;

            if (pageId.startsWith('profile')) {
                basePageId = 'profile';
                registrationNumber = pageId.replace('profile', '');
                console.log('👤 Page profil détectée pour:', registrationNumber);
            } else {
                basePageId = pageId;
            }

            if (!this.validPages.includes(basePageId)) {
                throw new Error(`Page invalide: ${pageId}`);
            }

            console.log(`📄 Chargement de la page: ${basePageId} (URL: ${pageId})`);
            
            // Afficher un indicateur de chargement
            this.showLoadingIndicator();
            
            const response = await fetch(`pages/${basePageId}.html`);
            if (!response.ok) {
                throw new Error('Page non trouvée');
            }

            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            this.showPage(pageId); // Passer l'ID complet
            await this.initializePage(basePageId);
            
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
        console.log('🎯 showPage appelé avec:', pageId);
        
        // Déterminer la page de base pour la navigation
        let basePageId;
        if (pageId.startsWith('profile')) {
            basePageId = 'profile';
        } else {
            basePageId = pageId;
        }
        
        // Hide all pages
        document.querySelectorAll('.page-section').forEach(page => {
            page.classList.remove('active');
        });
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show the selected page
        const targetPage = document.getElementById(basePageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update active nav link
            const navLinks = document.querySelectorAll(`[data-page="${basePageId}"]`);
            navLinks.forEach(link => {
                link.classList.add('active');
            });
            
            this.currentPage = basePageId;
            
            // Update browser history - garder l'URL complète
            history.pushState({page: pageId}, '', `#${pageId}`);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Update document title
            document.title = this.getPageTitle(basePageId) + ' - American Corner Mahajanga';
            
            console.log('✅ Page affichée:', basePageId, 'URL:', pageId);
        } else {
            console.error('❌ Page non trouvée:', basePageId);
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
            
            // Vérifier si on a des données de membre à afficher
            const memberData = this.getMemberDataForProfile();
            
            if (memberData) {
                console.log('✅ Données membre disponibles pour le profil:', memberData.registrationNumber);
                await this.initializeProfileWithData(memberData);
            } else {
                console.warn('⚠️ Aucune donnée membre disponible pour le profil');
                this.showProfileFallback();
            }
            
        } catch (error) {
            console.error('❌ Erreur initialisation page profil:', error);
            this.showProfileFallback();
        }
    }

    /**
     * Récupère les données du membre pour la page profil
     */
    getMemberDataForProfile() {
        try {
            // 1. Essayer depuis l'URL (navigation directe)
            const hash = window.location.hash;
            if (hash && hash.includes('profile')) {
                const registrationNumber = hash.replace('#profile', '');
                if (registrationNumber) {
                    console.log('🔗 Numéro d\'enregistrement détecté dans URL:', registrationNumber);
                    
                    // Chercher le membre dans les données disponibles
                    if (window.apiService && window.apiService.members) {
                        const member = window.apiService.members.find(m => 
                            m.registrationNumber === registrationNumber
                        );
                        if (member) {
                            console.log('✅ Membre trouvé via API Service:', member.registrationNumber);
                            return member;
                        }
                    }
                    
                    // Chercher dans membersSystem
                    if (window.membersSystem && window.membersSystem.members) {
                        const member = window.membersSystem.members.find(m => 
                            m.registrationNumber === registrationNumber
                        );
                        if (member) {
                            console.log('✅ Membre trouvé via MembersSystem:', member.registrationNumber);
                            return member;
                        }
                    }
                    
                    // Si le membre n'est pas trouvé, afficher une erreur
                    console.error('❌ Membre non trouvé:', registrationNumber);
                    this.showNotification(`Membre ${registrationNumber} non trouvé`, 'error');
                }
            }
            
            // 2. Essayer depuis sessionStorage (navigation depuis la liste des membres)
            const sessionData = sessionStorage.getItem('currentMemberProfile');
            if (sessionData) {
                const member = JSON.parse(sessionData);
                console.log('✅ Membre trouvé dans sessionStorage:', member.registrationNumber);
                return member;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération données membre:', error);
            return null;
        }
    }

    /**
     * Initialise le profil avec les données du membre
     */
    async initializeProfileWithData(memberData) {
        try {
            // Stocker les données dans sessionStorage pour le système de profil
            sessionStorage.setItem('currentMemberProfile', JSON.stringify(memberData));
            
            // Initialiser le système de profil
            if (typeof initializeProfileSystem === 'function') {
                window.profileSystem = initializeProfileSystem();
                console.log('✅ Système profil initialisé via appController');
            } else if (typeof ProfileSystem !== 'undefined') {
                // Fallback - créer une nouvelle instance
                window.profileSystem = new ProfileSystem();
                await window.profileSystem.init();
                console.log('✅ Système profil initialisé via fallback');
            } else {
                throw new Error('Aucun système profil disponible');
            }
            
        } catch (error) {
            console.error('❌ Erreur initialisation profil avec données:', error);
            throw error;
        }
    }

    /**
     * Affiche un fallback quand le profil ne peut pas être chargé
     */
    showProfileFallback() {
        const profileContent = document.getElementById('profileContent');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-user-slash fa-4x text-muted mb-4"></i>
                    <h3 class="text-muted mb-3">Profil non disponible</h3>
                    <p class="text-muted mb-4">
                        Impossible de charger le profil du membre. 
                        Veuillez sélectionner un membre depuis la liste.
                    </p>
                    <div class="d-flex gap-2 justify-content-center flex-wrap">
                        <button class="btn btn-primary" onclick="appController.loadPage('members')">
                            <i class="fas fa-users me-2"></i>Voir les membres
                        </button>
                        <button class="btn btn-outline-secondary" onclick="appController.loadPage('home')">
                            <i class="fas fa-home me-2"></i>Retour à l'accueil
                        </button>
                    </div>
                </div>
            `;
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

    /**
     * Méthode utilitaire pour naviguer vers un profil spécifique
     */
    navigateToProfile(registrationNumber) {
        console.log('🧭 Navigation vers profil:', registrationNumber);
        
        // Stocker les données si disponibles
        if (window.membersSystem && window.membersSystem.members) {
            const member = window.membersSystem.members.find(m => 
                m.registrationNumber === registrationNumber
            );
            if (member) {
                sessionStorage.setItem('currentMemberProfile', JSON.stringify(member));
            }
        }
        
        // Naviguer vers la page profil
        this.loadPage('profile');
        
        // Mettre à jour l'URL
        window.location.hash = `profile${registrationNumber}`;
    }

    // Méthode de débogage
    debugNavigation() {
        console.log('🐛 DEBUG NAVIGATION:');
        console.log('- Current URL:', window.location.href);
        console.log('- Current hash:', window.location.hash);
        console.log('- Current page:', this.currentPage);
        console.log('- AppController:', this);
        console.log('- MembersSystem:', window.membersSystem);
        console.log('- API Service:', window.apiService);
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

// Fonction globale pour la navigation vers les profils
window.openMemberProfile = function(registrationNumber) {
    if (window.appController) {
        window.appController.navigateToProfile(registrationNumber);
    } else {
        // Fallback direct
        window.location.href = `https://acm-attendance-system.netlify.app/#profile${registrationNumber}`;
    }
};

// Fonction globale pour le débogage
window.debugApp = function() {
    if (window.appController) {
        window.appController.debugNavigation();
    } else {
        console.log('❌ AppController non disponible');
    }
};