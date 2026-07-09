document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    let lexiqueData = [];
    let isDataLoaded = false;
    let activeTags = []; // Mémorise les tags cochés dans le menu
    let activeLetter = 'Tous'; // Mémorise la lettre sélectionnée

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

            // Génère les boutons du menu Filtres
            populateTagsDropdown(lexiqueData);
        
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
        
        // Si on tape au clavier, on remet l'alphabet sur "Tous" en mémoire et visuellement
        if (searchTerm !== '') {
            activeLetter = 'Tous';
            document.querySelectorAll('.alpha-btn').forEach(btn => {
                btn.classList.remove('active');
                if(btn.textContent === 'Tous') btn.classList.add('active');
            });
        }

        // Si tout est vide/réinitialisé (texte, tags ET alphabet), on affiche tout
        if (searchTerm === '' && activeTags.length === 0 && activeLetter === 'Tous') {
            lexiqueData.sort((a, b) => a.terme.trim().localeCompare(b.terme.trim()));
            displayResults(lexiqueData);
            return;
        }

       // 2A. Filtrer les données (Barre de texte + Menu Tags + Alphabet)
        let filteredData = lexiqueData.filter(item => {
            const terme = item.terme ? item.terme.toLowerCase().trim() : '';
            const definition = item.definition ? item.definition.toLowerCase() : '';
            const tagsStr = item.tags ? item.tags.toLowerCase() : '';
            
            // Filtre 1 : L'alphabet
            const letterMatch = (activeLetter === 'Tous') || terme.startsWith(activeLetter.toLowerCase());

            // Filtre 2 : Le texte (Barre de recherche)
            const textMatch = searchTerm === '' || terme.includes(searchTerm) || definition.includes(searchTerm) || tagsStr.includes(searchTerm);
            
            // Filtre 3 : Les cases cochées (Menu Tags)
            let tagsMatch = true; // Par défaut, si rien n'est coché, on laisse tout passer
            
            if (activeTags.length > 0) {
                if (!item.tags || item.tags.trim() === '') {
                    tagsMatch = false; // Ce mot n'a aucun tag, donc on le cache
                } else {
                    // On découpe les tags du mot pour vérifier s'il correspond à la sélection
                    const itemTags = item.tags.split(',').map(t => t.trim());
                    // .some() vérifie si le mot possède AU MOINS UN des tags cochés
                    tagsMatch = activeTags.some(activeTag => itemTags.includes(activeTag));
                }
            }

            // Le mot ne s'affiche que s'il valide les TROIS filtres !
            return letterMatch && textMatch && tagsMatch;
        });

        // 2B. Trier par PERTINENCE (Le moteur de recherche intelligent)
        filteredData.sort((a, b) => {
            const termeA = a.terme ? a.terme.toLowerCase().trim() : '';
            const termeB = b.terme ? b.terme.toLowerCase().trim() : '';
            
            // Calcul du score pour le mot A
            let scoreA = 0;
            // Sécurité : on ne calcule les scores que si l'utilisateur a tapé du texte
            if (searchTerm !== '') {
                if (termeA === searchTerm) scoreA = 3; // Match exact
                else if (termeA.startsWith(searchTerm)) scoreA = 2; // Commence par
                else if (termeA.includes(searchTerm)) scoreA = 1; // Contient dans le titre
            }
            
            // Calcul du score pour le mot B
            let scoreB = 0;
            if (searchTerm !== '') {
                if (termeB === searchTerm) scoreB = 3;
                else if (termeB.startsWith(searchTerm)) scoreB = 2;
                else if (termeB.includes(searchTerm)) scoreB = 1;
            }

            // On trie du plus grand score au plus petit
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            
            // Si les mots ont le même score (ex: tous les deux trouvés dans une définition),
            // ou si on a juste utilisé un filtre Tag/Alphabet (scores = 0)
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

    // --- GESTION DE L'ALPHABET ---
    const alphabetContainer = document.getElementById('alphabetContainer');

    function setupAlphabet() {
        // 1. Bouton "Tous" pour réinitialiser
        const btnAll = document.createElement('button');
        btnAll.className = 'alpha-btn active'; // Actif par défaut
        btnAll.textContent = 'Tous';
        btnAll.onclick = () => filterByLetter('Tous');
        alphabetContainer.appendChild(btnAll);

        // 2. Boutons de A à Z
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        letters.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'alpha-btn';
            btn.textContent = letter;
            btn.onclick = () => filterByLetter(letter);
            alphabetContainer.appendChild(btn);
        });
    }

    function filterByLetter(letter) {
        if (!isDataLoaded) return;

        // 1. Mémorise la lettre cliquée
        activeLetter = letter;

        // 2. Met à jour la couleur des boutons de l'alphabet
        document.querySelectorAll('.alpha-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.textContent === letter) btn.classList.add('active');
        });

        // 3. Vide la barre de texte pour éviter les conflits (mais garde les tags)
        searchInput.value = '';

        // 4. Lance la recherche globale (croise la lettre et les tags)
        performSearch();
    }

    // Lance la création des boutons au chargement
    setupAlphabet();

    // --- GESTION DU MENU FILTRES ---
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const tagsDropdown = document.getElementById('tagsDropdown');

    filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Évite que le clic se propage
        tagsDropdown.classList.toggle('show');
        filterToggleBtn.classList.toggle('active');
    });

    // Fermer le menu si on clique n'importe où ailleurs sur la page
    document.addEventListener('click', (e) => {
        if (!tagsDropdown.contains(e.target) && e.target !== filterToggleBtn) {
            tagsDropdown.classList.remove('show');
            filterToggleBtn.classList.remove('active');
        }
    });

    // --- GÉNÉRATION DYNAMIQUE DES TAGS DANS LE MENU ---
    function populateTagsDropdown(data) {
        const tagsList = document.getElementById('tagsList');
        const uniqueTags = new Set(); // Un "Set" permet de stocker des valeurs uniques sans doublons

        // 1. Récupérer tous les tags existants dans le Google Sheets
        data.forEach(item => {
            if (item.tags && item.tags.trim() !== '') {
                // On découpe par virgule et on nettoie les espaces
                const itemTags = item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                itemTags.forEach(tag => uniqueTags.add(tag));
            }
        });

        // 2. Les transformer en tableau et les trier par ordre alphabétique
        const sortedTags = Array.from(uniqueTags).sort();

        // 3. Vider le conteneur puis créer les boutons
        tagsList.innerHTML = ''; 
        
        sortedTags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'tag-badge';
            badge.textContent = tag;
            
            // ACTION AU CLIC SUR UN TAG DU MENU
            badge.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche le menu déroulant de se fermer
                
                if (activeTags.includes(tag)) {
                    // Si le tag est déjà actif, on l'enlève de la liste et on retire la couleur
                    activeTags = activeTags.filter(t => t !== tag);
                    badge.classList.remove('selected');
                } else {
                    // Sinon, on l'ajoute à la liste et on le met en vert
                    activeTags.push(tag);
                    badge.classList.add('selected');
                }
                
                // Remet l'alphabet sur "Tous" pour éviter les conflits
                document.querySelectorAll('.alpha-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if(btn.textContent === 'Tous') btn.classList.add('active');
                });
                
                // Lance la recherche
                performSearch(); 

                // Met à jour le texte et la couleur du bouton Filtres
                if (activeTags.length > 0) {
                    filterToggleBtn.textContent = `Filtres (${activeTags.length}) ▾`;
                    filterToggleBtn.style.backgroundColor = 'var(--bb-anise-green, #C4D600)';
                    filterToggleBtn.style.color = '#00302E';
                } else {
                    filterToggleBtn.textContent = 'Filtres ▾';
                    filterToggleBtn.style.backgroundColor = ''; // Remet la couleur par défaut
                    filterToggleBtn.style.color = '';
                }
            });
            
            tagsList.appendChild(badge);
        });
    }

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
            let cleanTerme = item.terme.trim();
                // On force la première lettre en majuscule
            if (cleanTerme.length > 0) {
                cleanTerme = cleanTerme.charAt(0).toUpperCase() + cleanTerme.slice(1);
            }
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
                htmlContent += `<h4>Concrètement, chez B&B HOTELS :</h4><p>${cleanImportance}</p>`;
            }

            // Traitement des tags
            if (item.tags && item.tags.trim() !== '') {
                // Découpe les tags par les virgules et enlève les espaces
                const tagsArray = item.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                
                if (tagsArray.length > 0) {
                    htmlContent += `<div class="card-tags">`;
                    tagsArray.forEach(tag => {
                        htmlContent += `<span class="tag-badge">${tag}</span>`;
                    });
                    htmlContent += `</div>`;
                }
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