# Partant — lieux par plage et parcours connectés

Livraison du 17 septembre 2026. Périmètre demandé : points **1 et 2**. Les points **3, 4 et 5 restent reportés** : intégrations externes ; paiements/communications et exploitation commerciale ; recette exhaustive sur appareils.

## 1. Un lieu compatible avec chaque horaire

Chaque plage hebdomadaire et chaque exception datée contient un début, une fin, les séances autorisées et les lieux autorisés. Le coach peut conserver « Tous mes lieux » ou sélectionner une salle le matin, une piste le soir, le domicile ou la visio. Copier une journée conserve aussi ses lieux.

Le client ne voit que l’intersection entre les lieux de la séance et ceux de la plage. La recherche par format, les alertes, la sélection du lieu, la confirmation et les changements d’horaire respectent cette affectation. Les cours collectifs sont programmés dans une plage compatible avec leur lieu. La réservation conserve un instantané du nom, de l’adresse et des consignes : une modification ultérieure du profil ne réécrit pas les rendez-vous confirmés.

Les horaires restent décidés par le coach. Aucun rétablissement des réglages Pause ou Espacement. Une nouvelle activité commence sans plages ouvertes.

## 2. Ce qui est partagé sur Supabase

| Parcours | Mode connecté |
|---|---|
| Connexion | Auth Supabase par code e-mail ; restauration de session. Aucun compte fictif injecté. |
| Préférences et favoris | Enregistrés pour le compte connecté ; onboarding utilisé pour les suggestions. |
| Profil, séances, tarifs et lieux | Modifications contrôlées par le serveur ; seul le coach propriétaire peut les effectuer. |
| Planning | Semaine, exceptions, lieux/offres par plage, indisponibilités et fermeture de départs. |
| Brouillons | Privés, conservés sur le serveur, séparés de la configuration publiée. |
| Réservations | Individuel, duo, groupe ; prix/places/lieux recalculés et conflits revérifiés côté serveur. Aucun encaissement. |
| Cours collectifs | Programmation, duplication de dates atomique, capacités, participants, fermeture et annulation. |
| Rendez-vous directs | Privés au coach ; leur occupation bloque les créneaux publics sans exposer le nom du client. |
| Après-séance | Annulation, annulation partielle des places, transfert de cours, proposition coach et acceptation/refus. |
| Messagerie | Conversation privée liée à la réservation, notifications, compteurs et accusés de lecture. |
| Notifications internes | Créées avec l’action et récupérées par rafraîchissement toutes les 5 secondes et au retour au premier plan. Pas de SMS/push/e-mail métier. |
| Avis | Après une séance terminée ; réponse du coach ; signalement et décision réservés à l’équipe. |
| Assistance | Demande privée, réponse et historique partagés avec le demandeur. |
| Documents | Import PDF/image dans le stockage privé ; liens de lecture temporaires ; accès propriétaire et équipe habilitée. |
| Publication | Dossier soumis puis décision de l’équipe, prérequis du profil, des offres, des lieux et du planning. Pas d’auto-validation du coach. |
| Fiches clients | Historique utile et notes privées du coach. |
| Compte | Informations, préférences de notification, export et suppression avec contrôle des séances encore actives. L’e-mail de connexion est affiché en lecture seule. |
| Calendrier et récurrence | Export ICS et réservation à nouveau ; duplication de cours. La synchronisation avec des agendas externes reste reportée. |
| Activité | Calculs et export issus des réservations partagées. Les montants, versements et remboursements restent simulés. |

## Exécution et autorisations

Le point d’entrée est l’Edge Function **`product-api`**. Elle authentifie chaque écriture avec `auth.getUser`, ignore toute identité ou habilitation fournie par le navigateur et exécute le même domaine TypeScript que React Native. Le client transmet une **commande autorisée**, jamais un état de marketplace à accepter aveuglément.

La découverte anonyme reçoit uniquement une projection publique. Les réservations des autres clients apparaissent seulement comme des occupations ou des places prises, sans leurs identités, objectifs ou messages. Documents, brouillons, coordonnées de compte et notes restent privés.

Les documents métier sont dans le schéma `private`, RLS activé et accès direct révoqué. Les RPC de lecture/commit sont réservées au serveur. Une révision transactionnelle empêche deux écritures concurrentes de valider le même état. L’API signale un conflit et demande de revoir les données actualisées. Les requêtes d’écriture ont une clé d’idempotence ; un rejeu ne double pas une réservation ou un message.

Les anciennes tables du pilote connecté étaient vides lors de la bascule. Elles sont conservées pour l’historique et leurs points d’écriture sont désactivés afin de ne pas entretenir deux agendas concurrents. Le pilote `?tools=connections` n’est plus le parcours métier de référence.

**Choix de développement, pas une architecture de volume validée** : les collections métier privées sont des documents JSON, avec révision globale. Cette approche conserve toutes les règles du prototype et permet des essais partagés. La pagination, la normalisation des collections à fort volume et le découpage des verrous doivent précéder une exploitation commerciale avec de nombreux utilisateurs. Aucun paiement réel n’est adossé à ce stockage de développement.

## Accès équipe

L’habilitation est une entrée dans `private.product_staff`, attribuée par un administrateur Supabase à un utilisateur Auth existant. Elle ne peut pas être créée depuis l’application ni depuis les métadonnées modifiables par l’utilisateur. Un membre habilité voit « Espace équipe » dans Mon espace. Aucun compte utilisateur n’a été promu automatiquement ; les habilitations de QA sont supprimées après les tests.

Les badges de la démonstration locale restent fictifs. En mode connecté, un dossier nécessite une décision habilitée. L’activation « versements de test » reste une simulation, pas une ouverture de compte de paiement.

## Ouvrir et vérifier

- Démonstration : `http://127.0.0.1:8081/?version=connected-venues-9`.
- Données partagées : `http://127.0.0.1:8081/?data=connected&version=connected-venues-9`.
- HTML conservé sans modification dans `outputs/partant.html`.

Les comptes et séances utilisés par les tests sont temporaires et supprimés. Le mode connecté ne contient donc pas l’offre fictive de la démonstration ; il faut un compte coach configuré et publié pour découvrir son offre.

**382 assertions réussies** : 293 contrôles existants, 51 contrôles du domaine connecté, 28 contrôles API/Auth/Storage réels, 7 contrôles DOM React Native vers le serveur et 3 contrôles de rejeu concurrent.

Vérifications : règles locales, commandes serveur, propriété des données, stockage privé, concurrence réelle sur les dernières places, idempotence, parcours React Native Web vers l’API déployée, TypeScript et exports web/iOS/Android. Les tests DOM ne constituent pas une validation visuelle ni une recette sur téléphone.

Commandes reproductibles :

```sh
node scripts/build-server-domain.cjs
node scripts/test-connected-domain.cjs
# QA distante isolée : préparer les fixtures, exécuter le SQL produit sous compte admin,
# puis tester. Les scripts ne contiennent ni secret ni accès service_role.
node scripts/test-connected-api.mjs --prepare
node scripts/test-connected-api.mjs
node scripts/test-connected-web.cjs
node scripts/test-connected-replay.mjs
node scripts/cleanup-connected-qa.cjs
# Exécuter aussi le SQL de nettoyage généré ; ne pas laisser les comptes temporaires.
```

`domain.js` est généré à partir des sources partagées. Toute évolution métier doit régénérer ce fichier et redéployer `product-api`. Le frontend n’embarque aucune clé service_role.

Advisor sécurité : les cinq tables privées sans policy sont volontairement inaccessibles aux clients ([explication du contrôle](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). L’advisor relève aussi la protection contre les mots de passe compromis désactivée ; l’application utilise le code e-mail, les mots de passe ne servent qu’aux comptes temporaires de QA. Vérifier ce paramètre avant d’introduire un parcours mot de passe ([documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).
