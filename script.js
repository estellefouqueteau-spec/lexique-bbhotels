document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    let lexiqueData = [];
    let isDataLoaded = false;

    // 1. Récupération des données du Google Sheets DataBase Lexique
    // CORRIGÉ : Suppression du "CSV" en trop à la fin de l'URL
    const URL_GOOGLE_SHEETS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRVConY2oTgvGjhsAvdgkR65CJ1QZKeXxTZDgPeLB2k1PYenyu4OBd59rLKKW7vbbNwdANmnPM3IYbO/pub?output=csv";

    Papa.parse(URL_GOOGLE_SHEETS, {
        download: true,
        header: true, // Utilise la première ligne (terme, definition...) comme étiquettes
        skipEmptyLines: true,
        complete: function(results) {
            // CORRIGÉ : On remplit nos variables globales pour que la recherche fonctionne
            lexiqueData = results.data;
            isDataLoaded = true;

            // BONUS SMART : On trie automatiquement par ordre alphabétique au cas où le Sheets ne le soit pas
            lexiqueData.sort((a, b) => {
                if (!a.terme) return 1;
                if (!b.terme) return -1;
                return a.terme.localeCompare(b.terme);
            });
        
            // On affiche immédiatement tous les mots au premier chargement
            displayResults(lexiqueData); 
        },
        error: function(err) {
            console.error("Erreur lors du chargement du Google Sheets :", err);
            resultsContainer.innerHTML = '<p style="color: red;">Erreur lors du chargement du lexique. Vérifiez votre connexion.</p>';
        }
    });

    // 2. Fonction qui lance la recherche
    const performSearch = () => {
        if (!isDataLoaded) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // Si la barre est vide, on réaffiche tout
        if (searchTerm === '') {
            displayResults(lexiqueData);
            return;
        }

        // Filtrer les données (elles resteront dans l'ordre alphabétique)
        const filteredData = lexiqueData.filter(item => {
            const terme = item.terme ? item.terme.toLowerCase() : '';
            const definition = item.definition ? item.definition.toLowerCase() : '';
            return terme.includes(searchTerm) || definition.includes(searchTerm);
        });

        // Afficher les résultats
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

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>Aucun mot trouvé. N\'hésitez pas à le proposer au Siège via le bouton ci-dessous !</p>';
            return;
        }

        results.forEach(item => {
            // Sécurité au cas où une ligne du Sheets serait mal remplie
            if (!item.terme || !item.definition) return;

            const card = document.createElement('div');
            card.className = 'result-card';
            
            let htmlContent = `<h2>${item.terme}</h2>`;
            htmlContent += `<p><strong>Définition :</strong> ${item.definition}</p>`;
            
            if (item.calcul && item.calcul.trim() !== '') {
                htmlContent += `<h4>Comment le calculer ?</h4><p>${item.calcul}</p>`;
            }
            
            if (item.importance && item.importance.trim() !== '') {
                htmlContent += `<h4>Pourquoi c'est important chez B&B HOTELS ?</h4><p>${item.importance}</p>`;
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
            themeToggle.textContent = 'Passer en mode sombre 🌙';
        } else {
            themeToggle.textContent = 'Passer en mode clair ☀️';
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