// QR Code Scanner System
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.isAvailable = false;
        this.init();
    }

    async init() {
        await this.checkScannerAvailability();
    }

    async checkScannerAvailability() {
        try {
            if (typeof Html5Qrcode === 'undefined') {
                console.warn('📵 Bibliothèque Html5Qrcode non chargée');
                this.isAvailable = false;
                return;
            }

            const cameras = await Html5Qrcode.getCameras();
            this.isAvailable = cameras && cameras.length > 0;
            
            if (this.isAvailable) {
                console.log('✅ Scanner disponible avec', cameras.length, 'caméra(s)');
            } else {
                console.warn('📵 Aucune caméra disponible');
            }
        } catch (error) {
            console.warn('📵 Scanner non disponible:', error.message);
            this.isAvailable = false;
        }
    }

    async startScanner() {
        if (!this.isAvailable) {
            this.showAlert('Scanner non disponible sur cet appareil', 'error');
            return;
        }

        try {
            console.log('🎥 Démarrage du scanner...');
            
            const cameras = await Html5Qrcode.getCameras();
            const scannerContainer = document.getElementById('scannerContainer');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');

            // Mise à jour de l'interface
            cameraPlaceholder.style.display = 'none';
            scannerContainer.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';

            // Initialisation du scanner
            this.html5QrCode = new Html5Qrcode("qrReader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Sélection de la caméra
            let cameraId = cameras[0].id;
            if (cameras.length > 1) {
                const rearCamera = cameras.find(cam => 
                    cam.label.toLowerCase().includes('back') || 
                    cam.label.toLowerCase().includes('arrière') ||
                    cam.label.toLowerCase().includes('rear')
                );
                cameraId = rearCamera ? rearCamera.id : cameras[1].id;
            }

            await this.html5QrCode.start(
                cameraId,
                config,
                (decodedText) => this.onScanSuccess(decodedText),
                () => this.onScanFailure()
            );
            
            this.isScanning = true;
            this.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'info');

        } catch (error) {
            console.error('❌ Erreur démarrage scanner:', error);
            this.handleScannerError(error);
        }
    }

    async stopScanner() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.isScanning = false;
                this.resetScannerUI();
                console.log('🛑 Scanner arrêté');
            } catch (error) {
                console.error('❌ Erreur arrêt scanner:', error);
            }
        }
    }

    onScanSuccess(decodedText) {
        console.log('📱 QR Code détecté:', decodedText);
        
        try {
            const memberData = JSON.parse(decodedText);
            
            if (this.isValidMemberData(memberData)) {
                this.stopScanner();
                this.processScannedMember(memberData);
                this.showScanSuccess();
            } else {
                throw new Error('Format QR code invalide');
            }
            
        } catch (error) {
            console.error('❌ Erreur scan:', error);
            this.showAlert('QR code invalide ou format incorrect', 'error');
            
            setTimeout(() => {
                if (!this.isScanning) {
                    this.startScanner();
                }
            }, 2000);
        }
    }

    onScanFailure() {
        // Erreurs normales pendant le scan
    }

    isValidMemberData(memberData) {
        return memberData && 
               memberData.registrationNumber && 
               memberData.firstName && 
               memberData.lastName;
    }

    processScannedMember(memberData) {
        const member = apiService.getMemberByRegistrationNumber(memberData.registrationNumber);
        
        if (member) {
            this.updateSessionInterface(member);
            this.showAlert(`✅ Bienvenue ${member.firstName} ${member.lastName}!`, 'success');
        } else {
            this.showAlert('❌ Membre non trouvé dans la base de données', 'error');
            setTimeout(() => this.startScanner(), 3000);
        }
    }

    updateSessionInterface(member) {
        document.getElementById('scannedMemberName').textContent = `${member.firstName} ${member.lastName}`;
        document.getElementById('scannedMemberId').textContent = member.registrationNumber;
        document.getElementById('checkInTime').textContent = new Date().toLocaleString();
        document.getElementById('sessionDetails').style.display = 'block';
        
        if (window.attendance) {
            window.attendance.currentSession = {
                memberId: member.registrationNumber,
                name: `${member.firstName} ${member.lastName}`,
                checkInTime: new Date().toISOString(),
                memberData: member
            };
        }
    }

    showScanSuccess() {
        const scannerContainer = document.getElementById('scannerContainer');
        if (scannerContainer) {
            scannerContainer.style.border = '3px solid #28a745';
            setTimeout(() => {
                scannerContainer.style.border = '';
            }, 1000);
        }
    }

    showAlert(message, type = 'info') {
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    handleScannerError(error) {
        let errorMessage = 'Erreur caméra: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '📵 Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '📵 Aucune caméra détectée sur cet appareil.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '📵 Votre navigateur ne supporte pas la fonction de scan.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '📵 Caméra déjà utilisée par une autre application.';
        } else {
            errorMessage += error.message;
        }
        
        this.showAlert(errorMessage, 'error');
        this.resetScannerUI();
    }

    resetScannerUI() {
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const scannerContainer = document.getElementById('scannerContainer');
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');
        
        if (cameraPlaceholder) cameraPlaceholder.style.display = 'flex';
        if (scannerContainer) scannerContainer.style.display = 'none';
        if (startBtn) startBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
    }
}

// Create global instance
const qrScanner = new QRScanner();