// QR Generator System - Version améliorée et robuste
class QRGenerator {
    constructor() {
        this.currentQRCode = null;
        this.recentQRCodes = this.loadRecentQRCodes();
        this.quickActionsSetup = false;
        this.isGenerating = false;
    }

    async initializeQRGenerator() {
        console.log('🔧 Initialisation du générateur QR...');
        
        try {
            // Vérifier que la bibliothèque QR code est disponible
            if (typeof qrcode === 'undefined') {
                console.error('❌ Bibliothèque QR code non chargée');
                this.showAlert('Erreur: Bibliothèque QR code non disponible', 'error');
                return false;
            }
            
            console.log('✅ Bibliothèque QR code disponible');
            
            this.setupEventListeners();
            await this.loadSampleMembers();
            this.renderRecentQRCodes();
            this.setupQuickActions();
            
            console.log('✅ Générateur QR initialisé avec succès');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showAlert('Erreur lors de l\'initialisation du générateur QR', 'error');
            return false;
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

        // Auto-remplissage depuis les champs
        this.attachEvent('registrationNumber', 'input', (e) => {
            this.autoFillFromExistingMember(e.target.value);
        });

        // Entrée pour générer avec la touche Enter
        this.attachEvent('qrGeneratorForm', 'submit', (e) => {
            e.preventDefault();
            this.generateQRCode();
        });
    }

    attachEvent(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Élément #${elementId} non trouvé pour l'événement ${event}`);
        }
    }

    setupQuickActions() {
        if (this.quickActionsSetup) return;
        
        console.log('⚡ Configuration des actions rapides...');
        this.quickActionsSetup = true;
    }

    autoFillFromExistingMember(registrationNumber) {
        if (!registrationNumber || registrationNumber.length < 3) return;
        
        try {
            const member = apiService.getMemberByRegistrationNumber(registrationNumber.trim());
            if (member) {
                this.fillFormFields({
                    firstName: member.firstName,
                    lastName: member.lastName,
                    occupation: member.occupation || 'student',
                    phoneNumber: member.phoneNumber || '',
                    studyWorkPlace: member.studyOrWorkPlace || ''
                });
                
                this.showAlert(`Membre ${member.firstName} ${member.lastName} trouvé!`, 'success');
            }
        } catch (error) {
            console.warn('Erreur lors de l\'auto-remplissage:', error);
        }
    }

    fillFormFields(fields) {
        Object.keys(fields).forEach(field => {
            const element = document.getElementById(field);
            if (element && fields[field] !== undefined) {
                element.value = fields[field];
            }
        });
    }

    async loadSampleMembers() {
        const container = document.getElementById('sampleMembers');
        if (!container) {
            console.warn('Conteneur sampleMembers non trouvé');
            return;
        }

        console.log('👥 Chargement des membres pour QR...');

        try {
            // Attendre que les membres soient chargés
            if (!apiService.members || apiService.members.length === 0) {
                await apiService.fetchMembers();
            }

            if (!apiService.members || apiService.members.length === 0) {
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
            container.innerHTML = this.getErrorMembersHTML();
        }
    }

    getMembersForQRGeneration() {
        if (!apiService.members || apiService.members.length === 0) {
            return [];
        }
        
        const members = [...apiService.members];
        return members
            .sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0))
            .slice(0, 12);
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
        
        const initials = utils.getInitials(member.firstName, member.lastName);
        const profileImageUrl = apiService.getProfileImageUrl(member.profileImage);
        const occupationIcon = this.getOccupationIcon(member.occupation);
        const hasRecentQR = this.hasRecentQRCode(member.registrationNumber);
        
        memberCol.innerHTML = `
            <div class="card sample-member-card h-100 ${hasRecentQR ? 'border-success' : ''}">
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
                    <span class="badge bg-primary mb-2">${utils.formatOccupation(member.occupation)}</span>
                    <p class="card-text">
                        <small class="text-muted member-id-display">${member.registrationNumber}</small>
                    </p>
                    
                    <div class="member-qr-status small text-muted mb-2">
                        <i class="fas fa-qrcode me-1"></i>
                        ${this.getQRStatusText(member.registrationNumber)}
                    </div>
                    
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm quick-generate-btn" 
                                data-registration="${member.registrationNumber}">
                            <i class="fas fa-bolt me-1"></i>Rapide
                        </button>
                        <button class="btn btn-outline-success btn-sm customize-btn" 
                                data-registration="${member.registrationNumber}">
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

    // 🎯 GÉNÉRATION RAPIDE
    quickGenerateQR(registrationNumber) {
        if (this.isGenerating) {
            this.showAlert('Génération en cours...', 'warning');
            return;
        }

        console.log('⚡ Génération QR rapide pour:', registrationNumber);
        
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
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

    // 🎯 GÉNÉRATION AVEC PERSONNALISATION
    generateMemberQR(registrationNumber) {
        console.log('🎨 Génération QR personnalisé pour:', registrationNumber);
        
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            this.fillFormFields({
                registrationNumber: member.registrationNumber,
                firstName: member.firstName,
                lastName: member.lastName,
                occupation: member.occupation || 'student',
                phoneNumber: member.phoneNumber || '',
                studyWorkPlace: member.studyOrWorkPlace || ''
            });
            
            // Scroll vers le formulaire
            document.getElementById('qrGeneratorForm').scrollIntoView({ behavior: 'smooth' });
            
            this.showAlert(`📝 Formulaire rempli pour ${member.firstName} ${member.lastName}`, 'info');
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

        if (!this.validateFormData(formData)) {
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
        const { registrationNumber, firstName, lastName } = data;
        
        if (!registrationNumber) {
            this.showAlert('Le numéro d\'inscription est obligatoire', 'warning');
            return false;
        }
        
        if (!firstName || !lastName) {
            this.showAlert('Le prénom et le nom sont obligatoires', 'warning');
            return false;
        }
        
        return true;
    }

    prepareMemberData(formData) {
        const memberData = {
            registrationNumber: formData.registrationNumber,
            firstName: formData.firstName,
            lastName: formData.lastName,
            occupation: formData.occupation,
            phoneNumber: formData.phoneNumber || undefined,
            studyOrWorkPlace: formData.studyWorkPlace || undefined,
            timestamp: new Date().toISOString(),
            generatedBy: 'ACM System'
        };

        // Nettoyer les données
        Object.keys(memberData).forEach(key => {
            if (memberData[key] === undefined || memberData[key] === '') {
                delete memberData[key];
            }
        });

        return memberData;
    }

    // 🎯 MÉTHODE PRINCIPALE DE GÉNÉRATION
    async generateQRCodeFromData(memberData) {
        if (this.isGenerating) return;
        
        console.log('🔧 Génération du QR code depuis les données...');
        this.isGenerating = true;
        
        const jsonString = JSON.stringify(memberData, null, 2);
        console.log('📄 JSON à encoder:', jsonString);
        
        try {
            // Vider le conteneur et afficher le loading
            const qrcodeContainer = document.getElementById('qrcode');
            if (!qrcodeContainer) {
                throw new Error('Conteneur QR code non trouvé');
            }
            
            qrcodeContainer.innerHTML = this.getLoadingHTML();
            
            // Utiliser une petite pause pour permettre l'affichage du loading
            await new Promise(resolve => setTimeout(resolve, 300));
            
            console.log('🎨 Création du QR code...');
            
            // Vérifier à nouveau la bibliothèque
            if (typeof qrcode === 'undefined') {
                throw new Error('Bibliothèque QR code non disponible');
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
            
            // Mettre à jour l'affichage
            this.updateQRDisplay(memberData, jsonString);
            
            // Sauvegarder dans les récents
            this.saveToRecentQRCodes(memberData);
            
            console.log('🎉 QR code affiché avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération du QR code:', error);
            this.handleGenerationError(error);
        } finally {
            this.isGenerating = false;
        }
    }

    getLoadingHTML() {
        return `
            <div class="text-center">
                <div class="spinner-border text-primary mb-2"></div>
                <p>Génération du QR code...</p>
            </div>
        `;
    }

    handleGenerationError(error) {
        const qrcodeContainer = document.getElementById('qrcode');
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur lors de la génération du QR code: ${error.message}
                </div>
            `;
        }
        this.showAlert('Erreur lors de la génération du QR code', 'error');
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
        if (elements.displayOccupation) elements.displayOccupation.textContent = utils.formatOccupation(memberData.occupation);
        if (elements.displayPhone) elements.displayPhone.textContent = memberData.phoneNumber || 'Non fourni';
        if (elements.displayStudyWork) elements.displayStudyWork.textContent = memberData.studyOrWorkPlace || 'Non fourni';
        if (elements.displayTimestamp) elements.displayTimestamp.textContent = new Date().toLocaleString('fr-FR');
        if (elements.jsonPreview) elements.jsonPreview.textContent = jsonString;
        
        // Afficher la section QR code
        this.showQRCodeSection();
        
        this.currentQRCode = memberData;
        this.showAlert('🎉 QR code généré avec succès!', 'success');
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
        }
    }

    loadRecentQRCodes() {
        try {
            const stored = localStorage.getItem('recentQRCodes');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erreur chargement QR codes récents:', error);
            return [];
        }
    }

    renderRecentQRCodes() {
        const container = document.getElementById('recentQRCodesContainer');
        if (!container) return;
        
        if (this.recentQRCodes.length === 0) {
            container.innerHTML = this.getNoRecentQRCodesHTML();
            return;
        }
        
        container.innerHTML = '';
        
        this.recentQRCodes.forEach(qrCode => {
            const qrItem = this.createRecentQRItem(qrCode);
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

    createRecentQRItem(qrCode) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';
        
        const generatedDate = new Date(qrCode.generatedAt).toLocaleDateString('fr-FR');
        const generatedTime = new Date(qrCode.generatedAt).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', minute: '2-digit' 
        });
        
        col.innerHTML = `
            <div class="card recent-qr-card h-100">
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
                            <span>${utils.formatOccupation(qrCode.occupation)}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Généré à:</span>
                            <span>${generatedTime}</span>
                        </div>
                    </div>
                    
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-outline-primary btn-sm regenerate-btn" 
                                data-registration="${qrCode.registrationNumber}">
                            <i class="fas fa-redo me-1"></i>Regénérer
                        </button>
                        <button class="btn btn-outline-success btn-sm template-btn" 
                                data-registration="${qrCode.registrationNumber}">
                            <i class="fas fa-copy me-1"></i>Modifier
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
            this.fillFormFields({
                registrationNumber: qrCode.registrationNumber,
                firstName: qrCode.firstName,
                lastName: qrCode.lastName,
                occupation: qrCode.occupation,
                phoneNumber: qrCode.phoneNumber || '',
                studyWorkPlace: qrCode.studyOrWorkPlace || ''
            });
            
            document.getElementById('qrGeneratorForm').scrollIntoView({ behavior: 'smooth' });
            this.showAlert('Formulaire rempli avec le modèle sélectionné', 'info');
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
        
        this.currentQRCode = null;
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

    // Méthode pour nettoyer les ressources si nécessaire
    destroy() {
        this.currentQRCode = null;
        this.recentQRCodes = [];
        this.quickActionsSetup = false;
        this.isGenerating = false;
    }
}

// Create global instance
const qrGenerator = new QRGenerator();

// Exposer globalement pour le débogage
window.qrGenerator = qrGenerator;