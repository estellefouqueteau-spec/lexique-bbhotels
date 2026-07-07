document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    let lexiqueData = [];
    let isDataLoaded = false;

    // 1. Récupération des données du fichier JSON
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Erreur réseau');
            return response.json();
        })
        .then(data => {
            // Tri alphabétique de A à Z dès la réception des données
            lexiqueData = data.sort((a, b) => a.terme.localeCompare(b.terme));
            
            isDataLoaded = true;
            // On affiche tout le lexique trié
            displayResults(lexiqueData);
        })
        .catch(error => {
            console.error('Erreur lors du chargement du lexique:', error);
            resultsContainer.innerHTML = `<p style="color: #c0d345;">⚠️ Oups ! Le dictionnaire n'a pas pu se charger.</p>`;
            searchInput.disabled = true;
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
        const filteredData = lexiqueData.filter(item => 
            item.terme.toLowerCase().includes(searchTerm) || 
            item.definition.toLowerCase().includes(searchTerm)
        );

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
            const card = document.createElement('div');
            card.className = 'result-card';
            
            let htmlContent = `<h2>${item.terme}</h2>`;
            htmlContent += `<p><strong>Définition :</strong> ${item.definition}</p>`;
            
            if (item.calcul) {
                htmlContent += `<h4>Comment le calculer ?</h4><p>${item.calcul}</p>`;
            }
            
            if (item.importance) {
                htmlContent += `<h4>Pourquoi c'est important chez B&B HOTELS ?</h4><p>${item.importance}</p>`;
            }

            card.innerHTML = htmlContent;
            resultsContainer.appendChild(card);
        });
    }

    // 6. Gestion du bouton Mode Clair / Mode Sombre
    const themeToggle = document.getElementById('themeToggle');
    
    themeToggle.addEventListener('click', () => {
        // Ajoute ou enlève la classe 'light-mode' sur le body
        document.body.classList.toggle('light-mode');
        
        // Change le texte du bouton en fonction du thème actif
        if (document.body.classList.contains('light-mode')) {
            themeToggle.textContent = 'Passer en mode sombre 🌙';
        } else {
            themeToggle.textContent = 'Passer en mode clair ☀️';
        }
    });

    // 7. Gestion du bouton "Retour en haut"
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    // Écouteur sur le défilement (scroll) de la page
    window.addEventListener('scroll', () => {
        // Si on descend de plus de 300 pixels, on affiche le bouton
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            // Sinon on le cache
            scrollTopBtn.classList.remove('visible');
        }
    });

    // Écouteur sur le clic du bouton
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Pour une remontée en douceur, pas brutale
        });
    });
});