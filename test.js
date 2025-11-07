<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>American Corner Mahajanga - Système Complet</title>
    
    <!-- Bibliothèques -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    
    <style>
        /* Styles généraux */
        :root {
            --primary-color: #00529b;
            --secondary-color: #0077cc;
            --accent-color: #ff6b00;
            --light-color: #f8f9fa;
            --dark-color: #343a40;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .page-section {
            display: none;
        }
        
        .page-section.active {
            display: block;
        }
        
        /* Navigation */
        .navbar {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .navbar-brand {
            font-weight: 700;
            font-size: 1.5rem;
        }
        
        .nav-link {
            font-weight: 500;
            transition: color 0.3s;
        }
        
        .nav-link:hover {
            color: rgba(255,255,255,0.8) !important;
        }
        
        /* Hero Section */
        .hero-section {
            background: linear-gradient(135deg, rgba(0, 82, 155, 0.85) 0%, rgba(0, 40, 85, 0.9) 100%), 
                        url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80') center/cover no-repeat;
            color: white;
            padding: 120px 0 80px;
            position: relative;
        }
        
        .hero-section h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .hero-section p {
            font-size: 1.3rem;
            max-width: 600px;
            margin: 0 auto 2rem;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .btn-hero {
            padding: 12px 30px;
            border-radius: 30px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-hero:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        /* Stats Section */
        .stats-section {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 80px 0;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        /* Services Section */
        .section-title {
            position: relative;
            margin-bottom: 3rem;
            font-weight: 700;
            color: var(--primary-color);
            text-align: center;
        }
        
        .section-title:after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
            border-radius: 2px;
        }
        
        .service-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
            overflow: hidden;
        }
        
        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        
        .service-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
        }
        
        /* Events Section */
        .featured-events {
            padding: 80px 0;
            background-color: var(--light-color);
        }
        
        .event-card {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
            height: 100%;
        }
        
        .event-card:hover {
            transform: translateY(-5px);
        }
        
        .event-image {
            height: 200px;
            background-size: cover;
            background-position: center;
        }
        
        .event-date {
            background: var(--primary-color);
            color: white;
            padding: 10px 15px;
            display: inline-block;
            border-radius: 0 0 8px 0;
            font-weight: 600;
        }
        
        /* Testimonials */
        .testimonial-section {
            background: white;
            padding: 80px 0;
        }
        
        .testimonial-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            height: 100%;
            position: relative;
        }
        
        .testimonial-text {
            font-style: italic;
            margin-bottom: 1.5rem;
            position: relative;
        }
        
        .testimonial-text:before {
            content: '"';
            font-size: 4rem;
            color: #e9ecef;
            position: absolute;
            top: -20px;
            left: -10px;
            z-index: 0;
        }
        
        .testimonial-author {
            display: flex;
            align-items: center;
        }
        
        .author-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 15px;
            background-size: cover;
            background-position: center;
        }
        
        /* Quick Access */
        .quick-access-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            height: 100%;
            text-align: center;
            padding: 2rem 1.5rem;
        }
        
        .quick-access-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        
        .quick-access-card i {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--primary-color);
        }
        
        /* CTA Section */
        .cta-section {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        .cta-section h2 {
            margin-bottom: 1.5rem;
        }
        
        .cta-section p {
            max-width: 600px;
            margin: 0 auto 2rem;
            font-size: 1.2rem;
        }
        
        /* Footer */
        .footer {
            background: var(--dark-color);
            color: white;
            padding: 60px 0 20px;
        }
        
        .footer h5 {
            margin-bottom: 1.5rem;
            font-weight: 600;
        }
        
        .footer ul li {
            margin-bottom: 0.5rem;
        }
        
        .social-icons a {
            display: inline-block;
            width: 40px;
            height: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            text-align: center;
            line-height: 40px;
            margin-right: 10px;
            transition: all 0.3s ease;
        }
        
        .social-icons a:hover {
            background: var(--primary-color);
            transform: translateY(-3px);
        }
        
        /* Attendance System */
        .attendance-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .scanner-status {
            margin-bottom: 1rem;
        }
        
        .qr-scanner-container {
            padding: 20px;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            text-align: center;
        }
        
        .camera-placeholder {
            padding: 40px 20px;
            background: #f8f9fa;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .camera-placeholder:hover {
            background: #e9ecef;
        }
        
        .alert-attendance {
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        /* QR Generator */
        .member-id-display {
            font-family: monospace;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .hero-section h1 {
                font-size: 2.5rem;
            }
            
            .hero-section p {
                font-size: 1.1rem;
            }
            
            .stat-number {
                font-size: 2.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#" onclick="showPage('home')">
                <i class="fas fa-university me-2"></i>
                American Corner Mahajanga
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" onclick="showPage('home')">Accueil</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showPage('about')">À Propos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showPage('attendance')">Présence</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showPage('qr-generator')">QR Codes</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showPage('members')">Membres</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showPage('contact')">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Home Page -->
    <section id="home" class="page-section active">
        <!-- Hero Section -->
        <div class="hero-section">
            <div class="container text-center">
                <h1 class="display-4 fw-bold mb-4">American Corner Mahajanga</h1>
                <p class="lead mb-4">Votre porte d'entrée vers l'éducation, la culture et l'information américaine à Mahajanga, Madagascar</p>
                <button class="btn btn-light btn-hero me-2" onclick="showPage('about')">En Savoir Plus</button>
                <button class="btn btn-outline-light btn-hero" onclick="showPage('attendance')">Check-In</button>
            </div>
        </div>

        <!-- Stats Section -->
        <section class="stats-section">
            <div class="container">
                <div class="row text-center">
                    <div class="col-md-3 col-6 mb-4">
                        <div class="stat-item">
                            <div class="stat-number">500+</div>
                            <div class="stat-label">Membres Actifs</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-4">
                        <div class="stat-item">
                            <div class="stat-number">50+</div>
                            <div class="stat-label">Événements Annuels</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-4">
                        <div class="stat-item">
                            <div class="stat-number">1000+</div>
                            <div class="stat-label">Livres Disponibles</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6 mb-4">
                        <div class="stat-item">
                            <div class="stat-number">10+</div>
                            <div class="stat-label">Années d'Expérience</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Services Preview -->
        <section class="py-5">
            <div class="container">
                <h2 class="section-title">Nos Services</h2>
                <div class="row g-4">
                    <div class="col-md-6 col-lg-3">
                        <div class="card service-card text-center p-4">
                            <div class="service-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h4>Conseil Éducatif</h4>
                            <p>Guidance gratuite pour les étudiants malgaches intéressés par les études aux États-Unis.</p>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card service-card text-center p-4">
                            <div class="service-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <h4>Ressources Bibliothèque</h4>
                            <p>Accès aux livres, magazines et ressources numériques sur la culture américaine.</p>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card service-card text-center p-4">
                            <div class="service-icon">
                                <i class="fas fa-language"></i>
                            </div>
                            <h4>Programmes d'Anglais</h4>
                            <p>Clubs de conversation, ateliers et ressources pour apprendre l'anglais.</p>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card service-card text-center p-4">
                            <div class="service-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <h4>Programmes Culturels</h4>
                            <p>Événements, projections de films et ateliers célébrant la culture américaine.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Events -->
        <section class="featured-events">
            <div class="container">
                <h2 class="section-title">Événements à Venir</h2>
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="card event-card">
                            <div class="event-image" style="background-image: url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')">
                                <div class="event-date">15 Nov</div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Club de Conversation Anglaise</h5>
                                <p class="card-text">Rejoignez notre session hebdomadaire pour pratiquer votre anglais dans un environnement détendu et amical.</p>
                                <a href="#" class="btn btn-primary">En savoir plus</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card event-card">
                            <div class="event-image" style="background-image: url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')">
                                <div class="event-date">22 Nov</div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Atelier Éducation USA</h5>
                                <p class="card-text">Découvrez comment postuler aux universités américaines et obtenir des bourses d'études.</p>
                                <a href="#" class="btn btn-primary">En savoir plus</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card event-card">
                            <div class="event-image" style="background-image: url('https://images.unsplash.com/photo-1489599809505-f3b2a0d3d0de?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')">
                                <div class="event-date">30 Nov</div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">Projection Cinéma</h5>
                                <p class="card-text">Projection du film "Selma" suivie d'une discussion sur le mouvement des droits civiques aux États-Unis.</p>
                                <a href="#" class="btn btn-primary">En savoir plus</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <button class="btn btn-outline-primary">Voir tous les événements</button>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="testimonial-section">
            <div class="container">
                <h2 class="section-title">Témoignages</h2>
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="testimonial-card">
                            <div class="testimonial-text">
                                Grâce aux conseils de l'American Corner, j'ai pu être accepté dans une université américaine avec une bourse complète. Cette expérience a changé ma vie.
                            </div>
                            <div class="testimonial-author">
                                <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80')"></div>
                                <div>
                                    <h6>Jean Rakoto</h6>
                                    <p class="mb-0">Étudiant à l'Université de Stanford</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="testimonial-card">
                            <div class="testimonial-text">
                                Les clubs de conversation m'ont aidé à améliorer mon anglais de manière significative. Maintenant, je peux communiquer avec confiance avec des anglophones.
                            </div>
                            <div class="testimonial-author">
                                <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80')"></div>
                                <div>
                                    <h6>Marie Rasoa</h6>
                                    <p class="mb-0">Professionnelle du tourisme</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="testimonial-card">
                            <div class="testimonial-text">
                                Les ressources de l'American Corner sont inestimables pour mes recherches académiques. L'accès aux livres et bases de données américaines est exceptionnel.
                            </div>
                            <div class="testimonial-author">
                                <div class="author-avatar" style="background-image: url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"></div>
                                <div>
                                    <h6>Dr. Thomas Andria</h6>
                                    <p class="mb-0">Chercheur universitaire</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick Access -->
        <section class="py-5">
            <div class="container">
                <h2 class="section-title">Accès Rapide</h2>
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="quick-access-card">
                            <i class="fas fa-qrcode"></i>
                            <h4>Système de Présence</h4>
                            <p>Check-in avec QR code pour le suivi des présences</p>
                            <button class="btn btn-primary mt-2" onclick="showPage('attendance')">Accéder</button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="quick-access-card">
                            <i class="fas fa-id-card"></i>
                            <h4>Générateur QR</h4>
                            <p>Créez des QR codes personnalisés pour les membres</p>
                            <button class="btn btn-primary mt-2" onclick="showPage('qr-generator')">Générer</button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="quick-access-card">
                            <i class="fas fa-users"></i>
                            <h4>Gestion Membres</h4>
                            <p>Consultez la liste des membres et leurs profils</p>
                            <button class="btn btn-primary mt-2" onclick="showPage('members')">Voir</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <div class="container">
                <h2>Rejoignez Notre Communauté</h2>
                <p>Inscrivez-vous dès aujourd'hui pour profiter de tous nos services et participer à nos événements culturels et éducatifs.</p>
                <button class="btn btn-light btn-lg px-4 me-2" onclick="showPage('members')">Devenir Membre</button>
                <button class="btn btn-outline-light btn-lg px-4" onclick="showPage('contact')">Nous Contacter</button>
            </div>
        </section>
    </section>

    <!-- About Page -->
    <section id="about" class="page-section py-5">
        <div class="container">
            <button class="btn btn-outline-primary mb-4" onclick="showPage('home')">
                <i class="fas fa-arrow-left me-2"></i>Retour à l'Accueil
            </button>
            <h2 class="section-title text-center">À Propos de Nous</h2>
            <div class="row align-items-center">
                <div class="col-md-6 mb-4">
                    <p class="lead">American Corner Mahajanga est un centre culturel et d'information situé à Mahajanga (Majunga), Madagascar. C'est un partenariat entre l'Ambassade des États-Unis à Madagascar et l'Université de Mahajanga.</p>
                    <p>Nous servons de ressource pour les étudiants, les professionnels et le grand public qui s'intéressent aux États-Unis, sa culture, son système éducatif et ses politiques.</p>
                    <p>Les American Corners font partie d'une initiative mondiale du Département d'État américain pour fournir une fenêtre sur les États-Unis dans les villes où il n'y a pas de Centre américain complet ou d'Ambassade.</p>
                    <p>Notre mission est de promouvoir la compréhension mutuelle entre les peuples de Madagascar et des États-Unis grâce à des programmes éducatifs et culturels.</p>
                </div>
                <div class="col-md-6">
                    <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Students at American Corner" class="img-fluid rounded shadow">
                </div>
            </div>
        </div>
    </section>

    <!-- Attendance System Page -->
    <section id="attendance" class="page-section py-5">
        <div class="container">
            <button class="btn btn-outline-primary mb-4" onclick="showPage('home')">
                <i class="fas fa-arrow-left me-2"></i>Retour à l'Accueil
            </button>
            <h2 class="section-title text-center">Système de Présence ACM</h2>
            
            <!-- Alerts -->
            <div id="attendanceAlert" class="alert alert-attendance" style="display: none;"></div>
            
            <!-- Scanner Status -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="scanner-status text-center">
                        <span class="badge bg-secondary" id="scannerStatus">Scanner arrêté</span>
                    </div>
                </div>
            </div>

            <!-- QR Scanner Section -->
            <div class="card attendance-card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0"><i class="fas fa-qrcode me-2"></i>Check-in par QR Code</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="qr-scanner-container">
                                <h5>Scannez Votre QR Code Membre</h5>
                                
                                <!-- Scanner Container -->
                                <div id="scannerSection">
                                    <!-- Camera Placeholder - visible par défaut -->
                                    <div class="camera-placeholder" id="cameraPlaceholder">
                                        <i class="fas fa-camera fa-3x mb-3"></i>
                                        <p>Scanner prêt</p>
                                        <small class="text-muted mt-2">Cliquez pour activer le scanner</small>
                                    </div>
                                    
                                    <!-- Scanner Container - caché par défaut -->
                                    <div id="scannerContainer" style="display: none;"></div>
                                    
                                    <!-- Scanner Controls -->
                                    <div class="scanner-controls mt-3">
                                        <button class="btn btn-primary w-100" id="startScannerBtn">
                                            <i class="fas fa-camera me-2"></i>Activer le Scanner
                                        </button>
                                        <button class="btn btn-secondary w-100" id="stopScannerBtn" style="display: none;">
                                            <i class="fas fa-stop me-2"></i>Arrêter le Scanner
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Manual Entry -->
                                <button class="btn btn-outline-primary mt-3 w-100" onclick="startManualEntry()">
                                    <i class="fas fa-keyboard me-2"></i>Entrée Manuelle
                                </button>
                                
                                <!-- Quick Demo -->
                                <div class="mt-3 p-3 bg-light rounded">
                                    <h6>Mode Démo</h6>
                                    <p class="small mb-2">Testez le système avec des données locales</p>
                                    <button class="btn btn-outline-info btn-sm w-100" onclick="testScannerWithDemoMember()">
                                        Utiliser ACM001 (Linus Torvalds)
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-4">
                                <h5>Comment Check-in</h5>
                                <ol class="list-group list-group-numbered mb-4">
                                    <li class="list-group-item">Obtenez votre QR code personnel</li>
                                    <li class="list-group-item">Activez le scanner caméra</li>
                                    <li class="list-group-item">Scannez votre QR code</li>
                                    <li class="list-group-item">Remplissez les détails de votre visite</li>
                                    <li class="list-group-item">Confirmez votre check-in</li>
                                </ol>
                                
                                <!-- Check-in Interface will be injected here -->
                                <div id="checkinInterfaceContainer">
                                    <!-- L'interface de check-in sera injectée ici dynamiquement -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Sessions -->
            <div class="card attendance-card mt-4">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0"><i class="fas fa-history me-2"></i>Check-ins Récents</h4>
                </div>
                <div class="card-body">
                    <div id="recentCheckinsContainer">
                        <p class="text-muted text-center">Aucun check-in récent</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- QR Generator Page -->
    <section id="qr-generator" class="page-section py-5">
        <div class="container">
            <button class="btn btn-outline-primary mb-4" onclick="showPage('home')">
                <i class="fas fa-arrow-left me-2"></i>Retour à l'Accueil
            </button>
            <h2 class="section-title text-center">Générateur de QR Codes</h2>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Format API:</strong> Les QR codes générés utilisent le format exact de votre API pour une compatibilité parfaite avec le système d'attendance.
            </div>
            
            <!-- QR Generator Form -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0"><i class="fas fa-qrcode me-2"></i>Générer un QR Code Membre</h4>
                </div>
                <div class="card-body">
                    <form id="qrGeneratorForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="registrationNumber" class="form-label">Numéro d'Enregistrement *</label>
                                    <input type="text" class="form-control" id="registrationNumber" required 
                                           placeholder="ex: ACM001, ACM002">
                                    <div class="form-text">Doit correspondre au registrationNumber de l'API</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="firstName" class="form-label">Prénom *</label>
                                    <input type="text" class="form-control" id="firstName" required 
                                           placeholder="ex: Linus">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="lastName" class="form-label">Nom *</label>
                                    <input type="text" class="form-control" id="lastName" required 
                                           placeholder="ex: Torvalds">
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="occupation" class="form-label">Occupation</label>
                                    <select class="form-select" id="occupation">
                                        <option value="student">Étudiant</option>
                                        <option value="employee">Employé</option>
                                        <option value="entrepreneur">Entrepreneur</option>
                                        <option value="unemployed">Sans emploi</option>
                                        <option value="other">Autre</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="phoneNumber" class="form-label">Téléphone</label>
                                    <input type="tel" class="form-control" id="phoneNumber" 
                                           placeholder="ex: +261 34 12 345 67">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="studyWorkPlace" class="form-label">Lieu d'Étude/Travail</label>
                                    <input type="text" class="form-control" id="studyWorkPlace" 
                                           placeholder="ex: Université de Mahajanga">
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center mt-4">
                            <button type="submit" class="btn btn-primary btn-lg" id="generateQRBtn">
                                <i class="fas fa-qrcode me-2"></i>Générer QR Code
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-lg ms-2" id="clearQRBtn">
                                <i class="fas fa-eraser me-2"></i>Effacer
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- QR Code Display -->
            <div class="card" id="qrCodeSection" style="display: none;">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0"><i class="fas fa-check-circle me-2"></i>QR Code Généré</h4>
                </div>
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="qr-code-display">
                                <div id="qrcode"></div>
                                <div class="mt-3">
                                    <button class="btn btn-success me-2" id="downloadQRBtn">
                                        <i class="fas fa-download me-2"></i>Télécharger
                                    </button>
                                    <button class="btn btn-outline-primary" id="printQRBtn">
                                        <i class="fas fa-print me-2"></i>Imprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="member-info">
                                <h5>Informations Membre</h5>
                                <div class="card">
                                    <div class="card-body">
                                        <p><strong>Numéro:</strong> <span id="displayRegNumber" class="member-id-display">-</span></p>
                                        <p><strong>Nom:</strong> <span id="displayName">-</span></p>
                                        <p><strong>Occupation:</strong> <span id="displayOccupation">-</span></p>
                                        <p><strong>Téléphone:</strong> <span id="displayPhone">-</span></p>
                                        <p><strong>Lieu:</strong> <span id="displayStudyWork">-</span></p>
                                        <p><strong>Généré:</strong> <span id="displayTimestamp">-</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h5>Contenu du QR Code (Format API):</h5>
                        <pre class="bg-light p-3 rounded"><code id="jsonPreview"></code></pre>
                    </div>
                </div>
            </div>

            <!-- Sample Members Section -->
            <div class="card mt-4">
                <div class="card-header bg-info text-white">
                    <h4 class="mb-0"><i class="fas fa-users me-2"></i>Membres ACM - Prêts à Scanner</h4>
                </div>
                <div class="card-body">
                    <p class="text-center mb-4">Cliquez sur un membre pour générer instantanément son QR code</p>
                    
                    <div class="row g-4" id="sampleMembers">
                        <!-- Sample members will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Members Page -->
    <section id="members" class="page-section py-5">
        <div class="container">
            <button class="btn btn-outline-primary mb-4" onclick="showPage('home')">
                <i class="fas fa-arrow-left me-2"></i>Retour à l'Accueil
            </button>
            <h2 class="section-title text-center">Nos Membres</h2>
            <p class="text-center mb-5">Découvrez nos membres dédiés qui participent aux activités de l'American Corner.</p>
            
            <div class="row g-4" id="membersContainer">
                <!-- Members will be loaded here -->
            </div>
        </div>
    </section>

    <!-- Contact Page -->
    <section id="contact" class="page-section py-5 bg-light">
        <div class="container">
            <button class="btn btn-outline-primary mb-4" onclick="showPage('home')">
                <i class="fas fa-arrow-left me-2"></i>Retour à l'Accueil
            </button>
            <h2 class="section-title text-center">Contactez-Nous</h2>
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="mb-4">Coordonnées</h4>
                            <div class="mb-3">
                                <h5><i class="fas fa-map-marker-alt me-2 text-primary"></i> Adresse</h5>
                                <p>Université de Mahajanga<br>Mahajanga, Région Boeny<br>Madagascar</p>
                            </div>
                            <div class="mb-3">
                                <h5><i class="fas fa-envelope me-2 text-primary"></i> Email</h5>
                                <p>info@americancornermahajanga.mg</p>
                            </div>
                            <div class="mb-3">
                                <h5><i class="fas fa-phone me-2 text-primary"></i> Téléphone</h5>
                                <p>+261 XX XX XXX XX</p>
                            </div>
                            <div class="mb-3">
                                <h5><i class="fas fa-clock me-2 text-primary"></i> Heures d'Ouverture</h5>
                                <p>Lundi - Vendredi: 9h00 - 17h00<br>Samedi: 9h00 - 13h00</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="mb-4">Envoyez un Message</h4>
                            <form id="contactForm">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Nom</label>
                                    <input type="text" class="form-control" id="name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" required>
                                </div>
                                <div class="mb-3">
                                    <label for="subject" class="form-label">Sujet</label>
                                    <input type="text" class="form-control" id="subject" required>
                                </div>
                                <div class="mb-3">
                                    <label for="message" class="form-label">Message</label>
                                    <textarea class="form-control" id="message" rows="4" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary px-4" id="sendMessageBtn">Envoyer</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="row">
                <div class="col-md-4 mb-4 mb-md-0">
                    <h5>American Corner Mahajanga</h5>
                    <p>Un partenariat entre l'Ambassade des États-Unis à Madagascar et l'Université de Mahajanga.</p>
                    <div class="social-icons">
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="col-md-4 mb-4 mb-md-0">
                    <h5>Liens Rapides</h5>
                    <ul class="list-unstyled">
                        <li><a href="#" class="text-white text-decoration-none" onclick="showPage('home')">Accueil</a></li>
                        <li><a href="#" class="text-white text-decoration-none" onclick="showPage('about')">À Propos</a></li>
                        <li><a href="#" class="text-white text-decoration-none" onclick="showPage('attendance')">Présence</a></li>
                        <li><a href="#" class="text-white text-decoration-none" onclick="showPage('qr-generator')">QR Codes</a></li>
                        <li><a href="#" class="text-white text-decoration-none" onclick="showPage('contact')">Contact</a></li>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Ressources</h5>
                    <ul class="list-unstyled">
                        <li><a href="https://mg.usembassy.gov" class="text-white text-decoration-none">Ambassade USA Madagascar</a></li>
                        <li><a href="https://educationusa.state.gov" class="text-white text-decoration-none">EducationUSA</a></li>
                        <li><a href="https://exchanges.state.gov" class="text-white text-decoration-none">Programmes d'Échange</a></li>
                    </ul>
                </div>
            </div>
            <hr class="mt-4 mb-3">
            <div class="row">
                <div class="col-md-12 text-center">
                    <p class="mb-0">&copy; 2024 American Corner Mahajanga. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Custom JavaScript -->
    <script>
        // Navigation between pages
        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page-section').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            document.getElementById(pageId).classList.add('active');
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Set active nav link based on page
            if (pageId === 'home') {
                document.querySelector('.nav-link[onclick="showPage(\'home\')"]').classList.add('active');
            }
        }
        
        // QR Code Generator functionality
        document.addEventListener('DOMContentLoaded', function() {
            const qrGeneratorForm = document.getElementById('qrGeneratorForm');
            const qrCodeSection = document.getElementById('qrCodeSection');
            const qrcodeDiv = document.getElementById('qrcode');
            const clearQRBtn = document.getElementById('clearQRBtn');
            
            // Generate QR Code
            if (qrGeneratorForm) {
                qrGeneratorForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Get form values
                    const registrationNumber = document.getElementById('registrationNumber').value;
                    const firstName = document.getElementById('firstName').value;
                    const lastName = document.getElementById('lastName').value;
                    const occupation = document.getElementById('occupation').value;
                    const phoneNumber = document.getElementById('phoneNumber').value;
                    const studyWorkPlace = document.getElementById('studyWorkPlace').value;
                    
                    // Create QR data object
                    const qrData = {
                        registrationNumber: registrationNumber,
                        firstName: firstName,
                        lastName: lastName,
                        occupation: occupation,
                        phoneNumber: phoneNumber,
                        studyOrWorkPlace: studyWorkPlace,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Generate QR Code
                    const qrDataString = JSON.stringify(qrData);
                    qrcodeDiv.innerHTML = '';
                    
                    const qrcode = new QRCode(qrcodeDiv, {
                        text: qrDataString,
                        width: 200,
                        height: 200,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    
                    // Update display information
                    document.getElementById('displayRegNumber').textContent = registrationNumber;
                    document.getElementById('displayName').textContent = `${firstName} ${lastName}`;
                    document.getElementById('displayOccupation').textContent = occupation;
                    document.getElementById('displayPhone').textContent = phoneNumber || 'Non fourni';
                    document.getElementById('displayStudyWork').textContent = studyWorkPlace || 'Non fourni';
                    document.getElementById('displayTimestamp').textContent = new Date().toLocaleString();
                    document.getElementById('jsonPreview').textContent = JSON.stringify(qrData, null, 2);
                    
                    // Show QR code section
                    qrCodeSection.style.display = 'block';
                    
                    // Scroll to QR code section
                    qrCodeSection.scrollIntoView({ behavior: 'smooth' });
                });
            }
            
            // Clear QR Code
            if (clearQRBtn) {
                clearQRBtn.addEventListener('click', function() {
                    qrGeneratorForm.reset();
                    qrcodeDiv.innerHTML = '';
                    qrCodeSection.style.display = 'none';
                });
            }
            
            // Download QR Code
            const downloadQRBtn = document.getElementById('downloadQRBtn');
            if (downloadQRBtn) {
                downloadQRBtn.addEventListener('click', function() {
                    const canvas = qrcodeDiv.querySelector('canvas');
                    if (canvas) {
                        const link = document.createElement('a');
                        link.download = `QRCode-${document.getElementById('registrationNumber').value}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    }
                });
            }
            
            // Print QR Code
            const printQRBtn = document.getElementById('printQRBtn');
            if (printQRBtn) {
                printQRBtn.addEventListener('click', function() {
                    const printWindow = window.open('', '_blank');
                    const registrationNumber = document.getElementById('registrationNumber').value;
                    const firstName = document.getElementById('firstName').value;
                    const lastName = document.getElementById('lastName').value;
                    
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>QR Code - ${registrationNumber}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                                    .qr-container { margin: 20px auto; }
                                    .member-info { margin-top: 20px; }
                                </style>
                            </head>
                            <body>
                                <h2>American Corner Mahajanga</h2>
                                <h3>QR Code Membre</h3>
                                <div class="qr-container">${qrcodeDiv.innerHTML}</div>
                                <div class="member-info">
                                    <p><strong>Numéro:</strong> ${registrationNumber}</p>
                                    <p><strong>Nom:</strong> ${firstName} ${lastName}</p>
                                    <p><strong>Date de génération:</strong> ${new Date().toLocaleDateString()}</p>
                                </div>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                });
            }
            
            // Load sample members for QR generator
            loadSampleMembers();
            
            // Load members for members page
            loadMembers();
        });
        
        // Load sample members for QR generator
        function loadSampleMembers() {
            const sampleMembers = [
                {
                    registrationNumber: "ACM001",
                    firstName: "Linus",
                    lastName: "Torvalds",
                    occupation: "entrepreneur",
                    phoneNumber: "+261 34 11 223 34",
                    studyWorkPlace: "Linux Foundation"
                },
                {
                    registrationNumber: "ACM002",
                    firstName: "Marie",
                    lastName: "Curie",
                    occupation: "student",
                    phoneNumber: "+261 32 22 334 45",
                    studyWorkPlace: "Université de Mahajanga"
                },
                {
                    registrationNumber: "ACM003",
                    firstName: "Thomas",
                    lastName: "Edison",
                    occupation: "employee",
                    phoneNumber: "+261 33 33 445 56",
                    studyWorkPlace: "Electric Company"
                }
            ];
            
            const sampleMembersContainer = document.getElementById('sampleMembers');
            if (sampleMembersContainer) {
                sampleMembersContainer.innerHTML = '';
                
                sampleMembers.forEach(member => {
                    const memberCard = document.createElement('div');
                    memberCard.className = 'col-md-4';
                    memberCard.innerHTML = `
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <div class="mb-3">
                                    <i class="fas fa-user-circle fa-3x text-primary"></i>
                                </div>
                                <h5>${member.firstName} ${member.lastName}</h5>
                                <p class="text-muted">${member.registrationNumber}</p>
                                <p><small>${member.occupation} - ${member.studyWorkPlace}</small></p>
                                <button class="btn btn-sm btn-outline-primary" onclick="fillMemberForm('${member.registrationNumber}', '${member.firstName}', '${member.lastName}', '${member.occupation}', '${member.phoneNumber}', '${member.studyWorkPlace}')">
                                    Générer QR Code
                                </button>
                            </div>
                        </div>
                    `;
                    sampleMembersContainer.appendChild(memberCard);
                });
            }
        }
        
        // Fill member form with sample data
        function fillMemberForm(regNumber, firstName, lastName, occupation, phone, studyWork) {
            document.getElementById('registrationNumber').value = regNumber;
            document.getElementById('firstName').value = firstName;
            document.getElementById('lastName').value = lastName;
            document.getElementById('occupation').value = occupation;
            document.getElementById('phoneNumber').value = phone;
            document.getElementById('studyWorkPlace').value = studyWork;
            
            // Scroll to form
            document.getElementById('qrGeneratorForm').scrollIntoView({ behavior: 'smooth' });
        }
        
        // Load members for members page
        function loadMembers() {
            const members = [
                {
                    id: "ACM001",
                    name: "Linus Torvalds",
                    role: "Membre Fondateur",
                    description: "Entrepreneur et développeur passionné par la technologie open source.",
                    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                },
                {
                    id: "ACM002",
                    name: "Marie Curie",
                    role: "Étudiante en Médecine",
                    description: "Étudiante motivée souhaitant poursuivre ses études aux États-Unis.",
                    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
                },
                {
                    id: "ACM003",
                    name: "Thomas Edison",
                    role: "Ingénieur Électricien",
                    description: "Professionnel cherchant à améliorer ses compétences en anglais.",
                    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
                },
                {
                    id: "ACM004",
                    name: "Ada Lovelace",
                    role: "Développeuse Web",
                    description: "Passionnée par la programmation et les échanges culturels.",
                    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                },
                {
                    id: "ACM005",
                    name: "Albert Einstein",
                    role: "Professeur de Physique",
                    description: "Enseignant partageant sa passion pour les sciences avec la communauté.",
                    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
                },
                {
                    id: "ACM006",
                    name: "Rosalind Franklin",
                    role: "Chercheuse en Biologie",
                    description: "Scientifique participant aux programmes de recherche collaborative.",
                    image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
                }
            ];
            
            const membersContainer = document.getElementById('membersContainer');
            if (membersContainer) {
                membersContainer.innerHTML = '';
                
                members.forEach(member => {
                    const memberCard = document.createElement('div');
                    memberCard.className = 'col-md-6 col-lg-4';
                    memberCard.innerHTML = `
                        <div class="card h-100">
                            <img src="${member.image}" class="card-img-top" alt="${member.name}" style="height: 200px; object-fit: cover;">
                            <div class="card-body text-center">
                                <h5 class="card-title">${member.name}</h5>
                                <p class="text-primary">${member.role}</p>
                                <p class="card-text">${member.description}</p>
                                <span class="badge bg-light text-dark">${member.id}</span>
                            </div>
                        </div>
                    `;
                    membersContainer.appendChild(memberCard);
                });
            }
        }
        
        // Manual entry for attendance
        function startManualEntry() {
            const checkinInterface = `
                <div class="manual-entry-form">
                    <h5>Entrée Manuelle</h5>
                    <div class="mb-3">
                        <label for="manualRegNumber" class="form-label">Numéro d'Enregistrement</label>
                        <input type="text" class="form-control" id="manualRegNumber" placeholder="ex: ACM001">
                    </div>
                    <div class="mb-3">
                        <label for="manualFirstName" class="form-label">Prénom</label>
                        <input type="text" class="form-control" id="manualFirstName" placeholder="ex: Linus">
                    </div>
                    <div class="mb-3">
                        <label for="manualLastName" class="form-label">Nom</label>
                        <input type="text" class="form-control" id="manualLastName" placeholder="ex: Torvalds">
                    </div>
                    <div class="mb-3">
                        <label for="manualPurpose" class="form-label">Raison de la Visite</label>
                        <select class="form-select" id="manualPurpose">
                            <option value="study">Études/Recherche</option>
                            <option value="event">Événement</option>
                            <option value="consultation">Consultation</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                    <button class="btn btn-success w-100" onclick="processManualCheckin()">
                        <i class="fas fa-check me-2"></i>Confirmer le Check-in
                    </button>
                </div>
            `;
            
            document.getElementById('checkinInterfaceContainer').innerHTML = checkinInterface;
        }
        
        // Process manual check-in
        function processManualCheckin() {
            const regNumber = document.getElementById('manualRegNumber').value;
            const firstName = document.getElementById('manualFirstName').value;
            const lastName = document.getElementById('manualLastName').value;
            const purpose = document.getElementById('manualPurpose').value;
            
            if (!regNumber || !firstName || !lastName) {
                showAttendanceAlert('Veuillez remplir tous les champs obligatoires', 'danger');
                return;
            }
            
            // Simulate successful check-in
            showAttendanceAlert(`Check-in réussi pour ${firstName} ${lastName} (${regNumber})`, 'success');
            
            // Add to recent check-ins
            addRecentCheckin({
                registrationNumber: regNumber,
                firstName: firstName,
                lastName: lastName,
                purpose: purpose,
                timestamp: new Date().toLocaleString()
            });
            
            // Clear form
            document.getElementById('checkinInterfaceContainer').innerHTML = '';
        }
        
        // Show attendance alert
        function showAttendanceAlert(message, type) {
            const alertDiv = document.getElementById('attendanceAlert');
            alertDiv.textContent = message;
            alertDiv.className = `alert alert-${type} alert-attendance`;
            alertDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }
        
        // Add recent check-in
        function addRecentCheckin(checkin) {
            const container = document.getElementById('recentCheckinsContainer');
            
            // If it's the first check-in, clear the placeholder
            if (container.querySelector('p.text-muted')) {
                container.innerHTML = '';
            }
            
            const checkinElement = document.createElement('div');
            checkinElement.className = 'checkin-item mb-3 p-3 border rounded';
            checkinElement.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${checkin.firstName} ${checkin.lastName}</strong>
                        <br>
                        <small class="text-muted">${checkin.registrationNumber}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary">${checkin.purpose}</span>
                        <br>
                        <small class="text-muted">${checkin.timestamp}</small>
                    </div>
                </div>
            `;
            
            container.prepend(checkinElement);
        }
        
        // Test scanner with demo member
        function testScannerWithDemoMember() {
            console.log('🧪 Test avec membre démo ACM001');
            
            // Simulate a successful scan
            const demoCheckin = {
                registrationNumber: "ACM001",
                firstName: "Linus",
                lastName: "Torvalds",
                purpose: "study",
                timestamp: new Date().toLocaleString()
            };
            
            showAttendanceAlert(`Scan réussi pour ${demoCheckin.firstName} ${demoCheckin.lastName} (${demoCheckin.registrationNumber})`, 'success');
            addRecentCheckin(demoCheckin);
        }
    </script>
</body>
</html>