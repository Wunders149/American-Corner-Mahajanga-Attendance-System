// QR Code Scanner System
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.scannerInitialized = false;
    }

    async startScanner() {
        console.log('🎬 Démarrage du scanner QR...');
        
        try {
            // Vérifier si la bibliothèque est disponible
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error('Bibliothèque scanner non chargée');
            }

            const scannerContainer = document.getElementById('scannerContainer');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');

            if (!scannerContainer) {
                throw new Error('Container scanner non trouvé');
            }

            // Mise à jour UI
            if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'block';
            
            scannerContainer.style.display = 'block';
            scannerContainer.innerHTML = '<div id="qrReader" style="width: 100%;"></div>';

            // Initialiser le scanner
            this.html5QrCode = new Html5Qrcode("qrReader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Démarrer le scanner
            await this.html5QrCode.start(
                { facingMode: "environment" },
                config,
                this.onScanSuccess.bind(this),
                this.onScanFailure.bind(this)
            );
            
            this.isScanning = true;
            this.scannerInitialized = true;
            console.log('✅ Scanner démarré avec succès');
            
            if (window.attendance) {
                window.attendance.showAlert('Scanner activé! Pointez vers un QR code.', 'success');
            }

        } catch (error) {
            console.error('❌ Erreur démarrage scanner:', error);
            this.handleScannerError(error);
        }
    }

    async stopScanner() {
        console.log('🛑 Arrêt du scanner...');
        
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.isScanning = false;
                console.log('✅ Scanner arrêté');
            } catch (error) {
                console.error('Erreur arrêt scanner:', error);
            }
        }
        
        this.resetScannerUI();
    }

    onScanSuccess(decodedText) {
        console.log('✅ QR Code scanné:', decodedText);
        
        // Arrêter le scanner temporairement
        this.stopScanner();
        
        try {
            const memberData = JSON.parse(decodedText);
            this.processScannedMember(memberData);
        } catch (error) {
            console.error('❌ QR code invalide:', error);
            this.showAlert('QR code invalide. Format incorrect.', 'error');
            
            // Redémarrer après erreur
            setTimeout(() => this.startScanner(), 2000);
        }
    }

    onScanFailure(error) {
        // Ignorer les erreurs normales de scan
        if (error && !error.includes('NotFoundException')) {
            console.log('🔍 Scan en cours...');
        }
    }

    processScannedMember(memberData) {
        if (!memberData.registrationNumber) {
            this.showAlert('QR code invalide: numéro manquant', 'error');
            return;
        }

        console.log('👤 Traitement membre:', memberData.registrationNumber);

        if (typeof apiService === 'undefined') {
            this.showAlert('Erreur: service indisponible', 'error');
            return;
        }

        const member = apiService.getMemberByRegistrationNumber(memberData.registrationNumber);
        
        if (member) {
            this.showAlert(`✅ Bienvenue ${member.firstName} ${member.lastName}!`, 'success');
            
            // Transférer à attendance system
            if (window.attendance) {
                window.attendance.processMemberCheckin(member);
            }
        } else {
            this.showAlert('❌ Membre non trouvé', 'error');
            setTimeout(() => this.startScanner(), 3000);
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
                <p>Cliquez pour activer le scanner</p>
                <small class="text-muted mt-2">Scannez les QR codes des membres</small>
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
        let errorMessage = 'Erreur caméra: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Permission caméra refusée. Autorisez l\'accès dans les paramètres.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Aucune caméra détectée sur cet appareil.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Votre navigateur ne supporte pas le scan QR. Essayez Chrome ou Firefox.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Caméra déjà utilisée par une autre application.';
        } else {
            errorMessage += error.message;
        }
        
        this.showAlert(errorMessage, 'error');
        this.resetScannerUI();
    }

    showAlert(message, type = 'info') {
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            // Fallback simple
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
            alertDiv.style.zIndex = '9999';
            alertDiv.innerHTML = message;
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }
    }
}

// Create global instance
const qrScanner = new QRScanner();