// ✅ QR Code Scanner System - Version COMPLÈTE avec processus de check-in
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.scannerActive = false;
        this.currentCameraId = null;
        this.scanningPaused = false;
        this.libraryLoaded = false;
        this.lastScanTime = 0;
        this.scanThrottleDelay = 500;
        this.startInProgress = false;
        this.currentMember = null;
        
        this.checkLibraryAvailability();
    }

    // ✅ Vérifier si la bibliothèque est disponible
    checkLibraryAvailability() {
        this.libraryLoaded = typeof Html5Qrcode !== 'undefined';
        
        if (this.libraryLoaded) {
            console.log('✅ Bibliothèque Html5Qrcode chargée');
        } else {
            console.warn('⚠️ Bibliothèque Html5Qrcode non chargée');
            this.showLibraryError();
        }
        
        return this.libraryLoaded;
    }

    showLibraryError() {
        const scannerContainer = document.getElementById('scannerContainer');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        if (scannerContainer) {
            scannerContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h5>Bibliothèque scanner non chargée</h5>
                    <p class="mb-3">Le système de scan QR nécessite une bibliothèque externe.</p>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary btn-sm" onclick="qrScanner.retryLibraryLoad()">
                            <i class="fas fa-redo me-1"></i>Réessayer
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="qrScanner.startManualEntry()">
                            <i class="fas fa-keyboard me-1"></i>Entrée manuelle
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'none';
        }
    }

    // ✅ Méthode pour réessayer le chargement
    retryLibraryLoad() {
        console.log('🔄 Réessai du chargement de la bibliothèque...');
        
        if (this.checkLibraryAvailability()) {
            this.showAlert('✅ Bibliothèque chargée! Vous pouvez maintenant utiliser le scanner.', 'success');
            this.updateScannerUI('stopped');
        } else {
            this.loadLibraryFromCloudFlare();
        }
    }

    // ✅ Chargement dynamique de la bibliothèque depuis CloudFlare
    loadLibraryFromCloudFlare() {
        console.log('📦 Chargement depuis CloudFlare CDN...');
        
        if (typeof Html5Qrcode !== 'undefined') {
            console.log('✅ Bibliothèque déjà chargée');
            this.retryLibraryLoad();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            console.log('✅ Bibliothèque Html5Qrcode chargée depuis CloudFlare');
            this.libraryLoaded = true;
            this.showAlert('✅ Scanner prêt à être utilisé!', 'success');
            this.updateScannerUI('stopped');
            
            const startBtn = document.getElementById('startScannerBtn');
            if (startBtn) {
                startBtn.disabled = false;
            }
        };
        
        script.onerror = (error) => {
            console.error('❌ Échec du chargement depuis CloudFlare:', error);
            this.showAlert('❌ Impossible de charger le scanner. Utilisez l\'entrée manuelle.', 'error');
        };
        
        document.head.appendChild(script);
    }

    // ✅ Démarrage du scanner
    async startScanner() {
        console.log('🎬 Démarrage du scanner QR...');

        if (this.startInProgress) {
            console.log('⏳ Démarrage déjà en cours...');
            return false;
        }

        if (!this.checkLibraryAvailability()) {
            this.showAlert('❌ Scanner non disponible. Chargement de la bibliothèque...', 'warning');
            this.loadLibraryFromCloudFlare();
            return false;
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            this.showAlert('⚠️ Le scanner nécessite une connexion HTTPS pour fonctionner', 'warning');
            return false;
        }

        if (this.isScanning) {
            console.log('📱 Scanner déjà actif');
            this.showAlert('Scanner déjà en cours d\'utilisation', 'info');
            return true;
        }

        try {
            this.startInProgress = true;
            this.updateScannerUI('starting');
            
            await new Promise(r => setTimeout(r, 300));

            const scannerContainer = document.getElementById('scannerContainer');
            if (!scannerContainer) {
                throw new Error('Conteneur scanner non trouvé');
            }

            scannerContainer.innerHTML = '<div id="qrReader" style="width: 100%;"></div>';

            if (this.html5QrCode) {
                await this.cleanupScanner();
            }

            this.html5QrCode = new Html5Qrcode("qrReader");

            console.log('📷 Recherche de caméras disponibles...');

            await this.checkCameraPermissions();

            let cameras;
            try {
                cameras = await Html5Qrcode.getCameras();
                console.log(`📱 Caméras détectées: ${cameras.length}`, cameras);
            } catch (cameraError) {
                console.error('❌ Erreur récupération caméras:', cameraError);
                throw new Error('Impossible d\'accéder aux caméras. Vérifiez les permissions.');
            }

            if (cameras.length === 0) {
                throw new Error('Aucune caméra détectée');
            }

            const camerasWithValidId = cameras.filter(cam => cam.id && cam.id.trim() !== '');
            
            if (camerasWithValidId.length === 0) {
                console.warn('⚠️ Toutes les caméras ont un ID vide, tentative de rechargement après permission...');
                
                await new Promise(r => setTimeout(r, 500));
                await this.checkCameraPermissions(true);
                
                const refreshedCameras = await Html5Qrcode.getCameras();
                console.log('🔄 Caméras après rechargement:', refreshedCameras);
                
                if (refreshedCameras.length === 0) {
                    throw new Error('Aucune caméra disponible après autorisation');
                }
                
                const cameraId = this.selectBestCamera(refreshedCameras);
                this.currentCameraId = cameraId;
            } else {
                const cameraId = this.selectBestCamera(cameras);
                this.currentCameraId = cameraId;
            }

            if (!this.currentCameraId || 
                (typeof this.currentCameraId !== 'string' && 
                 !(this.currentCameraId.facingMode && typeof this.currentCameraId.facingMode === 'string'))) {
                throw new Error('Aucune configuration de caméra valide après toutes les tentatives');
            }
            
            console.log('📷 Caméra sélectionnée:', this.currentCameraId);

            const config = {
                fps: 15,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                rememberLastUsedCamera: true
            };

            console.log('🚀 Lancement du flux vidéo...');
            
            this.isScanning = true;
            
            await this.html5QrCode.start(
                this.currentCameraId,
                config,
                (decodedText) => {
                    if (this.scanningPaused) return;
                    this.onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    if (!errorMessage || /NotFound|Timeout|Busy/.test(errorMessage)) return;
                    console.log('🔍 Lecture en cours...', errorMessage);
                }
            ).catch(error => {
                this.isScanning = false;
                console.error('❌ Erreur démarrage scanner:', error);
                throw error;
            });

            this.scannerActive = true;
            this.scanningPaused = false;

            console.log('🎉 Scanner opérationnel!');
            this.updateScannerUI('active');
            this.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'success');

            return true;

        } catch (error) {
            console.error('❌ Erreur critique:', error);
            this.isScanning = false;
            await this.handleScannerError(error);
            return false;
        } finally {
            this.startInProgress = false;
        }
    }

    // ✅ Vérification des permissions caméra
    async checkCameraPermissions(forcePrompt = false) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('API caméra non supportée par ce navigateur');
            }

            const constraints = {
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { ideal: 'environment' }
                } 
            };

            if (forcePrompt) {
                constraints.video.facingMode = { exact: 'environment' };
            }

            console.log('🔐 Vérification des permissions caméra...');
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            stream.getTracks().forEach(track => {
                track.stop();
            });
            
            console.log('✅ Permissions caméra accordées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur permissions caméra:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Aucune caméra détectée sur cet appareil.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra.');
            } else if (error.name === 'OverconstrainedError') {
                console.log('🔄 Contraintes trop strictes, tentative avec contraintes relâchées...');
                return await this.checkCameraPermissionsWithRelaxedConstraints();
            } else {
                throw new Error(`Accès caméra impossible: ${error.message}`);
            }
        }
    }

    // ✅ Fallback pour contraintes trop strictes
    async checkCameraPermissionsWithRelaxedConstraints() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true
            });
            
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Permissions accordées avec contraintes relâchées');
            return true;
        } catch (error) {
            throw new Error(`Accès caméra impossible même avec contraintes minimales: ${error.message}`);
        }
    }

    // ✅ Sélection de la meilleure caméra
    selectBestCamera(cameras) {
        if (!cameras || cameras.length === 0) {
            console.error('❌ Aucune caméra disponible');
            return null;
        }

        console.log('🔍 Sélection de la meilleure caméra parmi:', cameras.length, 'caméras');

        const validCameras = cameras.filter(cam => cam && (cam.id && cam.id.trim() !== ''));
        const fallbackCameras = cameras.filter(cam => cam && (!cam.id || cam.id.trim() === ''));

        console.log(`📊 Caméras valides: ${validCameras.length}, Fallback: ${fallbackCameras.length}`);

        if (validCameras.length > 0) {
            console.log('🎯 Utilisation des caméras avec ID valide');
            return this.selectFromValidCameras(validCameras);
        }

        if (fallbackCameras.length > 0) {
            console.warn('⚠️ Aucune caméra avec ID valide, utilisation du fallback...');
            return this.selectFromFallbackCameras(fallbackCameras);
        }

        console.error('❌ Aucune caméra utilisable trouvée');
        return null;
    }

    selectFromValidCameras(validCameras) {
        const rearCamera = validCameras.find(cam => {
            const label = (cam.label || '').toLowerCase();
            return label.includes('back') || 
                   label.includes('rear') || 
                   label.includes('arrière') ||
                   label.includes('environment') ||
                   (label.includes('2') && !label.includes('front')) ||
                   (cam.deviceId && cam.deviceId.includes('back'));
        });

        if (rearCamera) {
            console.log('📷 Caméra arrière sélectionnée:', rearCamera.label || rearCamera.deviceId);
            return rearCamera.id;
        }

        const mainCamera = validCameras.find(cam => {
            const label = (cam.label || '').toLowerCase();
            return !label.includes('front') && 
                   !label.includes('face') && 
                   !label.includes('user');
        });

        if (mainCamera) {
            console.log('📷 Caméra principale sélectionnée:', mainCamera.label || mainCamera.deviceId);
            return mainCamera.id;
        }

        console.log('📷 Première caméra valide utilisée:', validCameras[0].label || validCameras[0].deviceId);
        return validCameras[0].id;
    }

    selectFromFallbackCameras(fallbackCameras) {
        const rearFallback = fallbackCameras.find(cam => {
            const label = (cam.label || '').toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('arrière');
        });

        if (rearFallback) {
            console.log('📷 Fallback caméra arrière (sans ID):', rearFallback.label || 'Caméra inconnue');
            return { facingMode: "environment" };
        }

        console.log('📷 Fallback caméra par défaut (sans ID)');
        return { facingMode: "environment" };
    }

    // ✅ Arrêt du scanner
    async stopScanner() {
        console.log('🛑 Arrêt du scanner demandé...');
        
        if (!this.html5QrCode || !this.isScanning) {
            console.log('ℹ️ Scanner déjà arrêté');
            this.resetScannerState();
            return true;
        }

        try {
            this.scanningPaused = true;
            
            await this.html5QrCode.stop();
            console.log('✅ Scanner arrêté proprement');
            
            return true;
        } catch (error) {
            console.warn('⚠️ Problème à l\'arrêt:', error);
            return false;
        } finally {
            this.resetScannerState();
        }
    }

    // ✅ Nettoyage du scanner
    async cleanupScanner() {
        if (this.html5QrCode) {
            try {
                let isScannerActive = false;
                
                if (this.html5QrCode.getState && typeof this.html5QrCode.getState === 'function') {
                    const state = this.html5QrCode.getState();
                    isScannerActive = state && state !== Html5QrcodeScannerState.STOPPED;
                } else if (this.isScanning) {
                    isScannerActive = true;
                }
                
                if (isScannerActive) {
                    await this.html5QrCode.stop();
                }
                
                await this.html5QrCode.clear();
                console.log('🧹 Scanner nettoyé');
            } catch (error) {
                console.warn('⚠️ Erreur nettoyage scanner:', error);
            }
        }
        this.html5QrCode = null;
    }

    resetScannerState() {
        this.isScanning = false;
        this.scannerActive = false;
        this.scanningPaused = false;
        this.currentCameraId = null;
        this.updateScannerUI('stopped');
    }

    // ✅ Gestion des scans avec processus de check-in
    onScanSuccess(decodedText) {
        const now = Date.now();
        
        if (now - this.lastScanTime < this.scanThrottleDelay) {
            console.log('⏱️ Scan ignoré (trop rapide)');
            return;
        }
        
        this.lastScanTime = now;
        console.log('📱 QR Code détecté:', decodedText);
        
        this.scanningPaused = true;
        this.showScanSuccess();
        
        setTimeout(async () => {
            try {
                await this.processQRCode(decodedText);
            } catch (error) {
                console.error('❌ Erreur traitement QR:', error);
                this.showAlert('Erreur traitement QR code', 'error');
                await this.restartScannerAfterDelay(1000);
            }
        }, 500);
    }

    async processQRCode(decodedText) {
        try {
            console.log('🔍 Analyse du QR code...');
            
            let memberData;
            let isFromCard = false;
            
            try {
                memberData = JSON.parse(decodedText);
                console.log('📋 Format JSON détecté:', memberData);
                
                if (!memberData.registrationNumber && !memberData.memberId) {
                    throw new Error('Données membre manquantes dans le QR code');
                }
                
            } catch (jsonError) {
                console.log('📋 Format texte détecté:', decodedText);
                memberData = {
                    registrationNumber: decodedText.trim(),
                    isFromCard: true
                };
                isFromCard = true;
            }

            const registrationNumber = this.normalizeRegistrationNumber(
                memberData.registrationNumber || memberData.memberId || decodedText
            );

            if (!registrationNumber) {
                throw new Error('Numéro de membre invalide');
            }

            console.log('🔍 Recherche du membre:', registrationNumber);

            let member;
            if (window.apiService && window.apiService.getMemberByRegistrationNumber) {
                member = window.apiService.getMemberByRegistrationNumber(registrationNumber);
            } else {
                console.warn('⚠️ API service non disponible, utilisation des données mock');
                member = this.getMockMemberData(registrationNumber);
            }
            
            if (member) {
                console.log('✅ Membre trouvé:', member);
                this.currentMember = member;
                await this.handleMemberFound(member, isFromCard);
            } else {
                console.log('❌ Membre non trouvé');
                await this.handleMemberNotFound(registrationNumber, memberData);
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement QR code:', error);
            throw error;
        }
    }

    // ✅ Données mock pour la démonstration
    getMockMemberData(registrationNumber) {
        const mockMembers = {
            'M12345': {
                id: 1,
                registrationNumber: 'M12345',
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@email.com',
                membershipType: 'Premium',
                membershipStatus: 'active',
                profileImage: null
            },
            'M67890': {
                id: 2,
                registrationNumber: 'M67890', 
                firstName: 'Marie',
                lastName: 'Martin',
                email: 'marie.martin@email.com',
                membershipType: 'Standard',
                membershipStatus: 'active',
                profileImage: null
            },
            'M11111': {
                id: 3,
                registrationNumber: 'M11111',
                firstName: 'Pierre',
                lastName: 'Durand',
                email: 'pierre.durand@email.com',
                membershipType: 'VIP',
                membershipStatus: 'active',
                profileImage: null
            },
            'M22222': {
                id: 4,
                registrationNumber: 'M22222',
                firstName: 'Sophie',
                lastName: 'Leroy',
                email: 'sophie.leroy@email.com',
                membershipType: 'Standard',
                membershipStatus: 'active',
                profileImage: null
            },
            'M33333': {
                id: 5,
                registrationNumber: 'M33333',
                firstName: 'Michel',
                lastName: 'Bernard',
                email: 'michel.bernard@email.com',
                membershipType: 'Premium',
                membershipStatus: 'active',
                profileImage: null
            }
        };
        
        return mockMembers[registrationNumber] || null;
    }

    normalizeRegistrationNumber(regNumber) {
        if (!regNumber) return null;
        
        return regNumber.toString()
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
    }

    // ✅ Processus complet de check-in
    async handleMemberFound(member, isFromCard) {
        const welcomeMessage = isFromCard ? 
            `✅ Carte acceptée! Bienvenue ${member.firstName} ${member.lastName}` :
            `✅ Membre reconnu! Bienvenue ${member.firstName} ${member.lastName}`;
        
        this.showAlert(welcomeMessage, 'success');
        
        await this.stopScanner();
        
        this.showCheckinInterface(member);
    }

    // ✅ Interface de check-in complète
    showCheckinInterface(member) {
        const scannerContainer = document.getElementById('scannerContainer');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        if (!scannerContainer) return;

        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'none';
        }

        scannerContainer.innerHTML = `
            <div class="checkin-interface">
                <div class="card shadow-lg">
                    <div class="card-header bg-primary text-white text-center">
                        <h4 class="mb-0">
                            <i class="fas fa-user-check me-2"></i>
                            Check-in Membre
                        </h4>
                    </div>
                    
                    <div class="card-body">
                        <div class="member-info text-center mb-4">
                            <div class="member-avatar mb-3">
                                <div class="avatar-placeholder bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center" 
                                     style="width: 80px; height: 80px;">
                                    <i class="fas fa-user text-white fa-2x"></i>
                                </div>
                            </div>
                            <h5 class="member-name">${member.firstName} ${member.lastName}</h5>
                            <div class="member-details text-muted">
                                <div>N°: ${member.registrationNumber}</div>
                                <div>${member.membershipType} • ${member.membershipStatus}</div>
                            </div>
                        </div>

                        <hr>

                        <form id="checkinForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">
                                    <i class="fas fa-clipboard-list me-2"></i>Motif de visite
                                </label>
                                <div class="visit-reasons">
                                    ${this.generateVisitReasons()}
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">
                                    <i class="fas fa-dumbbell me-2"></i>Activité prévue
                                </label>
                                <select class="form-select" id="activitySelect" required>
                                    <option value="">Choisir une activité...</option>
                                    ${this.generateActivityOptions()}
                                </select>
                            </div>

                            <div class="mb-4" id="sessionSection" style="display: none;">
                                <label class="form-label fw-bold">
                                    <i class="fas fa-play-circle me-2"></i>Démarrer une session
                                </label>
                                <div class="session-options">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="sessionType" id="sessionCoach" value="coach">
                                        <label class="form-check-label" for="sessionCoach">
                                            Avec coach
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="sessionType" id="sessionSolo" value="solo">
                                        <label class="form-check-label" for="sessionSolo">
                                            En autonomie
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="sessionType" id="sessionGroup" value="group">
                                        <label class="form-check-label" for="sessionGroup">
                                            Cours collectif
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">
                                    <i class="fas fa-sticky-note me-2"></i>Notes (optionnel)
                                </label>
                                <textarea class="form-control" id="checkinNotes" rows="2" 
                                          placeholder="Commentaires, objectifs spécifiques..."></textarea>
                            </div>
                        </form>
                    </div>
                    
                    <div class="card-footer bg-light">
                        <div class="row g-2">
                            <div class="col-6">
                                <button type="button" class="btn btn-outline-danger w-100" onclick="qrScanner.cancelCheckin()">
                                    <i class="fas fa-times me-2"></i>Annuler
                                </button>
                            </div>
                            <div class="col-6">
                                <button type="button" class="btn btn-success w-100" id="confirmCheckinBtn" onclick="qrScanner.confirmCheckin()">
                                    <i class="fas fa-check me-2"></i>Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCheckinEventListeners();
    }

    // ✅ Génération des motifs de visite
    generateVisitReasons() {
        const reasons = [
            { id: 'training', label: 'Entraînement personnel', icon: 'fas fa-dumbbell' },
            { id: 'class', label: 'Cours collectif', icon: 'fas fa-users' },
            { id: 'coaching', label: 'Séance coaching', icon: 'fas fa-chalkboard-teacher' },
            { id: 'swimming', label: 'Natation', icon: 'fas fa-swimmer' },
            { id: 'wellness', label: 'Espace bien-être', icon: 'fas fa-spa' },
            { id: 'other', label: 'Autre', icon: 'fas fa-ellipsis-h' }
        ];

        return reasons.map(reason => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="visitReason" 
                       id="reason_${reason.id}" value="${reason.id}" required>
                <label class="form-check-label" for="reason_${reason.id}">
                    <i class="${reason.icon} me-2"></i>${reason.label}
                </label>
            </div>
        `).join('');
    }

    // ✅ Génération des options d'activité
    generateActivityOptions() {
        const activities = [
            { value: '', label: 'Choisir une activité...' },
            { value: 'cardio', label: 'Cardio Training' },
            { value: 'strength', label: 'Musculation' },
            { value: 'crossfit', label: 'CrossFit' },
            { value: 'yoga', label: 'Yoga' },
            { value: 'pilates', label: 'Pilates' },
            { value: 'boxing', label: 'Boxe' },
            { value: 'swimming', label: 'Natation' },
            { value: 'spinning', label: 'Spinning' },
            { value: 'other', label: 'Autre activité' }
        ];

        return activities.map(activity => 
            `<option value="${activity.value}">${activity.label}</option>`
        ).join('');
    }

    // ✅ Configuration des écouteurs d'événements
    setupCheckinEventListeners() {
        const activitySelect = document.getElementById('activitySelect');
        const sessionSection = document.getElementById('sessionSection');

        if (activitySelect && sessionSection) {
            activitySelect.addEventListener('change', (e) => {
                const hasActivity = e.target.value && e.target.value !== '';
                sessionSection.style.display = hasActivity ? 'block' : 'none';
                this.validateCheckinForm();
            });
        }

        const form = document.getElementById('checkinForm');
        if (form) {
            form.addEventListener('change', this.validateCheckinForm.bind(this));
        }

        this.validateCheckinForm();
    }

    // ✅ Validation du formulaire
    validateCheckinForm() {
        const form = document.getElementById('checkinForm');
        const confirmBtn = document.getElementById('confirmCheckinBtn');
        
        if (!form || !confirmBtn) return;

        const visitReason = form.querySelector('input[name="visitReason"]:checked');
        const activity = document.getElementById('activitySelect').value;
        
        const isValid = visitReason && activity;
        confirmBtn.disabled = !isValid;
    }

    // ✅ Confirmation du check-in
    async confirmCheckin() {
        const form = document.getElementById('checkinForm');
        if (!form || !this.currentMember) {
            this.showAlert('Erreur: Données manquantes', 'error');
            return;
        }

        const formData = this.getCheckinFormData();
        
        if (!formData.visitReason || !formData.activity) {
            this.showAlert('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }

        try {
            this.showCheckinLoading();

            await this.submitCheckinData(formData);

            this.showCheckinSuccess(formData);

            setTimeout(() => {
                this.restartScanner();
            }, 3000);

        } catch (error) {
            console.error('❌ Erreur lors du check-in:', error);
            this.showAlert('Erreur lors de l\'enregistrement du check-in', 'error');
            this.hideCheckinLoading();
        }
    }

    // ✅ Récupération des données du formulaire
    getCheckinFormData() {
        const form = document.getElementById('checkinForm');
        const visitReason = form.querySelector('input[name="visitReason"]:checked');
        const sessionType = form.querySelector('input[name="sessionType"]:checked');
        
        return {
            member: this.currentMember,
            visitReason: visitReason?.value,
            activity: document.getElementById('activitySelect').value,
            sessionType: sessionType?.value,
            notes: document.getElementById('checkinNotes').value,
            timestamp: new Date().toISOString(),
            checkinId: 'CHK_' + Date.now()
        };
    }

    // ✅ Soumission des données de check-in
    async submitCheckinData(formData) {
        console.log('📤 Envoi des données de check-in:', formData);
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    console.log('✅ Check-in enregistré avec succès');
                    
                    this.saveCheckinToLocalStorage(formData);
                    resolve(formData);
                } else {
                    reject(new Error('Erreur serveur simulée'));
                }
            }, 1500);
        });
    }

    // ✅ Sauvegarde locale pour la démo
    saveCheckinToLocalStorage(formData) {
        try {
            const checkins = JSON.parse(localStorage.getItem('gymCheckins') || '[]');
            checkins.push(formData);
            localStorage.setItem('gymCheckins', JSON.stringify(checkins));
        } catch (error) {
            console.warn('Impossible de sauvegarder le check-in localement:', error);
        }
    }

    // ✅ Affichage du chargement
    showCheckinLoading() {
        const confirmBtn = document.getElementById('confirmCheckinBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <div class="spinner-border spinner-border-sm me-2"></div>
                Enregistrement...
            `;
        }
    }

    // ✅ Masquage du chargement
    hideCheckinLoading() {
        const confirmBtn = document.getElementById('confirmCheckinBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <i class="fas fa-check me-2"></i>Confirmer
            `;
        }
    }

    // ✅ Affichage de la confirmation de succès
    showCheckinSuccess(formData) {
        const scannerContainer = document.getElementById('scannerContainer');
        if (!scannerContainer) return;

        scannerContainer.innerHTML = `
            <div class="checkin-success text-center py-5">
                <div class="success-icon mb-4">
                    <i class="fas fa-check-circle text-success fa-5x"></i>
                </div>
                <h4 class="text-success mb-3">Check-in Réussi!</h4>
                <div class="success-details mb-4">
                    <p class="mb-2"><strong>${this.currentMember.firstName} ${this.currentMember.lastName}</strong></p>
                    <p class="text-muted mb-1">${this.getActivityLabel(formData.activity)}</p>
                    <p class="text-muted small">${new Date().toLocaleTimeString()}</p>
                </div>
                <div class="success-actions">
                    <button class="btn btn-outline-primary" onclick="qrScanner.restartScanner()">
                        <i class="fas fa-qrcode me-2"></i>Nouveau scan
                    </button>
                </div>
            </div>
        `;
    }

    // ✅ Obtenir le libellé de l'activité
    getActivityLabel(activityValue) {
        const activities = {
            'cardio': 'Cardio Training',
            'strength': 'Musculation',
            'crossfit': 'CrossFit',
            'yoga': 'Yoga',
            'pilates': 'Pilates',
            'boxing': 'Boxe',
            'swimming': 'Natation',
            'spinning': 'Spinning',
            'other': 'Autre activité'
        };
        return activities[activityValue] || activityValue;
    }

    // ✅ Annulation du check-in
    cancelCheckin() {
        if (confirm('Êtes-vous sûr de vouloir annuler ce check-in ?')) {
            this.showAlert('Check-in annulé', 'info');
            this.restartScanner();
        }
    }

    // ✅ Redémarrage du scanner après check-in
    async restartScanner() {
        const scannerContainer = document.getElementById('scannerContainer');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        if (scannerContainer) {
            scannerContainer.innerHTML = '';
        }
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
        }
        
        this.currentMember = null;
        
        await this.startScanner();
    }

    // ✅ Gestion membre non trouvé
    async handleMemberNotFound(registrationNumber, rawData) {
        console.log('❌ Membre non trouvé avec les données:', rawData);
        
        const errorMessage = `❌ Carte non reconnue: ${registrationNumber}`;
        this.showAlert(errorMessage, 'error');
        
        setTimeout(() => {
            if (confirm('Membre non trouvé. Voulez-vous l\'ajouter manuellement?')) {
                this.startManualEntry(registrationNumber);
            } else {
                this.restartScannerAfterDelay(2000);
            }
        }, 2000);
    }

    // ✅ Entrée manuelle
    startManualEntry(prefilledId = '') {
        this.showManualEntryInterface(prefilledId);
    }

    // ✅ Interface d'entrée manuelle
    showManualEntryInterface(prefilledId = '') {
        const scannerContainer = document.getElementById('scannerContainer');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        if (!scannerContainer) return;

        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'none';
        }

        scannerContainer.innerHTML = `
            <div class="manual-entry-interface">
                <div class="card shadow-lg">
                    <div class="card-header bg-info text-white text-center">
                        <h4 class="mb-0">
                            <i class="fas fa-keyboard me-2"></i>
                            Entrée Manuelle
                        </h4>
                    </div>
                    
                    <div class="card-body">
                        <form id="manualEntryForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Numéro de membre</label>
                                <input type="text" class="form-control" id="manualMemberId" 
                                       value="${prefilledId}" placeholder="Ex: M12345" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nom</label>
                                <input type="text" class="form-control" id="manualLastName" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Prénom</label>
                                <input type="text" class="form-control" id="manualFirstName" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Type d'adhésion</label>
                                <select class="form-select" id="manualMembershipType" required>
                                    <option value="">Choisir...</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Premium">Premium</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    
                    <div class="card-footer bg-light">
                        <div class="row g-2">
                            <div class="col-6">
                                <button type="button" class="btn btn-outline-secondary w-100" onclick="qrScanner.cancelManualEntry()">
                                    <i class="fas fa-arrow-left me-2"></i>Retour
                                </button>
                            </div>
                            <div class="col-6">
                                <button type="button" class="btn btn-primary w-100" onclick="qrScanner.submitManualEntry()">
                                    <i class="fas fa-save me-2"></i>Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ✅ Annulation entrée manuelle
    cancelManualEntry() {
        this.restartScanner();
    }

    // ✅ Soumission entrée manuelle
    submitManualEntry() {
        const memberId = document.getElementById('manualMemberId').value;
        const lastName = document.getElementById('manualLastName').value;
        const firstName = document.getElementById('manualFirstName').value;
        const membershipType = document.getElementById('manualMembershipType').value;

        if (!memberId || !lastName || !firstName || !membershipType) {
            this.showAlert('Veuillez remplir tous les champs', 'warning');
            return;
        }

        const newMember = {
            id: Date.now(),
            registrationNumber: memberId,
            firstName: firstName,
            lastName: lastName,
            membershipType: membershipType,
            membershipStatus: 'active',
            email: ''
        };

        this.showAlert(`Membre ${firstName} ${lastName} ajouté avec succès!`, 'success');
        
        setTimeout(() => {
            this.currentMember = newMember;
            this.showCheckinInterface(newMember);
        }, 1500);
    }

    // ✅ Restart avec délai
    async restartScannerAfterDelay(delay = 2000) {
        console.log(`🔄 Redémarrage du scanner dans ${delay}ms...`);
        
        if (this.scanningPaused && this.isScanning) {
            this.scanningPaused = false;
            return;
        }
        
        setTimeout(async () => {
            try {
                this.scanningPaused = false;
                
                if (!this.isScanning || !this.scannerActive) {
                    await this.startScanner();
                }
            } catch (error) {
                console.error('❌ Erreur redémarrage scanner:', error);
            }
        }, delay);
    }

    // ✅ Mise à jour de l'UI
    updateScannerUI(state) {
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const scannerContainer = document.getElementById('scannerContainer');
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');
        const scannerStatus = document.getElementById('scannerStatus');

        if (scannerContainer && scannerContainer.querySelector('.alert')) {
            scannerContainer.innerHTML = '';
        }

        switch (state) {
            case 'starting':
                if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
                if (scannerContainer) {
                    scannerContainer.style.display = 'block';
                    scannerContainer.innerHTML = `
                        <div class="scanner-loading text-center py-4">
                            <div class="spinner-border text-primary mb-2"></div>
                            <p>Initialisation du scanner...</p>
                        </div>
                    `;
                }
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) stopBtn.style.display = 'none';
                if (scannerStatus) scannerStatus.textContent = 'Initialisation...';
                break;
                
            case 'active':
                if (scannerContainer) {
                    scannerContainer.style.border = '3px solid #28a745';
                    scannerContainer.style.transition = 'border 0.3s ease';
                }
                if (startBtn) startBtn.style.display = 'none';
                if (stopBtn) stopBtn.style.display = 'block';
                if (scannerStatus) {
                    scannerStatus.textContent = 'Scanner actif';
                    scannerStatus.className = 'badge bg-success';
                }
                break;
                
            case 'stopped':
                if (cameraPlaceholder) {
                    cameraPlaceholder.style.display = 'flex';
                    cameraPlaceholder.innerHTML = `
                        <div class="text-center">
                            <i class="fas fa-camera fa-3x text-muted mb-3"></i>
                            <p class="mb-1">Scanner prêt</p>
                            <small class="text-muted">Cliquez pour activer le scanner</small>
                        </div>
                    `;
                }
                if (scannerContainer) {
                    scannerContainer.style.display = 'none';
                    if (scannerContainer.querySelector('#qrReader')) {
                        scannerContainer.innerHTML = '';
                    }
                    scannerContainer.style.border = '2px solid #dee2e6';
                }
                if (startBtn) {
                    startBtn.style.display = 'block';
                    startBtn.disabled = false;
                }
                if (stopBtn) stopBtn.style.display = 'none';
                if (scannerStatus) {
                    scannerStatus.textContent = this.libraryLoaded ? 'Scanner arrêté' : 'Bibliothèque manquante';
                    scannerStatus.className = this.libraryLoaded ? 'badge bg-secondary' : 'badge bg-warning';
                }
                break;

            case 'error':
                if (scannerStatus) {
                    scannerStatus.textContent = 'Erreur scanner';
                    scannerStatus.className = 'badge bg-danger';
                }
                break;
        }
    }

    // ✅ Affichage succès scan
    showScanSuccess() {
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            const originalBorder = scannerContainer.style.border;
            scannerContainer.style.border = '4px solid #28a745';
            scannerContainer.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
            scannerContainer.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                if (scannerContainer) {
                    scannerContainer.style.border = originalBorder;
                    scannerContainer.style.boxShadow = 'none';
                }
            }, 800);
        }
    }

    // ✅ Gestion des erreurs
    async handleScannerError(error) {
        console.error('🚨 Erreur scanner détaillée:', error);
        
        let errorMessage = 'Erreur inconnue du scanner';
        let errorType = 'error';
        let recoverable = false;
        
        const errorConfig = {
            'NotAllowedError': {
                message: '📵 Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.',
                type: 'warning',
                recoverable: true
            },
            'NotFoundError': {
                message: '📵 Aucune caméra détectée sur cet appareil.',
                type: 'error',
                recoverable: false
            },
            'NotSupportedError': {
                message: '📵 Votre navigateur ne supporte pas le scan QR. Essayez Chrome, Firefox ou Edge.',
                type: 'warning',
                recoverable: false
            },
            'NotReadableError': {
                message: '📵 Caméra déjà utilisée par une autre application.',
                type: 'warning',
                recoverable: true
            },
            'OverconstrainedError': {
                message: '📵 Configuration caméra non supportée.',
                type: 'warning',
                recoverable: true
            }
        };
        
        const config = errorConfig[error.name] || { 
            message: `📵 Erreur technique: ${error.message || error}`,
            type: 'error',
            recoverable: false
        };
        
        errorMessage = config.message;
        errorType = config.type;
        recoverable = config.recoverable;
        
        this.showAlert(errorMessage, errorType);
        this.updateScannerUI('error');
        
        await this.cleanupScanner();
        this.resetScannerState();
        
        if (recoverable) {
            setTimeout(() => {
                this.showRecoveryOptions();
            }, 2000);
        }
    }

    // ✅ Options de récupération
    showRecoveryOptions() {
        const recoveryHTML = `
            <div class="alert alert-warning mt-3">
                <h6>Options de récupération</h6>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-primary btn-sm" onclick="qrScanner.retryScanner()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="qrScanner.startManualEntry()">
                        <i class="fas fa-keyboard me-1"></i>Entrée manuelle
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="qrScanner.switchCamera()">
                        <i class="fas fa-sync me-1"></i>Changer de caméra
                    </button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('scannerContainer');
        if (container) {
            container.innerHTML += recoveryHTML;
        }
    }

    // ✅ Méthodes de recovery
    async retryScanner() {
        console.log('🔄 Nouvelle tentative de démarrage...');
        await this.cleanupScanner();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.startScanner();
    }

    async switchCamera() {
        console.log('🔄 Changement de caméra demandé...');
        
        if (!this.html5QrCode || !this.isScanning) {
            return this.startScanner();
        }
        
        try {
            const cameras = await Html5Qrcode.getCameras();
            const currentIndex = cameras.findIndex(cam => cam.id === this.currentCameraId);
            const nextIndex = (currentIndex + 1) % cameras.length;
            const nextCameraId = cameras[nextIndex].id;
            
            console.log(`🔄 Passage de la caméra ${currentIndex} à ${nextIndex}`);
            
            await this.stopScanner();
            this.currentCameraId = nextCameraId;
            return await this.startScanner();
            
        } catch (error) {
            console.error('❌ Erreur changement caméra:', error);
            this.showAlert('Erreur changement de caméra', 'error');
            return false;
        }
    }

    // ✅ Méthode showAlert
    showAlert(message, type = 'info') {
        console.log(`💬 Alerte [${type}]: ${message}`);
        
        if (window.attendance && typeof window.attendance.showAlert === 'function') {
            window.attendance.showAlert(message, type);
            return;
        }
        
        this.showFallbackAlert(message, type);
    }

    // ✅ Nettoyage complet
    async cleanup() {
        console.log('🧹 Nettoyage du scanner...');
        await this.stopScanner();
        await this.cleanupScanner();
        this.resetScannerState();
    }
}

// ✅ Instance unique
const qrScanner = new QRScanner();

// Gestion du cycle de vie
window.addEventListener('beforeunload', () => {
    if (window.qrScanner) {
        qrScanner.cleanup();
    }
});

window.addEventListener('pagehide', () => {
    if (window.qrScanner) {
        qrScanner.cleanup();
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Vérification du scanner QR...');
    setTimeout(() => {
        if (!qrScanner.libraryLoaded) {
            console.warn('⚠️ Scanner QR non disponible - bibliothèque manquante');
            qrScanner.showLibraryError();
        }
    }, 1000);
});

// Exposer pour le débogage
window.qrScanner = qrScanner;