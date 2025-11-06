// QR Generator System
class QRGenerator {
    constructor() {
        this.currentQRCode = null;
    }

    async initializeQRGenerator() {
        this.setupEventListeners();
        await this.loadSampleMembers();
        console.log('✅ Générateur QR initialisé');
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

    async loadSampleMembers() {
        const container = document.getElementById('sampleMembers');
        if (!container) return;

        // Attendre que les membres soient chargés
        if (apiService.members.length === 0) {
            await apiService.fetchMembers();
        }

        if (apiService.members.length === 0) return;

        container.innerHTML = '';
        
        // Afficher jusqu'à 6 membres comme exemples
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
                            onclick="qrGenerator.generateSampleQR('${member.registrationNumber}')">
                        <i class="fas fa-qrcode me-1"></i>Générer QR
                    </button>
                </div>
            `;
            
            container.appendChild(memberCol);
        });
    }

    generateSampleQR(registrationNumber = null) {
        console.log('🎨 Génération d\'un QR code d\'exemple...');
        
        let sampleMember;
        if (registrationNumber && apiService) {
            const member = apiService.getMemberByRegistrationNumber(registrationNumber);
            if (member) {
                sampleMember = member;
            }
        }
        
        if (!sampleMember) {
            sampleMember = {
                registrationNumber: "ACM-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                firstName: "John",
                lastName: "Doe",
                occupation: "student",
                phoneNumber: "+261 34 12 345 67",
                studyOrWorkPlace: "Université de Mahajanga",
                timestamp: new Date().toISOString(),
                isSample: true
            };
        }

        this.generateQRCodeFromData(sampleMember);
    }

    generateQRCode() {
        const registrationNumber = document.getElementById('registrationNumber').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const occupation = document.getElementById('occupation').value;
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const studyWorkPlace = document.getElementById('studyWorkPlace').value.trim();

        if (!registrationNumber || !firstName || !lastName) {
            this.showAlert('Veuillez remplir tous les champs obligatoires (Numéro, Prénom, Nom)', 'warning');
            return;
        }

        // Validation des entrées
        try {
            const memberData = {
                registrationNumber: utils.sanitizeInput(registrationNumber),
                firstName: utils.sanitizeInput(firstName),
                lastName: utils.sanitizeInput(lastName),
                occupation: occupation,
                phoneNumber: utils.sanitizeInput(phoneNumber),
                studyOrWorkPlace: utils.sanitizeInput(studyWorkPlace),
                timestamp: new Date().toISOString()
            };

            apiService.validateMemberData(memberData);
            this.generateQRCodeFromData(memberData);
            
        } catch (error) {
            this.showAlert(`Erreur de validation: ${error.message}`, 'error');
        }
    }

    generateQRCodeFromData(memberData) {
        const jsonString = JSON.stringify(memberData, null, 2);
        
        document.getElementById('qrcode').innerHTML = '';
        
        const typeNumber = 0;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(jsonString);
        qr.make();
        
        const qrImage = qr.createImgTag(5, 0);
        document.getElementById('qrcode').innerHTML = qrImage;
        
        document.getElementById('displayRegNumber').textContent = memberData.registrationNumber;
        document.getElementById('displayName').textContent = `${memberData.firstName} ${memberData.lastName}`;
        document.getElementById('displayOccupation').textContent = utils.formatOccupation(memberData.occupation);
        document.getElementById('displayPhone').textContent = memberData.phoneNumber || 'Non fourni';
        document.getElementById('displayStudyWork').textContent = memberData.studyOrWorkPlace || 'Non fourni';
        document.getElementById('displayTimestamp').textContent = new Date().toLocaleString();
        
        document.getElementById('jsonPreview').textContent = jsonString;
        document.getElementById('qrCodeSection').style.display = 'block';
        
        this.currentQRCode = memberData;
        
        this.showAlert('QR code généré avec succès!', 'success');
    }

    downloadQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (qrCodeElement) {
            const regNumber = document.getElementById('displayRegNumber').textContent;
            const link = document.createElement('a');
            link.download = `ACM-QR-${regNumber}.png`;
            link.href = qrCodeElement.src;
            link.click();
        } else {
            this.showAlert('Veuillez générer un QR code d\'abord', 'warning');
        }
    }

    printQRCode() {
        const qrCodeElement = document.querySelector('#qrcode img');
        if (!qrCodeElement) {
            this.showAlert('Veuillez générer un QR code d\'abord', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank');
        const regNumber = document.getElementById('displayRegNumber').textContent;
        const memberName = document.getElementById('displayName').textContent;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${regNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                    .qr-container { margin: 20px auto; max-width: 300px; }
                    .member-info { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: left; }
                    .member-id { font-family: 'Courier New', monospace; background: #f8f9fa; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                    @media print { 
                        body { margin: 0; padding: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h2>American Corner Mahajanga</h2>
                <h3>QR Code Membre</h3>
                <div class="member-info">
                    <strong>Numéro:</strong> <span class="member-id">${regNumber}</span><br>
                    <strong>Nom:</strong> ${memberName}<br>
                    <strong>Généré:</strong> ${new Date().toLocaleDateString()}
                </div>
                <div class="qr-container">
                    ${document.querySelector('#qrcode').innerHTML}
                </div>
                <p><small>Scannez ce QR code à l'American Corner pour le suivi des présences</small></p>
                <div class="no-print">
                    <button onclick="window.print()" class="btn btn-primary mt-3">Imprimer</button>
                    <button onclick="window.close()" class="btn btn-secondary mt-3 ms-2">Fermer</button>
                </div>
                <script>
                    window.onload = function() {
                        // Auto-print
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
        this.showAlert('Formulaire réinitialisé', 'info');
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