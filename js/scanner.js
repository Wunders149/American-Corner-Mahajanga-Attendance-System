// ✅ QR Code Scanner System - Version corrigée (Problème caméra sans ID résolu)
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
        
        // Vérifier le chargement de la bibliothèque
        this.checkLibraryAvailability();
    }

    // Vérifier si la bibliothèque est disponible
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
                        <button class="btn btn-outline-secondary btn-sm" onclick="attendance.startManualEntry()">
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

    // Méthode pour réessayer le chargement
    retryLibraryLoad() {
        console.log('🔄 Réessai du chargement de la bibliothèque...');
        
        if (this.checkLibraryAvailability()) {
            this.showAlert('✅ Bibliothèque chargée! Vous pouvez maintenant utiliser le scanner.', 'success');
            this.updateScannerUI('stopped');
        } else {
            // Charger dynamiquement la bibliothèque depuis CloudFlare
            this.loadLibraryFromCloudFlare();
        }
    }

    // Chargement dynamique de la bibliothèque depuis CloudFlare
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
            
            // Réinitialiser les boutons
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

    async startScanner() {
        console.log('🎬 Démarrage du scanner QR...');

        // Vérifier d'abord la bibliothèque
        if (!this.checkLibraryAvailability()) {
            this.showAlert('❌ Scanner non disponible. Chargement de la bibliothèque...', 'warning');
            this.loadLibraryFromCloudFlare();
            return false;
        }

        // Empêcher double démarrage
        if (this.isScanning) {
            console.log('📱 Scanner déjà actif');
            this.showAlert('Scanner déjà en cours d\'utilisation', 'info');
            return true;
        }

        try {
            this.updateScannerUI('starting');
            
            // Petite latence visuelle pour une transition fluide
            await new Promise(r => setTimeout(r, 300));

            const scannerContainer = document.getElementById('scannerContainer');
            if (!scannerContainer) {
                throw new Error('Conteneur scanner non trouvé');
            }

            // Préparer le conteneur
            scannerContainer.innerHTML = '<div id="qrReader" style="width: 100%;"></div>';

            // Nettoyer l'instance précédente
            if (this.html5QrCode) {
                await this.cleanupScanner();
            }

            // Créer nouvelle instance
            this.html5QrCode = new Html5Qrcode("qrReader");

            console.log('📷 Recherche de caméras disponibles...');

            // ✅ CORRECTION CRITIQUE : Demander les permissions AVANT de lister les caméras
            await this.checkCameraPermissions();

            const cameras = await Html5Qrcode.getCameras();
            console.log(`📱 Caméras détectées: ${cameras.length}`, cameras);

            if (cameras.length === 0) {
                throw new Error('Aucune caméra détectée');
            }

            // ✅ CORRECTION : Gérer le cas où les caméras n'ont pas d'ID (permissions non accordées)
            const camerasWithValidId = cameras.filter(cam => cam.id && cam.id.trim() !== '');
            
            if (camerasWithValidId.length === 0) {
                console.warn('⚠️ Toutes les caméras ont un ID vide, tentative de rechargement après permission...');
                
                // Réessayer avec permissions fraîches
                await new Promise(r => setTimeout(r, 500));
                await this.checkCameraPermissions(true); // Forcer la demande
                
                const refreshedCameras = await Html5Qrcode.getCameras();
                console.log('🔄 Caméras après rechargement:', refreshedCameras);
                
                if (refreshedCameras.length === 0) {
                    throw new Error('Aucune caméra disponible après autorisation');
                }
                
                // Sélectionner avec les caméras rafraîchies
                const cameraId = this.selectBestCamera(refreshedCameras);
                this.currentCameraId = cameraId;
            } else {
                // Sélection normale avec caméras valides
                const cameraId = this.selectBestCamera(cameras);
                this.currentCameraId = cameraId;
            }

            // VÉRIFICATION CRITIQUE : s'assurer qu'on a un ID de caméra valide
            if (!this.currentCameraId) {
                throw new Error('Aucune caméra valide sélectionnée après toutes les tentatives');
            }
            
            console.log('📷 Caméra sélectionnée:', this.currentCameraId);

            const config = {
                fps: 15, // Augmenté pour meilleure réactivité
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                rememberLastUsedCamera: true
            };

            console.log('🚀 Lancement du flux vidéo...');
            
            await this.html5QrCode.start(
                this.currentCameraId,
                config,
                (decodedText) => {
                    if (this.scanningPaused) return;
                    this.onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Ignorer les messages d'erreur normaux pendant la lecture
                    if (!errorMessage || /NotFound|Timeout|Busy/.test(errorMessage)) return;
                    console.log('🔍 Lecture en cours...', errorMessage);
                }
            ).catch(error => {
                console.error('❌ Erreur démarrage scanner:', error);
                throw error;
            });

            this.isScanning = true;
            this.scannerActive = true;
            this.scanningPaused = false;

            console.log('🎉 Scanner opérationnel!');
            this.updateScannerUI('active');
            this.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'success');

            return true;

        } catch (error) {
            console.error('❌ Erreur critique:', error);
            await this.handleScannerError(error);
            return false;
        }
    }

    // ✅ CORRECTION : Méthode checkCameraPermissions améliorée
    async checkCameraPermissions(forcePrompt = false) {
        try {
            // Vérifier d'abord si l'API est disponible
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

            // Si forcePrompt, on utilise une configuration qui déclenchera la demande
            if (forcePrompt) {
                constraints.video.facingMode = { exact: 'environment' };
            }

            console.log('🔐 Vérification des permissions caméra...');
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Arrêter immédiatement le stream de test
            stream.getTracks().forEach(track => {
                track.stop();
            });
            
            console.log('✅ Permissions caméra accordées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur permissions caméra:', error);
            
            // Messages d'erreur plus spécifiques
            if (error.name === 'NotAllowedError') {
                throw new Error('Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Aucune caméra détectée sur cet appareil.');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra.');
            } else if (error.name === 'OverconstrainedError') {
                // Relancer avec des contraintes plus souples
                console.log('🔄 Contraintes trop strictes, tentative avec contraintes relâchées...');
                return await this.checkCameraPermissionsWithRelaxedConstraints();
            } else {
                throw new Error(`Accès caméra impossible: ${error.message}`);
            }
        }
    }

    // Fallback pour contraintes trop strictes
    async checkCameraPermissionsWithRelaxedConstraints() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true // Contraintes minimales
            });
            
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Permissions accordées avec contraintes relâchées');
            return true;
        } catch (error) {
            throw new Error(`Accès caméra impossible même avec contraintes minimales: ${error.message}`);
        }
    }

    // ✅ CORRECTION CRITIQUE : selectBestCamera améliorée pour gérer les IDs vides
    selectBestCamera(cameras) {
        if (!cameras || cameras.length === 0) {
            console.error('❌ Aucune caméra disponible');
            return null;
        }

        console.log('🔍 Sélection de la meilleure caméra parmi:', cameras.length, 'caméras');

        // ✅ CORRECTION : Accepter les caméras sans ID valide en dernier recours
        const validCameras = cameras.filter(cam => cam && (cam.id && cam.id.trim() !== ''));
        const fallbackCameras = cameras.filter(cam => cam && (!cam.id || cam.id.trim() === ''));

        console.log(`📊 Caméras valides: ${validCameras.length}, Fallback: ${fallbackCameras.length}`);

        // Priorité 1: Utiliser d'abord les caméras avec ID valide
        if (validCameras.length > 0) {
            console.log('🎯 Utilisation des caméras avec ID valide');
            return this.selectFromValidCameras(validCameras);
        }

        // ✅ CORRECTION : Fallback pour caméras sans ID valide
        if (fallbackCameras.length > 0) {
            console.warn('⚠️ Aucune caméra avec ID valide, utilisation du fallback...');
            return this.selectFromFallbackCameras(fallbackCameras);
        }

        console.error('❌ Aucune caméra utilisable trouvée');
        return null;
    }

    selectFromValidCameras(validCameras) {
        // Priorité 1: Caméra arrière
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

        // Priorité 2: Caméra principale (face arrière par défaut sur mobile)
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

        // Fallback: Première caméra valide disponible
        console.log('📷 Première caméra valide utilisée:', validCameras[0].label || validCameras[0].deviceId);
        return validCameras[0].id;
    }

    selectFromFallbackCameras(fallbackCameras) {
        // ✅ CORRECTION : Utiliser facingMode comme fallback quand pas d'ID
        const rearFallback = fallbackCameras.find(cam => {
            const label = (cam.label || '').toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('arrière');
        });

        if (rearFallback) {
            console.log('📷 Fallback caméra arrière (sans ID):', rearFallback.label || 'Caméra inconnue');
            // html5-qrcode accepte un objet de configuration quand pas d'ID
            return { facingMode: "environment" };
        }

        // Fallback général
        console.log('📷 Fallback caméra par défaut (sans ID)');
        return { facingMode: "environment" }; // Laisser le navigateur choisir
    }

    async stopScanner() {
        console.log('🛑 Arrêt du scanner demandé...');
        
        if (!this.html5QrCode || !this.isScanning) {
            console.log('ℹ️ Scanner déjà arrêté');
            this.resetScannerState();
            return true;
        }

        try {
            // Mettre en pause avant l'arrêt pour éviter les conflits
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

    async cleanupScanner() {
        if (this.html5QrCode) {
            try {
                // Vérifier si le scanner est actif - méthode plus robuste
                const scannerState = this.html5QrCode.getState && this.html5QrCode.getState();
                const isScannerActive = scannerState && scannerState !== 'STOPPED';
                
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

    // ✅ CORRECTION : Gestion des scans avec throttling
    onScanSuccess(decodedText) {
        const now = Date.now();
        
        // Éviter les scans trop rapprochés
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
            } finally {
                // Redémarrer le scanner après traitement avec délai réduit
                await this.restartScannerAfterDelay(1000);
            }
        }, 500); // Délai réduit pour meilleure UX
    }

    async processQRCode(decodedText) {
        try {
            console.log('🔍 Analyse du QR code...');
            
            let memberData;
            let isFromCard = false;
            
            // Essayer de parser comme JSON
            try {
                memberData = JSON.parse(decodedText);
                console.log('📋 Format JSON détecté:', memberData);
                
                // Validation des données JSON
                if (!memberData.registrationNumber && !memberData.memberId) {
                    throw new Error('Données membre manquantes dans le QR code');
                }
                
            } catch (jsonError) {
                // Traiter comme texte simple (numéro de membre)
                console.log('📋 Format texte détecté:', decodedText);
                memberData = {
                    registrationNumber: decodedText.trim(),
                    isFromCard: true
                };
                isFromCard = true;
            }

            // Normaliser le numéro d'inscription
            const registrationNumber = this.normalizeRegistrationNumber(
                memberData.registrationNumber || memberData.memberId || decodedText
            );

            if (!registrationNumber) {
                throw new Error('Numéro de membre invalide');
            }

            console.log('🔍 Recherche du membre:', registrationNumber);

            // Rechercher le membre
            const member = apiService.getMemberByRegistrationNumber(registrationNumber);
            
            if (member) {
                console.log('✅ Membre trouvé:', member);
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

    normalizeRegistrationNumber(regNumber) {
        if (!regNumber) return null;
        
        return regNumber.toString()
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, ''); // Nettoyer les caractères spéciaux
    }

    async handleMemberFound(member, isFromCard) {
        const welcomeMessage = isFromCard ? 
            `✅ Carte acceptée! Bienvenue ${member.firstName} ${member.lastName}` :
            `✅ Membre reconnu! Bienvenue ${member.firstName} ${member.lastName}`;
        
        this.showAlert(welcomeMessage, 'success');
        
        // Transférer au système de présence
        if (window.attendance && window.attendance.processMemberCheckin) {
            // Petit délai pour laisser voir le message
            setTimeout(() => {
                window.attendance.processMemberCheckin(member);
            }, 1500);
        } else {
            console.warn('Système de présence non disponible');
            // Fallback local
            this.showAlert(`Présence enregistrée pour ${member.firstName} ${member.lastName}`, 'info');
        }
    }

    async handleMemberNotFound(registrationNumber, rawData) {
        console.log('❌ Membre non trouvé avec les données:', rawData);
        
        const errorMessage = `❌ Carte non reconnue: ${registrationNumber}`;
        this.showAlert(errorMessage, 'error');
        
        // Proposer l'ajout manuel si c'est une nouvelle carte
        setTimeout(() => {
            if (window.attendance && confirm('Membre non trouvé. Voulez-vous l\'ajouter manuellement?')) {
                window.attendance.startManualEntry(registrationNumber);
            }
        }, 2000);
    }

    async restartScannerAfterDelay(delay = 2000) {
        console.log(`🔄 Redémarrage du scanner dans ${delay}ms...`);
        
        // Réactiver le scanning après le délai
        setTimeout(async () => {
            try {
                this.scanningPaused = false;
                // Si le scanner est toujours actif, on le laisse continuer
                if (this.isScanning && this.html5QrCode) {
                    console.log('🔄 Scanner déjà actif, réactivation du scanning');
                    return;
                }
                
                // Sinon redémarrer complètement
                await this.startScanner();
            } catch (error) {
                console.error('❌ Erreur redémarrage scanner:', error);
            }
        }, delay);
    }

    updateScannerUI(state) {
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const scannerContainer = document.getElementById('scannerContainer');
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');
        const scannerStatus = document.getElementById('scannerStatus');

        // Masquer les messages d'erreur de bibliothèque si on change d'état
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
                    scannerContainer.innerHTML = '';
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
                
            case 'library_missing':
                if (scannerStatus) {
                    scannerStatus.textContent = 'Bibliothèque manquante';
                    scannerStatus.className = 'badge bg-warning';
                }
                break;
        }
    }

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

    async handleScannerError(error) {
        console.error('🚨 Erreur scanner détaillée:', error);
        
        let errorMessage = 'Erreur inconnue du scanner';
        let errorType = 'error';
        let recoverable = false;
        
        // Classification des erreurs
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
        
        // Proposition de recovery seulement si c'est récupérable
        if (recoverable) {
            setTimeout(() => {
                this.showRecoveryOptions();
            }, 2000);
        }
    }

    // ✅ NOUVEAU : Options de récupération
    showRecoveryOptions() {
        const recoveryHTML = `
            <div class="alert alert-warning mt-3">
                <h6>Options de récupération</h6>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-primary btn-sm" onclick="qrScanner.retryScanner()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="attendance.startManualEntry()">
                        <i class="fas fa-keyboard me-1"></i>Entrée manuelle
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="qrScanner.switchCamera()">
                        <i class="fas fa-sync me-1"></i>Changer de caméra
                    </button>
                </div>
            </div>
        `;
        
        // Injecter dans l'interface
        const container = document.getElementById('scannerContainer');
        if (container) {
            container.innerHTML += recoveryHTML;
        }
    }

    // ✅ NOUVEAU : Méthodes de recovery
    async retryScanner() {
        console.log('🔄 Nouvelle tentative de démarrage...');
        await this.cleanup();
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
        // Supprimer les alertes existantes
        const existingAlerts = document.querySelectorAll('.qr-scanner-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} qr-scanner-alert position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.maxWidth = '90vw';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
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

    // 🔧 MÉTHODES DE DIAGNOSTIC ET D'ADMINISTRATION

    async getScannerStatus() {
        const status = {
            isScanning: this.isScanning,
            scannerActive: this.scannerActive,
            scanningPaused: this.scanningPaused,
            html5QrCode: !!this.html5QrCode,
            libraryLoaded: this.libraryLoaded,
            currentCameraId: this.currentCameraId,
            camerasAvailable: await this.checkCamerasAvailability()
        };

        if (this.html5QrCode && this.html5QrCode.getState) {
            status.scannerState = this.html5QrCode.getState();
        }

        return status;
    }

    async checkCamerasAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return {
                available: videoDevices.length > 0,
                count: videoDevices.length,
                devices: videoDevices.map(d => ({ id: d.deviceId, label: d.label || 'Caméra inconnue' }))
            };
        } catch (error) {
            console.error('Erreur vérification caméras:', error);
            return { available: false, error: error.message };
        }
    }

    // Nettoyage complet
    async cleanup() {
        console.log('🧹 Nettoyage du scanner...');
        await this.stopScanner();
        await this.cleanupScanner();
        this.resetScannerState();
    }

    // ✅ NOUVEAU : Méthode de diagnostic complète
    async runDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            library: {
                loaded: this.libraryLoaded,
                version: Html5QrcodeVersion || 'unknown'
            },
            permissions: await this.checkCameraPermissions().catch(e => e.message),
            cameras: await this.checkCamerasAvailability(),
            scanner: await this.getScannerStatus(),
            environment: {
                isSecure: window.location.protocol === 'https:',
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                isTouch: 'ontouchstart' in window
            }
        };
        
        console.log('🔍 Diagnostics complets:', diagnostics);
        return diagnostics;
    }
}

// ✅ UNE SEULE INSTANCE
const qrScanner = new QRScanner();

// Gestion automatique du cycle de vie
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

// Vérification au chargement de la page
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