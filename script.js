document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    let lexiqueData = [];
    let isDataLoaded = false;

    // 1. Récupération des données du Google Sheets DataBase Lexique
    const URL_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRVConY2oTgvGjhsAvdgkR65CJ1QZKeXxTZDgPeLB2k1PYenyu4OBd59rLKKW7vbbNwdANmnPM3IYbO/pub?gid=627138795&single=true&output=csv";

    // AFFICHAGE DU LOADER
    resultsContainer.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p class="loader-text">Chargement du Décodeur B&B HOTELS</p>
        </div>
    `;

    Papa.parse(URL_GOOGLE_SHEETS, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            lexiqueData = results.data;
            isDataLoaded = true;

            // On trie alphabétiquement en nettoyant les espaces avant
            lexiqueData.sort((a, b) => {
                const termeA = a.terme ? a.terme.trim().toLowerCase() : '';
                const termeB = b.terme ? b.terme.trim().toLowerCase() : '';
                if (!termeA) return 1;
                if (!termeB) return -1;
                return termeA.localeCompare(termeB);
            });
        
            // Cette fonction va écraser le loader pour afficher les résultats
            displayResults(lexiqueData); 
        },
        error: function(err) {
            console.error("Erreur lors du chargement du Google Sheets :", err);
            // En cas d'erreur, on remplace le loader par un message rouge
            resultsContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Erreur lors du chargement du lexique. Vérifiez votre connexion internet.</p>';
        }
    });

   // 2. Fonction qui lance la recherche
    const performSearch = () => {
        if (!isDataLoaded) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // Si la barre est vide, on réaffiche tout en ordre alphabétique normal
        if (searchTerm === '') {
            lexiqueData.sort((a, b) => a.terme.localeCompare(b.terme));
            displayResults(lexiqueData);
            return;
        }

        // 2A. Filtrer les données (on garde .includes pour être tolérant)
        let filteredData = lexiqueData.filter(item => {
            const terme = item.terme ? item.terme.toLowerCase() : '';
            const definition = item.definition ? item.definition.toLowerCase() : '';
            return terme.includes(searchTerm) || definition.includes(searchTerm);
        });

        // 2B. Trier par PERTINENCE (Le moteur de recherche intelligent)
        filteredData.sort((a, b) => {
            const termeA = a.terme ? a.terme.toLowerCase() : '';
            const termeB = b.terme ? b.terme.toLowerCase() : '';
            
            // Calcul du score pour le mot A
            let scoreA = 0;
            if (termeA === searchTerm) scoreA = 3; // Match exact
            else if (termeA.startsWith(searchTerm)) scoreA = 2; // Commence par
            else if (termeA.includes(searchTerm)) scoreA = 1; // Contient dans le titre
            
            // Calcul du score pour le mot B
            let scoreB = 0;
            if (termeB === searchTerm) scoreB = 3;
            else if (termeB.startsWith(searchTerm)) scoreB = 2;
            else if (termeB.includes(searchTerm)) scoreB = 1;

            // On trie du plus grand score au plus petit
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            
            // Si les mots ont le même score (ex: tous les deux trouvés dans une définition),
            // on les départage par ordre alphabétique pour que ça reste propre à l'écran.
            return termeA.localeCompare(termeB);
        });

        // Afficher les résultats triés
        displayResults(filteredData);
    };

    // 3. Écouteur pour la recherche en temps réel
    searchInput.addEventListener('input', performSearch);

    // 4. Écouteur pour la touche "Entrée"
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // 5. Fonction pour générer le HTML des résultats
    function displayResults(results) {
        resultsContainer.innerHTML = '';

        // EMPTY STATE (Si aucun résultat)
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>Aucun mot trouvé. N\'hésitez pas à le proposer ou l\'ajouter via les boutons ci-dessous !</p>';
            return;
        }

        // Fonction utilitaire pour nettoyer et gérer les sauts de ligne
        const formatText = (text) => {
            if (!text) return '';
            // .trim() enlève les espaces inutiles au début/fin
            // .replace(/\n/g, '<br>') transforme les "Entrées" du clavier en vrais sauts de ligne HTML
            return text.trim().replace(/\n/g, '<br>');
        };

        results.forEach(item => {
            // Sécurité : on ignore la ligne si le terme ou la def est vide
            if (!item.terme || !item.terme.trim() || !item.definition || !item.definition.trim()) return;

            // On nettoie le terme pour l'affichage (enlève les espaces au début/fin)
            const cleanTerme = item.terme.trim();
            const cleanDefinition = formatText(item.definition);
            const cleanCalcul = formatText(item.calcul);
            const cleanImportance = formatText(item.importance);

            const card = document.createElement('div');
            card.className = 'result-card';
            
            let htmlContent = `<h2>${cleanTerme}</h2>`;
            htmlContent += `<p><strong>Définition :</strong> ${cleanDefinition}</p>`;
            
            if (cleanCalcul !== '') {
                htmlContent += `<h4>Comment le calculer ?</h4><p>${cleanCalcul}</p>`;
            }
            
            if (cleanImportance !== '') {
                htmlContent += `<h4>Pourquoi c'est important chez B&B HOTELS ?</h4><p>${cleanImportance}</p>`;
            }

            card.innerHTML = htmlContent;
            resultsContainer.appendChild(card);
        });
    }

    // 6. Gestion du bouton Mode Clair / Mode Sombre
    const themeToggle = document.getElementById('themeToggle');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            themeToggle.textContent = 'Mode sombre 🌙';
        } else {
            themeToggle.textContent = 'Mode clair ☀️';
        }
    });

    // 7. Gestion du bouton "Retour en haut"
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
