# Mon journal nourriture IA — version Render

Cette version est prête à être déployée comme service Web Node.js sur Render.

## Ce qui est corrigé
- L'application et l'API IA sont servies par le même serveur.
- Le bouton "Estimer avec l'IA" appelle `/api/estimate`.
- La clé OpenAI reste côté serveur.
- Le serveur écoute `0.0.0.0` et le port `PORT` fourni par Render.
- Un endpoint `/health` permet à Render de vérifier que l'app tourne.
- L'app peut être ajoutée à l'écran d'accueil sur Android.

## Déploiement le plus simple

### 1) Mettre ce dossier sur GitHub
Crée un nouveau dépôt GitHub puis ajoute tous les fichiers de ce dossier à la racine du dépôt.

### 2) Créer le service sur Render
Dans Render:
- New → Blueprint
- Connecte ton dépôt GitHub
- Render détectera automatiquement `render.yaml`

### 3) Ajouter la clé OpenAI
Render te demandera la valeur de `OPENAI_API_KEY`.
Colle ta clé API OpenAI dans ce champ secret.

Ne mets jamais la clé dans `public/index.html`, GitHub ou `render.yaml`.

### 4) Déployer
Laisse Render construire l'application.
Une fois le déploiement terminé, Render fournit une URL `https://...onrender.com`.

### 5) Sur Samsung / Chrome
Ouvre cette URL.
Menu ⋮ → Ajouter à l'écran d'accueil / Installer l'application.

## Tester
Ouvre:
`https://TON-APP.onrender.com/health`

Tu devrais voir quelque chose comme:
`{"ok":true,"aiConfigured":true}`

Puis dans l'app écris par exemple:
"Ce matin j'ai mangé une pita de 100 calories, une cuillère à café de mayo, une poignée de poulet, beaucoup de laitue et un café Nespresso."

## Coût
Render peut proposer un plan gratuit selon les options disponibles dans ton compte.
L'utilisation de l'API OpenAI est facturée séparément selon le modèle et le nombre de requêtes.
Par défaut l'app utilise `gpt-5.6-luna`, choisi pour limiter le coût.

## Important
Les valeurs nutritionnelles restent des estimations. Les portions, marques et méthodes de cuisson améliorent beaucoup la précision.
