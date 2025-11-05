// Attendance System
class AttendanceSystem {
    constructor() {
        this.currentSession = null;
        this.durationInterval = null;
        this.scanner = new QRScanner(); // Instance du scanner
    }

    initializeAttendanceSystem() {
        this.loadAttendanceStats();
        this.loadRecentSessions();
        this.setupScannerUI();
    }
    // Méthodes pour le scanner
    startScanner() {
        this.scanner.startScanner();
    }

    stopScanner() {
        this.scanner.stopScanner();
    }

    switchCamera() {
        this.scanner.switchCamera();
    }

    setupScannerUI() {
        // Ajouter un bouton pour changer de caméra si disponible
        const scannerSection = document.getElementById('scannerSection');
        if (scannerSection) {
            const switchCameraBtn = document.createElement('button');
            switchCameraBtn.className = 'btn btn-outline-info btn-sm mt-2 w-100';
            switchCameraBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Changer de caméra';
            switchCameraBtn.onclick = () => this.switchCamera();
            scannerSection.appendChild(switchCameraBtn);
        }
    }
    
    showAlert(message, type = 'info') {
        const alertEl = document.getElementById('attendanceAlert');
        const alertClass = type === 'error' ? 'alert-danger' : 
                         type === 'success' ? 'alert-success' :
                         type === 'warning' ? 'alert-warning' : 'alert-info';
        
        alertEl.className = `alert alert-attendance ${alertClass}`;
        alertEl.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                <div>${message}</div>
            </div>
        `;
        alertEl.style.display = 'block';
        
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, 5000);
    }

    startManualEntry() {
        document.getElementById('manualEntryForm').style.display = 'block';
        this.showAlert('Veuillez entrer le numéro d\'enregistrement du membre', 'info');
    }

    cancelManualEntry() {
        document.getElementById('manualEntryForm').style.display = 'none';
        document.getElementById('manualMemberId').value = '';
    }

    processManualEntry() {
        const memberId = document.getElementById('manualMemberId').value.trim();
        
        if (!memberId) {
            this.showAlert('Veuillez entrer le numéro d\'enregistrement du membre', 'warning');
            return;
        }

        // Find member by registration number
        const member = apiService.getMemberByRegistrationNumber(memberId);
        
        if (!member) {
            this.showAlert('Membre non trouvé. Vérifiez le numéro d\'enregistrement.', 'error');
            return;
        }

        document.getElementById('manualEntryForm').style.display = 'none';
        
        document.getElementById('scannedMemberName').textContent = `${member.firstName} ${member.lastName}`;
        document.getElementById('scannedMemberId').textContent = member.registrationNumber;
        document.getElementById('checkInTime').textContent = new Date().toLocaleString();
        
        document.getElementById('sessionDetails').style.display = 'block';
        this.currentSession = {
            memberId: member.registrationNumber,
            name: `${member.firstName} ${member.lastName}`,
            checkInTime: new Date().toISOString(),
            memberData: member
        };
        
        this.showAlert(`Entrée manuelle réussie! Bienvenue ${member.firstName} ${member.lastName}`, 'success');
    }

    useDemoMember() {
        if (apiService.members.length === 0) {
            this.showAlert('Chargement des membres en cours...', 'warning');
            return;
        }
        
        const demoMember = apiService.members[0];
        document.getElementById('scannedMemberName').textContent = `${demoMember.firstName} ${demoMember.lastName}`;
        document.getElementById('scannedMemberId').textContent = demoMember.registrationNumber;
        document.getElementById('checkInTime').textContent = new Date().toLocaleString();
        
        document.getElementById('sessionDetails').style.display = 'block';
        this.currentSession = {
            memberId: demoMember.registrationNumber,
            name: `${demoMember.firstName} ${demoMember.lastName}`,
            checkInTime: new Date().toISOString(),
            memberData: demoMember
        };
        
        this.showAlert(`Démo: ${demoMember.firstName} ${demoMember.lastName}`, 'success');
    }

    cancelSession() {
        document.getElementById('sessionDetails').style.display = 'none';
        document.getElementById('sessionForm').reset();
        this.currentSession = null;
        this.showAlert('Session annulée', 'warning');
    }

    startSession() {
        const purpose = document.getElementById('purpose').value;
        const topic = document.getElementById('topic').value;
        
        if (!purpose) {
            this.showAlert('Veuillez sélectionner le motif de la visite', 'warning');
            return;
        }

        document.getElementById('sessionDetails').style.display = 'none';
        document.getElementById('activeSession').style.display = 'block';
        
        document.getElementById('activeMemberName').textContent = this.currentSession.name;
        document.getElementById('activePurpose').textContent = purpose;
        document.getElementById('activeStartTime').textContent = new Date().toLocaleString();
        
        this.currentSession = {
            ...this.currentSession,
            purpose: purpose,
            topic: topic || 'Non spécifié',
            startTime: new Date(),
            id: 'session-' + Date.now()
        };
        
        this.updateDuration();
        this.durationInterval = setInterval(() => this.updateDuration(), 1000);
        
        this.showAlert(`Session démarrée pour ${this.currentSession.name}`, 'success');
        this.loadAttendanceStats();
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
        
        document.getElementById('activeDuration').textContent = durationText;
    }

    endSession() {
        if (!this.currentSession) return;
        
        if (confirm(`Terminer la session pour ${this.currentSession.name}?`)) {
            if (this.durationInterval) {
                clearInterval(this.durationInterval);
                this.durationInterval = null;
            }
            
            document.getElementById('activeSession').style.display = 'none';
            document.getElementById('sessionForm').reset();
            
            const endTime = new Date();
            const startTime = new Date(this.currentSession.startTime);
            const durationMs = endTime - startTime;
            const minutes = Math.floor(durationMs / 60000);
            
            this.showAlert(`Session terminée pour ${this.currentSession.name}. Durée: ${minutes} minutes`, 'info');
            
            this.addToRecentSessions({
                ...this.currentSession,
                endTime: endTime.toISOString(),
                duration: minutes + 'm'
            });
            
            this.currentSession = null;
            
            this.loadAttendanceStats();
            this.loadRecentSessions();
        }
    }

    addToRecentSessions(session) {
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        recentSessions.unshift(session);
        if (recentSessions.length > 10) {
            recentSessions.pop();
        }
        localStorage.setItem('recentSessions', JSON.stringify(recentSessions));
    }

    loadAttendanceStats() {
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        const today = new Date().toDateString();
        const todaySessions = recentSessions.filter(session => 
            new Date(session.startTime).toDateString() === today
        );
        const activeSessions = this.currentSession ? 1 : 0;

        document.getElementById('totalSessions').textContent = recentSessions.length;
        document.getElementById('activeSessions').textContent = activeSessions;
        document.getElementById('todaySessions').textContent = todaySessions.length;
        
        if (recentSessions.length > 0) {
            const totalMinutes = recentSessions.reduce((sum, session) => {
                return sum + (parseInt(session.duration) || 0);
            }, 0);
            const avgMinutes = Math.round(totalMinutes / recentSessions.length);
            document.getElementById('avgDuration').textContent = avgMinutes + 'm';
        } else {
            document.getElementById('avgDuration').textContent = '0m';
        }
    }

    loadRecentSessions() {
        const container = document.getElementById('recentSessionsContainer');
        const loadingEl = document.getElementById('recentSessionsLoading');
        
        loadingEl.style.display = 'block';
        container.innerHTML = '';
        
        setTimeout(() => {
            const sessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
            
            loadingEl.style.display = 'none';
            
            if (sessions.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-history fa-3x mb-3"></i>
                        <p>Aucune session récente</p>
                        <small>Utilisez le formulaire ci-dessus pour voir les sessions ici</small>
                    </div>
                `;
                return;
            }
            
            sessions.forEach(session => {
                const sessionEl = document.createElement('div');
                sessionEl.className = `card mb-3 ${session.endTime ? 'session-ended' : 'session-active'}`;
                
                sessionEl.innerHTML = `
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h6 class="card-title">${session.name}</h6>
                                <p class="card-text mb-1 small">
                                    <strong>Motif:</strong> ${session.purpose}
                                </p>
                                <p class="card-text small text-muted mb-0">
                                    ${utils.formatTime(session.startTime)} - ${session.endTime ? utils.formatTime(session.endTime) : 'Active'}
                                </p>
                            </div>
                            <div class="col-md-4">
                                <p class="card-text mb-1">
                                    <strong>Durée:</strong> ${session.duration || 'Active'}
                                </p>
                                <span class="badge ${session.endTime ? 'bg-secondary' : 'bg-success'}">
                                    ${session.endTime ? 'Terminée' : 'Active'}
                                </span>
                            </div>
                            <div class="col-md-2 text-end">
                                <small class="text-muted">${session.memberId}</small>
                            </div>
                        </div>
                    </div>
                `;
                
                container.appendChild(sessionEl);
            });
        }, 500);
    }
}

// Create global instance
const attendance = new AttendanceSystem();