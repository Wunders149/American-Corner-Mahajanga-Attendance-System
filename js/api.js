// api.js - Version COMPLÈTE et CORRIGÉE
const API_CONFIG = {
    BASE_URL: "https://acm-backend-iwde.onrender.com/api/member/", // Correct Endpoint
    PROFILE_IMAGE_BASE_URL: "https://acm-backend-iwde.onrender.com/uploads/",
    TIMEOUT: 15000
};

class ApiService {
    constructor() {
        this.members = [];
        this.useDemoData = false;
        this.isLoading = false;
        this.lastError = null;
    }

    async fetchMembers() {
        // Éviter les requêtes multiples
        if (this.isLoading) {
            console.log('⏳ Chargement déjà en cours...');
            return this.members;
        }

        this.isLoading = true;
        this.lastError = null;
        
        try {
            console.log('🔗 Tentative de connexion à l\'API...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('⏰ Timeout API atteint (15s)');
                controller.abort();
            }, API_CONFIG.TIMEOUT);
            
            const response = await fetch(API_CONFIG.BASE_URL, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Données API reçues:', data);
            
            if (data.success && Array.isArray(data.data)) {
                this.members = this.cleanMemberData(data.data);
                this.useDemoData = false;
                console.log(`✅ ${this.members.length} membres chargés depuis l'API`);
                return this.members;
            } else {
                throw new Error(data.message || 'Format de données invalide');
            }
        } catch (error) {
            this.lastError = error.message;
            console.warn('❌ API indisponible, utilisation du mode démo:', error.message);
            this.members = this.getDemoMembers();
            this.useDemoData = true;
            
            // Notification différée
            setTimeout(() => {
                this.showDemoModeNotification();
            }, 1000);
            
            return this.members;
        } finally {
            this.isLoading = false;
        }
    }

    showDemoModeNotification() {
        if (window.attendance && typeof window.attendance.showAlert === 'function') {
            window.attendance.showAlert('Mode démo activé - Connexion API temporairement indisponible', 'warning');
        } else if (window.appController && typeof window.appController.showNotification === 'function') {
            window.appController.showNotification('Mode démo activé - Données locales utilisées', 'warning');
        } else {
            console.log('💡 Mode démo activé - Données locales');
        }
    }

    cleanMemberData(members) {
        return members.map(member => {
            const cleanedMember = {
                id: member.id || this.generateId(),
                registrationNumber: member.registrationNumber || `ACM${this.generateRandomId()}`,
                firstName: member.firstName || 'Prénom',
                lastName: member.lastName || 'Non spécifié',
                occupation: member.occupation || 'other',
                phoneNumber: member.phoneNumber || null,
                email: member.email || null,
                address: member.address || null,
                studyOrWorkPlace: member.studyOrWorkPlace || null,
                joinDate: member.joinDate || new Date().toISOString(),
                profileImage: member.profileImage || null
            };

            // Standardiser le format du numéro d'enregistrement
            if (!cleanedMember.registrationNumber.startsWith('ACM')) {
                cleanedMember.registrationNumber = `ACM${cleanedMember.registrationNumber}`;
            }

            return cleanedMember;
        });
    }

    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    generateRandomId() {
        return Math.floor(1000 + Math.random() * 9000); // 4 chiffres
    }

    getDemoMembers() {
        return [
            {
                id: 1,
                registrationNumber: "ACM001",
                firstName: "Linus",
                lastName: "Torvalds",
                occupation: "entrepreneur",
                phoneNumber: "+261 34 11 223 34",
                email: "linus@linux.org",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Linux Foundation",
                joinDate: new Date('2023-01-15').toISOString(),
                profileImage: null
            },
            {
                id: 2,
                registrationNumber: "ACM002", 
                firstName: "Marie",
                lastName: "Curie",
                occupation: "student",
                phoneNumber: "+261 34 55 667 78",
                email: "marie.curie@univ-mg.mg",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Université de Mahajanga",
                joinDate: new Date('2023-03-20').toISOString(),
                profileImage: null
            },
            {
                id: 3,
                registrationNumber: "ACM003",
                firstName: "Jean",
                lastName: "Rakoto",
                occupation: "employee",
                phoneNumber: "+261 32 12 345 67",
                email: "jean.rakoto@entreprise.mg",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Société ABC",
                joinDate: new Date('2023-02-10').toISOString(),
                profileImage: null
            },
            {
                id: 4,
                registrationNumber: "ACM004",
                firstName: "Sarah",
                lastName: "Johnson",
                occupation: "student",
                phoneNumber: "+261 33 98 765 43",
                email: "sarah.johnson@campus.mg",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Campus Universitaire",
                joinDate: new Date('2023-04-05').toISOString(),
                profileImage: null
            },
            {
                id: 5,
                registrationNumber: "ACM005",
                firstName: "John",
                lastName: "Doe",
                occupation: "employee",
                phoneNumber: "+261 34 11 222 33",
                email: "john.doe@company.mg",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Company XYZ",
                joinDate: new Date('2023-05-15').toISOString(),
                profileImage: null
            },
            {
                id: 6,
                registrationNumber: "ACM006",
                firstName: "Paul",
                lastName: "Martin",
                occupation: "entrepreneur",
                phoneNumber: "+261 32 44 556 67",
                email: "paul.martin@startup.mg",
                address: "Mahajanga, Madagascar",
                studyOrWorkPlace: "Startup Inc",
                joinDate: new Date('2023-06-20').toISOString(),
                profileImage: null
            }
        ];
    }

    getMemberByRegistrationNumber(registrationNumber) {
        const cleanRegNumber = this.normalizeRegistrationNumber(registrationNumber);
        const member = this.members.find(m => {
            const memberReg = m.registrationNumber ? this.normalizeRegistrationNumber(m.registrationNumber) : '';
            return memberReg === cleanRegNumber;
        });
        
        if (!member && this.useDemoData) {
            return this.createTemporaryDemoMember(registrationNumber);
        }
        return member;
    }

    normalizeRegistrationNumber(regNumber) {
        if (!regNumber) return null;
        
        let normalized = regNumber.toString()
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
        
        // Ajouter le préfixe ACM si manquant et c'est un nombre
        if (/^\d+$/.test(normalized)) {
            normalized = 'ACM' + normalized;
        }
        
        // Standardiser les formats
        if (normalized.startsWith('M') && normalized.length > 1) {
            const numberPart = normalized.substring(1);
            if (/^\d+$/.test(numberPart)) {
                normalized = 'ACM' + numberPart;
            }
        }
        
        return normalized;
    }

    createTemporaryDemoMember(registrationNumber) {
        const demoNames = [
            { firstName: "John", lastName: "Doe", email: "john.doe@example.mg" },
            { firstName: "Jane", lastName: "Smith", email: "jane.smith@example.mg" },
            { firstName: "Paul", lastName: "Martin", email: "paul.martin@example.mg" },
            { firstName: "Marie", lastName: "Curie", email: "marie.curie@example.mg" }
        ];
        
        const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
        const normalizedReg = this.normalizeRegistrationNumber(registrationNumber);
        
        return {
            id: Date.now(),
            registrationNumber: normalizedReg,
            firstName: randomName.firstName,
            lastName: randomName.lastName,
            occupation: "student",
            phoneNumber: "+261 34 XX XX XX",
            email: randomName.email,
            address: "Mahajanga, Madagascar",
            studyOrWorkPlace: "Université de Mahajanga",
            joinDate: new Date().toISOString(),
            profileImage: null,
            isTemporary: true
        };
    }

    getMemberById(id) {
        return this.members.find(m => m.id === id);
    }

    getProfileImageUrl(profileImage) {
        if (!profileImage) {
            return null;
        }

        if (profileImage.startsWith('http')) {
            return profileImage;
        }

        let imagePath = profileImage;
        if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
        }

        const fullUrl = `${API_CONFIG.PROFILE_IMAGE_BASE_URL}${imagePath.replace(/^\//, '')}`;
        console.log(`🖼️ URL image profil générée: ${fullUrl}`);
        
        return fullUrl;
    }

    async checkProfileImageExists(profileImage) {
        if (!profileImage) return false;
        
        try {
            const imageUrl = this.getProfileImageUrl(profileImage);
            const response = await fetch(imageUrl, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.log('❌ Image profil non accessible:', error.message);
            return false;
        }
    }

    getMembersStats() {
        const stats = {
            total: this.members.length,
            byOccupation: {},
            withProfileImage: 0,
            recentMembers: 0,
            demoMode: this.useDemoData
        };

        this.members.forEach(member => {
            const occupation = member.occupation || 'other';
            stats.byOccupation[occupation] = (stats.byOccupation[occupation] || 0) + 1;
            
            if (member.profileImage) {
                stats.withProfileImage++;
            }
            
            const joinDate = new Date(member.joinDate);
            const daysSinceJoin = (new Date() - joinDate) / (1000 * 60 * 60 * 24);
            if (daysSinceJoin <= 30) {
                stats.recentMembers++;
            }
        });

        return stats;
    }

    isUsingDemoData() {
        return this.useDemoData;
    }

    getLastError() {
        return this.lastError;
    }

    searchMembers(query) {
        if (!query) return this.members;
        
        const searchTerm = query.toLowerCase().trim();
        return this.members.filter(member => 
            (member.firstName && member.firstName.toLowerCase().includes(searchTerm)) ||
            (member.lastName && member.lastName.toLowerCase().includes(searchTerm)) ||
            (member.registrationNumber && member.registrationNumber.toLowerCase().includes(searchTerm)) ||
            (member.email && member.email.toLowerCase().includes(searchTerm)) ||
            (member.phoneNumber && member.phoneNumber.toLowerCase().includes(searchTerm)) ||
            (member.studyOrWorkPlace && member.studyOrWorkPlace.toLowerCase().includes(searchTerm)) ||
            (member.address && member.address.toLowerCase().includes(searchTerm))
        );
    }

    // Nouvelle méthode pour rafraîchir les données
    async refreshData() {
        console.log('🔄 Rafraîchissement des données...');
        return await this.fetchMembers();
    }
}

// Créer l'instance globale IMMÉDIATEMENT
window.apiService = new ApiService();
console.log('✅ Service API initialisé');