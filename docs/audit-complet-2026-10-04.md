# Audit global de Partant et préparation au lancement

Audit du 4 octobre 2026, sur `bb7eff1`, identique à `origin/main` au contrôle. Il couvre les sources communes React Native/WebApp, les parcours automatisés, la configuration serveur observable et les besoins d’exploitation. Aucune correction produit, migration, nouvelle habilitation ou souscription n’a été appliquée pendant cet audit.

**Partant possède un socle produit développé, mais pas encore une exploitation commerciale complète.** Les priorités sont désormais la fiabilité, l’exploitation des comptes coachs, l’identité professionnelle, les communications et le paiement. Ajouter des écrans n’est pas la principale réponse. Supabase fournit déjà une vraie base de données ; c’est son modèle métier et son exploitation qu’il faut faire évoluer.

## Ce qui a été vérifié aujourd’hui

- Sources, dépendances, configuration iOS, pipeline GitHub, modèles de données, contrôles serveur, stockage, planning, confidentialité, messagerie, équipe et intégrations.
- TypeScript et **43 suites métier/DOM réussies**. Les corrections F-01 à F-06 passent leur suite de non-régression.
- **7 suites navigateur sur 10 réussies à la première passe.** Deux échecs concernent des fixtures dépendantes du jour courant : ce dimanche, « demain » sort de la semaine visible et l’agenda du jour ne possède pas les six plages attendues. Les deux suites passent avec une horloge de mercredi contrôlée : 45 et 100 contrôles. Le troisième échec, d’accessibilité dans l’éditeur d’offre, est reproduit deux fois. Ce n’est donc pas une recette navigateur entièrement verte.
- API publique accessible, aucune identité privée dans la réponse anonyme observée ; appels anonymes aux fonctions SQL métier `product_load` et `product_commit` refusés avec 401. Les 56 contrôles API authentifiés du 30 septembre sont des preuves antérieures, pas une nouvelle recette rejouée ici.
- Supabase actif en `eu-west-1` ; zéro tâche de suppression en attente, zéro échec cron sur les dernières 24 heures et zéro erreur dans les réponses HTTP planifiées encore présentes dans leur rétention. Cela ne mesure pas toute la disponibilité du service.
- Zéro compte équipe permanent, zéro agenda Google connecté, zéro appareil push enregistré et zéro coach dans la réponse publique observée. Ces nombres décrivent ce projet de développement, pas une absence d’implémentation.

[Preuves et limites détaillées](audits/2026-10-04-complet/verification.json), [résultats métier](audits/2026-10-04-complet/unit-dom.json), [première passe navigateur](audits/2026-10-04-complet/browser-initial.json), [investigation des échecs](audits/2026-10-04-complet/browser-followup.json).

Pas de nouveau build signé, d’essai iPhone/Android, de test de charge, d’intrusion, de restauration complète, de paiement, de réception push ou de consentement Calendar réel. Les réglages SMTP et les consoles OAuth n’ont pas été réaudités intégralement ; leur état reporté provient du suivi du projet. Il s’agit d’un audit transversal étayé, pas d’une certification exhaustive.

## Corrections techniques nouvelles à prévoir

| Référence | Priorité | Constat et conséquence | Critère de correction |
| --- | --- | --- | --- |
| A36-01 | P1 avant diffusion | L’audit npm mobile signale 16 paquets « high », correspondant à deux avis racines : `braces` 3.0.3 et `node-forge` 1.4.0, via Expo CLI/Metro. L’exploitabilité dans le binaire client n’est pas démontrée. | Qualifier les chemins réellement exposés, appliquer un correctif compatible ou une mitigation documentée, puis recompiler et tester. Aucun `npm audit fix --force` : l’outil propose ici des rétrogradations majeures inadaptées. |
| A36-02 | P1 avant bêta | PostgreSQL hébergé est encore en 17.6, tandis que Supabase annonce une mise à jour 17.11 incluant des correctifs de sécurité. | Préparer sauvegarde, revue des extensions, fenêtre et procédure de reprise ; mettre à jour puis revalider les commandes métier. Ne pas lancer une maintenance aveugle. |
| A36-03 | P2 fonctionnel | Le sélecteur accepte un justificatif WebP, mais le bucket privé déployé autorise seulement PDF/JPEG/PNG. Un format proposé peut donc être refusé à l’envoi. | Aligner interface, validation et bucket ; tester un WebP et les refus de taille/type. [Sélecteur](../apps/mobile/src/product/deviceFiles.ts#L82). |
| A36-04 | P2 fonctionnel | `instant('2027-03-28','02:30')` retourne une heure qui se réaffiche 01:30 à Paris. L’heure locale demandée n’existe pas lors du passage à l’heure d’été, mais elle n’est pas rejetée. | Refuser les heures inexistantes, décider comment traiter les heures doublées et tester réservations, durées, rappels et calendriers autour de ces changements. Reproduction au niveau du moteur, sans réservation réelle. [Conversion](../apps/mobile/src/product/model.ts#L296). |
| A36-05 | P2 accessibilité | Après offre → configurer les lieux → retour, axe détecte `aria-modal="true"` sur un conteneur sans rôle adapté, à 390 px. Reproduit deux fois. | Corriger la sémantique du dialogue et vérifier focus, fermeture, clavier et lecteur d’écran. Le niveau « critical » est celui d’axe, pas une sévérité de cybersécurité. [Preuve](audits/2026-10-04-complet/offer-editor-390-axe.json). |
| A36-06 | P2 qualité des tests | Deux recettes dépendent du jour de la semaine et échouent le dimanche sans démontrer de défaut de réservation. | Horloge explicite, sélection de la semaine/journée contenant les données et cas de frontière semaine/mois. Garder aussi une recette en date réelle. |

Les deux avis npm sont référencés ici : [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Au contrôle, ces fiches n’indiquent pas de version corrigée. Les dépendances de `tools/qa` et `services/calendar` ne remontent aucun avis npm. Le rapport mobile est [conservé](audits/2026-10-04-complet/npm-mobile.json). La mise à jour PostgreSQL demande une revue des incompatibilités annoncées par [Supabase](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).

## Couverture de l’application et de la WebApp

« Présent » signifie codé et observable dans le périmètre examiné, pas validé sur chaque appareil.

| Domaine | État actuel | Ce qui manque ou mérite une amélioration |
| --- | --- | --- |
| Produit client | Découverte, profils, favoris, filtres, individuel/duo/groupe, réservation, modification, annulation et avis présents. | Recette complète sur deux appareils, traitement des erreurs réseau, cas de conflit, qualité des résultats et offre réelle de coachs dans une zone pilote. |
| Produit coach | Offres, lieux, tarifs, horaires libres, dates ponctuelles, agenda, dossiers et historique présents. | Parcours réellement suivi par des coachs autonomes ; pièces/accès expirés, changements de pratique et publication contrôlée. Aucun besoin de réintroduire des horaires imposés. |
| Rôles et identité | Séparation client/coach ; passage professionnel encadré ; sessions natives SecureStore. | Politique de changement d’e-mail et de récupération de compte ; cas Apple masqué/Google/adresses différentes et prévention des comptes en double. Ne pas fusionner automatiquement sur une identité supposée. |
| Équipe | File de dossiers, décisions par pratique, motifs, historique, contrôle contre preuve obsolète et suspension présents. | Opérateur habilité, MFA pour les actions sensibles, droits distincts support/vérification/admin, règles de revue et escalade. Attribution des dossiers et pagination serveur avant plusieurs examinateurs/volume important. |
| Paiement | Montants et remboursements simulés. | Paiement marketplace, vérification financière du coach, commission, remboursements, versements, litiges, rapprochement et justificatifs comptables. Aucun IBAN maison à ajouter en attendant. |
| Messages et notifications | Conversations privées, brouillons, accusés d’envoi, rubriques et actions présents. | Réception push réelle ; indicateur de synchronisation/reprise sur réseau lent ; procédure humaine pour signalements, absence du coach et abus. Un statut lu n’est pas une preuve de résolution. |
| Agendas | Google codé/déployé ; Apple Calendar permet l’ajout/export. | Consentement Google, conflit réel, renouvellement/révocation et panne fournisseur à tester. Outlook et synchronisation iCloud bidirectionnelle restent hors périmètre actuel. |
| Données et performance | PostgreSQL privé, commandes validées, commits atomiques et idempotence. | Normalisation ciblée, requêtes paginées, charge et conflits mesurés, archivage ; voir le plan base de données ci-dessous. |
| Fichiers | Photos publiques, justificatifs privés, limites serveur et URL signées courtes. | Corriger WebP, redimensionner les photos plutôt que refuser une photo iPhone trop lourde, gérer les fichiers abandonnés après import, définir conservation et sauvegarde des originaux. Protection/analyse des fichiers à durcir selon l’exposition. |
| Sécurité | RLS activé sur les tables observées, fonctions métier non exécutables directement par les clients, contrôles par acteur, secrets exclus des fichiers suivis connus. | Traiter les dépendances, MFA équipe, rotation/révocation, surveillance des abus, protection Auth contre les inscriptions automatisées et contrôle des paramètres de production. Pas de scan exhaustif de tout l’historique Git ni de pentest dans cet audit. |
| Confidentialité | Notice, choix de notifications, export et suppression avec purge serveur présents. Pas de GPS en continu. | Identité du responsable/contact encore vides ; bases légales, conservation, contrats prestataires, exercice des droits et déclaration des données réellement collectées à finaliser. |
| WebApp | Interface desktop et métier communs au mobile ; export statique utilisable. | Hébergement HTTPS, domaine, environnement de préproduction, stratégie de cache et retour arrière de version. Routes partageables/restaurables et comportement du bouton Retour du navigateur à renforcer. Les profils ne sont pas encore de véritables pages publiques optimisées pour le référencement. |
| Mobile | React Native iOS et configuration Xcode présents ; Apple natif déjà validé par le propriétaire dans une version antérieure. | Dernier build signé, iPhone/iPad, clavier, petits écrans, Dynamic Type, VoiceOver, interruptions et réseau faible. Préparation App Store/TestFlight. Android nécessite sa propre configuration et recette si retenu au lancement. |
| Accessibilité | Contrôles automatisés et navigation clavier existent. | Corriger A36-05 ; compléter lecteur d’écran, agrandissement du texte, focus, zones tactiles et navigation dans les cartes. Les captures en largeur téléphone ne prouvent pas ces comportements natifs. |
| Exploitation | Cron, file de push, purge et script de santé présents. | Alertes envoyées à un opérateur, suivi des exceptions et versions, indicateurs de latence/conflits, procédures d’incident et responsable joignable. |
| Sauvegarde | Export local des documents métier avec vérification limitée. | Sauvegarde complète, hors machine, chiffrée, test de restauration Auth/fichiers/données/configuration, objectifs de perte maximale et de délai de reprise. Git ne sauvegarde pas les utilisateurs. |
| Livraison | CI TypeScript, suites métier/navigateur et export Hermes présents. | Rendre les tests déterministes, empêcher un bundle serveur périmé, contrôle des dépendances/secrets en CI, validation native, déploiement réversible. La CI utilise des fixtures, pas le serveur de production. |
| Pilotage produit | Parcours et statistiques visibles ; calculs financiers simulés. | Mesurer recherche sans résultat, ouverture profil, réservation réussie/échouée, abandon et retour client. Instrumentation minimale respectueuse de la confidentialité, sans enregistrer documents/messages dans l’analytics. |
| Exploitation marketplace | Offre produit riche, mais aucune offre publique observée sur le projet connecté. | Recruter et accompagner les premiers coachs vérifiés, concentrer le lancement géographiquement, définir réponse support et suivi des annulations. La densité de créneaux est plus utile qu’une nouvelle collection de fonctionnalités. |

Les 11 informations « RLS sans policy » concernent des tables privées sans droits directs client ; il ne faut pas ajouter des policies permissives pour faire disparaître ces messages. Supabase signale aussi la protection contre les mots de passe compromis désactivée : à traiter selon les méthodes de connexion conservées, sans confondre ce réglage avec la sécurité des connexions Apple/Google. Aucune alerte performance du conseiller ne constitue un test de charge.

## Domaine et e-mails Partant

Il faut distinguer quatre composants. Les noms ci-dessous sont des exemples à adapter au domaine réellement acheté ; aucun nom n’est réservé ni disponible par déduction.

1. **Le domaine de marque** : propriété de l’entreprise, renouvellement, accès de secours, DNS et HTTPS. Il sert au site, à la WebApp et aux e-mails.
2. **La boîte de réception professionnelle** : par exemple `support@<votre-domaine>`, avec éventuellement des alias contact/confidentialité vers la même boîte. Accès nominatifs et réponse suivie ; éviter que toute l’exploitation dépende d’une boîte personnelle ou d’un mot de passe partagé.
3. **L’envoi automatique** : fournisseur SMTP/API raccordé à Supabase Auth pour les codes ou liens, puis aux événements transactionnels de réservation. Une boîte de réception ne remplace pas cet expéditeur. SPF, DKIM, DMARC, rebonds, plaintes, quotas, reprise et `Reply-To` sont à configurer. Le fournisseur standard Supabase est limité et destiné aux essais ; le projet documente toujours ce mode reporté. [Documentation SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
4. **La personnalisation de l’authentification** : marque Google/Apple, pages d’aide et callbacks de la WebApp. Remplacer aussi l’hôte technique Supabase visible dans certains parcours OAuth est un chantier distinct : son domaine personnalisé est une option payante sur un plan payant, pas une conséquence automatique de l’achat du domaine du site. [Documentation](https://supabase.com/docs/guides/platform/custom-domains).

Je recommande un seul fournisseur transactionnel au départ, distinct de la boîte support. Resend ou Brevo sont des exemples compatibles cités par Supabase ; le choix reste à faire selon tarifs, délivrabilité, contrats et volume, sans abonnement souscrit ici. Un modèle français à code existe dans le dépôt mais n’est pas une preuve d’activation. La restriction de personnalisation du SMTP standard pour les nouveaux projets gratuits est [documentée](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

**Critère de fin** : un utilisateur externe à l’équipe reçoit le message Partant, confirme son compte sur web et iPhone, peut répondre au support, et le système traite expiration, nouvel envoi, rebond et double clic sans faux succès. Ajouter ensuite confirmation, changement et annulation de séance via une file transactionnelle ; ne pas déclencher ces e-mails uniquement depuis le téléphone. Le marketing peut attendre et reste distinct des messages de service.

## Base de données et montée en charge

**Il ne faut pas créer une seconde base pour la WebApp.** Supabase PostgreSQL héberge déjà les données partagées. En revanche, le moteur actif charge l’ensemble métier à partir de `private.product_documents`, réparti en documents JSON, puis utilise une révision globale. Les tables relationnelles du pilote historique existent encore, mais ne sont pas toutes la source du produit actuel. [Chargement](../supabase/migrations/20260916211333_connected_product_workflows.sql#L17), [API](../supabase/functions/product-api/index.ts), [verrou global](../supabase/migrations/20260921173312_backend_push_23.sql#L176).

Cette approche protège aujourd’hui la cohérence des commits. Sa limite est qu’une action chez un coach peut invalider la version détenue par un autre utilisateur ; le coût des lectures et des transformations augmente avec les historiques. Le polling toutes les cinq secondes est conditionnel, mais les données métier chargées restent larges. Les 7 557 octets de documents observés sont trop peu pour conclure à une capacité commerciale.

Évolution recommandée, **sans réécrire les interfaces** :

- Séparer progressivement profils, offres, lieux, ouvertures, occurrences de groupe, réservations/participants, messages, notifications, dossiers/pièces/décisions et événements de paiement.
- Définir les contraintes et index autour des parcours : propriétaire, statut, date, capacité, chevauchement et recherche géographique. Révision/verrouillage au niveau de la réservation ou du coach concerné plutôt qu’au niveau de toute la marketplace.
- Garder les commandes et leur validation serveur ; introduire pagination réelle et réponses ciblées. Ne pas remplacer l’API par des écritures directes non contrôlées depuis les clients.
- Versionner la migration, comparer les résultats ancien/nouveau modèle sur un environnement isolé et prévoir une reprise. Retirer les anciens points d’entrée inutilisés après inventaire.
- Mesurer latence, taille des réponses, erreurs et concurrence sur une volumétrie convenue avant de choisir l’abonnement ou les ressources. Aucune capacité « milliers de coachs » n’est démontrée aujourd’hui.

La sauvegarde actuelle ne couvre pas Auth, les binaires Storage ni les secrets externes. Même les sauvegardes de base Supabase ne contiennent pas les objets Storage : il faut une stratégie complémentaire et une restauration testée. [Limites des sauvegardes](https://supabase.com/docs/guides/platform/backups), [script actuel](../scripts/backup-product-23.mjs).

## Séparation des environnements et exploitation

Le projet observé est un environnement de développement. Avant des utilisateurs externes, définir développement, préproduction et production, leurs données, clés, callbacks, expéditeurs et environnements de paiement/push. Ce sont des environnements séparés d’un même produit, pas une divergence entre App et WebApp.

L’export public contient encore les pages de simulation/recette et l’application web accepte `?data=preview`. Les données fictives restent isolées et cela n’accorde aucun droit serveur, mais un artefact public devrait désactiver ces outils pour éviter la confusion. Le serveur Python sur `127.0.0.1` est uniquement une prévisualisation locale ; son absence d’en-têtes de production ne constitue pas un audit d’un hébergement public inexistant.

Prévoir déploiement avec HTTPS, en-têtes adaptés (notamment politique de contenu), version identifiable, rollback, alertes d’erreur et sauvegardes externes. Ajouter une surveillance des files et erreurs fournisseurs avec un destinataire humain. Un cron sans erreur et une file vide ne prouvent pas qu’une notification arrive sur un iPhone.

Les cartes utilisent les tuiles publiques OpenStreetMap et le géocodage IGN. Conserver les attributions, limiter les requêtes et les données transmises, tester les pannes, et choisir un service adapté au trafic attendu. Les serveurs de tuiles publics ne donnent pas une garantie de disponibilité commerciale. [Politique OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).

## Paiement et règles commerciales à décider

Le paiement marketplace requiert plus qu’un bouton carte : rattachement du compte financier coach, autorisation/capture, état d’attente limité dans le temps, capacité réservée, idempotence, événements serveur vérifiés, commission, remboursement, versement, impayé/litige et rapprochement. Garder les coordonnées bancaires chez le prestataire. Les reçus, factures et exports de revenus devront correspondre aux transactions réelles. [Stripe Connect](https://docs.stripe.com/connect).

Les environnements de test permettent de construire ce parcours sans déplacer d’argent réel ; cela ne préjuge pas des frais d’exploitation ultérieurs. [Mode test](https://docs.stripe.com/testing). L’intégration reste reportée à la demande du propriétaire.

**Décision à prendre avant cette intégration : la visio collective.** Les règles Apple distinguent les séances physiques consommées hors app, les services individuels en temps réel et les services distants pour plusieurs personnes. Leur règle 3.1.3(d) prévoit l’achat intégré pour les services en temps réel « one-to-few/one-to-many », tandis que 3.1.3(e) traite les services physiques hors app. Ne pas supposer qu’un même paiement externe couvre toutes les offres visio et physiques. Recommandation pour simplifier le lancement : examiner d’abord le périmètre physique, puis qualifier explicitement individuel/duo/groupe à distance. Ce choix n’a pas été appliqué. [Règles Apple](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods).

Définir aussi : qui facture la prestation et la commission, traitement des absences/retards, annulation coach, météo pour l’extérieur, nombre minimum de participants, assurances, mineurs, procédure de réclamation et responsabilités. Le modèle juridique et fiscal doit déterminer les champs à collecter. L’applicabilité de DPI-DAC7 aux services personnels vendus via la plateforme doit être qualifiée avant exploitation ; ne pas supposer que Stripe couvre toutes les obligations de Partant. [Administration fiscale](https://www.impots.gouv.fr/transfert-dinformations-en-application-des-dispositifs-dpi-dac7-plateformes-deconomie-collaborative).

## Confidentialité et confiance

La notice est explicitement une notice de test ; `controller` et `contactEmail` sont encore vides. Il faut compléter identité/contact, finalités et bases légales, durées, destinataires, garanties des prestataires, procédures d’accès/export/effacement et traitement des incidents. La région européenne du projet ne démontre pas à elle seule l’absence de tout transfert international. [Source](../apps/mobile/src/product/privacyContent.ts).

Ne pas ajouter une case globale « j’accepte le RGPD ». Conserver l’information au compte, les choix facultatifs au bon moment et leur gestion dans les réglages. Une permission technique du téléphone ne règle pas à elle seule toutes les questions de consentement. [Recommandations CNIL](https://www.cnil.fr/fr/permissions-applications-mobiles-recommandations-de-la-cnil-pour-respecter-la-vie-privee).

Les objectifs et champs libres peuvent contenir des informations de santé si un utilisateur y décrit une blessure ou une pathologie. Recommandation : limiter les demandes au nécessaire et qualifier ces traitements, sans transformer Partant en dossier médical. [Définition CNIL](https://www.cnil.fr/fr/quest-ce-ce-quune-donnee-de-sante).

Le manifeste iOS contient une liste vide pour `NSPrivacyCollectedDataTypes`. Il faut la rapprocher des usages réels et des déclarations App Store Connect, ainsi que des SDK embarqués ; ce n’est pas une preuve que l’app ne collecte rien. [Manifeste actuel](../apps/mobile/ios/Partant/PrivacyInfo.xcprivacy), [documentation Apple](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests).

## Ordre d’exécution proposé

| Étape | Travail | Qui intervient | Terminé lorsque |
| --- | --- | --- | --- |
| 1 — Fiabilité sans nouvelle souscription | Corriger A36-03 à A36-06, qualifier/mitiger les dépendances, préparer la mise à jour PostgreSQL et sa reprise. | Développement | Recette déterministe verte, problèmes reproduits couverts et décision sécurité documentée. |
| 2 — Premier opérateur | Habiliter une adresse explicitement désignée, sécuriser l’accès et définir la revue des dossiers/support. | Paul + développement/opérateur | Dossier de test déposé, corrigé, validé/refusé et publié avec historique. |
| 3 — Identité et communications | Choisir domaine et boîte professionnelle, brancher SMTP et modèle français, vérifier réception externe et support. | Paul pour comptes/coûts + développement | Un nouveau testeur termine la connexion web/iPhone et peut recevoir une réponse. |
| 4 — Données et exploitation | Préproduction/production, sauvegarde complète/restauration, monitoring et plan de normalisation ciblé. | Développement/opérateur | Reprise démontrée, alertes reçues et charge mesurée selon la cible retenue. |
| 5 — Recette native et services | Dernier binaire, deux comptes, Calendar, APNs, réseau faible, retours, accessibilité et appareils ciblés. | Paul/QA + développement | Preuves sur appareils et état cohérent App/WebApp ; aucun résultat simulé présenté comme réel. |
| 6 — MVP commercial | Valider périmètre visio/paiement, intégrer le prestataire en test, finaliser règles et informations légales puis préparer distribution. | Paul + développement + conseil adapté | Réservation réellement encaissable, remboursement/versement vérifiés, équipe et support disponibles. |

Les étapes peuvent se chevaucher : la réflexion sur la structure des données et les règles de paiement doit commencer avant leur implémentation. Une petite bêta supervisée peut précéder la normalisation totale si charge, risques et limites sont explicitement acceptés ; un lancement à volume indéterminé ne le devrait pas.

## Coûts et éléments qui peuvent attendre

Les corrections, les tests, le plan de données et la préparation des e-mails peuvent avancer dans l’environnement actuel. Le domaine, la boîte professionnelle, l’envoi transactionnel, l’hébergement et les garanties de sauvegarde peuvent entraîner des coûts selon les fournisseurs et volumes. Aucun tarif forfaitaire n’est promis par cet audit. Le domaine personnalisé Supabase est distinct de ces besoins.

À différer sans pénaliser le premier parcours local : SMS, Outlook, synchronisation iCloud bidirectionnelle, PWA hors ligne, applications Android si lancement iPhone uniquement, abonnement coach, fidélité complexe et catalogue national. Une messagerie instantanée au sens technique ou un nouveau dashboard ne sont pas nécessaires pour corriger les manques actuels.

Conserver la DA validée et les composants partagés. Améliorer d’abord les retours d’erreur, la reprise d’activité et la qualité de l’offre locale. Le code peut ensuite être découpé par parcours : `ProductApp.tsx` dépasse 6 000 lignes, ce qui augmente le coût de maintenance, sans constituer en soi un défaut visible pour l’utilisateur.
