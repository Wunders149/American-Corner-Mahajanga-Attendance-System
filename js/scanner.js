// ✅ QR Code Scanner System - Version stabilisée et fluide
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.scannerActive = false;
    }

    async startScanner() {
        console.log('🎬 Démarrage du scanner QR...');

        // Empêcher double démarrage
        if (this.isScanning) {
            console.log('📱 Scanner déjà actif');
            return;
        }

        try {
            this.updateScannerUI('starting');

            // Vérifier la bibliothèque Html5Qrcode
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error('Bibliothèque Html5Qrcode non chargée');
            }

            console.log('📦 Bibliothèque scanner disponible');

            const scannerContainer = document.getElementById('scannerContainer');
            if (!scannerContainer) throw new Error('Conteneur scanner non trouvé');

            scannerContainer.innerHTML = '<div id="qrReader" style="width: 100%;"></div>';

            // 🧩 Correction : nettoyage de l'instance précédente avant de redémarrer
            if (this.html5QrCode) {
                await this.stopScanner();
            }

            this.html5QrCode = new Html5Qrcode("qrReader");

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
            };

            console.log('📷 Recherche de caméras disponibles...');

            const cameras = await Html5Qrcode.getCameras();
            console.log(`📱 Caméras détectées: ${cameras.length}`);

            if (cameras.length === 0) {
                throw new Error('Aucune caméra détectée');
            }

            // Choisir la caméra arrière si possible
            let cameraId = cameras[0].id;
            const rearCamera = cameras.find(cam =>
                cam.label.toLowerCase().includes('back') ||
                cam.label.toLowerCase().includes('rear') ||
                cam.label.toLowerCase().includes('arrière')
            );
            if (rearCamera) {
                cameraId = rearCamera.id;
                console.log('📷 Caméra arrière sélectionnée');
            } else {
                console.log('📷 Caméra par défaut utilisée');
            }

            // 🧩 Correction : test permission caméra avant lancement
            await navigator.mediaDevices.getUserMedia({ video: true });

            console.log('🚀 Lancement du flux vidéo...');
            await this.html5QrCode.start(
                cameraId,
                config,
                (decodedText) => {
                    console.log('✅ QR Code détecté:', decodedText);
                    this.onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    if (!errorMessage || /NotFound|Timeout|Busy/.test(errorMessage)) return;
                    console.log('🔍 Lecture en cours...', errorMessage);
                }
            );

            this.isScanning = true;
            this.scannerActive = true;
            console.log('🎉 Scanner opérationnel!');

            this.updateScannerUI('active');
            this.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'success');

        } catch (error) {
            console.error('❌ Erreur critique:', error);
            this.handleScannerError(error);
        }
    }

    async stopScanner() {
        console.log('🛑 Arrêt du scanner demandé...');
        if (!this.html5QrCode) {
            this.isScanning = false;
            this.scannerActive = false;
            this.updateScannerUI('stopped');
            return;
        }

        try {
            await this.html5QrCode.stop();
            await this.html5QrCode.clear();
            console.log('✅ Scanner arrêté proprement');
        } catch (error) {
            console.warn('⚠️ Problème à l\'arrêt:', error);
        } finally {
            this.isScanning = false;
            this.scannerActive = false;
            this.updateScannerUI('stopped');
        }
    }

    onScanSuccess(decodedText) {
        console.log('📱 QR Code détecté:', decodedText);
        this.showScanSuccess();
        this.stopScanner();

        setTimeout(() => this.processQRCode(decodedText), 500);
    }

    updateScannerUI(state) {
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const scannerContainer = document.getElementById('scannerContainer');
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');

        switch (state) {
            case 'starting':
                if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
                if (scannerContainer) scannerContainer.style.display = 'block';
                if (startBtn) startBtn.style.display = 'none';
                if (stopBtn) stopBtn.style.display = 'block';
                break;
                
            case 'active':
                if (scannerContainer) {
                    scannerContainer.style.border = '3px solid #28a745';
                    scannerContainer.style.transition = 'border 0.3s ease';
                }
                break;
                
            case 'stopped':
                if (cameraPlaceholder) {
                    cameraPlaceholder.style.display = 'flex';
                    cameraPlaceholder.innerHTML = `
                        <i class="fas fa-camera"></i>
                        <p>Scanner prêt</p>
                        <small class="text-muted mt-2">Cliquez pour activer le scanner</small>
                    `;
                }
                if (scannerContainer) {
                    scannerContainer.style.display = 'none';
                    scannerContainer.innerHTML = '';
                    scannerContainer.style.border = '2px solid #dee2e6';
                }
                if (startBtn) startBtn.style.display = 'block';
                if (stopBtn) stopBtn.style.display = 'none';
                break;
        }
    }

    showScanSuccess() {
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            scannerContainer.style.border = '4px solid #28a745';
            scannerContainer.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
            
            setTimeout(() => {
                if (scannerContainer) {
                    scannerContainer.style.border = '3px solid #28a745';
                    scannerContainer.style.boxShadow = 'none';
                }
            }, 800);
        }
    }

    processQRCode(decodedText) {
        try {
            console.log('🔍 Analyse du QR code...');
            
            let memberData;
            
            // Essayer de parser comme JSON
            try {
                memberData = JSON.parse(decodedText);
                console.log('📋 Format JSON détecté:', memberData);
            } catch (jsonError) {
                // Traiter comme texte simple (numéro de membre)
                console.log('📋 Format texte détecté:', decodedText);
                memberData = {
                    registrationNumber: decodedText.trim(),
                    firstName: "Membre",
                    lastName: "Scanné",
                    isFromCard: true
                };
            }

            // Validation basique
            if (!memberData.registrationNumber) {
                throw new Error('Numéro de membre manquant dans le QR code');
            }

            // Nettoyer le numéro
            const cleanRegNumber = memberData.registrationNumber.toString().trim().toUpperCase();
            console.log('🔍 Recherche du membre:', cleanRegNumber);

            // Rechercher le membre
            const member = apiService.getMemberByRegistrationNumber(cleanRegNumber);
            
            if (member) {
                console.log('✅ Membre trouvé:', member);
                this.handleMemberFound(member);
            } else {
                console.log('❌ Membre non trouvé');
                this.handleMemberNotFound(cleanRegNumber);
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement QR code:', error);
            this.showAlert('QR code invalide: ' + error.message, 'error');
            this.restartScannerAfterDelay();
        }
    }

    handleMemberFound(member) {
        this.showAlert(`✅ Carte acceptée! Bienvenue ${member.firstName} ${member.lastName}`, 'success');
        
        // Transférer au système de présence
        if (window.attendance && window.attendance.processMemberCheckin) {
            setTimeout(() => {
                window.attendance.processMemberCheckin(member);
            }, 1000);
        }
    }

    handleMemberNotFound(registrationNumber) {
        this.showAlert(`❌ Carte non reconnue: ${registrationNumber}`, 'error');
        this.restartScannerAfterDelay();
    }

    restartScannerAfterDelay() {
        console.log('🔄 Redémarrage du scanner dans 3 secondes...');
        setTimeout(() => {
            this.startScanner();
        }, 3000);
    }

    handleScannerError(error) {
        console.error('🚨 Erreur scanner détaillée:', error);
        
        let errorMessage = 'Erreur inconnue';
        let errorType = 'error';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '📵 Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.';
            errorType = 'warning';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '📵 Aucune caméra détectée sur cet appareil.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '📵 Votre navigateur ne supporte pas le scan QR. Essayez Chrome, Firefox ou Edge.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '📵 Caméra déjà utilisée par une autre application.';
        } else if (error.message && error.message.includes('No MultiFormat Readers')) {
            errorMessage = '📵 Problème de compatibilité. Essayez un autre navigateur.';
        } else if (error.message && error.message.includes('Could not start video stream')) {
            errorMessage = '📵 Impossible de démarrer le flux vidéo. Vérifiez votre caméra.';
        } else {
            errorMessage = `📵 Erreur technique: ${error.message || error}`;
        }
        
        this.showAlert(errorMessage, errorType);
        this.updateScannerUI('stopped');
        
        // Proposer l'entrée manuelle après un délai
        setTimeout(() => {
            if (window.attendance && confirm('Scanner impossible. Voulez-vous utiliser l\'entrée manuelle?')) {
                window.attendance.startManualEntry();
            }
        }, 2000);
    }

    showAlert(message, type = 'info') {
        console.log(`💬 Alerte [${type}]: ${message}`);
        
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            // Fallback robuste
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
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

    // Méthode de diagnostic pour le débogage
    getScannerStatus() {
        return {
            isScanning: this.isScanning,
            scannerActive: this.scannerActive,
            html5QrCode: !!this.html5QrCode,
            libraryLoaded: typeof Html5Qrcode !== 'undefined',
            camerasAvailable: this.checkCamerasAvailability()
        };
    }

    async checkCamerasAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Erreur vérification caméras:', error);
            return false;
        }
    }

    // Méthode pour forcer le redémarrage du scanner
    async forceRestartScanner() {
        console.log('🔄 Forcer le redémarrage du scanner...');
        await this.stopScanner();
        
        // Petit délai pour s'assurer que tout est nettoyé
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.startScanner();
    }

    // Nettoyage complet quand la page est quittée
    cleanup() {
        if (this.html5QrCode && this.isScanning) {
            this.stopScanner().catch(console.error);
        }
    }
}

// Create global instance
const qrScanner = new QRScanner();

// Nettoyage automatique quand la page est quittée
window.addEventListener('beforeunload', () => {
    if (window.qrScanner) {
        qrScanner.cleanup();
    }
});

// Gestion des changements de page dans notre SPA
window.addEventListener('pagehide', () => {
    if (window.qrScanner) {
        qrScanner.cleanup();
    }
});