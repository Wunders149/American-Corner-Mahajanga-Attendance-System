// API Configuration and Functions
const API_CONFIG = {
    BASE_URL: "https://acm-backend-iwde.onrender.com/api/member/",
    PROFILE_IMAGE_BASE_URL: "https://acm-backend-iwde.onrender.com/uploads/"
};

class ApiService {
    constructor() {
        this.members = [];
    }

    async fetchMembers() {
        try {
            const response = await fetch(API_CONFIG.BASE_URL);
            const data = await response.json();
            
            if (data.success) {
                this.members = data.data;
                return this.members;
            } else {
                console.error('Erreur API:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return [];
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
}

// Create global instance
const apiService = new ApiService();