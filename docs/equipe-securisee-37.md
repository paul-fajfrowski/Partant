# Livraison 37 — accès équipe et traitement des dossiers

4 octobre 2026. Sources partagées React Native / WebApp et serveur de développement. Aucun compte réel habilité, aucun achat ni service commercial activé.

## Ce qui change

Un membre explicitement habilité accède à une étape de double authentification avant l’espace équipe. La configuration TOTP propose un QR code sur ordinateur et une clé sélectionnable pour une saisie dans une application d’authentification. Le secret d’enrôlement n’est ni persisté par Partant ni journalisé. Les facteurs vérifiés existants sont réutilisés. L’annulation tente de retirer uniquement le nouveau facteur non confirmé créé par ce parcours.

La protection ne dépend pas de l’interface : l’API vérifie le jeton auprès d’Auth, puis la session AAL2 et son facteur vérifié encore présents dans Auth. La politique du stockage privé impose aussi ces conditions. Une simple ligne dans la table des habilitations ou un ancien jeton AAL2 après révocation ne suffisent pas. Une URL de justificatif déjà signée peut rester utilisable jusqu’à son expiration courte de 60 secondes ; sa création est refusée après révocation.

| Rôle | Droits équipe |
| --- | --- |
| `reviewer` | File de dossiers, justificatifs, demandes de complément et décisions par pratique. |
| `support` | Demandes d’assistance et réponses ; aucune validation de coach ni consultation des justificatifs professionnels. |
| `admin` | Vérification et assistance, suspension/levée motivée, décisions sensibles existantes et libération d’un dossier pour réattribution. |

Les opérations financières restent simulées. Un rôle `admin` n’active ni paiement réel ni fonction d’auto-habilitation.

La file connectée charge **10 résumés par page depuis le serveur**, avec recherche par nom/pratique et filtres « À examiner », « Mes dossiers », « Tous ». Les demandes en attente sont ordonnées par date de dépôt connue, puis nom et identifiant ; les anciennes demandes sans date arrivent ensuite. Les justificatifs détaillés d’un coach sont chargés à l’ouverture de son dossier, pas dans le chargement initial de tous les profils.

L’examinateur prend explicitement le dossier en charge avant une décision. Deux prises en charge simultanées ont un seul gagnant. L’attribution, l’habilitation et la session sont recontrôlées dans la transaction d’enregistrement. Les retraits de droits bloquent donc aussi une décision partie depuis une interface devenue périmée. Les prises en charge, libérations et habilitations opérateur sont journalisées ; les décisions conservent leur historique par pratique et leur empreinte de justificatifs. Les preuves et décisions précédentes restent consultables dans le détail.

Les erreurs laissent une reprise explicite. Une réponse réseau perdue conserve la même référence idempotente lors du nouvel essai de la même décision. Un conflit de révision recharge le dossier sans confirmer à tort la décision ; le motif saisi est conservé et les vérifications dépendent toujours de l’empreinte courante des pièces. Le retour depuis un dossier ramène à sa liste. La version desktop utilise deux colonnes ; le petit écran affiche liste puis détail.

## Habiliter la bonne personne — reste à désigner par Paul

Le compte doit déjà être confirmé dans Auth et avoir terminé son profil Partant. Depuis une session opérateur Supabase autorisée :

```sh
node scripts/configure-team-24.mjs personne@example.com --role=reviewer
# Ou --role=support / --role=admin, suivant le besoin expressément désigné.
node scripts/configure-team-24.mjs personne@example.com --revoke
```

Le rôle est désormais **obligatoire et explicite**. Le script refuse une adresse ne correspondant pas à un profil confirmé unique. Il ne crée pas de compte et n’envoie pas d’invitation. Le passage à `support` libère les dossiers précédemment attribués ; le retrait de l’habilitation les libère également. Le journal opérateur utilise `actor=null` : il ne prétend pas identifier une personne à partir des identifiants CLI partagés. L’identification nominative des opérateurs d’infrastructure reste à organiser.

Actualiser Partant, ouvrir « Espace équipe » ou « Dossiers coachs » (« Assistance » pour le rôle support), puis configurer/valider la double authentification. Aucun compte du propriétaire n’a été deviné ou promu. À la fin de la recette : **0 compte équipe réel ou QA, 0 attribution et 0 compte/fichier QA restant**.

Perte du second facteur : faire vérifier l’identité par l’opérateur autorisé avant toute remise à zéro dans Auth. Aucun contournement automatique n’a été ajouté. En cas de départ d’un membre, retirer son habilitation et révoquer ses sessions ; un accès personnel client/coach n’est pas supprimé par le seul retrait du rôle équipe.

## Déploiement et reprise technique

- Migrations appliquées : `20261004172311_team_access_37.sql`, `20261004173912_team_queue_legacy_37.sql` (pratique principale des anciens profils) et `20261004175013_team_claim_lifecycle_37.sql` (nettoyage des attributions lors de la suppression du dossier).
- Fonctions synchronisées : `product-api` v26, `google-calendar` v21, `push-dispatch` v14.
- Tables privées : rôles de `product_staff`, `product_review_claims`, `product_team_events`. RLS activée et aucun accès direct `anon`/`authenticated` aux nouvelles tables ; fonctions métier réservées au serveur.
- Source : `TeamSecurity.tsx`, `ConnectedTeamWorkspace.tsx`, `teamAccess.ts`, `connectedDomain.ts`, composant de décision partagé et API. La démo historique reste locale ; elle ne fournit jamais de droits sur le serveur.
- Xcode : aucune nouvelle dépendance native ni modification de signature. Ouvrir le workspace de cette copie et reconstruire pour obtenir les écrans récents. Le canal Release connecté reste inchangé.
- L’export public force toujours le mode connecté. Aucun hébergement public ou environnement de production distinct créé.

Consulter `ETAT_DU_PROJET.md` pour l’installation, les fichiers d’environnement publics et les prochains MVP. Après toute modification du domaine, régénérer puis déployer les trois fonctions qui l’importent.

## Vérifications

**46/46 suites métier/DOM et 11/11 suites navigateur réussies.** TypeScript, exports web de développement/production et bundles Hermes iOS de développement/production construits. Le test de l’export public refuse toujours les URL et comptes de démonstration. [Preuves de recette](audits/2026-10-04-equipe/). Un premier lancement navigateur sans URL de serveur a échoué avant navigation ; le lanceur possède désormais une URL locale par défaut, et la recette complète a été rejouée avec succès.

- Contrôles ciblés : 24 assertions de rôles/projection, parcours équipe DOM mobile et desktop, navigateur aux deux largeurs, et 19 contrôles sur Auth/API/Storage réellement déployés.
- Recette serveur existante rejouée : 36 contrôles API et 20 contrôles fonctionnels. Comptes et objets dédiés, supprimés après recette. Pas de paiement ni d’e-mail de test envoyé.
- Scénarios sécurité : AAL1 refusé, AAL2 accepté, périmètre par rôle, pagination SQL, deux prises en charge concurrentes, refus de décision sans attribution, refus Storage après révocation de session.
- Un test SQL transactionnel, annulé après assertion, valide le nettoyage de l’attribution à la suppression du dossier.
- Les tests de volume utilisent 11 dossiers synthétiques isolés, **pas un test de charge représentatif**. Les premières exécutions ont corrigé la structure des fixtures et les attentes de statut HTTP ; les rapports finaux décrivent le passage réussi.
- Conseiller Supabase : pas d’erreur de sécurité remontée ; informations « RLS sans politique » attendues pour les tables privées à accès serveur uniquement. Avertissement existant sur la protection des mots de passe compromis non activée, à réévaluer avec la configuration Auth avant ouverture publique. [Explication Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

La recette web, les fournisseurs simulés des tests UI et l’export Hermes ne valident pas le clavier/VoiceOver, la signature ou le parcours MFA sur un iPhone physique.

## Limites à conserver dans le plan

Cette livraison borne la réponse de la file équipe, **pas le stockage métier global** : les documents JSON et la révision globale existent encore, et la requête SQL parcourt les dossiers pour rechercher/compter. Normalisation, index adaptés, curseurs de pagination stables sous insertions concurrentes et charge cible restent à travailler. Les demandes d’assistance ne sont pas encore paginées côté serveur.

La sauvegarde complète Auth/Storage/configuration, la maintenance PostgreSQL, l’alerte opérateur avec destinataire réel, les routes web partageables et l’optimisation des médias restent ouvertes. Les procédures de conservation du journal équipe et de récupération MFA doivent être confirmées par l’exploitant. Domaine/SMTP, identité juridique, paiement, désignation des membres et recette appareil nécessitent toujours les informations ou actions indiquées dans le récapitulatif.

## Rejouer les contrôles

Depuis la racine, avec Node 24 et les dépendances installées :

```sh
npm --prefix apps/mobile run typecheck
node scripts/build-server-domain.cjs
# Export web/iOS depuis apps/mobile, puis attendre sa fin avant la recette DOM.
(cd apps/mobile && npx expo export --platform web --platform ios --output-dir dist --max-workers 1)
node scripts/qa-33.cjs
# Servir apps/mobile/dist sur 8081 ; autre port possible avec PARTANT_QA_URL.
node scripts/qa-33.cjs --browser
npm --prefix apps/web run build:production
# Servir apps/web/dist-production sur 8099 pour ce contrôle.
node scripts/test-release-36.cjs
```

Recette distante réservée à un opérateur sur le serveur de développement : `test-connected-api.mjs --prepare` prépare les comptes QA et le SQL temporaire ; appliquer ce SQL avec la CLI Supabase autorisée, puis lancer `test-connected-api.mjs`, `test-features-api-35.mjs`, `test-team-api-37.mjs` dans cet ordre. Le helper TOTP n’accepte que les adresses isolées `partant-qa-…@example.invalid`. `cleanup-connected-qa.cjs` prépare ensuite le SQL de nettoyage ciblé à appliquer, même si un test a échoué. Vérifier les compteurs puis supprimer les fichiers temporaires d’identifiants ; ne jamais les versionner. Ces tests ne sont pas exécutés par la CI publique.

### Observation d’exploitation pendant la recette

Le contrôle final ne montre aucune tâche cron en retard, aucune suppression en attente et aucun push bloqué. Deux réponses HTTP 503 « Temporary worker failure » sont conservées dans la fenêtre de 24 h, à 17:29 et 17:30 UTC, pendant les premiers essais de fixtures incomplètes. Les cinq réponses de worker observées sur les cinq minutes précédant le contrôle à 17:48 UTC sont HTTP 200. Les fixtures ont été corrigées et nettoyées ; le journal n’a pas été effacé pour masquer les échecs. Voir `health.json` dans les preuves.
