// Attendance System
class AttendanceSystem {
    constructor() {
        this.currentSession = null;
        this.durationInterval = null;
    }

    initializeAttendanceSystem() {
        console.log('🎯 Initialisation du système de présence...');
        this.loadAttendanceStats();
        this.loadRecentSessions();
        this.setupEventListeners();
        console.log('✅ Système de présence initialisé');
    }

    setupEventListeners() {
        console.log('🔧 Configuration des événements...');
        
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

        // Attacher les événements
        if (startScannerBtn) {
            startScannerBtn.onclick = (e) => {
                e.preventDefault();
                this.startScanner();
            };
        }

        if (stopScannerBtn) {
            stopScannerBtn.onclick = (e) => {
                e.preventDefault();
                this.stopScanner();
            };
        }

        if (manualEntryBtn) {
            manualEntryBtn.onclick = (e) => {
                e.preventDefault();
                this.startManualEntry();
            };
        }

        if (processManualBtn) {
            processManualBtn.onclick = (e) => {
                e.preventDefault();
                this.processManualEntry();
            };
        }

        if (cancelManualBtn) {
            cancelManualBtn.onclick = (e) => {
                e.preventDefault();
                this.cancelManualEntry();
            };
        }

        if (demoMemberBtn) {
            demoMemberBtn.onclick = (e) => {
                e.preventDefault();
                this.useDemoMember();
            };
        }

        if (startSessionBtn) {
            startSessionBtn.onclick = (e) => {
                e.preventDefault();
                this.startSession();
            };
        }

        if (cancelSessionBtn) {
            cancelSessionBtn.onclick = (e) => {
                e.preventDefault();
                this.cancelSession();
            };
        }

        if (endSessionBtn) {
            endSessionBtn.onclick = (e) => {
                e.preventDefault();
                this.endSession();
            };
        }

        // Enter key in manual entry
        const manualInput = document.getElementById('manualMemberId');
        if (manualInput) {
            manualInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.processManualEntry();
                }
            });
        }

        console.log('✅ Événements configurés');
    }

    // Scanner methods
    startScanner() {
        console.log('🔍 Démarrage du scanner...');
        if (window.qrScanner) {
            qrScanner.startScanner();
        } else {
            this.showAlert('Scanner non disponible', 'error');
        }
    }

    stopScanner() {
        console.log('🛑 Arrêt du scanner...');
        if (window.qrScanner) {
            qrScanner.stopScanner();
        }
    }

    showAlert(message, type = 'info') {
        const alertEl = document.getElementById('attendanceAlert');
        if (!alertEl) return;

        const alertClass = type === 'error' ? 'alert-danger' : 
                         type === 'success' ? 'alert-success' :
                         type === 'warning' ? 'alert-warning' : 'alert-info';
        
        alertEl.className = `alert ${alertClass}`;
        alertEl.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                <div>${message}</div>
            </div>
        `;
        alertEl.style.display = 'block';
        
        // Auto-hide après 5 secondes
        setTimeout(() => {
            alertEl.style.display = 'none';
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

    startManualEntry() {
        console.log('⌨️ Démarrage entrée manuelle');
        const manualForm = document.getElementById('manualEntryForm');
        if (manualForm) {
            manualForm.style.display = 'block';
            const memberIdInput = document.getElementById('manualMemberId');
            if (memberIdInput) {
                memberIdInput.focus();
            }
        }
    }

    cancelManualEntry() {
        console.log('❌ Annulation entrée manuelle');
        const manualForm = document.getElementById('manualEntryForm');
        const memberIdInput = document.getElementById('manualMemberId');
        
        if (manualForm) manualForm.style.display = 'none';
        if (memberIdInput) memberIdInput.value = '';
    }

    processManualEntry() {
        console.log('✅ Traitement entrée manuelle');
        const memberId = document.getElementById('manualMemberId')?.value.trim();
        
        if (!memberId) {
            this.showAlert('Veuillez entrer un numéro d\'enregistrement', 'warning');
            return;
        }

        console.log(`🔍 Recherche du membre: ${memberId}`);
        
        if (typeof apiService === 'undefined') {
            this.showAlert('Erreur: service indisponible', 'error');
            return;
        }

        const member = apiService.getMemberByRegistrationNumber(memberId);
        
        if (!member) {
            this.showAlert(`Membre "${memberId}" non trouvé`, 'error');
            return;
        }

        this.processMemberCheckin(member);
    }

    processMemberCheckin(member) {
        console.log(`👤 Check-in pour: ${member.registrationNumber}`);
        
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
        
        const scannedMemberName = document.getElementById('scannedMemberName');
        const scannedMemberId = document.getElementById('scannedMemberId');
        const checkInTime = document.getElementById('checkInTime');
        const sessionDetails = document.getElementById('sessionDetails');

        if (scannedMemberName) scannedMemberName.textContent = `${member.firstName} ${member.lastName}`;
        if (scannedMemberId) scannedMemberId.textContent = member.registrationNumber;
        if (checkInTime) checkInTime.textContent = new Date().toLocaleString();
        if (sessionDetails) sessionDetails.style.display = 'block';
    }

    useDemoMember() {
        console.log('🔧 Utilisation membre démo');
        
        // Utiliser le premier membre disponible ou créer un démo
        let demoMember;
        if (apiService.members.length > 0) {
            demoMember = apiService.members[0];
        } else {
            demoMember = {
                id: 999,
                registrationNumber: "ACM001",
                firstName: "Linus",
                lastName: "Torvalds",
                occupation: "entrepreneur",
                phoneNumber: "+261 34 11 223 34",
                studyOrWorkPlace: "Linux Foundation"
            };
        }
        
        this.processMemberCheckin(demoMember);
        this.showAlert('Mode démo activé', 'info');
    }

    cancelSession() {
        console.log('❌ Annulation session');
        const sessionDetails = document.getElementById('sessionDetails');
        const sessionForm = document.getElementById('sessionForm');
        
        if (sessionDetails) sessionDetails.style.display = 'none';
        if (sessionForm) sessionForm.reset();
        
        this.currentSession = null;
    }

    startSession() {
        console.log('🚀 Démarrage session');
        const purpose = document.getElementById('purpose')?.value;
        const topic = document.getElementById('topic')?.value;
        
        if (!purpose) {
            this.showAlert('Veuillez sélectionner un motif de visite', 'warning');
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
        this.currentSession.purpose = purpose;
        this.currentSession.topic = topic || 'Non spécifié';
        this.currentSession.startTime = new Date();
        this.currentSession.id = 'session-' + Date.now();
        
        // Démarrer le compteur de durée
        this.startDurationTimer();
        
        this.showAlert(`Session démarrée pour ${this.currentSession.name}`, 'success');
        this.loadAttendanceStats();
    }

    updateActiveSessionInterface(purpose, topic) {
        const activeMemberName = document.getElementById('activeMemberName');
        const activePurpose = document.getElementById('activePurpose');
        const activeStartTime = document.getElementById('activeStartTime');
        const activeDuration = document.getElementById('activeDuration');

        if (activeMemberName) activeMemberName.textContent = this.currentSession.name;
        if (activePurpose) activePurpose.textContent = purpose;
        if (activeStartTime) activeStartTime.textContent = new Date().toLocaleString();
        if (activeDuration) activeDuration.textContent = '0s';
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
            duration: minutes
        });
        
        this.showAlert(`Session terminée - Durée: ${minutes} minutes`, 'info');
        
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
        console.log(`Session sauvegardée. Total: ${recentSessions.length}`);
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
                return sum + (session.duration || 0);
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
        
        if (loadingEl) loadingEl.style.display = 'block';
        container.innerHTML = '';
        
        setTimeout(() => {
            const sessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (sessions.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-history fa-3x mb-3"></i>
                        <p>Aucune session récente</p>
                        <small>Les sessions apparaitront ici après utilisation du système</small>
                    </div>
                `;
                return;
            }
            
            sessions.forEach(session => {
                const sessionEl = this.createSessionElement(session);
                container.appendChild(sessionEl);
            });
        }, 500);
    }

    createSessionElement(session) {
        const sessionEl = document.createElement('div');
        const isEnded = !!session.endTime;
        sessionEl.className = `card mb-3 ${isEnded ? 'border-secondary' : 'border-success'}`;
        
        sessionEl.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h6 class="card-title">${session.name}</h6>
                        <p class="card-text mb-1 small">
                            <strong>Motif:</strong> ${session.purpose}
                        </p>
                        <p class="card-text small text-muted mb-0">
                            ${new Date(session.startTime).toLocaleTimeString()} - ${isEnded ? new Date(session.endTime).toLocaleTimeString() : 'Active'}
                        </p>
                    </div>
                    <div class="col-md-4">
                        <p class="card-text mb-1">
                            <strong>Durée:</strong> ${session.duration || 'Active'}m
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
}

// Create global instance
const attendance = new AttendanceSystem();