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
            console.log('🔗 Connexion à l\'API...');
            const response = await fetch(API_CONFIG.BASE_URL);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.members = data.data;
                this.useDemoData = false;
                console.log(`✅ ${this.members.length} membres chargés depuis l'API`);
                return this.members;
            } else {
                throw new Error(data.message || 'Erreur inconnue de l\'API');
            }
        } catch (error) {
            console.warn('❌ API hors service, utilisation du mode démo:', error.message);
            this.members = [];
            this.useDemoData = true;
            
            // Message utilisateur
            setTimeout(() => {
                if (window.attendance) {
                    attendance.showAlert('Mode démo activé - API temporairement indisponible', 'warning');
                }
            }, 1000);
            
            return this.members;
        }
    }

    getMemberByRegistrationNumber(registrationNumber) {
        return this.members.find(m => m.registrationNumber === registrationNumber);
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

    // Méthode pour ajouter un membre temporaire en mode démo
    addDemoMember(memberData) {
        if (this.useDemoData) {
            this.members.push(memberData);
            return true;
        }
        return false;
    }
}

// Create global instance
const apiService = new ApiService();