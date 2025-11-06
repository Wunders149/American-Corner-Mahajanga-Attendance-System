// API Configuration and Functions - Version corrigée pour les profils
const API_CONFIG = {
    BASE_URL: "https://acm-backend-iwde.onrender.com/api/member/",
    PROFILE_IMAGE_BASE_URL: "https://acm-backend-iwde.onrender.com/uploads/"
};

class ApiService {
    constructor() {
        this.members = [];
        this.useDemoData = false;
    }

    async fetchMembers() {
        try {
            console.log('🔗 Tentative de connexion à l\'API...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(API_CONFIG.BASE_URL, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Données API reçues:', data);
            
            if (data.success && data.data) {
                // 🧩 CORRECTION: Nettoyer et valider les données des membres
                this.members = this.cleanMemberData(data.data);
                this.useDemoData = false;
                console.log(`✅ ${this.members.length} membres chargés depuis l'API`);
                return this.members;
            } else {
                throw new Error(data.message || 'Format de données invalide');
            }
        } catch (error) {
            console.warn('❌ API indisponible, utilisation du mode démo:', error.message);
            this.members = this.getDemoMembers();
            this.useDemoData = true;
            
            setTimeout(() => {
                if (window.attendance) {
                    window.attendance.showAlert('Mode démo activé - Connexion API temporairement indisponible', 'warning');
                }
            }, 1000);
            
            return this.members;
        }
    }

    // 🧩 NOUVELLE MÉTHODE: Nettoyer et valider les données des membres
    cleanMemberData(members) {
        return members.map(member => {
            // Assurer que tous les champs requis existent
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
                // 🧩 CORRECTION: Gérer le champ profileImage qui peut être manquant
                profileImage: member.profileImage || null
            };

            // Validation supplémentaire
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
        return Math.random().toString(36).substr(2, 9).toUpperCase();
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
                profileImage: "profile1.jpg" // Image de démo
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
                profileImage: null // Pas d'image de profil
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
                profileImage: "profile3.jpg"
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
            }
        ];
    }

    getMemberByRegistrationNumber(registrationNumber) {
        const cleanRegNumber = registrationNumber.toString().trim().toUpperCase();
        const member = this.members.find(m => {
            const memberReg = m.registrationNumber ? m.registrationNumber.toString().toUpperCase() : '';
            return memberReg === cleanRegNumber;
        });
        
        if (!member && this.useDemoData) {
            return this.createTemporaryDemoMember(registrationNumber);
        }
        return member;
    }

    createTemporaryDemoMember(registrationNumber) {
        const demoNames = [
            { firstName: "John", lastName: "Doe", email: "john.doe@example.mg" },
            { firstName: "Jane", lastName: "Smith", email: "jane.smith@example.mg" },
            { firstName: "Paul", lastName: "Martin", email: "paul.martin@example.mg" }
        ];
        
        const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
        
        return {
            id: Date.now(),
            registrationNumber: registrationNumber,
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

    // 🧩 CORRECTION: Méthode améliorée pour les URLs de profil
    getProfileImageUrl(profileImage) {
        if (!profileImage) {
            return null;
        }

        // Si c'est déjà une URL complète
        if (profileImage.startsWith('http')) {
            return profileImage;
        }

        // Si c'est un chemin relatif, construire l'URL complète
        let imagePath = profileImage;
        if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
        }

        const fullUrl = `${API_CONFIG.PROFILE_IMAGE_BASE_URL}${imagePath.replace(/^\//, '')}`;
        console.log(`🖼️ URL image profil générée: ${fullUrl}`);
        
        return fullUrl;
    }

    // 🧩 NOUVELLE MÉTHODE: Vérifier si une image existe
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

    // 🧩 NOUVELLE MÉTHODE: Obtenir les statistiques des membres
    getMembersStats() {
        const stats = {
            total: this.members.length,
            byOccupation: {},
            withProfileImage: 0,
            recentMembers: 0
        };

        // Compter par occupation
        this.members.forEach(member => {
            const occupation = member.occupation || 'other';
            stats.byOccupation[occupation] = (stats.byOccupation[occupation] || 0) + 1;
            
            // Compter les membres avec image de profil
            if (member.profileImage) {
                stats.withProfileImage++;
            }
            
            // Compter les membres récents (moins de 30 jours)
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

    // 🧩 NOUVELLE MÉTHODE: Recherche avancée
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
}

// Create global instance
const apiService = new ApiService();