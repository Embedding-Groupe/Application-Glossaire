# Application-Glossaire
Glossaire intelligent avec interface graphique 

Pour faite cette application nous utiliserons Preact pour le front-end et l'interface utilisateur ainsi que  FastAPI pour gérer le back-end de l'application et charger les suggestions intelligentes.

Installation : 

1 - Front Preact :

Commandes à lancer pour télécharger les packages et lancer l'application :

Tout d'abord il vous faut node, qui permet de gerer les paquets pour les projets typescript, puis :
npm install
npm run dev

Puis lancer le lien depuis un navigateur pour acceder a l'appli

2 - Back FastAPI :

Le back utilise un fichier lourd, pour le récuperer, utilisez soit GIT-LFS, ou télécharger le fichier resyf.xml sur le site https://cental.uclouvain.be/resyf/download.html et placez le dans le dossier back-end/src/resyf-package/resources

Commandes à lancer pour télécharger les packages eet lancer l'application :

pip install -r requirements.txt
uvicorn main:app

Puis l'API se lance pour accéder à la récupération des données
