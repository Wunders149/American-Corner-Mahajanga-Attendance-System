// QR Generator System - Optimisé pour les cartes
class QRGenerator {
    constructor() {
        this.currentQRCode = null;
    }

    initializeQRGenerator() {
        this.setupEventListeners();
        this.loadSampleMembers();
        console.log('✅ Générateur QR pour cartes initialisé');
    }

    setupEventListeners() {
        document.getElementById('generateQRBtn').onclick = (e) => {
            e.preventDefault();
            this.generateQRCode();
        };
        document.getElementById('clearQRBtn').onclick = () => this.clearQRForm();
        document.getElementById('downloadQRBtn').onclick = () => this.downloadQRCode();
        document.getElementById('printQRBtn').onclick = () => this.printQRCode();
    }

    loadSampleMembers() {
        const container = document.getElementById('sampleMembers');
        if (!container || apiService.members.length === 0) return;

        container.innerHTML = '';
        
        // Afficher les 6 premiers membres comme exemples
        const sampleMembers = apiService.members.slice(0, 6);
        
        sampleMembers.forEach(member => {
            const memberCol = document.createElement('div');
            memberCol.className = 'col-md-6 col-lg-4';
            
            memberCol.innerHTML = `
                <div class="card sample-member-card text-center p-3">
                    <div class="initials-avatar small mx-auto mb-2">
                        ${utils.getInitials(member.firstName, member.lastName)}
                    </div>
                    <h6 class="mb-1">${member.firstName} ${member.lastName}</h6>
                    <small class="text-muted member-id-display">${member.registrationNumber}</small>
                    <button class="btn btn-sm btn-primary mt-2 w-100" 
                            onclick="qrGenerator.generateMemberQR('${member.registrationNumber}')">
                        <i class="fas fa-qrcode me-1"></i>Générer Carte
                    </button>
                </div>
            `;
            
            container.appendChild(memberCol);
        });
    }

    generateMemberQR(registrationNumber) {
        console.log('🎨 Génération carte pour:', registrationNumber);
        
        const member = apiService.getMemberByRegistrationNumber(registrationNumber);
        if (member) {
            // Remplir le formulaire automatiquement
            document.getElementById('registrationNumber').value = member.registrationNumber;
            document.getElementById('firstName').value = member.firstName;
            document.getElementById('lastName').value = member.lastName;
            document.getElementById('occupation').value = member.occupation || 'student';
            document.getElementById('phoneNumber').value = member.phoneNumber || '';
            document.getElementById('studyWorkPlace').value = member.studyOrWorkPlace || '';
            
            // Générer le QR code
            this.generateQRCode();
        }
    }

    generateQRCode() {
        const registrationNumber = document.getElementById('registrationNumber').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const occupation = document.getElementById('occupation').value;
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const studyWorkPlace = document.getElementById('studyWorkPlace').value.trim();

        if (!registrationNumber || !firstName || !lastName) {
            this.showAlert('Veuillez remplir les champs obligatoires', 'warning');
            return;
        }

        // Format optimisé pour le scanner de cartes
        const memberData = {
            registrationNumber: registrationNumber,
            firstName: firstName,
            lastName: lastName,
            occupation: occupation,
            phoneNumber: phoneNumber || undefined,
            studyOrWorkPlace: studyWorkPlace || undefined,
            timestamp: new Date().toISOString().split('T')[0] // Date seulement
        };

        // Nettoyer les données (supprimer les champs undefined)
        Object.keys(memberData).forEach(key => {
            if (memberData[key] === undefined) {
                delete memberData[key];
            }
        });

        this.generateQRCodeFromData(memberData);
    }

    generateQRCodeFromData(memberData) {
        const jsonString = JSON.stringify(memberData);
        
        // Vider le conteneur
        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.innerHTML = '';
        
        // Générer le QR code
        const typeNumber = 0;
        const errorCorrectionLevel = 'M'; // Correction moyenne pour les cartes
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(jsonString);
        qr.make();
        
        // Créer l'image QR
        const qrImage = qr.createImgTag(5, 0, 'Carte ACM');
        qrcodeContainer.innerHTML = qrImage;
        
        // Mettre à jour les informations d'affichage
        document.getElementById('displayRegNumber').textContent = memberData.registrationNumber;
        document.getElementById('displayName').textContent = `${memberData.firstName} ${memberData.lastName}`;
        document.getElementById('displayOccupation').textContent = utils.formatOccupation(memberData.occupation);
        document.getElementById('displayPhone').textContent = memberData.phoneNumber || 'Non fourni';
        document.getElementById('displayStudyWork').textContent = memberData.studyOrWorkPlace || 'Non fourni';
        document.getElementById('displayTimestamp').textContent = new Date().toLocaleDateString('fr-FR');
        
        // Afficher le contenu JSON
        document.getElementById('jsonPreview').textContent = jsonString;
        
        // Afficher la section QR code
        document.getElementById('qrCodeSection').style.display = 'block';
        
        this.currentQRCode = memberData;
        
        this.showAlert('Carte QR générée avec succès!', 'success');
    }

    downloadQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (qrCodeElement) {
            const regNumber = document.getElementById('displayRegNumber').textContent;
            const link = document.createElement('a');
            link.download = `Carte-ACM-${regNumber}.png`;
            link.href = qrCodeElement.src;
            link.click();
        } else {
            this.showAlert('Générez d\'abord une carte QR', 'warning');
        }
    }

    printQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (!qrCodeElement) {
            this.showAlert('Générez d\'abord une carte QR', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank');
        const regNumber = document.getElementById('displayRegNumber').textContent;
        const memberName = document.getElementById('displayName').textContent;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Carte Membre - ${regNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    .card-container { margin: 20px auto; max-width: 300px; border: 2px solid #333; padding: 20px; border-radius: 10px; }
                    .header { background: #2c3e50; color: white; padding: 10px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }
                    .qr-container { margin: 15px 0; }
                    .member-info { text-align: left; margin: 15px 0; }
                    .member-id { font-family: 'Courier New', monospace; background: #f8f9fa; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                    @media print { 
                        body { margin: 0; padding: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="card-container">
                    <div class="header">
                        <h3>American Corner Mahajanga</h3>
                        <p>Carte de Membre</p>
                    </div>
                    
                    <div class="qr-container">
                        ${document.querySelector('#qrcode').innerHTML}
                    </div>
                    
                    <div class="member-info">
                        <p><strong>Numéro:</strong> <span class="member-id">${regNumber}</span></p>
                        <p><strong>Nom:</strong> ${memberName}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                
                <div class="no-print" style="margin-top: 20px;">
                    <button onclick="window.print()" class="btn btn-primary">Imprimer</button>
                    <button onclick="window.close()" class="btn btn-secondary">Fermer</button>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() { 
                            window.print(); 
                        }, 500);
                    }
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    clearQRForm() {
        document.getElementById('qrGeneratorForm').reset();
        document.getElementById('qrCodeSection').style.display = 'none';
        this.currentQRCode = null;
    }

    showAlert(message, type = 'info') {
        if (window.attendance && window.attendance.showAlert) {
            window.attendance.showAlert(message, type);
        } else {
            alert(message);
        }
    }
}

// Create global instance
const qrGenerator = new QRGenerator();