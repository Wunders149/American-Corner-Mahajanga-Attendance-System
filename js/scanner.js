// QR Code Scanner System
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.scannerContainer = null;
    }

    async startScanner() {
        try {
            // Vérifier si la caméra est disponible
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length === 0) {
                throw new Error('Aucune caméra disponible');
            }

            // Initialiser le scanner
            this.scannerContainer = document.getElementById('scannerContainer');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');

            // Masquer le placeholder et afficher le scanner
            cameraPlaceholder.style.display = 'none';
            this.scannerContainer.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';

            // Créer l'instance du scanner
            this.html5QrCode = new Html5Qrcode("qrReader");
            
            // Configuration du scanner
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Démarrer le scanner avec la caméra arrière par défaut
            const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;
            
            await this.html5QrCode.start(
                cameraId,
                config,
                this.onScanSuccess.bind(this),
                this.onScanFailure.bind(this)
            );
            
            this.isScanning = true;
            attendance.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'info');

        } catch (error) {
            console.error('Erreur lors du démarrage du scanner:', error);
            this.handleScannerError(error);
        }
    }

    async stopScanner() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.isScanning = false;
                
                // Réinitialiser l'interface
                const cameraPlaceholder = document.getElementById('cameraPlaceholder');
                const scannerContainer = document.getElementById('scannerContainer');
                const startBtn = document.getElementById('startScannerBtn');
                const stopBtn = document.getElementById('stopScannerBtn');
                
                cameraPlaceholder.style.display = 'flex';
                scannerContainer.style.display = 'none';
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                
                attendance.showAlert('Scanner arrêté', 'info');
                
            } catch (error) {
                console.error('Erreur lors de l\'arrêt du scanner:', error);
            }
        }
    }

    onScanSuccess(decodedText, decodedResult) {
        console.log('QR Code scanné:', decodedText);
        
        try {
            // Parser les données du QR code
            const memberData = JSON.parse(decodedText);
            
            // Valider la structure des données
            if (this.isValidMemberData(memberData)) {
                // Arrêter le scanner temporairement
                this.stopScanner();
                
                // Traiter le membre scanné
                this.processScannedMember(memberData);
                
                // Feedback visuel
                this.showScanSuccess();
                
            } else {
                throw new Error('Format de QR code invalide');
            }
            
        } catch (error) {
            console.error('Erreur de parsing QR code:', error);
            attendance.showAlert('QR code invalide. Veuillez réessayer.', 'error');
            
            // Redémarrer le scanner après une erreur
            setTimeout(() => {
                if (!this.isScanning) {
                    this.startScanner();
                }
            }, 2000);
        }
    }

    onScanFailure(error) {
        // Les erreurs de scan sont normales, on ne les affiche pas toutes
        if (error && !error.includes('NotFoundException')) {
            console.log('Scan en cours...');
        }
    }

    isValidMemberData(memberData) {
        return memberData && 
               memberData.registrationNumber && 
               memberData.firstName && 
               memberData.lastName;
    }

    processScannedMember(memberData) {
        // Vérifier si le membre existe dans la base
        const member = apiService.getMemberByRegistrationNumber(memberData.registrationNumber);
        
        if (member) {
            // Utiliser les données de l'API pour plus de sécurité
            document.getElementById('scannedMemberName').textContent = `${member.firstName} ${member.lastName}`;
            document.getElementById('scannedMemberId').textContent = member.registrationNumber;
            document.getElementById('checkInTime').textContent = new Date().toLocaleString();
            
            document.getElementById('sessionDetails').style.display = 'block';
            attendance.currentSession = {
                memberId: member.registrationNumber,
                name: `${member.firstName} ${member.lastName}`,
                checkInTime: new Date().toISOString(),
                memberData: member
            };
            
            attendance.showAlert(`QR code scanné avec succès! Bienvenue ${member.firstName} ${member.lastName}`, 'success');
            
        } else {
            // Membre non trouvé dans l'API
            attendance.showAlert('Membre non trouvé dans la base de données', 'error');
            
            // Redémarrer le scanner
            setTimeout(() => {
                this.startScanner();
            }, 3000);
        }
    }

    showScanSuccess() {
        // Feedback visuel temporaire
        const scannerContainer = document.getElementById('scannerContainer');
        const originalBorder = scannerContainer.style.border;
        
        scannerContainer.style.border = '3px solid #28a745';
        setTimeout(() => {
            scannerContainer.style.border = originalBorder;
        }, 1000);
    }

    handleScannerError(error) {
        let errorMessage = 'Erreur du scanner: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Permission de caméra refusée.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'Aucune caméra trouvée.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Fonctionnalité non supportée par le navigateur.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Caméra déjà utilisée par une autre application.';
        } else {
            errorMessage += error.message;
        }
        
        attendance.showAlert(errorMessage, 'error');
        
        // Réafficher le bouton de démarrage
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        cameraPlaceholder.style.display = 'flex';
    }

    // Méthode pour basculer entre les caméras
    async switchCamera() {
        if (!this.html5QrCode || !this.isScanning) return;
        
        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length < 2) {
                attendance.showAlert('Une seule caméra disponible', 'info');
                return;
            }
            
            // Arrêter le scanner actuel
            await this.stopScanner();
            
            // Redémarrer avec une autre caméra
            setTimeout(() => {
                this.startScanner();
            }, 500);
            
        } catch (error) {
            console.error('Erreur lors du changement de caméra:', error);
        }
    }

    // Méthode pour gérer les permissions
    async checkCameraPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    }

    // Méthode pour afficher les instructions
    showScannerInstructions() {
        const instructions = `
            <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i>Instructions de scan</h6>
                <ul class="mb-0">
                    <li>Assurez-vous d'avoir une bonne luminosité</li>
                    <li>Maintenez le QR code stable face à la caméra</li>
                    <li>Placez le QR code dans le cadre de scan</li>
                    <li>Évitez les reflets et les ombres</li>
                </ul>
            </div>
        `;
        
        const container = document.getElementById('scannerSection');
        const existingInstructions = container.querySelector('.scanner-instructions');
        
        if (!existingInstructions) {
            const instructionsDiv = document.createElement('div');
            instructionsDiv.className = 'scanner-instructions';
            instructionsDiv.innerHTML = instructions;
            container.insertBefore(instructionsDiv, container.firstChild);
        }
    }
}

// Intégration avec le système d'attendance existant
// Modifiez la classe AttendanceSystem pour inclure le scanner