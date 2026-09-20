# Simulation de volume — espace coach

> État actuel : [la livraison 17](notifications-paging-17.md) ajoute la pagination, l’accès aux actions et la conservation de la position. Les constats ci-dessous décrivent les étapes antérieures.

Exécutée le 18 septembre 2026, sur la livraison Communication 15 inchangée.

> Mesure initiale conservée ci-dessous. La simulation visible est maintenant actualisée : [les messages ont été retirés des notifications générales](notifications-without-messages-16.md). Elle présente 230 notifications et 36 conversations séparées ; les longues listes ne sont pas encore limitées.

## Scénario

Six semaines d’événements fictifs : 144 séances, 36 clients, 446 notifications visibles pour le coach. Répartition : 144 réservations, 24 annulations, 36 modifications, 216 notifications de message, 24 avis, un incident d’agenda et une correction de dossier. Une notification supplémentaire destinée à un autre coach sert à tester la confidentialité. Les six messages par client représentent volontairement une accumulation de messages non lus.

Les deux actions techniques ont neuf et douze jours et sont déjà lues, mais non résolues. Il s’agit d’une hypothèse de charge pour tester l’interface, pas de données d’usage observées ni d’une validation de transactions serveur.

## Résultats observés

| Observation vérifiée | Conséquence produit |
| --- | --- |
| L’entrée ne monte aucune ligne de notification et présente sept rubriques. | Le regroupement actuel reste une bonne base pour le repérage. |
| Ouvrir les réservations monte les 144 lignes ; la rubrique Annulations vient ensuite dans le document. | Une rubrique ouverte rend l’accès aux suivantes plus long. |
| Les 216 notifications de message correspondent à 36 conversations. | Six lignes par personne répètent la même destination. |
| Ouvrir la conversation de Camille marque ses six alertes comme lues, mais les 216 lignes restent affichées au retour. | La distinction lu/non lu fonctionne, mais ne réduit pas le volume visuel. |
| Les deux actions anciennes restent signalées « 1 à traiter » chacune. Lire l’incident n’efface pas l’action. | Il faut préserver cette logique lors d’une future limitation de l’historique. |
| Les détails, le retour à la rubrique et la conversation de la bonne personne fonctionnent. | Aucun blocage fonctionnel observé dans ces parcours. |
| La notification privée de l’autre coach est exclue et le stockage habituel reste inchangé. | La simulation est isolée. |

Les nombres sont issus du DOM réel de l’export React Native web. Ils ne mesurent pas la hauteur en pixels, le temps de défilement ou la performance sur un téléphone. L’absence d’erreur fonctionnelle ne vaut pas validation de fluidité à grande échelle.

## Améliorations recommandées, non implémentées

1. **Limiter l’historique initial de chaque rubrique.** Commencer par 10–15 événements récents, puis « Voir les précédents ». Ne pas masquer les actions encore ouvertes à cause de cette limite. Garder leur accès explicite et conserver la position au retour d’un détail.
2. **Regrouper les notifications de message par personne.** Une entrée « Camille · 6 nouveaux messages », datée du plus récent et dirigée vers le fil existant. Le nombre de messages non lus doit se recalculer depuis la conversation. L’historique détaillé des messages reste dans cette conversation.
3. **Faciliter l’accès aux actions en attente.** Un accès compact en haut (« 2 actions à traiter ») peut amener à Agenda ou Dossier sans traverser un long historique. Il ne doit pas créer une deuxième boîte de réception ni confondre une information non lue avec une réponse attendue.

Ne pas ajouter de recherche ou de filtres supplémentaires avant de retester ces trois ajustements. L’architecture par rubriques n’a pas besoin d’être remplacée.

## Recette et reproduction

- `node scripts/test-coach-volume.cjs` : **20 contrôles DOM réussis**, résultats détaillés dans `docs/coach-volume-results.json`.
- `node scripts/test-coach-volume-visible.cjs` : **7 étapes visibles réussies** dans le harness DOM ; stockage de démo préservé, aucune erreur d’exécution.
- Le scénario utilise `scripts/fixtures/coach-volume.cjs`. Les dates sont relatives au moment de génération. Pour renouveler les données publiques :

```sh
node -e 'require("node:fs").writeFileSync("apps/mobile/public/coach-volume.json",JSON.stringify(require("./scripts/fixtures/coach-volume.cjs")()))'
```

Après export Expo web (ou copie de ces trois fichiers publics dans `apps/mobile/dist`), ouvrir :

http://127.0.0.1:8081/coach-volume.html?autoplay=1

La lecture automatique montre les écrans et met en évidence les éléments parcourus. Pause permet d’observer ; après les sept étapes, le téléphone est utilisable librement. Le bouton Rejouer recharge le scénario initial. Les données sont stockées sous une clé `partant-native-recette-volume-…`, séparée de la démo habituelle et des comptes connectés. Aucun message n’est envoyé à une personne réelle et aucune configuration Google/Apple/Supabase n’est modifiée.

Les écrans produit n’ont pas été modifiés dans cette simulation. La revue visuelle et les mesures sur appareils restent à effectuer.
