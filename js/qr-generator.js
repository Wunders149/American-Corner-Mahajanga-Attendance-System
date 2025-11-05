// QR Generator System
class QRGenerator {
    constructor() {
        this.currentQRCode = null;
    }

    initializeQRGenerator() {
        this.setupEventListeners();
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

    generateQRCode() {
        const registrationNumber = document.getElementById('registrationNumber').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const occupation = document.getElementById('occupation').value;
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const studyWorkPlace = document.getElementById('studyWorkPlace').value.trim();

        if (!registrationNumber || !firstName || !lastName) {
            alert('Veuillez remplir tous les champs obligatoires (Numéro, Prénom, Nom)');
            return;
        }

        const memberData = {
            registrationNumber: registrationNumber,
            firstName: firstName,
            lastName: lastName,
            occupation: occupation,
            phoneNumber: phoneNumber || "Non spécifié",
            studyOrWorkPlace: studyWorkPlace || "Non spécifié",
            timestamp: new Date().toISOString()
        };

        this.generateQRCodeFromData(memberData);
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
            alert('Veuillez générer un QR code d\'abord');
        }
    }

    printQRCode() {
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
                    @media print { body { margin: 0; padding: 10px; } }
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
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
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
}

// Create global instance
const qrGenerator = new QRGenerator();