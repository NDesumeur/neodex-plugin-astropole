# Astropole

Un jeu incrémental en pixel art, refait de zéro dans sa version 2. Tu bâtis une ville spatiale dont les bâtiments produisent des crédits chaque seconde, même quand NeoDex est fermé. Le jeu a quatre couches, et chacune change les règles : la ville, les colonies, les singularités, puis la galaxie.

*English version: [README.en.md](README.en.md)*

## La ville

- **Clique sur la ville** : chaque clic rapporte des crédits.
- **Achète des bâtiments** dans l'onglet Bâtiments, avec les boutons ×1, ×10, ×100 ou MAX. Ils vont du module d'habitat jusqu'à l'architecte du vide, puis aux mégastructures en orbite, sans fin.
- Tous les **25 exemplaires** d'un même bâtiment, sa production **double**.
- Chaque sorte de bâtiment a **son quartier**. Les petits sont devant et les tours derrière. Un quartier se remplit et grandit quand tu en achètes plus.
- **Double-clique sur un quartier** pour le voir de près : ses habitants se promènent, discutent et dansent. Le bouton ← Ville (ou Échap) revient à la vue d'ensemble.
- **Le jour et la nuit** passent toutes les 4 minutes. On voit des aurores, un monorail, des voitures volantes, des fusées et des nuages.

## Événements

- **Un vaisseau qui arrive** ou **une fête** dans un quartier : une bulle apparaît au-dessus. Clique dessus pour zoomer, puis clique sur le vaisseau (2 minutes de production) ou sur la fête (production ×3 pendant 2 minutes).
- **Pluie de météores** : clique sur les météores.
- **Le marchand** passe dans un vaisseau doré : choisis un bonus parmi trois.
- **Les cargos jaunes** rapportent 30 secondes de production.

## Les colonies

- **Recherches** : chaque bâtiment ×3 à 10, 25, 50, 100, 200 et 400 exemplaires, des liaisons entre bâtiments, des clics plus forts.
- **Doctrine** : à chaque colonie, tu choisis une seule voie parmi trois, avec quatre paliers.
  - **Industrie** : une ville qui tourne seule (prix réduits, paliers ×2,5, achats automatiques).
  - **Science** : recherches moins chères, Mémoires ×2, succès qui valent le double.
  - **Commerce** : clics ×10, événements plus fréquents, marchand plus généreux.
- **Nouvelle colonie** (onglet Colonie) : après 1 billion de crédits produits, tu recommences sur la planète suivante avec des **Mémoires**. Une Mémoire gardée ajoute 10 % de production. Dépensée, elle achète un avantage.
- Chaque planète a ses forces : Cryos, Pyra, Sylve, Aurore et Nébula.

## Les défis

Ils s'ouvrent après 5 colonies ou à la première singularité. Un défi recommence la colonie avec une contrainte, et le réussir donne un bonus pour toujours. Il y en a huit :

- Panne de clics
- Inflation
- Sans recherche
- Isolement
- Éclipse
- Calme plat
- Spécialiste
- Amnésie

## Les singularités

Une fois **1e50 crédits** produits, la ville peut **s'effondrer en singularités**. Tout repart de zéro, Mémoires comprises. Ce qui est gagné en échange change le jeu :

- **La matière noire** apparaît et grandit avec le temps. Elle multiplie toute la production par (1 + matière noire)².
- **Les lois de la physique** s'achètent avec les singularités :
  - les Automates achètent les bâtiments tout seuls ;
  - les Archives vivantes achètent les recherches ;
  - Polymathe donne deux doctrines à la fois ;
  - avec les Paliers serrés, un bâtiment double tous les 10 exemplaires ;
  - avec le Trou de ver, le temps passé loin compte double.
- **Les distorsions** s'achètent avec la matière noire : dilatation du temps, compression des prix, gravité des mégastructures, écho des Mémoires.

Une partie commencée avant la version 2 compte tout ce qu'elle a déjà produit pour la première singularité.

## La galaxie

Avec **30 singularités** gagnées, l'**exode** donne des **Étoiles**. La carte de la galaxie a 22 systèmes reliés par des routes. Tu conquiers les systèmes voisins des tiens, et chacun donne un bonus pour toujours :

- production ×1 000 ;
- matière noire ×3 ;
- singularités ×1,5 ;
- Mémoires ×10 ;
- bâtiments moins chers ;
- événements plus fréquents ;
- départ plus riche.

## Le retour et les chiffres

- Au retour, un **rapport d'absence** montre ce qui a été produit et les événements manqués. Il te laisse choisir :
  - **encaisser** ;
  - **réinvestir** tout de suite ;
  - faire une **fête de retour** (un quart des gains contre une production ×3 pendant 15 minutes) ;
  - **rappeler le marchand**.
- L'onglet **Statistiques** montre la production dans le temps, sur 2 jours ou 30 jours, avec les colonies, défis, singularités et exodes.
- On y choisit aussi la **notation des grands nombres** : noms (millions, milliards), scientifique, ingénieur, lettres ou logarithme.
- Il y a **101 succès**. Chacun ajoute 3 % de production pour toujours.

Le bouton **Plein écran** est en haut de la page. La partie reste sur cet appareil. Une partie de la version 1 continue telle quelle.
