# American Corner Mahajanga - Système de Gestion

## Fonctionnalités

- ✅ Système de présence avec QR codes
- ✅ Scanner de QR codes en temps réel
- ✅ Générateur de QR codes personnalisés
- ✅ Gestion des membres
- ✅ Interface responsive
- ✅ Mode démo en cas d'indisponibilité de l'API

## Installation

1. Téléchargez tous les fichiers
2. Ouvrez `index.html` dans un navigateur web
3. Aucune installation supplémentaire requise

## Structure

american-corner/
├── index.html
├── css/
│ ├── style.css
│ └── responsive.css
├── js/
│ ├── api.js # Gestion API
│ ├── scanner.js # Scanner QR code
│ ├── attendance.js # Système de présence
│ ├── qr-generator.js # Générateur QR
│ ├── members.js # Gestion membres
│ └── app.js # Application principale
└── README.md


## Utilisation

### Scanner de QR codes
1. Allez dans la section "Présence"
2. Cliquez sur "Activer le Scanner"
3. Autorisez l'accès à la caméra
4. Pointez vers un QR code membre

### Génération de QR codes
1. Allez dans "QR Codes"
2. Remplissez le formulaire ou cliquez sur un membre
3. Téléchargez ou imprimez le QR code généré

### Mode Démo
Le système fonctionne en mode démo si l'API est indisponible.

## Technologies

- HTML5, CSS3, JavaScript
- Bootstrap 5
- Font Awesome
- HTML5 QR Code Scanner
- QR Code Generator