// QR Generator System - Version Améliorée
class QRGenerator {
    constructor() {
        this.currentQRCode = null;
        this.recentQRCodes = this.loadRecentQRCodes();
        this.quickActionsSetup = false;
        this.isGenerating = false;
        this.prefillData = null;
        
        // Nouveaux gestionnaires
        this.stateManager = new QRStateManager();
        this.errorHandler = new ErrorHandler();
        this.qrCache = new QRCache();
        this.autoFillDebounce = this.debounce((value) => {
            this.autoFillFromExistingMember(value);
        }, 500);
    }

    async initializeQRGenerator() {
        console.log('🔧 Initialisation du générateur QR...');
        
        try {
            // Charger les dépendances d'abord
            await this.loadDependencies();
            
            // Vérifier les éléments requis
            this.verifyRequiredElements();
            
            this.setupEventListeners();
            await this.loadSampleMembers();
            this.renderRecentQRCodes();
            this.setupQuickActions();
            
            // Vérifier les données de pré-remplissage
            this.checkForPrefillData();
            
            console.log('✅ Générateur QR initialisé avec succès');
            this.stateManager.setState({ generationStatus: 'ready' });
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            const handledError = this.errorHandler.handle(error, 'INITIALIZATION');
            this.showAlert(handledError.userMessage, 'error');
            return false;
        }
    }

    /**
     * Charge et vérifie toutes les dépendances nécessaires
     */
    async loadDependencies() {
        console.log('📦 Chargement des dépendances...');
        
        const dependencies = {
            qrcode: () => typeof qrcode !== 'undefined',
            bootstrap: () => typeof bootstrap !== 'undefined',
            apiService: () => window.apiService
        };
        
        const missingDeps = [];
        
        for (const [dep, check] of Object.entries(dependencies)) {
            if (!check()) {
                console.warn(`⚠️ Dépendance manquante: ${dep}`);
                missingDeps.push(dep);
                await this.loadDependency(dep);
            } else {
                console.log(`✅ Dépendance chargée: ${dep}`);
            }
        }
        
        if (missingDeps.length > 0) {
            console.log(`🔄 Dépendances chargées dynamiquement: ${missingDeps.join(', ')}`);
        }
    }

    /**
     * Charge une dépendance dynamiquement
     */
    async loadDependency(dependency) {
        return new Promise((resolve, reject) => {
            switch(dependency) {
                case 'qrcode':
                    // La librairie QR code devrait déjà être chargée via le HTML
                    console.warn('Bibliothèque QR code non trouvée. Vérifiez le chargement dans le HTML.');
                    resolve();
                    break;
                default:
                    resolve();
            }
        });
    }

    /**
     * Vérifie que tous les éléments requis existent
     */
    verifyRequiredElements() {
        console.log('🔍 Vérification des éléments requis...');
        
        const requiredElements = [
            'qrcode',
            'qrCodeSection',
            'downloadQRBtn', 
            'printQRBtn',
            'displayRegNumber',
            'displayName',
            'displayOccupation',
            'jsonPreview'
        ];
        
        let allElementsExist = true;
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`❌ Élément manquant: #${elementId}`);
                allElementsExist = false;
                
                // Créer les éléments critiques immédiatement
                if (elementId === 'qrcode' || elementId === 'qrCodeSection') {
                    console.log(`🛠️ Création immédiate de: #${elementId}`);
                    this.createQRCodeContainer();
                }
            } else {
                console.log(`✅ Élément présent: #${elementId}`);
            }
        });
        
        if (!allElementsExist) {
            console.log('🛠️ Certains éléments sont manquants, création dynamique activée');
        }
        
        return allElementsExist;
    }

    /**
     * Vérifie et applique les données de pré-remplissage au chargement de la page
     */
    checkForPrefillData() {
        try {
            // Vérifier sessionStorage d'abord (pour la liaison depuis les membres)
            const prefillData = sessionStorage.getItem('qrPrefillData');
            if (prefillData) {
                const member = JSON.parse(prefillData);
                console.log('📦 Données de pré-remplissage trouvées:', member.registrationNumber);
                
                // Appliquer après un court délai pour s'assurer que le DOM est prêt
                setTimeout(() => {
                    this.prefillForm(member);
                }, 500);
                
                // Nettoyer les données après utilisation
                sessionStorage.removeItem('qrPrefillData');
                return;
            }

            // Vérifier aussi l'URL pour les paramètres
            this.checkURLParameters();
            
        } catch (error) {
            console.error('❌ Erreur traitement données pré-remplissage:', error);
            this.errorHandler.handle(error, 'PREFILL_DATA');
            sessionStorage.removeItem('qrPrefillData');
        }
    }

    /**
     * Vérifie les paramètres d'URL pour le pré-remplissage
     */
    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const regNumber = urlParams.get('registration');
        
        if (regNumber && window.apiService) {
            console.log('🔗 Paramètre URL détecté:', regNumber);
            const member = window.apiService.getMemberByRegistrationNumber(regNumber);
            if (member) {
                setTimeout(() => {
                    this.prefillForm(member);
                }, 1000);
            }
        }
    }

    setupEventListeners() {
        console.log('🔧 Configuration des événements...');
        
        // Événements pour les boutons principaux
        this.attachEvent('generateQRBtn', 'click', (e) => {
            e.preventDefault();
            console.log('🎯 Clic sur générer QR code');
            this.generateQRCode();
        });

        this.attachEvent('clearQRBtn', 'click', (e) => {
            e.preventDefault();
            this.clearQRForm();
        });

        this.attachEvent('downloadQRBtn', 'click', (e) => {
            e.preventDefault();
            this.downloadQRCode();
        });

        this.attachEvent('printQRBtn', 'click', (e) => {
            e.preventDefault();
            this.printQRCode();
        });

        // Auto-remplissage depuis les champs avec debounce
        this.attachEvent('registrationNumber', 'input', (e) => {
            this.autoFillDebounce(e.target.value);
        });

        // Entrée pour générer avec la touche Enter
        this.attachEvent('qrGeneratorForm', 'submit', (e) => {
            e.preventDefault();
            this.generateQRCode();
        });

        // Événements pour les actions rapides
        this.setupQuickActionListeners();
    }

    setupQuickActionListeners() {
        // Écouter les événements de génération rapide depuis d'autres pages
        window.addEventListener('quickQRGenerate', (event) => {
            if (event.detail && event.detail.registrationNumber) {
                this.quickGenerateQR(event.detail.registrationNumber);
            }
        });

        // Écouter les événements de pré-remplissage
        window.addEventListener('prefillQRForm', (event) => {
            if (event.detail) {
                this.prefillForm(event.detail);
            }
        });
    }

    attachEvent(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✅ Événement attaché: ${event} sur #${elementId}`);
        } else {
            console.warn(`⚠️ Élément #${elementId} non trouvé pour l'événement ${event}`);
            
            // Si c'est un élément critique, le créer
            if (elementId === 'downloadQRBtn' || elementId === 'printQRBtn') {
                console.log(`🛠️ Élément critique manquant, création différée: #${elementId}`);
            }
        }
    }

    setupQuickActions() {
        if (this.quickActionsSetup) return;
        
        console.log('⚡ Configuration des actions rapides...');
        
        // Exposer les méthodes globalement pour la liaison
        window.qrGenerator = this;
        
        this.quickActionsSetup = true;
    }

    // ==================== MÉTHODES DE LIAISON AVEC MEMBRES ====================

    /**
     * Pré-remplit le formulaire avec les données d'un membre
     * @param {Object} member - Données du membre
     */
    prefillForm(member) {
        console.log('📝 Pré-remplissage formulaire avec:', member.registrationNumber);
        
        if (!member) {
            console.error('❌ Aucun membre fourni');
            this.showAlert('Aucune donnée de membre fournie', 'warning');
            return;
        }

        try {
            this.fillFormFields({
                registrationNumber: member.registrationNumber,
                firstName: member.firstName,
                lastName: member.lastName,
                occupation: member.occupation || 'student',
                phoneNumber: member.phoneNumber || '',
                studyWorkPlace: member.studyOrWorkPlace || ''
            });

            // Stocker les données pour référence
            this.prefillData = member;

            // Afficher l'indicateur de pré-remplissage
            this.showPrefillIndicator();

            // Scroll vers le formulaire
            const formElement = document.getElementById('qrGeneratorForm');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            this.showAlert(`📝 Formulaire rempli pour ${member.firstName} ${member.lastName}`, 'info');
            
            // Optionnel: Générer automatiquement après pré-remplissage
            setTimeout(() => {
                if (this.shouldAutoGenerate()) {
                    this.generateQRCode();
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erreur pré-remplissage:', error);
            const handledError = this.errorHandler.handle(error, 'PREFILL_FORM');
            this.showAlert(handledError.userMessage, 'error');
        }
    }

    /**
     * Affiche l'indicateur de pré-remplissage
     */
    showPrefillIndicator() {
        let indicator = document.getElementById('prefillIndicator');
        if (!indicator) {
            // Créer l'indicateur s'il n'existe pas
            indicator = document.createElement('div');
            indicator.id = 'prefillIndicator';
            indicator.className = 'alert alert-warning mb-3';
            indicator.innerHTML = `
                <i class="fas fa-sync me-2"></i>
                <strong>Formulaire pré-rempli:</strong> Les informations proviennent de la base des membres.
            `;
            
            const form = document.getElementById('qrGeneratorForm');
            if (form) {
                form.parentNode.insertBefore(indicator, form);
            }
        }
        indicator.style.display = 'block';
    }

    /**
     * Détermine si la génération automatique doit être déclenchée
     */
    shouldAutoGenerate() {
        // Générer automatiquement si c'est une action rapide
        return this.prefillData && this.prefillData.quickGenerate === true;
    }

    /**
     * Remplit les champs du formulaire avec les données fournies
     * @param {Object} fields - Champs à remplir
     */
    fillFormFields(fields) {
        Object.keys(fields).forEach(field => {
            const element = document.getElementById(field);
            if (element && fields[field] !== undefined && fields[field] !== null) {
                element.value = fields[field];
                
                // Déclencher les événements de changement si nécessaire
                if (field === 'registrationNumber') {
                    // Utiliser le debounce pour l'auto-remplissage
                    this.autoFillDebounce(fields[field]);
                }
            }
        });
    }

    autoFillFromExistingMember(registrationNumber) {
        if (!registrationNumber || registrationNumber.length < 3) return;
        
        try {
            // Vérifier d'abord le cache
            const cachedMember = this.qrCache.get(`member_${registrationNumber}`);
            if (cachedMember && !this.prefillData) {
                this.fillFormFields({
                    firstName: cachedMember.firstName,
                    lastName: cachedMember.lastName,
                    occupation: cachedMember.occupation || 'student',
                    phoneNumber: cachedMember.phoneNumber || '',
                    studyWorkPlace: cachedMember.studyOrWorkPlace || ''
                });
                return;
            }

            // Utiliser le service API pour trouver le membre
            if (window.apiService && typeof window.apiService.getMemberByRegistrationNumber === 'function') {
                const member = window.apiService.getMemberByRegistrationNumber(registrationNumber.trim());
                if (member && !this.prefillData) {
                    // Mettre en cache le membre
                    this.qrCache.set(`member_${registrationNumber}`, member);
                    
                    // Auto-remplir seulement si pas déjà pré-rempli
                    this.fillFormFields({
                        firstName: member.firstName,
                        lastName: member.lastName,
                        occupation: member.occupation || 'student',
                        phoneNumber: member.phoneNumber || '',
                        studyWorkPlace: member.studyOrWorkPlace || ''
                    });
                    
                    this.showAlert(`Membre ${member.firstName} ${member.lastName} trouvé!`, 'success');
                }
            }
        } catch (error) {
            console.warn('Erreur lors de l\'auto-remplissage:', error);
            this.errorHandler.handle(error, 'AUTO_FILL');
        }
    }

    // 🎯 GÉNÉRATION RAPIDE
    quickGenerateQR(registrationNumber) {
        if (this.isGenerating) {
            this.showAlert('Génération en cours...', 'warning');
            return;
        }

        console.log('⚡ Génération QR rapide pour:', registrationNumber);
        
        const member = this.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            const memberData = {
                registrationNumber: member.registrationNumber,
                firstName: member.firstName,
                lastName: member.lastName,
                occupation: member.occupation,
                phoneNumber: member.phoneNumber || undefined,
                studyOrWorkPlace: member.studyOrWorkPlace || undefined,
                timestamp: new Date().toISOString(),
                quickGenerate: true
            };
            
            this.generateQRCodeFromData(memberData);
        } else {
            this.showAlert('❌ Membre non trouvé', 'error');
        }
    }

    /**
     * Obtient un membre par son numéro d'enregistrement
     */
    getMemberByRegistrationNumber(registrationNumber) {
        // Vérifier d'abord le cache
        const cachedMember = this.qrCache.get(`member_${registrationNumber}`);
        if (cachedMember) {
            return cachedMember;
        }

        if (window.apiService && typeof window.apiService.getMemberByRegistrationNumber === 'function') {
            const member = window.apiService.getMemberByRegistrationNumber(registrationNumber);
            if (member) {
                this.qrCache.set(`member_${registrationNumber}`, member);
            }
            return member;
        }
        
        // Fallback: chercher dans les membres chargés
        if (window.membersSystem && window.membersSystem.members) {
            const member = window.membersSystem.members.find(m => 
                m.registrationNumber === registrationNumber
            );
            if (member) {
                this.qrCache.set(`member_${registrationNumber}`, member);
            }
            return member;
        }
        
        return null;
    }

    // 🎯 GÉNÉRATION AVEC PERSONNALISATION
    generateMemberQR(registrationNumber) {
        console.log('🎨 Génération QR personnalisé pour:', registrationNumber);
        
        const member = this.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            this.prefillForm(member);
        } else {
            this.showAlert('Membre non trouvé', 'error');
        }
    }

    // 🎯 GÉNÉRATION MANUELLE DEPUIS LE FORMULAIRE
    generateQRCode() {
        if (this.isGenerating) {
            this.showAlert('Génération en cours...', 'warning');
            return;
        }

        console.log('🎯 Début de la génération manuelle...');
        
        const formData = this.getFormData();
        console.log('📝 Données du formulaire:', formData);

        const validation = this.validateFormData(formData);
        if (!validation.isValid) {
            validation.errors.forEach(error => this.showAlert(error, 'warning'));
            return;
        }

        const memberData = this.prepareMemberData(formData);
        console.log('📦 Données à encoder:', memberData);
        
        this.generateQRCodeFromData(memberData);
    }

    getFormData() {
        return {
            registrationNumber: document.getElementById('registrationNumber')?.value.trim(),
            firstName: document.getElementById('firstName')?.value.trim(),
            lastName: document.getElementById('lastName')?.value.trim(),
            occupation: document.getElementById('occupation')?.value,
            phoneNumber: document.getElementById('phoneNumber')?.value.trim(),
            studyWorkPlace: document.getElementById('studyWorkPlace')?.value.trim()
        };
    }

    validateFormData(data) {
        const validationRules = {
            registrationNumber: {
                required: true,
                pattern: /^(ACM)?\d+$/i,
                minLength: 3,
                maxLength: 20,
                message: 'Format de numéro d\'inscription invalide'
            },
            firstName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
                message: 'Le prénom doit contenir entre 2 et 50 caractères alphabétiques'
            },
            lastName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
                message: 'Le nom doit contenir entre 2 et 50 caractères alphabétiques'
            },
            occupation: {
                required: true,
                allowed: ['student', 'employee', 'entrepreneur', 'unemployed', 'other'],
                message: 'Veuillez sélectionner une occupation valide'
            }
        };

        const errors = [];

        for (const [field, rules] of Object.entries(validationRules)) {
            const value = data[field];
            
            if (rules.required && (!value || value.trim() === '')) {
                errors.push(`Le champ ${field} est obligatoire`);
                continue;
            }
            
            if (value) {
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(rules.message);
                }
                
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(rules.message);
                }
                
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(rules.message);
                }
                
                if (rules.allowed && !rules.allowed.includes(value)) {
                    errors.push(rules.message);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    prepareMemberData(formData) {
        const memberData = {
            registrationNumber: this.normalizeRegistrationNumber(formData.registrationNumber),
            firstName: formData.firstName,
            lastName: formData.lastName,
            occupation: formData.occupation,
            phoneNumber: formData.phoneNumber || undefined,
            studyOrWorkPlace: formData.studyWorkPlace || undefined,
            timestamp: new Date().toISOString(),
            generatedBy: 'ACM System',
            source: this.prefillData ? 'prefilled' : 'manual'
        };

        // Nettoyer les données
        Object.keys(memberData).forEach(key => {
            if (memberData[key] === undefined || memberData[key] === '') {
                delete memberData[key];
            }
        });

        return memberData;
    }

    normalizeRegistrationNumber(regNumber) {
        if (!regNumber) return regNumber;
        
        // Standardiser le format: ACM + numéro
        let normalized = regNumber.toUpperCase().trim();
        
        if (normalized.startsWith('M') && normalized.length > 1) {
            const numberPart = normalized.substring(1);
            if (/^\d+$/.test(numberPart)) {
                normalized = 'ACM' + numberPart;
            }
        } else if (/^\d+$/.test(normalized)) {
            normalized = 'ACM' + normalized;
        }
        
        return normalized;
    }

    // 🎯 MÉTHODE PRINCIPALE DE GÉNÉRATION - CORRIGÉE
    async generateQRCodeFromData(memberData) {
        if (this.isGenerating) return;
        
        console.log('🔧 Génération du QR code depuis les données...');
        this.isGenerating = true;
        this.stateManager.setState({ generationStatus: 'generating' });
        
        const jsonString = JSON.stringify(memberData, null, 2);
        console.log('📄 JSON à encoder:', jsonString);
        
        try {
            // Vérifier d'abord le cache
            const cacheKey = `qr_${memberData.registrationNumber}_${JSON.stringify(memberData).hashCode()}`;
            const cachedQR = this.qrCache.get(cacheKey);
            
            if (cachedQR) {
                console.log('📦 Utilisation du QR code en cache');
                this.displayCachedQR(cachedQR, memberData, jsonString);
                return;
            }

            // VÉRIFICATION ROBUSTE DU CONTENEUR
            let qrcodeContainer = document.getElementById('qrcode');
            if (!qrcodeContainer) {
                console.warn('❌ Conteneur QR code non trouvé, création dynamique...');
                this.createQRCodeContainer();
                
                // Réessayer après création
                await new Promise(resolve => setTimeout(resolve, 100));
                qrcodeContainer = document.getElementById('qrcode');
            }
            
            // Vérifier à nouveau après tentative de création
            if (!qrcodeContainer) {
                throw new Error('Impossible de créer ou trouver le conteneur QR code');
            }
            
            console.log('✅ Conteneur QR code trouvé/créé');
            
            // Afficher le loading
            qrcodeContainer.innerHTML = this.getLoadingHTML();
            
            // Utiliser une petite pause pour permettre l'affichage du loading
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log('🎨 Création du QR code...');
            
            // Vérifier à nouveau la bibliothèque
            if (typeof qrcode === 'undefined') {
                throw { code: 'LIBRARY_NOT_LOADED', message: 'Bibliothèque QR code non disponible' };
            }

            // Vider le conteneur
            qrcodeContainer.innerHTML = '';
            
            // Créer le QR code
            const qr = qrcode(0, 'M');
            qr.addData(jsonString);
            qr.make();
            
            console.log('✅ QR code généré avec succès');
            
            // Créer l'image
            const qrImage = qr.createImgTag(6, 0, `QR Code ${memberData.registrationNumber}`);
            qrcodeContainer.innerHTML = qrImage;
            
            // Mettre en cache le QR code généré
            const qrElement = qrcodeContainer.querySelector('img');
            if (qrElement) {
                this.qrCache.set(cacheKey, {
                    src: qrElement.src,
                    data: memberData
                });
            }
            
            // Mettre à jour l'affichage
            this.updateQRDisplay(memberData, jsonString);
            
            // Sauvegarder dans les récents
            this.saveToRecentQRCodes(memberData);
            
            // Réinitialiser les données de pré-remplissage
            this.prefillData = null;
            
            // Masquer l'indicateur de pré-remplissage
            this.hidePrefillIndicator();
            
            this.stateManager.setState({ 
                generationStatus: 'success',
                currentQR: memberData
            });
            
            console.log('🎉 QR code affiché avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération du QR code:', error);
            const handledError = this.errorHandler.handle(error, 'QR_GENERATION');
            this.handleGenerationError(handledError);
            this.stateManager.setState({ generationStatus: 'error' });
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Affiche un QR code depuis le cache
     */
    displayCachedQR(cachedQR, memberData, jsonString) {
        const qrcodeContainer = document.getElementById('qrcode');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = `<img src="${cachedQR.src}" alt="QR Code ${memberData.registrationNumber}">`;
            this.updateQRDisplay(memberData, jsonString);
            this.showAlert('QR code chargé depuis le cache!', 'success');
        }
    }

    /**
     * Masque l'indicateur de pré-remplissage
     */
    hidePrefillIndicator() {
        const indicator = document.getElementById('prefillIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Crée dynamiquement le conteneur QR code si il n'existe pas
     */
    createQRCodeContainer() {
        console.log('🛠️ Création dynamique du conteneur QR code...');
        
        // Vérifier d'abord si la section QR existe
        let qrCodeSection = document.getElementById('qrCodeSection');
        
        if (!qrCodeSection) {
            // Créer toute la section si elle n'existe pas
            qrCodeSection = this.createFullQRCodeSection();
        } else {
            // La section existe, vérifier le conteneur qrcode
            let qrcodeContainer = document.getElementById('qrcode');
            if (!qrcodeContainer) {
                // Créer juste le conteneur dans la section existante
                const qrDisplayArea = qrCodeSection.querySelector('.qr-code-display');
                if (qrDisplayArea) {
                    qrcodeContainer = document.createElement('div');
                    qrcodeContainer.id = 'qrcode';
                    qrDisplayArea.prepend(qrcodeContainer);
                    console.log('✅ Conteneur QR code créé dans section existante');
                }
            }
        }
    }

    /**
     * Crée toute la section QR code complète
     */
    createFullQRCodeSection() {
        console.log('🏗️ Création de toute la section QR code...');
        
        const sectionHTML = `
            <div class="card mb-5" id="qrCodeSection">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0">
                        <i class="fas fa-check-circle me-2"></i>
                        QR Code Généré avec Succès
                    </h4>
                </div>
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6 text-center">
                            <div class="qr-code-display">
                                <div id="qrcode"></div>
                                <div class="mt-3 action-buttons">
                                    <button class="btn btn-success me-2 mb-2" id="downloadQRBtn">
                                        <i class="fas fa-download me-2"></i>Télécharger
                                    </button>
                                    <button class="btn btn-outline-primary mb-2" id="printQRBtn">
                                        <i class="fas fa-print me-2"></i>Imprimer
                                    </button>
                                    <button class="btn btn-outline-info mb-2" id="newQRBtn">
                                        <i class="fas fa-plus me-2"></i>Nouveau QR
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="member-info">
                                <h5 class="border-bottom pb-2 mb-3">Informations Encodées</h5>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <strong>Numéro:</strong>
                                                <span id="displayRegNumber" class="member-id-display text-primary">-</span>
                                            </div>
                                            <div class="info-item">
                                                <strong>Nom Complet:</strong>
                                                <span id="displayName">-</span>
                                            </div>
                                            <div class="info-item">
                                                <strong>Occupation:</strong>
                                                <span id="displayOccupation">-</span>
                                            </div>
                                            <div class="info-item">
                                                <strong>Téléphone:</strong>
                                                <span id="displayPhone" class="text-muted">Non fourni</span>
                                            </div>
                                            <div class="info-item">
                                                <strong>Lieu:</strong>
                                                <span id="displayStudyWork" class="text-muted">Non fourni</span>
                                            </div>
                                            <div class="info-item">
                                                <strong>Généré le:</strong>
                                                <span id="displayTimestamp" class="text-muted">-</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h5 class="border-bottom pb-2 mb-3">Contenu du QR Code (Format API)</h5>
                        <div class="card">
                            <div class="card-header bg-dark text-white py-2">
                                <small><i class="fas fa-code me-2"></i>Structure JSON</small>
                            </div>
                            <div class="card-body p-0">
                                <pre class="bg-light p-3 mb-0"><code id="jsonPreview" class="language-json">Les données JSON apparaîtront ici...</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Trouver où insérer la section (après le formulaire)
        const qrGeneratorForm = document.getElementById('qrGeneratorForm');
        const container = document.querySelector('.container') || document.body;
        
        if (qrGeneratorForm) {
            qrGeneratorForm.closest('.card').insertAdjacentHTML('afterend', sectionHTML);
        } else {
            container.insertAdjacentHTML('beforeend', sectionHTML);
        }
        
        // Re-attacher les événements des boutons
        this.attachDynamicEventListeners();
        
        console.log('✅ Section QR code créée dynamiquement');
        return document.getElementById('qrCodeSection');
    }

    /**
     * Attache les événements pour les éléments créés dynamiquement
     */
    attachDynamicEventListeners() {
        this.attachEvent('downloadQRBtn', 'click', (e) => {
            e.preventDefault();
            this.downloadQRCode();
        });

        this.attachEvent('printQRBtn', 'click', (e) => {
            e.preventDefault();
            this.printQRCode();
        });

        this.attachEvent('newQRBtn', 'click', (e) => {
            e.preventDefault();
            this.clearQRForm();
        });
    }

    getLoadingHTML() {
        return `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                <p class="text-muted">Génération du QR code en cours...</p>
                <div class="progress mt-2" style="height: 4px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                </div>
            </div>
        `;
    }

    handleGenerationError(error) {
        const qrcodeContainer = document.getElementById('qrcode');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Erreur de génération</strong><br>
                    <small>${error.userMessage || error.message}</small>
                </div>
            `;
        }
        this.showAlert(error.userMessage || 'Erreur lors de la génération du QR code', 'error');
    }

    updateQRDisplay(memberData, jsonString) {
        console.log('🔄 Mise à jour de l affichage...');
        
        // Mettre à jour les informations
        const elements = {
            displayRegNumber: document.getElementById('displayRegNumber'),
            displayName: document.getElementById('displayName'),
            displayOccupation: document.getElementById('displayOccupation'),
            displayPhone: document.getElementById('displayPhone'),
            displayStudyWork: document.getElementById('displayStudyWork'),
            displayTimestamp: document.getElementById('displayTimestamp'),
            jsonPreview: document.getElementById('jsonPreview')
        };

        // Mettre à jour seulement les éléments existants
        if (elements.displayRegNumber) elements.displayRegNumber.textContent = memberData.registrationNumber;
        if (elements.displayName) elements.displayName.textContent = `${memberData.firstName} ${memberData.lastName}`;
        if (elements.displayOccupation) elements.displayOccupation.textContent = this.formatOccupation(memberData.occupation);
        if (elements.displayPhone) elements.displayPhone.textContent = memberData.phoneNumber || 'Non fourni';
        if (elements.displayStudyWork) elements.displayStudyWork.textContent = memberData.studyOrWorkPlace || 'Non fourni';
        if (elements.displayTimestamp) elements.displayTimestamp.textContent = new Date().toLocaleString('fr-FR');
        if (elements.jsonPreview) elements.jsonPreview.textContent = jsonString;
        
        // Afficher la section QR code
        this.showQRCodeSection();
        
        this.currentQRCode = memberData;
        this.showAlert('🎉 QR code généré avec succès!', 'success');
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

    showQRCodeSection() {
        const qrCodeSection = document.getElementById('qrCodeSection');
        if (qrCodeSection) {
            qrCodeSection.style.display = 'block';
            qrCodeSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    saveToRecentQRCodes(memberData) {
        const qrCodeItem = {
            ...memberData,
            id: 'qr-' + Date.now(),
            generatedAt: new Date().toISOString()
        };
        
        // Éviter les doublons
        this.recentQRCodes = this.recentQRCodes.filter(
            qr => qr.registrationNumber !== memberData.registrationNumber
        );
        
        this.recentQRCodes.unshift(qrCodeItem);
        
        // Garder seulement les 20 plus récents
        if (this.recentQRCodes.length > 20) {
            this.recentQRCodes = this.recentQRCodes.slice(0, 20);
        }
        
        this.saveRecentQRCodesToStorage();
        this.renderRecentQRCodes();
    }

    saveRecentQRCodesToStorage() {
        try {
            localStorage.setItem('recentQRCodes', JSON.stringify(this.recentQRCodes));
        } catch (error) {
            console.error('Erreur sauvegarde QR codes récents:', error);
            this.errorHandler.handle(error, 'SAVE_RECENT_QR');
        }
    }

    loadRecentQRCodes() {
        try {
            const stored = localStorage.getItem('recentQRCodes');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erreur chargement QR codes récents:', error);
            this.errorHandler.handle(error, 'LOAD_RECENT_QR');
            return [];
        }
    }

    // ==================== GESTION DES MEMBRES POUR QR ====================

    async loadSampleMembers() {
        const container = document.getElementById('sampleMembers');
        if (!container) {
            console.warn('Conteneur sampleMembers non trouvé');
            return;
        }

        console.log('👥 Chargement des membres pour QR...');

        try {
            // Afficher le loading
            container.innerHTML = this.getMembersLoadingHTML();

            // Attendre que les membres soient chargés
            if (!this.hasMembersData()) {
                await this.waitForMembersData();
            }

            if (!this.hasMembersData()) {
                container.innerHTML = this.getNoMembersHTML();
                return;
            }

            container.innerHTML = '';
            
            // Afficher les membres avec indicateur de statut
            const sampleMembers = this.getMembersForQRGeneration();
            
            sampleMembers.forEach((member, index) => {
                const memberCol = this.createSampleMemberCard(member, index);
                container.appendChild(memberCol);
            });

            console.log(`✅ ${sampleMembers.length} membres affichés pour QR`);
            
        } catch (error) {
            console.error('Erreur lors du chargement des membres:', error);
            const handledError = this.errorHandler.handle(error, 'LOAD_SAMPLE_MEMBERS');
            container.innerHTML = this.getErrorMembersHTML();
        }
    }

    hasMembersData() {
        return (window.apiService && window.apiService.members && window.apiService.members.length > 0) ||
               (window.membersSystem && window.membersSystem.members && window.membersSystem.members.length > 0);
    }

    async waitForMembersData() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (this.hasMembersData() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });
    }

    getMembersForQRGeneration() {
        let members = [];
        
        if (window.apiService && window.apiService.members) {
            members = window.apiService.members;
        } else if (window.membersSystem && window.membersSystem.members) {
            members = window.membersSystem.members;
        }
        
        if (members.length === 0) {
            return [];
        }
        
        return members
            .sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0))
            .slice(0, 12);
    }

    getMembersLoadingHTML() {
        return `
            <div class="col-12">
                <div class="text-center py-4">
                    <div class="spinner-border text-primary mb-3"></div>
                    <p class="text-muted">Chargement des membres...</p>
                </div>
            </div>
        `;
    }

    getNoMembersHTML() {
        return `
            <div class="col-12">
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun membre disponible</h5>
                    <p class="text-muted">Les membres apparaîtront ici une fois chargés</p>
                    <button class="btn btn-primary" onclick="qrGenerator.retryLoadMembers()">
                        <i class="fas fa-sync me-1"></i>Actualiser
                    </button>
                </div>
            </div>
        `;
    }

    getErrorMembersHTML() {
        return `
            <div class="col-12">
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-warning">Erreur de chargement</h5>
                    <p class="text-muted">Impossible de charger les membres</p>
                    <button class="btn btn-warning" onclick="qrGenerator.retryLoadMembers()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            </div>
        `;
    }

    async retryLoadMembers() {
        await this.loadSampleMembers();
    }

    createSampleMemberCard(member, index) {
        const memberCol = document.createElement('div');
        memberCol.className = 'col-md-6 col-lg-4 col-xl-3 mb-3';
        
        const initials = this.getInitials(member.firstName, member.lastName);
        const profileImageUrl = this.getProfileImageUrl(member);
        const occupationIcon = this.getOccupationIcon(member.occupation);
        const hasRecentQR = this.hasRecentQRCode(member.registrationNumber);
        
        memberCol.innerHTML = `
            <div class="card sample-member-card h-100 ${hasRecentQR ? 'border-success' : ''}" 
                 style="animation-delay: ${index * 0.1}s">
                <div class="card-body text-center">
                    ${hasRecentQR ? `
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-success" title="QR code généré récemment">
                                <i class="fas fa-check-circle me-1"></i>Récent
                            </span>
                        </div>
                    ` : ''}
                    
                    <div class="member-avatar small position-relative mx-auto mb-2">
                        ${profileImageUrl ? 
                            `<img src="${profileImageUrl}" alt="${member.firstName} ${member.lastName}" 
                                  class="profile-image small"
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                            ''
                        }
                        <div class="initials-avatar small ${profileImageUrl ? 'd-none' : ''}">
                            ${initials}
                        </div>
                        <div class="occupation-badge small">
                            <i class="fas ${occupationIcon}"></i>
                        </div>
                    </div>
                    
                    <h6 class="card-title mb-1">${member.firstName} ${member.lastName}</h6>
                    <span class="badge bg-primary mb-2">${this.formatOccupation(member.occupation)}</span>
                    <p class="card-text">
                        <small class="text-muted member-id-display">${member.registrationNumber}</small>
                    </p>
                    
                    <div class="member-qr-status small text-muted mb-2">
                        <i class="fas fa-qrcode me-1"></i>
                        ${this.getQRStatusText(member.registrationNumber)}
                    </div>
                    
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm quick-generate-btn" 
                                data-registration="${member.registrationNumber}"
                                title="Génération rapide">
                            <i class="fas fa-bolt me-1"></i>Rapide
                        </button>
                        <button class="btn btn-outline-success btn-sm customize-btn" 
                                data-registration="${member.registrationNumber}"
                                title="Personnaliser et générer">
                            <i class="fas fa-edit me-1"></i>Personnaliser
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter les événements après la création de l'élément
        this.attachMemberCardEvents(memberCol, member);
        
        return memberCol;
    }

    getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return (firstInitial + lastInitial).substring(0, 2);
    }

    getProfileImageUrl(member) {
        if (window.apiService && typeof window.apiService.getProfileImageUrl === 'function') {
            return window.apiService.getProfileImageUrl(member.profileImage);
        }
        return member.profileImage;
    }

    attachMemberCardEvents(memberCol, member) {
        const quickGenerateBtn = memberCol.querySelector('.quick-generate-btn');
        const customizeBtn = memberCol.querySelector('.customize-btn');
        
        if (quickGenerateBtn) {
            quickGenerateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.quickGenerateQR(member.registrationNumber);
            });
        }
        
        if (customizeBtn) {
            customizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.generateMemberQR(member.registrationNumber);
            });
        }
    }

    hasRecentQRCode(registrationNumber) {
        return this.recentQRCodes.some(qr => 
            qr.registrationNumber === registrationNumber
        );
    }

    getQRStatusText(registrationNumber) {
        const recentQR = this.recentQRCodes.find(qr => qr.registrationNumber === registrationNumber);
        if (!recentQR) return 'Jamais généré';
        
        const generatedDate = new Date(recentQR.generatedAt);
        return `Généré ${generatedDate.toLocaleDateString('fr-FR')}`;
    }

    renderRecentQRCodes() {
        const container = document.getElementById('recentQRCodesContainer');
        if (!container) return;
        
        if (this.recentQRCodes.length === 0) {
            container.innerHTML = this.getNoRecentQRCodesHTML();
            return;
        }
        
        container.innerHTML = '';
        
        this.recentQRCodes.forEach((qrCode, index) => {
            const qrItem = this.createRecentQRItem(qrCode, index);
            container.appendChild(qrItem);
        });
    }

    getNoRecentQRCodesHTML() {
        return `
            <div class="text-center text-muted py-4">
                <i class="fas fa-history fa-3x mb-3"></i>
                <h5>Aucun QR code récent</h5>
                <p>Les QR codes générés apparaîtront ici</p>
            </div>
        `;
    }

    createRecentQRItem(qrCode, index) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        const generatedDate = new Date(qrCode.generatedAt).toLocaleDateString('fr-FR');
        const generatedTime = new Date(qrCode.generatedAt).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', minute: '2-digit' 
        });
        
        col.innerHTML = `
            <div class="card recent-qr-card h-100" style="animation-delay: ${index * 0.1}s">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${qrCode.firstName} ${qrCode.lastName}</h6>
                        <span class="badge bg-secondary">${generatedDate}</span>
                    </div>
                    
                    <p class="card-text">
                        <small class="text-muted member-id-display">${qrCode.registrationNumber}</small>
                    </p>
                    
                    <div class="member-details small text-muted mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Occupation:</span>
                            <span>${this.formatOccupation(qrCode.occupation)}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Généré à:</span>
                            <span>${generatedTime}</span>
                        </div>
                    </div>
                    
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm regenerate-btn" 
                                data-registration="${qrCode.registrationNumber}"
                                title="Regénérer le QR code">
                            <i class="fas fa-redo me-1"></i>Regénérer
                        </button>
                        <button class="btn btn-outline-success btn-sm template-btn" 
                                data-registration="${qrCode.registrationNumber}"
                                title="Utiliser comme modèle">
                            <i class="fas fa-copy me-1"></i>Modèle
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.attachRecentQRItemEvents(col, qrCode);
        return col;
    }

    attachRecentQRItemEvents(col, qrCode) {
        const regenerateBtn = col.querySelector('.regenerate-btn');
        const templateBtn = col.querySelector('.template-btn');
        
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.regenerateQR(qrCode.registrationNumber);
            });
        }
        
        if (templateBtn) {
            templateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.useAsTemplate(qrCode.registrationNumber);
            });
        }
    }

    regenerateQR(registrationNumber) {
        const qrCode = this.recentQRCodes.find(qr => qr.registrationNumber === registrationNumber);
        if (qrCode) {
            this.generateQRCodeFromData(qrCode);
            this.showAlert('QR code regénéré!', 'success');
        }
    }

    useAsTemplate(registrationNumber) {
        const qrCode = this.recentQRCodes.find(qr => qr.registrationNumber === registrationNumber);
        if (qrCode) {
            this.prefillForm(qrCode);
        }
    }

    downloadQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (qrCodeElement && qrCodeElement.src) {
            const regNumber = document.getElementById('displayRegNumber')?.textContent || 'QRCode';
            const memberName = document.getElementById('displayName')?.textContent || 'Membre';
            
            const link = document.createElement('a');
            link.download = `Carte-ACM-${regNumber}-${memberName.replace(/\s+/g, '-')}.png`;
            link.href = qrCodeElement.src;
            link.click();
            
            this.showAlert('Carte téléchargée!', 'success');
        } else {
            this.showAlert('Générez d\'abord un QR code', 'warning');
        }
    }

    printQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (!qrCodeElement) {
            this.showAlert('Générez d\'abord un QR code', 'warning');
            return;
        }

        this.showPrintModal();
    }

    showPrintModal() {
        // Implémentation de la modal d'impression
        this.showAlert('Fonction d\'impression bientôt disponible', 'info');
    }

    clearQRForm() {
        const form = document.getElementById('qrGeneratorForm');
        if (form) {
            form.reset();
        }
        
        const qrCodeSection = document.getElementById('qrCodeSection');
        if (qrCodeSection) {
            qrCodeSection.style.display = 'none';
        }
        
        // Masquer l'indicateur de pré-remplissage
        this.hidePrefillIndicator();
        
        this.currentQRCode = null;
        this.prefillData = null;
        this.stateManager.setState({ 
            generationStatus: 'idle',
            currentQR: null 
        });
        this.showAlert('Formulaire réinitialisé', 'info');
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

    showAlert(message, type = 'info') {
        console.log(`💬 Alerte [${type}]: ${message}`);
        
        // Utiliser le système d'alerte existant s'il est disponible
        if (window.attendance && typeof window.attendance.showAlert === 'function') {
            window.attendance.showAlert(message, type);
        } else if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification(message, type);
        } else {
            this.showFallbackAlert(message, type);
        }
    }

    showFallbackAlert(message, type) {
        // Créer une alerte simple
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-suppression après 4 secondes
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 4000);
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ==================== NOUVELLES FONCTIONNALITÉS ====================

    /**
     * Fonction debounce pour optimiser les performances
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Méthode pour nettoyer les ressources si nécessaire
    destroy() {
        this.currentQRCode = null;
        this.recentQRCodes = [];
        this.quickActionsSetup = false;
        this.isGenerating = false;
        this.prefillData = null;
        this.qrCache.clear();
        this.stateManager.setState({ generationStatus: 'idle' });
    }
}

// ==================== CLASSES DE GESTION AMÉLIORÉES ====================

/**
 * Gestionnaire d'état pour le générateur QR
 */
class QRStateManager {
    constructor() {
        this.state = {
            currentQR: null,
            recentQRCodes: [],
            generationStatus: 'idle', // 'idle', 'generating', 'success', 'error'
            formData: {},
            ui: {
                prefillIndicator: false,
                sectionVisible: false
            }
        };
        this.listeners = [];
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    getState() {
        return { ...this.state };
    }
}

/**
 * Gestionnaire d'erreurs centralisé
 */
class ErrorHandler {
    static handle(error, context = '') {
        console.error(`❌ Erreur [${context}]:`, error);
        
        const errorMap = {
            'QR_CODE_GENERATION_FAILED': {
                message: 'Échec de la génération du QR code',
                userMessage: 'Impossible de générer le QR code. Veuillez réessayer.',
                level: 'error'
            },
            'LIBRARY_NOT_LOADED': {
                message: 'Bibliothèque non chargée',
                userMessage: 'Une ressource nécessaire est manquante. Veuillez actualiser la page.',
                level: 'error'
            },
            'NETWORK_ERROR': {
                message: 'Erreur réseau',
                userMessage: 'Problème de connexion. Vérifiez votre connexion internet.',
                level: 'warning'
            },
            'INITIALIZATION': {
                message: 'Erreur d\'initialisation',
                userMessage: 'Impossible d\'initialiser le générateur QR. Contactez l\'administrateur.',
                level: 'error'
            },
            'PREFILL_DATA': {
                message: 'Erreur de pré-remplissage',
                userMessage: 'Impossible de pré-remplir le formulaire.',
                level: 'warning'
            },
            'AUTO_FILL': {
                message: 'Erreur d\'auto-remplissage',
                userMessage: 'Impossible de trouver les informations du membre.',
                level: 'info'
            },
            'SAVE_RECENT_QR': {
                message: 'Erreur de sauvegarde',
                userMessage: 'Impossible de sauvegarder l\'historique.',
                level: 'warning'
            },
            'LOAD_RECENT_QR': {
                message: 'Erreur de chargement',
                userMessage: 'Impossible de charger l\'historique.',
                level: 'warning'
            },
            'LOAD_SAMPLE_MEMBERS': {
                message: 'Erreur de chargement des membres',
                userMessage: 'Impossible de charger la liste des membres.',
                level: 'warning'
            }
        };
        
        // Envoyer à un service de monitoring si disponible
        this.reportToMonitoring(error, context);
        
        // Trouver l'erreur correspondante ou utiliser une erreur par défaut
        const errorInfo = errorMap[context] || errorMap[error?.code] || {
            message: error?.message || 'Erreur inconnue',
            userMessage: 'Une erreur inattendue est survenue. Veuillez réessayer.',
            level: 'error'
        };
        
        return errorInfo;
    }
    
    static reportToMonitoring(error, context) {
        // Intégration avec Sentry ou autre service
        if (window.Sentry) {
            window.Sentry.captureException(error, { extra: { context } });
        }
        
        // Log supplémentaire pour le débogage
        if (window.console && window.console.error) {
            window.console.error('Error reported to monitoring:', { error, context });
        }
    }
}

/**
 * Système de cache pour optimiser les performances
 */
class QRCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
        this.ttl = 30 * 60 * 1000; // 30 minutes
    }
    
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        // Vérifier TTL
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
    
    // Méthode utilitaire pour générer des hashs simples
    static generateKey(...args) {
        return args.join('_').replace(/\s+/g, '_');
    }
}

// Extension de String pour le hachage simple
if (!String.prototype.hashCode) {
    String.prototype.hashCode = function() {
        let hash = 0;
        for (let i = 0; i < this.length; i++) {
            const char = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };
}

// Create global instance
const qrGenerator = new QRGenerator();

// Exposer globalement pour le débogage et la liaison
window.qrGenerator = qrGenerator;
window.QRStateManager = QRStateManager;
window.ErrorHandler = ErrorHandler;
window.QRCache = QRCache;

// Initialisation automatique si on est sur la page QR Generator
document.addEventListener('DOMContentLoaded', function() {
    const qrPage = document.getElementById('qr-generator');
    if (qrPage && (qrPage.style.display === 'block' || qrPage.classList.contains('active'))) {
        console.log('🚀 Initialisation automatique du générateur QR');
        qrGenerator.initializeQRGenerator();
    }
});

// Export pour les modules ES6 si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QRGenerator,
        QRStateManager,
        ErrorHandler,
        QRCache,
        qrGenerator
    };
}