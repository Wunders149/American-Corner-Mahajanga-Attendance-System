// American Corner Mahajanga - Contrôleur Principal d'Application
class AppController {
    constructor() {
        this.currentPage = 'home';
        this.validPages = ['home', 'about', 'attendance', 'qr-generator', 'members', 'contact', 'profile'];
        this.isInitialized = false;
        this.modules = {};
        this.pageCache = new Map();
        
        // Nouveaux états et stores
        this.appState = {
            isOnline: navigator.onLine,
            isLoading: false,
            currentUser: null,
            permissions: [],
            dataVersion: 0,
            language: localStorage.getItem('preferred_language') || 'fr'
        };
        
        this.dataStore = {
            members: [],
            attendance: [],
            settings: {},
            
            getMemberByRegistration(regNumber) {
                return this.members.find(m => m.registrationNumber === regNumber);
            },
            
            updateMember(regNumber, updates) {
                const index = this.members.findIndex(m => m.registrationNumber === regNumber);
                if (index !== -1) {
                    this.members[index] = { ...this.members[index], ...updates };
                    this.persistData();
                }
            },
            
            persistData() {
                try {
                    localStorage.setItem('acm_data_store', JSON.stringify({
                        members: this.members,
                        attendance: this.attendance,
                        settings: this.settings,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    console.warn('Impossible de persister les données:', error);
                }
            },
            
            restoreData() {
                try {
                    const saved = localStorage.getItem('acm_data_store');
                    if (saved) {
                        const data = JSON.parse(saved);
                        this.members = data.members || [];
                        this.attendance = data.attendance || [];
                        this.settings = data.settings || {};
                        console.log('📀 Données restaurées:', this.members.length + ' membres');
                    }
                } catch (error) {
                    console.warn('Impossible de restaurer les données:', error);
                }
            }
        };
        
        // Système d'internationalisation
        this.i18n = {
            currentLang: this.appState.language,
            strings: {
                fr: {
                    welcome: 'Bienvenue',
                    error: 'Erreur',
                    loading: 'Chargement...',
                    success: 'Succès',
                    warning: 'Attention',
                    online: 'En ligne',
                    offline: 'Hors ligne',
                    demo_mode: 'Mode démo actif',
                    access_denied: 'Accès non autorisé',
                    data_updated: 'Données mises à jour',
                    connection_restored: 'Connexion rétablie',
                    connection_lost: 'Connexion perdue'
                },
                en: {
                    welcome: 'Welcome',
                    error: 'Error',
                    loading: 'Loading...',
                    success: 'Success',
                    warning: 'Warning',
                    online: 'Online',
                    offline: 'Offline',
                    demo_mode: 'Demo mode active',
                    access_denied: 'Access denied',
                    data_updated: 'Data updated',
                    connection_restored: 'Connection restored',
                    connection_lost: 'Connection lost'
                }
            },
            
            t(key) {
                return this.strings[this.currentLang]?.[key] || key;
            },
            
            setLanguage(lang) {
                if (this.strings[lang]) {
                    this.currentLang = lang;
                    localStorage.setItem('preferred_language', lang);
                    if (window.appController) {
                        window.appController.emitAppStateChange();
                    }
                }
            }
        };
        
        // Système de rôles
        this.userRoles = {
            admin: ['view_members', 'edit_members', 'generate_qr', 'view_attendance', 'export_data', 'manage_system'],
            manager: ['view_members', 'generate_qr', 'view_attendance', 'scan_qr'],
            viewer: ['view_members', 'view_attendance']
        };

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initialisation American Corner Mahajanga...');
            
            // Set as global reference immediately
            window.appController = this;
            
            // Restaurer les données sauvegardées
            this.dataStore.restoreData();
            
            // Setup enhanced error handling
            this.setupErrorHandling();
            
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
            this.showErrorPage('Erreur lors du démarrage de l\'application', error);
        }
    }

    async initializeApp() {
        try {
            console.log('🔄 Initialisation des services...');
            
            // Mettre à jour l'état de chargement
            this.setAppState({ isLoading: true });
            
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
            console.log('🔗 Hash initial:', hash);
            
            let initialPage;
            if (hash && hash.startsWith('profile')) {
                initialPage = hash;
            } else if (hash && this.validPages.includes(hash)) {
                initialPage = hash;
            } else {
                initialPage = 'home';
            }
            
            console.log('📄 Page initiale:', initialPage);
            await this.loadPage(initialPage);
            
            // Mettre à jour l'état de chargement
            this.setAppState({ isLoading: false });
            
        } catch (error) {
            console.error('❌ Erreur initialisation app:', error);
            this.setAppState({ isLoading: false });
            throw error;
        }
    }

    // Gestion améliorée des états
    setAppState(newState) {
        this.appState = { ...this.appState, ...newState };
        this.emitAppStateChange();
    }

    emitAppStateChange() {
        const event = new CustomEvent('appStateChanged', { 
            detail: this.appState 
        });
        window.dispatchEvent(event);
    }

    // Gestion des permissions
    hasPermission(permission) {
        if (!this.appState.currentUser) return false;
        const userRole = this.appState.currentUser.role || 'viewer';
        return this.userRoles[userRole]?.includes(permission) || false;
    }

    checkPermission(permission) {
        if (!this.hasPermission(permission)) {
            this.showNotification(this.i18n.t('access_denied'), 'error');
            return false;
        }
        return true;
    }

    // Méthode loadMembers améliorée
    async loadMembers() {
        try {
            if (typeof apiService !== 'undefined') {
                console.log('⏳ Chargement des données membres...');
                await apiService.fetchMembers();
                
                // Mettre à jour le store local
                if (apiService.members && apiService.members.length > 0) {
                    this.dataStore.members = apiService.members;
                    this.dataStore.persistData();
                }
                
                console.log(`📊 ${apiService.members.length} membres disponibles`);
            } else {
                console.warn('⚠️ Service API non disponible');
                // Utiliser les données du store local
                if (this.dataStore.members.length > 0) {
                    console.log(`📊 ${this.dataStore.members.length} membres restaurés du cache`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Avertissement chargement membres:', error);
            // Continuer avec les données du store local
        }
    }

    // Initialisation des modules avec lazy loading - CORRIGÉE
    async initializeModules() {
        console.log('🔧 Initialisation des modules...');
        
        const modulesToLoad = [
            { name: 'scanner', globalVar: 'qrScanner' },
            { name: 'qrGenerator', globalVar: 'qrGenerator' },
            { name: 'members', globalVar: 'membersSystem' },
            { name: 'profile', globalVar: 'ProfileSystem' }
        ];

        for (const module of modulesToLoad) {
            try {
                await this.loadModule(module.name, module.globalVar);
                
                // Initialiser le module s'il est disponible
                if (this.modules[module.name] && this.modules[module.name].isAvailable !== false) {
                    if (typeof this.modules[module.name].init === 'function') {
                        await this.modules[module.name].init();
                        console.log(`✅ Module ${module.name} initialisé`);
                    }
                } else {
                    console.log(`⚠️ Module ${module.name} non disponible, continuation sans...`);
                }
            } catch (error) {
                console.warn(`❌ Erreur initialisation module ${module.name}:`, error);
                // Continuer même si un module échoue
            }
        }
        
        console.log('🔧 Tous les modules traités');
    }

    // Méthode loadModule - CORRIGÉE
    async loadModule(moduleName, globalVar) {
        if (this.modules[moduleName]) return this.modules[moduleName];
        
        // Vérifier d'abord si le module est disponible globalement
        if (typeof window[globalVar] !== 'undefined') {
            this.modules[moduleName] = window[globalVar];
            console.log(`✅ Module ${moduleName} détecté globalement`);
            return this.modules[moduleName];
        }
        
        // Fallback: essayer de charger dynamiquement avec gestion d'erreur améliorée
        try {
            // Pour les modules qui sont déjà chargés via script dans le HTML
            switch(moduleName) {
                case 'profile':
                    if (typeof initializeProfileSystem !== 'undefined') {
                        this.modules[moduleName] = { init: initializeProfileSystem };
                        console.log(`✅ Module ${moduleName} chargé via fonction globale`);
                        return this.modules[moduleName];
                    }
                    break;
                case 'members':
                    if (typeof membersSystem !== 'undefined') {
                        this.modules[moduleName] = membersSystem;
                        console.log(`✅ Module ${moduleName} détecté`);
                        return this.modules[moduleName];
                    }
                    break;
                case 'scanner':
                    if (typeof qrScanner !== 'undefined') {
                        this.modules[moduleName] = qrScanner;
                        console.log(`✅ Module ${moduleName} détecté`);
                        return this.modules[moduleName];
                    }
                    break;
                case 'qrGenerator':
                    if (typeof qrGenerator !== 'undefined') {
                        this.modules[moduleName] = qrGenerator;
                        console.log(`✅ Module ${moduleName} détecté`);
                        return this.modules[moduleName];
                    }
                    break;
            }
            
            // Si le module n'est pas trouvé, créer un placeholder
            console.warn(`⚠️ Module ${moduleName} non trouvé, création d'un placeholder`);
            this.modules[moduleName] = {
                init: () => Promise.resolve(),
                isAvailable: false
            };
            
            return this.modules[moduleName];
            
        } catch (error) {
            console.warn(`⚠️ Erreur chargement module ${moduleName}:`, error);
            
            // Créer un module placeholder pour éviter les erreurs
            this.modules[moduleName] = {
                init: () => Promise.resolve(),
                isAvailable: false,
                error: error.message
            };
            
            return this.modules[moduleName];
        }
    }

    setupEventListeners() {
        // Navigation event delegation - enhanced to handle all dynamic content - CORRIGÉE
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            
            if (!link) return;

            // NE PAS INTERCEPTER les liens avec target="_blank" ou href externes
            if (link.target === '_blank' || link.hostname !== window.location.hostname) {
                console.log('🔗 Lien externe détecté, laisser le navigateur gérer:', link.href);
                return;
            }

            // Handle data-page navigation - ONLY for internal SPA navigation
            const pageId = link.getAttribute('data-page');
            const href = link.getAttribute('href');
            
            if (pageId && href && href.startsWith('#')) {
                e.preventDefault();
                this.loadPage(pageId);
                return;
            }
            
            // Handle hash links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const hashPage = href.substring(1);
                if (this.validPages.includes(hashPage)) {
                    this.loadPage(hashPage);
                }
                return;
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.loadPage(event.state.page);
            } else {
                // Handle hash-based navigation
                const hash = window.location.hash.substring(1);
                if (hash && this.validPages.includes(hash)) {
                    this.loadPage(hash);
                }
            }
        });

        // Enhanced error handling
        this.setupErrorHandling();

        // Online/offline detection
        window.addEventListener('online', () => {
            this.setAppState({ isOnline: true });
            this.showNotification(this.i18n.t('connection_restored'), 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.setAppState({ isOnline: false });
            this.showNotification(this.i18n.t('connection_lost') + ' - ' + this.i18n.t('offline'), 'warning');
        });

        // Gestion du changement d'hash pour la navigation SPA
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            console.log('🔗 Hash change détecté:', hash);
            
            if (hash) {
                const basePage = this.extractBasePageFromHash(hash);
                if (basePage && this.validPages.includes(basePage)) {
                    this.loadPage(hash);
                }
            }
        });

        // Écouter les changements d'état de l'application
        window.addEventListener('appStateChanged', (event) => {
            this.updateUIForAppState(event.detail);
        });
    }

    setupErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejetée non gérée:', event.reason);
            this.trackEvent('error', 'unhandled_promise_rejection', event.reason?.message);
        });
        
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.trackEvent('error', 'global_error', event.error?.message);
        });
    }

    // Nouvelle méthode pour extraire la page de base depuis l'hash
    extractBasePageFromHash(hash) {
        if (hash.startsWith('profile')) {
            return 'profile';
        }
        return this.validPages.includes(hash) ? hash : null;
    }

    // Main page loading function with cache
    async loadPage(pageId) {
        try {
            console.log('📄 loadPage appelé avec:', pageId);
            
            // Track navigation
            this.trackEvent('navigation', 'page_load', pageId);
            
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
            
            // Vérifier le cache d'abord
            if (this.pageCache.has(pageId)) {
                console.log('💾 Utilisation du cache pour:', pageId);
                const cachedHtml = this.pageCache.get(pageId);
                document.getElementById('main-content').innerHTML = cachedHtml;
                this.showPage(pageId);
                await this.initializePage(basePageId);
                return;
            }
            
            // Afficher un indicateur de chargement
            this.showLoadingIndicator();
            this.setAppState({ isLoading: true });

            const response = await fetch(`pages/${basePageId}.html`);
            if (!response.ok) {
                throw new Error('Page non trouvée');
            }

            const html = await response.text();
            document.getElementById('main-content').innerHTML = html;
            
            // Mettre en cache
            this.pageCache.set(pageId, html);
            
            this.showPage(pageId);
            await this.initializePage(basePageId);
            
            // Masquer l'indicateur de chargement
            this.hideLoadingIndicator();
            this.setAppState({ isLoading: false });
            
        } catch (error) {
            console.error(`Erreur chargement page ${pageId}:`, error);
            this.hideLoadingIndicator();
            this.setAppState({ isLoading: false });
            this.showErrorPage(`Impossible de charger la page ${pageId}`, error);
        }
    }

    showLoadingIndicator() {
        document.documentElement.style.cursor = 'wait';
        
        // Ajouter un overlay de chargement si nécessaire
        if (!document.getElementById('global-loading')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.8);
                z-index: 9998;
                display: flex;
                justify-content: center;
                align-items: center;
            `;
            loadingOverlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${this.i18n.t('loading')}</span>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }
    }

    hideLoadingIndicator() {
        document.documentElement.style.cursor = 'default';
        const loadingOverlay = document.getElementById('global-loading');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Show page and update navigation - CORRIGÉE
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
            
            // Activer le lien correspondant à la page de base
            const linkPage = link.getAttribute('data-page');
            if (linkPage === basePageId) {
                link.classList.add('active');
                // Mettre à jour le href pour correspondre à la navigation actuelle
                link.href = `#${pageId}`;
            } else if (linkPage) {
                // Réinitialiser les autres liens vers leurs pages de base
                link.href = `#${linkPage}`;
            }
        });
        
        // Show the selected page
        const targetPage = document.getElementById(basePageId);
        if (targetPage) {
            targetPage.classList.add('active');
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
        
        // Vérifier les permissions si nécessaire
        if (pageId === 'members' && !this.checkPermission('view_members')) {
            return;
        }
        
        if (pageId === 'qr-generator' && !this.checkPermission('generate_qr')) {
            return;
        }
        
        if (pageId === 'attendance' && !this.checkPermission('view_attendance')) {
            return;
        }
        
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
        
        // Update stats from data store
        this.updateHomePageStats();
    }

    updateHomePageStats() {
        const totalMembers = this.dataStore.members.length;
        const totalAttendance = this.dataStore.attendance.length;
        
        // Mettre à jour les compteurs si ils existent
        const memberCounter = document.querySelector('[data-target="' + totalMembers + '"]');
        if (memberCounter) {
            memberCounter.setAttribute('data-target', totalMembers);
        }
    }

    async initializeAboutPage() {
        console.log('📖 Page À Propos initialisée');
    }

    async initializeAttendancePage() {
        if (this.modules.scanner) {
            try {
                console.log('🔍 Vérification du scanner QR...');
                this.modules.scanner.updateScannerUI('stopped');
                this.setupScannerEventListeners();
                console.log('✅ Scanner QR prêt');
            } catch (error) {
                console.warn('Avertissement initialisation scanner:', error);
            }
        } else {
            console.warn('QR Scanner non disponible');
        }
    }

    // Méthode initializeProfilePage - CORRIGÉE
    async initializeProfilePage() {
        console.log('👤 Initialisation de la page profil...');
        
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Vérifier si le module profile est disponible
            if (this.modules.profile && this.modules.profile.isAvailable !== false) {
                console.log('✅ Utilisation du module profil');
                
                const memberData = this.getMemberDataForProfile();
                
                if (memberData) {
                    console.log('✅ Données membre disponibles pour le profil:', memberData.registrationNumber);
                    
                    // Stocker les données pour le module profile
                    sessionStorage.setItem('currentMemberProfile', JSON.stringify(memberData));
                    
                    // Initialiser le système de profil
                    if (typeof this.modules.profile.init === 'function') {
                        await this.modules.profile.init();
                    } else if (typeof initializeProfileSystem === 'function') {
                        await initializeProfileSystem();
                    }
                    
                } else {
                    console.warn('⚠️ Aucune donnée membre disponible pour le profil');
                    this.showProfileFallback();
                }
            } else {
                console.warn('⚠️ Module profil non disponible, utilisation du fallback');
                this.initializeProfileFallback();
            }
            
        } catch (error) {
            console.error('❌ Erreur initialisation page profil:', error);
            this.showProfileFallback();
        }
    }

    // Nouvelle méthode pour gérer le profil sans module
    initializeProfileFallback() {
        console.log('🔄 Initialisation fallback du profil...');
        
        const memberData = this.getMemberDataForProfile();
        
        if (!memberData) {
            this.showProfileFallback();
            return;
        }
        
        // Rendu basique du profil sans module dédié
        this.renderBasicProfile(memberData);
    }

    renderBasicProfile(memberData) {
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;
        
        const { firstName, lastName, registrationNumber, email, phoneNumber, occupation, studyOrWorkPlace, joinDate } = memberData;
        
        profileContent.innerHTML = `
            <div class="container py-4">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <button class="btn btn-light btn-sm" onclick="appController.loadPage('members')">
                            <i class="fas fa-arrow-left me-1"></i>Retour
                        </button>
                        <h5 class="mb-0 ms-2 d-inline">Profil Membre</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                                     style="width: 100px; height: 100px;">
                                    <span class="text-white fw-bold fs-4">
                                        ${firstName?.charAt(0)}${lastName?.charAt(0)}
                                    </span>
                                </div>
                                <h4 class="mt-3">${firstName} ${lastName}</h4>
                                <span class="badge bg-secondary">${registrationNumber}</span>
                            </div>
                            <div class="col-md-8">
                                <div class="row">
                                    <div class="col-6 mb-3">
                                        <strong>Occupation:</strong><br>
                                        <span class="text-muted">${occupation || 'Non spécifié'}</span>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <strong>Lieu:</strong><br>
                                        <span class="text-muted">${studyOrWorkPlace || 'Non spécifié'}</span>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <strong>Email:</strong><br>
                                        <span class="text-muted">${email || 'Non spécifié'}</span>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <strong>Téléphone:</strong><br>
                                        <span class="text-muted">${phoneNumber || 'Non spécifié'}</span>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <strong>Date d'adhésion:</strong><br>
                                        <span class="text-muted">${joinDate ? new Date(joinDate).toLocaleDateString('fr-FR') : 'Non spécifié'}</span>
                                    </div>
                                </div>
                                <div class="mt-4">
                                    <button class="btn btn-primary me-2" onclick="appController.showNotification('Fonction QR non disponible', 'warning')">
                                        <i class="fas fa-qrcode me-1"></i>Générer QR
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="appController.loadPage('members')">
                                        <i class="fas fa-users me-1"></i>Retour aux membres
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMemberDataForProfile() {
        try {
            // 1. Essayer depuis l'URL (navigation directe)
            const hash = window.location.hash;
            if (hash && hash.includes('profile')) {
                const registrationNumber = hash.replace('#profile', '');
                if (registrationNumber) {
                    console.log('🔗 Numéro d\'enregistrement détecté dans URL:', registrationNumber);
                    
                    // Chercher dans le store de données
                    const member = this.dataStore.getMemberByRegistration(registrationNumber);
                    if (member) {
                        console.log('✅ Membre trouvé dans dataStore:', member.registrationNumber);
                        return member;
                    }
                    
                    // Chercher dans API Service
                    if (window.apiService && window.apiService.members) {
                        const member = window.apiService.members.find(m => 
                            m.registrationNumber === registrationNumber
                        );
                        if (member) {
                            console.log('✅ Membre trouvé via API Service:', member.registrationNumber);
                            return member;
                        }
                    }
                    
                    console.error('❌ Membre non trouvé:', registrationNumber);
                    this.showNotification(`Membre ${registrationNumber} non trouvé`, 'error');
                }
            }
            
            // 2. Essayer depuis sessionStorage
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

    setupScannerEventListeners() {
        const startBtn = document.getElementById('startScannerBtn');
        if (startBtn && this.modules.scanner) {
            startBtn.addEventListener('click', () => {
                this.modules.scanner.startScanner();
            });
        }

        const stopBtn = document.getElementById('stopScannerBtn');
        if (stopBtn && this.modules.scanner) {
            stopBtn.addEventListener('click', () => {
                this.modules.scanner.stopScanner();
            });
        }

        const manualBtn = document.getElementById('manualEntryBtn');
        if (manualBtn && this.modules.scanner) {
            manualBtn.addEventListener('click', () => {
                this.modules.scanner.startManualEntry();
            });
        }

        const demoBtn = document.getElementById('demoScannerBtn');
        if (demoBtn && this.modules.scanner) {
            demoBtn.addEventListener('click', () => {
                this.testScannerWithDemoMember();
            });
        }

        console.log('🎯 Écouteurs d\'événements du scanner configurés');
    }

    async initializeQRGeneratorPage() {
        if (this.modules.qrGenerator) {
            try {
                if (typeof this.modules.qrGenerator.initialize === 'function') {
                    await this.modules.qrGenerator.initialize();
                } else if (typeof this.modules.qrGenerator.init === 'function') {
                    await this.modules.qrGenerator.init();
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
        if (this.modules.members) {
            try {
                console.log('👥 Initialisation de la page membres...');
                
                if (typeof this.modules.members.loadMembersPage === 'function') {
                    await this.modules.members.loadMembersPage();
                } else if (typeof this.modules.members.loadMembers === 'function') {
                    await this.modules.members.loadMembers();
                } else if (typeof this.modules.members.init === 'function') {
                    await this.modules.members.init();
                }
                
                console.log('✅ Page membres chargée avec succès');
                
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

    // Enhanced Error page display
    showErrorPage(message, error = null) {
        const errorId = Math.random().toString(36).substr(2, 9);
        console.error(`Erreur ${errorId}:`, error);
        
        document.getElementById('main-content').innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                        <h4 class="mb-0">${this.i18n.t('error')} ${errorId}</h4>
                    </div>
                    <p class="mb-3">${message}</p>
                    ${error ? `<details class="mb-3"><summary>Détails techniques</summary><code>${error.toString()}</code></details>` : ''}
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-primary" data-page="home">
                            <i class="fas fa-home me-2"></i>Accueil
                        </button>
                        <button class="btn btn-outline-secondary" onclick="location.reload()">
                            <i class="fas fa-redo me-2"></i>Recharger
                        </button>
                        ${!this.appState.isOnline ? `
                        <button class="btn btn-warning">
                            <i class="fas fa-wifi-slash me-2"></i>${this.i18n.t('offline')}
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Enhanced Notification system
    showNotification(message, type = 'info') {
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
        
        document.body.appendChild(notification);
        
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

    // Enhanced system status
    showSystemStatus() {
        const status = {
            api: typeof apiService !== 'undefined',
            members: this.dataStore.members.length,
            demoMode: apiService ? apiService.useDemoData : true,
            modules: Object.keys(this.modules).length,
            online: this.appState.isOnline,
            cache: this.pageCache.size,
            language: this.appState.language
        };
        
        console.log('📊 Statut système:', status);
        
        if (status.demoMode) {
            setTimeout(() => {
                this.showNotification(this.i18n.t('demo_mode'), 'info');
            }, 2000);
        }
        
        if (!status.online) {
            this.showNotification(this.i18n.t('connection_lost') + ' - ' + this.i18n.t('offline'), 'warning');
        }
    }

    // Méthode pour rafraîchir toutes les données
    async refreshAllData() {
        console.log('🔄 Rafraîchissement de toutes les données...');
        
        this.setAppState({ isLoading: true });
        
        try {
            if (window.apiService && typeof apiService.refreshData === 'function') {
                await apiService.refreshData();
            }
            
            if (this.modules.members && typeof this.modules.members.refreshData === 'function') {
                await this.modules.members.refreshData();
            }
            
            // Mettre à jour le store local
            if (apiService && apiService.members) {
                this.dataStore.members = apiService.members;
                this.dataStore.persistData();
            }
            
            this.showNotification(this.i18n.t('data_updated'), 'success');
            
        } catch (error) {
            console.error('❌ Erreur rafraîchissement données:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        } finally {
            this.setAppState({ isLoading: false });
        }
    }

    // Navigation vers profil
    navigateToProfile(registrationNumber) {
        console.log('🧭 Navigation vers profil:', registrationNumber);
        
        // Stocker les données si disponibles
        const member = this.dataStore.getMemberByRegistration(registrationNumber);
        if (member) {
            sessionStorage.setItem('currentMemberProfile', JSON.stringify(member));
        }
        
        this.loadPage('profile');
        window.location.hash = `profile${registrationNumber}`;
    }

    // Analytics et tracking
    trackEvent(category, action, label = null) {
        const eventData = {
            category,
            action,
            label,
            timestamp: new Date().toISOString(),
            page: this.currentPage,
            user: this.appState.currentUser?.registrationNumber || 'anonymous',
            online: this.appState.isOnline
        };
        
        console.log('📈 Event:', eventData);
        
        // Envoyer à Google Analytics si disponible
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
        
        // Stocker localement pour backup
        this.storeEventLocally(eventData);
    }

    storeEventLocally(eventData) {
        try {
            const events = JSON.parse(localStorage.getItem('acm_events') || '[]');
            events.push(eventData);
            
            // Garder seulement les 100 derniers événements
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            localStorage.setItem('acm_events', JSON.stringify(events));
        } catch (error) {
            console.warn('Impossible de stocker l\'événement:', error);
        }
    }

    // Sync des données hors ligne
    async syncOfflineData() {
        if (!this.appState.isOnline) return;
        
        console.log('🔄 Synchronisation des données hors ligne...');
        
        // Implémenter la logique de sync ici
        // Par exemple, envoyer les événements stockés localement
    }

    // Mise à jour de l'UI basée sur l'état
    updateUIForAppState(state) {
        // Mettre à jour l'indicateur de connexion
        const onlineIndicator = document.getElementById('online-indicator');
        if (onlineIndicator) {
            onlineIndicator.className = `badge bg-${state.isOnline ? 'success' : 'warning'}`;
            onlineIndicator.innerHTML = `<i class="fas fa-wifi${state.isOnline ? '' : '-slash'} me-1"></i>${state.isOnline ? this.i18n.t('online') : this.i18n.t('offline')}`;
        }
        
        // Masquer/afficher le loading global
        if (state.isLoading) {
            this.showLoadingIndicator();
        } else {
            this.hideLoadingIndicator();
        }
    }

    // Méthode de débogage améliorée
    debugNavigation() {
        console.log('🐛 DEBUG NAVIGATION:');
        console.log('- Current URL:', window.location.href);
        console.log('- Current hash:', window.location.hash);
        console.log('- Current page:', this.currentPage);
        console.log('- App State:', this.appState);
        console.log('- Data Store:', {
            members: this.dataStore.members.length,
            attendance: this.dataStore.attendance.length
        });
        console.log('- Page Cache:', this.pageCache.size);
        console.log('- Modules:', Object.keys(this.modules));
        console.log('- Online:', this.appState.isOnline);
        console.log('- Language:', this.appState.language);
    }

    // Méthode de débogage pour vérifier les modules
    debugModules() {
        console.log('🐛 DEBUG MODULES:');
        console.log('- Modules chargés:', Object.keys(this.modules));
        
        // Vérifier la disponibilité globale
        console.log('- Variables globales disponibles:');
        console.log('  * initializeProfileSystem:', typeof initializeProfileSystem);
        console.log('  * membersSystem:', typeof membersSystem);
        console.log('  * qrScanner:', typeof qrScanner);
        console.log('  * qrGenerator:', typeof qrGenerator);
        console.log('  * ProfileSystem:', typeof ProfileSystem);
        
        // Vérifier l'état de chaque module
        Object.keys(this.modules).forEach(moduleName => {
            const module = this.modules[moduleName];
            console.log(`  - ${moduleName}:`, {
                available: module.isAvailable !== false,
                hasInit: typeof module.init === 'function',
                error: module.error || 'none'
            });
        });
    }

    // Nettoyage
    destroy() {
        this.pageCache.clear();
        sessionStorage.removeItem('currentMemberProfile');
        console.log('🧹 AppController nettoyé');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});

// Quick start function for immediate feedback
(function() {
    const loadingElement = document.querySelector('.spinner-border');
    if (loadingElement) {
        setTimeout(() => {
            loadingElement.style.display = 'none';
            if (loadingElement.nextElementSibling) {
                loadingElement.nextElementSibling.style.display = 'none';
            }
        }, 500);
    }
})();

// Fonctions globales
window.openMemberProfile = function(registrationNumber) {
    if (window.appController) {
        window.appController.navigateToProfile(registrationNumber);
    } else {
        window.location.href = `https://acm-attendance-system.netlify.app/#profile${registrationNumber}`;
    }
};

window.debugApp = function() {
    if (window.appController) {
        window.appController.debugNavigation();
    } else {
        console.log('❌ AppController non disponible');
    }
};

window.debugModules = function() {
    if (window.appController) {
        window.appController.debugModules();
    } else {
        console.log('❌ AppController non disponible');
    }
};

window.refreshAppData = function() {
    if (window.appController) {
        window.appController.refreshAllData();
    }
};

window.changeLanguage = function(lang) {
    if (window.appController) {
        window.appController.i18n.setLanguage(lang);
    }
};