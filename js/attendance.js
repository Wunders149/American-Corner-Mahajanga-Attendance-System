// Attendance System
class AttendanceSystem {
    constructor() {
        this.currentSession = null;
        this.durationInterval = null;
        this.eventListenersSetup = false;
    }

    initializeAttendanceSystem() {
        console.log('🎯 Initialisation du système de présence...');
        this.loadAttendanceStats();
        this.loadRecentSessions();
        this.setupEventListeners();
        console.log('✅ Système de présence initialisé');
    }

    setupEventListeners() {
        // Éviter de configurer les événements plusieurs fois
        if (this.eventListenersSetup) {
            console.log('ℹ️ Événements déjà configurés');
            return;
        }

        console.log('🔧 Configuration des événements...');
        
        // Attendre que le DOM soit complètement chargé
        setTimeout(() => {
            this.attachEventListeners();
        }, 100);
    }

    attachEventListeners() {
        // Scanner buttons
        const startScannerBtn = document.getElementById('startScannerBtn');
        const stopScannerBtn = document.getElementById('stopScannerBtn');
        const manualEntryBtn = document.getElementById('manualEntryBtn');
        const processManualBtn = document.getElementById('processManualBtn');
        const cancelManualBtn = document.getElementById('cancelManualBtn');
        const demoMemberBtn = document.getElementById('demoMemberBtn');
        const startSessionBtn = document.getElementById('startSessionBtn');
        const cancelSessionBtn = document.getElementById('cancelSessionBtn');
        const endSessionBtn = document.getElementById('endSessionBtn');

        // Vérifier et attacher les événements
        if (startScannerBtn) {
            startScannerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎬 Clic sur Activer le Scanner');
                this.startScanner();
            });
            console.log('✅ Événement startScannerBtn attaché');
        } else {
            console.error('❌ Bouton startScannerBtn non trouvé');
        }

        if (stopScannerBtn) {
            stopScannerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🛑 Clic sur Arrêter le Scanner');
                this.stopScanner();
            });
        }

        if (manualEntryBtn) {
            manualEntryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⌨️ Clic sur Entrée Manuelle');
                this.startManualEntry();
            });
        }

        if (processManualBtn) {
            processManualBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('✅ Clic sur Continuer (manuel)');
                this.processManualEntry();
            });
        }

        if (cancelManualBtn) {
            cancelManualBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('❌ Clic sur Annuler (manuel)');
                this.cancelManualEntry();
            });
        }

        if (demoMemberBtn) {
            demoMemberBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔧 Clic sur Mode Démo');
                this.useDemoMember();
            });
        }

        if (startSessionBtn) {
            startSessionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚀 Clic sur Démarrer Session');
                this.startSession();
            });
        }

        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('❌ Clic sur Annuler Session');
                this.cancelSession();
            });
        }

        if (endSessionBtn) {
            endSessionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📤 Clic sur Check-Out');
                this.endSession();
            });
        }

        // Événement pour le formulaire de session
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Soumission formulaire session');
                this.startSession();
            });
        }

        // Événement pour le formulaire d'entrée manuelle
        const manualEntryForm = document.getElementById('manualMemberId');
        if (manualEntryForm) {
            manualEntryForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('↵ Entrée pressée dans champ manuel');
                    this.processManualEntry();
                }
            });
        }

        this.eventListenersSetup = true;
        console.log('✅ Tous les événements configurés');
    }

    // Scanner methods
    startScanner() {
        console.log('🔍 Début de startScanner() dans AttendanceSystem');
        
        if (window.qrScanner) {
            console.log('🎯 Appel de qrScanner.startScanner()');
            qrScanner.startScanner().catch(error => {
                console.error('❌ Erreur dans startScanner:', error);
                this.showAlert('Erreur lors du démarrage du scanner', 'error');
            });
        } else {
            console.error('❌ qrScanner non disponible');
            this.showAlert('Scanner non disponible. Utilisez l\'entrée manuelle.', 'warning');
            this.startManualEntry();
        }
    }

    stopScanner() {
        console.log('🛑 Arrêt du scanner depuis AttendanceSystem');
        if (window.qrScanner) {
            qrScanner.stopScanner();
        }
    }

    showAlert(message, type = 'info') {
        console.log(`💬 Alerte [${type}]: ${message}`);
        const alertEl = document.getElementById('attendanceAlert');
        if (!alertEl) {
            // Fallback si l'élément d'alerte n'existe pas
            this.showFallbackAlert(message, type);
            return;
        }
        
        const alertClass = type === 'error' ? 'alert-danger' : 
                         type === 'success' ? 'alert-success' :
                         type === 'warning' ? 'alert-warning' : 'alert-info';
        
        alertEl.className = `alert alert-attendance ${alertClass}`;
        alertEl.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                <div>${message}</div>
            </div>
        `;
        alertEl.style.display = 'block';
        
        // Auto-masquage après 5 secondes
        setTimeout(() => {
            if (alertEl) {
                alertEl.style.display = 'none';
            }
        }, 5000);
    }

    getAlertIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            case 'warning': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }

    showFallbackAlert(message, type) {
        // Créer une alerte temporaire si l'élément n'existe pas
        const tempAlert = document.createElement('div');
        tempAlert.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
        tempAlert.style.zIndex = '9999';
        tempAlert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                <div>${message}</div>
            </div>
        `;
        document.body.appendChild(tempAlert);
        
        setTimeout(() => {
            if (tempAlert.parentNode) {
                tempAlert.parentNode.removeChild(tempAlert);
            }
        }, 5000);
    }

    startManualEntry() {
        console.log('⌨️ Démarrage entrée manuelle');
        const manualForm = document.getElementById('manualEntryForm');
        if (manualForm) {
            manualForm.style.display = 'block';
            // Focus sur le champ de saisie
            const memberIdInput = document.getElementById('manualMemberId');
            if (memberIdInput) {
                memberIdInput.focus();
            }
            this.showAlert('Veuillez entrer le numéro d\'enregistrement du membre', 'info');
        } else {
            console.error('❌ Formulaire manuel non trouvé');
        }
    }

    cancelManualEntry() {
        console.log('❌ Annulation entrée manuelle');
        const manualForm = document.getElementById('manualEntryForm');
        const memberIdInput = document.getElementById('manualMemberId');
        
        if (manualForm) manualForm.style.display = 'none';
        if (memberIdInput) memberIdInput.value = '';
        
        this.showAlert('Entrée manuelle annulée', 'warning');
    }

    processManualEntry() {
        console.log('✅ Traitement entrée manuelle');
        const memberId = document.getElementById('manualMemberId')?.value.trim();
        
        if (!memberId) {
            this.showAlert('Veuillez entrer le numéro d\'enregistrement', 'warning');
            return;
        }

        console.log(`🔍 Recherche du membre: ${memberId}`);
        
        // Vérifier si l'API service est disponible
        if (typeof apiService === 'undefined') {
            this.showAlert('Erreur: Service non disponible', 'error');
            return;
        }

        const member = apiService.getMemberByRegistrationNumber(memberId);
        
        if (!member) {
            this.showAlert(`Membre "${memberId}" non trouvé. Vérifiez le numéro.`, 'error');
            return;
        }

        this.processMemberCheckin(member);
    }

    processMemberCheckin(member) {
        console.log(`👤 Traitement check-in pour: ${member.registrationNumber}`);
        
        // Masquer le formulaire manuel
        const manualForm = document.getElementById('manualEntryForm');
        if (manualForm) manualForm.style.display = 'none';
        
        // Vider le champ
        const memberIdInput = document.getElementById('manualMemberId');
        if (memberIdInput) memberIdInput.value = '';
        
        // Mettre à jour l'interface
        this.updateSessionInterface(member);
        
        // Stocker la session courante
        this.currentSession = {
            memberId: member.registrationNumber,
            name: `${member.firstName} ${member.lastName}`,
            checkInTime: new Date().toISOString(),
            memberData: member
        };
        
        this.showAlert(`✅ Bienvenue ${member.firstName} ${member.lastName}!`, 'success');
    }

    updateSessionInterface(member) {
        console.log('🖥️ Mise à jour interface session');
        
        const elements = {
            scannedMemberName: document.getElementById('scannedMemberName'),
            scannedMemberId: document.getElementById('scannedMemberId'),
            checkInTime: document.getElementById('checkInTime'),
            sessionDetails: document.getElementById('sessionDetails')
        };

        // Mettre à jour les éléments s'ils existent
        if (elements.scannedMemberName) {
            elements.scannedMemberName.textContent = `${member.firstName} ${member.lastName}`;
        }
        if (elements.scannedMemberId) {
            elements.scannedMemberId.textContent = member.registrationNumber;
        }
        if (elements.checkInTime) {
            elements.checkInTime.textContent = new Date().toLocaleString();
        }
        if (elements.sessionDetails) {
            elements.sessionDetails.style.display = 'block';
        }
    }

    useDemoMember() {
        console.log('🔧 Utilisation membre démo');
        
        if (!apiService || apiService.members.length === 0) {
            // Créer un membre de démo temporaire
            const demoMember = {
                id: 999,
                registrationNumber: "ACM001",
                firstName: "Linus",
                lastName: "Torvalds",
                occupation: "entrepreneur",
                phoneNumber: "555-123-4567",
                studyOrWorkPlace: "NY University"
            };
            this.processMemberCheckin(demoMember);
            this.showAlert('🔧 Mode démo activé - Données de test', 'info');
        } else {
            const demoMember = apiService.members[0];
            this.processMemberCheckin(demoMember);
            this.showAlert(`🔧 Mode démo: ${demoMember.firstName} ${demoMember.lastName}`, 'info');
        }
    }

    cancelSession() {
        console.log('❌ Annulation session');
        const sessionDetails = document.getElementById('sessionDetails');
        const sessionForm = document.getElementById('sessionForm');
        
        if (sessionDetails) sessionDetails.style.display = 'none';
        if (sessionForm) sessionForm.reset();
        
        this.currentSession = null;
        this.showAlert('Session annulée', 'warning');
    }

    startSession() {
        console.log('🚀 Démarrage session');
        const purpose = document.getElementById('purpose')?.value;
        const topic = document.getElementById('topic')?.value;
        
        if (!purpose) {
            this.showAlert('Veuillez sélectionner le motif de la visite', 'warning');
            return;
        }

        if (!this.currentSession) {
            this.showAlert('Aucun membre sélectionné', 'error');
            return;
        }

        // Masquer les détails et afficher la session active
        const sessionDetails = document.getElementById('sessionDetails');
        const activeSession = document.getElementById('activeSession');
        
        if (sessionDetails) sessionDetails.style.display = 'none';
        if (activeSession) activeSession.style.display = 'block';
        
        // Mettre à jour les informations de session active
        this.updateActiveSessionInterface(purpose, topic);
        
        // Mettre à jour la session courante
        this.currentSession = {
            ...this.currentSession,
            purpose: purpose,
            topic: topic || 'Non spécifié',
            startTime: new Date(),
            id: 'session-' + Date.now()
        };
        
        // Démarrer le compteur de durée
        this.startDurationTimer();
        
        this.showAlert(`✅ Session démarrée pour ${this.currentSession.name}`, 'success');
        this.loadAttendanceStats();
    }

    updateActiveSessionInterface(purpose, topic) {
        const elements = {
            activeMemberName: document.getElementById('activeMemberName'),
            activePurpose: document.getElementById('activePurpose'),
            activeStartTime: document.getElementById('activeStartTime'),
            activeDuration: document.getElementById('activeDuration')
        };

        if (elements.activeMemberName) {
            elements.activeMemberName.textContent = this.currentSession.name;
        }
        if (elements.activePurpose) {
            elements.activePurpose.textContent = purpose;
        }
        if (elements.activeStartTime) {
            elements.activeStartTime.textContent = new Date().toLocaleString();
        }
        if (elements.activeDuration) {
            elements.activeDuration.textContent = '0s';
        }
    }

    startDurationTimer() {
        // Arrêter tout intervalle existant
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
        }
        
        // Démarrer un nouvel intervalle
        this.durationInterval = setInterval(() => {
            this.updateDuration();
        }, 1000);
    }

    updateDuration() {
        if (!this.currentSession || !this.currentSession.startTime) return;
        
        const now = new Date();
        const start = new Date(this.currentSession.startTime);
        const diffMs = now - start;
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        let durationText = '';
        if (hours > 0) {
            durationText = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            durationText = `${minutes}m ${seconds % 60}s`;
        } else {
            durationText = `${seconds}s`;
        }
        
        const durationElement = document.getElementById('activeDuration');
        if (durationElement) {
            durationElement.textContent = durationText;
        }
    }

    endSession() {
        if (!this.currentSession) {
            this.showAlert('Aucune session active', 'warning');
            return;
        }

        const confirmMessage = `Terminer la session pour ${this.currentSession.name}?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        console.log('📤 Fin de session pour:', this.currentSession.name);
        
        // Arrêter le compteur de durée
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        
        // Masquer la session active
        const activeSession = document.getElementById('activeSession');
        const sessionForm = document.getElementById('sessionForm');
        
        if (activeSession) activeSession.style.display = 'none';
        if (sessionForm) sessionForm.reset();
        
        // Calculer la durée
        const endTime = new Date();
        const startTime = new Date(this.currentSession.startTime);
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / 60000);
        
        // Ajouter aux sessions récentes
        this.addToRecentSessions({
            ...this.currentSession,
            endTime: endTime.toISOString(),
            duration: minutes + 'm'
        });
        
        this.showAlert(`📊 Session terminée pour ${this.currentSession.name} - Durée: ${minutes} minutes`, 'info');
        
        // Réinitialiser
        this.currentSession = null;
        
        // Mettre à jour les statistiques
        this.loadAttendanceStats();
        this.loadRecentSessions();
    }

    addToRecentSessions(session) {
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        recentSessions.unshift(session);
        
        // Garder seulement les 10 dernières sessions
        if (recentSessions.length > 10) {
            recentSessions.pop();
        }
        
        localStorage.setItem('recentSessions', JSON.stringify(recentSessions));
        console.log(`💾 Session sauvegardée. Total: ${recentSessions.length} sessions`);
    }

    loadAttendanceStats() {
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        const today = new Date().toDateString();
        const todaySessions = recentSessions.filter(session => 
            new Date(session.startTime).toDateString() === today
        );
        const activeSessions = this.currentSession ? 1 : 0;

        // Mettre à jour les statistiques
        this.updateStatElement('totalSessions', recentSessions.length);
        this.updateStatElement('activeSessions', activeSessions);
        this.updateStatElement('todaySessions', todaySessions.length);
        
        // Calculer la durée moyenne
        if (recentSessions.length > 0) {
            const totalMinutes = recentSessions.reduce((sum, session) => {
                return sum + (parseInt(session.duration) || 0);
            }, 0);
            const avgMinutes = Math.round(totalMinutes / recentSessions.length);
            this.updateStatElement('avgDuration', avgMinutes + 'm');
        } else {
            this.updateStatElement('avgDuration', '0m');
        }
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    loadRecentSessions() {
        const container = document.getElementById('recentSessionsContainer');
        const loadingEl = document.getElementById('recentSessionsLoading');
        
        if (!container) return;
        
        // Afficher le loading
        if (loadingEl) loadingEl.style.display = 'block';
        container.innerHTML = '';
        
        // Simuler un chargement (pour l'effet visuel)
        setTimeout(() => {
            const sessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
            
            // Masquer le loading
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (sessions.length === 0) {
                container.innerHTML = this.getNoSessionsHTML();
                return;
            }
            
            // Afficher les sessions
            sessions.forEach(session => {
                const sessionEl = this.createSessionElement(session);
                container.appendChild(sessionEl);
            });
        }, 500);
    }

    getNoSessionsHTML() {
        return `
            <div class="text-center text-muted py-4">
                <i class="fas fa-history fa-3x mb-3"></i>
                <p>Aucune session récente</p>
                <small>Les sessions apparaitront ici après utilisation du système</small>
            </div>
        `;
    }

    createSessionElement(session) {
        const sessionEl = document.createElement('div');
        const isEnded = !!session.endTime;
        sessionEl.className = `card mb-3 ${isEnded ? 'session-ended' : 'session-active'}`;
        
        sessionEl.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="card-title">${session.name}</h6>
                        <p class="card-text mb-1 small">
                            <strong>Motif:</strong> ${session.purpose}
                        </p>
                        <p class="card-text small text-muted mb-0">
                            ${utils.formatTime(session.startTime)} - ${isEnded ? utils.formatTime(session.endTime) : 'Active'}
                        </p>
                    </div>
                    <div class="col-md-4">
                        <p class="card-text mb-1">
                            <strong>Durée:</strong> ${session.duration || 'Active'}
                        </p>
                        <span class="badge ${isEnded ? 'bg-secondary' : 'bg-success'}">
                            ${isEnded ? 'Terminée' : 'Active'}
                        </span>
                    </div>
                    <div class="col-md-2 text-end">
                        <small class="text-muted">${session.memberId}</small>
                    </div>
                </div>
            </div>
        `;
        
        return sessionEl;
    }

    // Méthode utilitaire pour obtenir l'état du système
    getSystemStatus() {
        return {
            currentSession: this.currentSession,
            hasActiveSession: !!this.currentSession,
            durationInterval: !!this.durationInterval,
            eventListenersSetup: this.eventListenersSetup
        };
    }
}

// Create global instance
const attendance = new AttendanceSystem();