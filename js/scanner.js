// QR Code Scanner System - Optimisé pour les cartes
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
    }

    async startScanner() {
        console.log('🎬 Démarrage du scanner pour cartes...');
        
        try {
            // Vérifier la bibliothèque
            if (typeof Html5Qrcode === 'undefined') {
                this.showAlert('Scanner non disponible. Rechargez la page.', 'error');
                return;
            }

            const scannerContainer = document.getElementById('scannerContainer');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');

            // Mise à jour UI
            if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'block';
            if (scannerContainer) {
                scannerContainer.style.display = 'block';
                scannerContainer.innerHTML = '<div id="qrReader" style="width: 100%;"></div>';
            }

            // Configuration optimisée pour les cartes
            this.html5QrCode = new Html5Qrcode("qrReader");
            
            const config = {
                fps: 15, // Augmenté pour plus de réactivité
                qrbox: { width: 300, height: 300 }, // Zone plus grande
                aspectRatio: 1.0,
                focusMode: "continuous" // Focus automatique
            };

            console.log('📷 Démarrage du scanner...');
            
            // Essayer d'abord la caméra arrière, puis la caméra avant
            try {
                await this.html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => this.onScanSuccess(decodedText),
                    (error) => console.log('🔍 Scan en cours...')
                );
            } catch (rearError) {
                console.log('📱 Essai caméra avant...');
                await this.html5QrCode.start(
                    { facingMode: "user" },
                    config,
                    (decodedText) => this.onScanSuccess(decodedText),
                    (error) => console.log('🔍 Scan en cours...')
                );
            }
            
            this.isScanning = true;
            console.log('✅ Scanner démarré avec succès');
            this.showAlert('Scanner activé! Pointez vers la carte QR code.', 'success');

        } catch (error) {
            console.error('❌ Erreur démarrage scanner:', error);
            this.handleScannerError(error);
        }
    }

    async stopScanner() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.isScanning = false;
                console.log('🛑 Scanner arrêté');
            } catch (error) {
                console.error('Erreur arrêt scanner:', error);
            }
        }
        this.resetScannerUI();
    }

    onScanSuccess(decodedText) {
        console.log('✅ QR Code détecté:', decodedText);
        
        // Arrêter le scanner temporairement
        this.stopScanner();
        
        // Traitement du QR code
        this.processQRCode(decodedText);
    }

    processQRCode(decodedText) {
        try {
            let memberData;
            
            // Essayer de parser comme JSON d'abord
            try {
                memberData = JSON.parse(decodedText);
                console.log('📋 QR code format JSON:', memberData);
            } catch (jsonError) {
                // Si ce n'est pas du JSON, traiter comme texte simple (numéro de membre)
                console.log('📋 QR code format texte:', decodedText);
                memberData = {
                    registrationNumber: decodedText.trim(),
                    firstName: "Membre",
                    lastName: "Scanné",
                    isFromCard: true
                };
            }

            // Valider les données
            if (!memberData.registrationNumber) {
                throw new Error('Numéro de membre manquant dans le QR code');
            }

            // Traiter le membre
            this.processScannedMember(memberData);
            
        } catch (error) {
            console.error('❌ Erreur traitement QR code:', error);
            this.showAlert('QR code invalide: ' + error.message, 'error');
            
            // Redémarrer après erreur
            setTimeout(() => this.startScanner(), 2000);
        }
    }

    processScannedMember(memberData) {
        console.log('🔍 Recherche du membre:', memberData.registrationNumber);

        // Nettoyer le numéro de membre
        const cleanRegistration = memberData.registrationNumber.toString().trim().toUpperCase();
        
        // Rechercher le membre
        const member = apiService.getMemberByRegistrationNumber(cleanRegistration);
        
        if (member) {
            console.log('✅ Membre trouvé:', member);
            
            // Feedback visuel
            this.showScanSuccess();
            
            // Transférer au système de présence
            if (window.attendance && window.attendance.processMemberCheckin) {
                setTimeout(() => {
                    window.attendance.processMemberCheckin(member);
                }, 500);
            }
            
            this.showAlert(`✅ Carte acceptée! Bienvenue ${member.firstName} ${member.lastName}`, 'success');
            
        } else {
            console.log('❌ Membre non trouvé:', cleanRegistration);
            this.showAlert(`❌ Carte non reconnue: ${cleanRegistration}`, 'error');
            
            // Redémarrer le scanner
            setTimeout(() => this.startScanner(), 3000);
        }
    }

    showScanSuccess() {
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            scannerContainer.style.border = '3px solid #28a745';
            scannerContainer.style.transition = 'border 0.3s ease';
            
            setTimeout(() => {
                scannerContainer.style.border = '2px solid #dee2e6';
            }, 1000);
        }
    }

    resetScannerUI() {
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const scannerContainer = document.getElementById('scannerContainer');
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');
        
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
            cameraPlaceholder.innerHTML = `
                <i class="fas fa-camera"></i>
                <p>Cliquez pour scanner une carte</p>
                <small class="text-muted mt-2">Approchez la carte QR code de la caméra</small>
            `;
        }
        if (scannerContainer) {
            scannerContainer.style.display = 'none';
            scannerContainer.innerHTML = '';
        }
        if (startBtn) startBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
    }

    handleScannerError(error) {
        console.error('🚨 Erreur scanner:', error);
        let errorMessage = 'Impossible d\'accéder à la caméra: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '📵 Permission refusée. Autorisez l\'accès caméra dans les paramètres de votre navigateur.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '📵 Aucune caméra détectée. Vérifiez votre appareil.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '📵 Navigateur non supporté. Utilisez Chrome ou Firefox.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '📵 Caméra utilisée par une autre application.';
        } else {
            errorMessage += error.message;
        }
        
        this.showAlert(errorMessage, 'error');
        this.resetScannerUI();
        
        // Proposer l'entrée manuelle
        setTimeout(() => {
            if (window.attendance && confirm('Scanner impossible. Voulez-vous utiliser l\'entrée manuelle?')) {
                window.attendance.startManualEntry();
            }
        }, 2000);
    }

    showAlert(message, type = 'info') {
        console.log(`💬 ${type}: ${message}`);
        
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            // Fallback
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
            alertDiv.style.zIndex = '9999';
            alertDiv.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                    <div>${message}</div>
                </div>
            `;
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }
    }

    getAlertIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            case 'warning': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }
}

// Create global instance
const qrScanner = new QRScanner();