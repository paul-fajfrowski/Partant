# Product API

Entrée unique des commandes métier React Native connectées. Voir `docs/connected-product-9.md` depuis la racine.

- Régénérer `domain.js` avec `node scripts/build-server-domain.cjs` après toute modification du domaine partagé.
- Déployer `index.ts` et `domain.js` ensemble, sans exposer de secret dans le bundle mobile.
- `verify_jwt: false` au niveau de la passerelle est intentionnel pour la découverte anonyme et les publishable keys. **L’authentification des écritures est effectuée dans la fonction avec `auth.getUser`** ; toute commande sans utilisateur authentifié reçoit 401. Ne jamais supprimer cette vérification.
- La clé service_role est l’environnement serveur Supabase ; elle ne traverse jamais une réponse.
- La fonction expose uniquement `project(state, actor)` après vérification. Les RPC `product_load` et `product_commit` sont réservées au rôle serveur.
- Le commit compare la révision dans une transaction ; les conflits donnent 409, sans accepter un résultat calculé sur un ancien agenda.
- Les tests distants créent leurs propres comptes temporaires sans e-mail et génèrent un nettoyage ciblé. Toujours effectuer le nettoyage après la QA.
- Ce serveur de développement ne prélève et ne reverse aucun paiement.
