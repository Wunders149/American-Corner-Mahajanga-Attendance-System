// QR Code Scanner System
class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.isAvailable = false;
        this.libraryLoaded = false;
        this.camerasChecked = false;
        
        // Ne pas initialiser automatiquement - attendre le clic utilisateur
        console.log('📱 Scanner initialisé - en attente de démarrage manuel');
    }

    async loadScannerLibrary() {
        return new Promise((resolve) => {
            if (typeof Html5Qrcode !== 'undefined') {
                console.log('✅ Bibliothèque Html5Qrcode déjà chargée');
                this.libraryLoaded = true;
                resolve(true);
                return;
            }

            console.log('🔄 Chargement de la bibliothèque scanner...');

            const cdnSources = [
                'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
            ];

            let currentSourceIndex = 0;

            const tryNextSource = () => {
                if (currentSourceIndex >= cdnSources.length) {
                    console.error('❌ Toutes les sources CDN ont échoué');
                    this.libraryLoaded = false;
                    resolve(false);
                    return;
                }

                const source = cdnSources[currentSourceIndex];
                console.log(`📦 Essai de chargement depuis: ${source}`);

                const script = document.createElement('script');
                script.src = source;
                script.onload = () => {
                    console.log('✅ Bibliothèque Html5Qrcode chargée avec succès');
                    this.libraryLoaded = true;
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn(`❌ Échec du chargement depuis: ${source}`);
                    currentSourceIndex++;
                    tryNextSource();
                };
                document.head.appendChild(script);
            };

            tryNextSource();
        });
    }

    async checkCameraAvailability() {
        if (!this.libraryLoaded) {
            console.warn('❌ Bibliothèque non chargée pour vérifier les caméras');
            return false;
        }

        try {
            console.log('🔍 Vérification des caméras...');
            const cameras = await Html5Qrcode.getCameras();
            this.isAvailable = cameras && cameras.length > 0;
            this.camerasChecked = true;
            
            if (this.isAvailable) {
                console.log('✅ Caméras disponibles:', cameras.length);
            } else {
                console.warn('📵 Aucune caméra disponible');
            }
            return this.isAvailable;
        } catch (error) {
            console.error('❌ Erreur vérification caméras:', error);
            this.isAvailable = false;
            this.camerasChecked = true;
            return false;
        }
    }

    async startScanner() {
        console.log('🎬 Début de startScanner()');
        
        // Charger la bibliothèque si nécessaire
        if (!this.libraryLoaded) {
            console.log('📚 Chargement de la bibliothèque...');
            const loaded = await this.loadScannerLibrary();
            if (!loaded) {
                this.showAlert('Impossible de charger le scanner. Vérifiez votre connexion internet.', 'error');
                return;
            }
        }

        // Vérifier les caméras seulement maintenant (au premier clic)
        if (!this.camerasChecked) {
            console.log('📷 Première vérification des caméras...');
            const camerasAvailable = await this.checkCameraAvailability();
            if (!camerasAvailable) {
                this.showAlert('Aucune caméra disponible sur cet appareil.', 'error');
                return;
            }
        }

        if (!this.isAvailable) {
            this.showAlert('Scanner non disponible sur cet appareil', 'error');
            return;
        }

        try {
            console.log('🚀 Démarrage effectif du scanner...');
            
            const cameras = await Html5Qrcode.getCameras();
            const scannerContainer = document.getElementById('scannerContainer');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');
            const startBtn = document.getElementById('startScannerBtn');
            const stopBtn = document.getElementById('stopScannerBtn');

            if (!scannerContainer || !cameraPlaceholder) {
                console.error('❌ Éléments DOM manquants');
                this.showAlert('Erreur d\'interface scanner', 'error');
                return;
            }

            console.log('🎥 Mise à jour de l\'interface...');
            
            // Mise à jour de l'interface
            cameraPlaceholder.style.display = 'none';
            scannerContainer.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';

            // Vider le conteneur et créer l'élément de scan
            scannerContainer.innerHTML = '<div id="qrReader"></div>';

            // Initialisation du scanner
            console.log('🔧 Création de l\'instance Html5Qrcode...');
            this.html5QrCode = new Html5Qrcode("qrReader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                rememberLastUsedCamera: true
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

            console.log('📷 Démarrage avec caméra:', cameraId);
            
            // Démarrer le scanner
            await this.html5QrCode.start(
                cameraId,
                config,
                (decodedText) => {
                    console.log('✅ QR Code détecté:', decodedText);
                    this.onScanSuccess(decodedText);
                },
                (error) => {
                    // Ne pas afficher les erreurs normales
                    if (error && !error.includes('NotFoundException')) {
                        console.log('🔍 Scan en cours...');
                    }
                }
            );
            
            this.isScanning = true;
            console.log('🎉 Scanner démarré avec succès!');
            this.showAlert('Scanner activé! Pointez la caméra vers un QR code.', 'success');

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
                this.resetScannerUI();
                console.log('✅ Scanner arrêté');
            } catch (error) {
                console.error('❌ Erreur arrêt scanner:', error);
            }
        } else {
            console.log('ℹ️ Scanner déjà arrêté ou non initialisé');
        }
    }

    onScanSuccess(decodedText) {
        console.log('📱 Traitement du QR code:', decodedText);
        
        // Arrêter le scanner temporairement
        this.stopScanner();
        
        try {
            const memberData = JSON.parse(decodedText);
            
            if (this.isValidMemberData(memberData)) {
                this.processScannedMember(memberData);
                this.showScanSuccess();
            } else {
                throw new Error('Format QR code invalide');
            }
            
        } catch (error) {
            console.error('❌ Erreur traitement QR code:', error);
            this.showAlert('QR code invalide ou format incorrect', 'error');
            
            // Redémarrer le scanner après une erreur
            setTimeout(() => {
                console.log('🔄 Redémarrage du scanner après erreur...');
                this.startScanner();
            }, 2000);
        }
    }

    isValidMemberData(memberData) {
        const isValid = memberData && 
               memberData.registrationNumber && 
               memberData.firstName && 
               memberData.lastName;
        console.log('📋 Validation données membre:', isValid);
        return isValid;
    }

    processScannedMember(memberData) {
        console.log('👤 Traitement du membre:', memberData.registrationNumber);
        
        if (typeof apiService === 'undefined') {
            this.showAlert('Erreur: Service API non disponible', 'error');
            return;
        }

        const member = apiService.getMemberByRegistrationNumber(memberData.registrationNumber);
        
        if (member) {
            this.updateSessionInterface(member);
            this.showAlert(`✅ Bienvenue ${member.firstName} ${member.lastName}!`, 'success');
        } else {
            // En mode démo, créer un membre temporaire
            if (apiService.isUsingDemoData && apiService.isUsingDemoData()) {
                this.createDemoSession(memberData);
            } else {
                this.showAlert('❌ Membre non trouvé dans la base de données', 'error');
                setTimeout(() => {
                    console.log('🔄 Redémarrage scanner après membre non trouvé');
                    this.startScanner();
                }, 3000);
            }
        }
    }

    createDemoSession(memberData) {
        console.log('🔧 Création session démo pour:', memberData.registrationNumber);
        const demoMember = {
            registrationNumber: memberData.registrationNumber,
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            occupation: memberData.occupation || 'Non spécifié'
        };
        
        this.updateSessionInterface(demoMember);
        this.showAlert(`🔧 Mode démo: Bienvenue ${demoMember.firstName} ${demoMember.lastName}!`, 'info');
    }

    updateSessionInterface(member) {
        console.log('🖥️ Mise à jour interface session pour:', member.registrationNumber);
        
        const scannedName = document.getElementById('scannedMemberName');
        const scannedId = document.getElementById('scannedMemberId');
        const checkInTime = document.getElementById('checkInTime');
        const sessionDetails = document.getElementById('sessionDetails');
        
        if (scannedName) scannedName.textContent = `${member.firstName} ${member.lastName}`;
        if (scannedId) scannedId.textContent = member.registrationNumber;
        if (checkInTime) checkInTime.textContent = new Date().toLocaleString();
        if (sessionDetails) sessionDetails.style.display = 'block';
        
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
        console.log(`💬 Alerte [${type}]: ${message}`);
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            // Fallback simple
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    handleScannerError(error) {
        console.error('🚨 Erreur scanner:', error);
        let errorMessage = 'Erreur caméra: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '📵 Permission caméra refusée. Autorisez l\'accès dans les paramètres de votre navigateur.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '📵 Aucune caméra détectée sur cet appareil.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '📵 Votre navigateur ne supporte pas la fonction de scan. Essayez Chrome ou Firefox.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '📵 Caméra déjà utilisée par une autre application.';
        } else if (error.message && error.message.includes('No MultiFormat Readers')) {
            errorMessage = '📵 Problème de compatibilité scanner. Essayez un autre navigateur.';
        } else {
            errorMessage += error.message;
        }
        
        this.showAlert(errorMessage, 'error');
        this.resetScannerUI();
    }

    resetScannerUI() {
        console.log('🔄 Réinitialisation interface scanner');
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
            scannerContainer.innerHTML = ''; // Vider le contenu
        }
        if (startBtn) startBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
    }

    // Méthode pour déboguer l'état du scanner
    getScannerStatus() {
        return {
            libraryLoaded: this.libraryLoaded,
            camerasChecked: this.camerasChecked,
            hardwareAvailable: this.isAvailable,
            isScanning: this.isScanning
        };
    }
}

// Créer l'instance mais ne pas initialiser automatiquement
const qrScanner = new QRScanner();