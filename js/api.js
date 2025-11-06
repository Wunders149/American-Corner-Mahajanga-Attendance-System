// API Configuration and Functions
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
                this.members = data.data;
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
            
            // Notification utilisateur
            setTimeout(() => {
                if (window.attendance) {
                    window.attendance.showAlert('Mode démo activé - Connexion API temporairement indisponible', 'warning');
                }
            }, 1000);
            
            return this.members;
        }
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
                studyOrWorkPlace: "Linux Foundation",
                joinDate: new Date().toISOString(),
                address: "Mahajanga, Madagascar"
            },
            {
                id: 2,
                registrationNumber: "ACM002", 
                firstName: "Marie",
                lastName: "Curie",
                occupation: "student",
                phoneNumber: "+261 34 55 667 78",
                studyOrWorkPlace: "Université de Mahajanga",
                joinDate: new Date().toISOString(),
                address: "Mahajanga, Madagascar"
            },
            {
                id: 3,
                registrationNumber: "ACM003",
                firstName: "Jean",
                lastName: "Rakoto",
                occupation: "employee",
                phoneNumber: "+261 32 12 345 67",
                studyOrWorkPlace: "Société ABC",
                joinDate: new Date().toISOString(),
                address: "Mahajanga, Madagascar"
            }
        ];
    }

    getMemberByRegistrationNumber(registrationNumber) {
        const member = this.members.find(m => 
            m.registrationNumber && m.registrationNumber.toString().toUpperCase() === registrationNumber.toString().toUpperCase()
        );
        
        if (!member && this.useDemoData) {
            return this.createTemporaryDemoMember(registrationNumber);
        }
        return member;
    }

    createTemporaryDemoMember(registrationNumber) {
        const demoNames = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Smith" },
            { firstName: "Paul", lastName: "Martin" }
        ];
        
        const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
        
        return {
            id: Date.now(),
            registrationNumber: registrationNumber,
            firstName: randomName.firstName,
            lastName: randomName.lastName,
            occupation: "student",
            phoneNumber: "+261 34 XX XX XX",
            studyOrWorkPlace: "Université de Mahajanga",
            joinDate: new Date().toISOString(),
            isTemporary: true
        };
    }

    getMemberById(id) {
        return this.members.find(m => m.id === id);
    }

    getProfileImageUrl(profileImage) {
        if (!profileImage) return null;
        return `${API_CONFIG.PROFILE_IMAGE_BASE_URL}${profileImage}`;
    }

    isUsingDemoData() {
        return this.useDemoData;
    }
}

// Create global instance
const apiService = new ApiService();