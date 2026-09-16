# Prototype de référence et version React Native

État au 16 septembre 2026. **React Native devient la version de travail de Partant.** Les prochaines évolutions se font dans `apps/mobile`. Le HTML A1–A9 est conservé comme référence validée ; sa validation ne vaut pas validation automatique du rendu natif.

## Référence conservée

- HTML archivé : `outputs/partant.html` ; source historique : `work/partant.template.html`.
- SHA-256 inchangé : `4b32d715f836e39db9d7b9646c2c9a287f1ccafa2fefeae5d007c6e2f2705375`.
- Hanken Grotesk, photographies, pictogrammes SVG, carte schématique, profils, objectifs par sport et communes d’Île-de-France sont repris de la référence.
- L’interface utilise des composants React Native, pas une WebView contenant le prototype. Le portage ne constitue pas une autorisation de refonte.

## Couverture fonctionnelle locale

« Repris » signifie implémenté dans la démonstration native. Les tests automatisés couvrent une sélection de parcours, pas toutes les combinaisons possibles.

| Ensemble | Reprise dans React Native | Limites / vérification restante |
| --- | --- | --- |
| Entrée et comptes | Particulier / coach, connexion avec code fictif, inscription, comptes isolés, modification/export/suppression | OAuth et authentification réelle à terminer |
| Onboarding | Pratique, objectifs adaptés, budget, secteurs IDF | Revue du clavier et des listes sur appareil |
| Découverte | Filtres prix/distance/format/date/heure, individuel/duo/groupe, comparaison, carte schématique | Géographie réelle multi-coachs à raccorder |
| Profils et favoris | Photos du prototype et import, approche, qualifications, avis, prochains créneaux multi-dates | Comparaison visuelle à réaliser |
| Réservation | Séance, durée, lieu, déplacement, nombre de places, prix et récapitulatif | Règles avancées encore locales |
| Paiement A5 | Tentative persistante, refus, interruption, reprise, expiration, réussite idempotente | Simulation sans encaissement ; étape 4 reportée |
| Confirmation et séances | Détails, consignes, checklist, calendrier ICS, conversation, historique, réserver à nouveau | Vérifier export/partage sur iOS et Android |
| Changements | Modification client, proposition coach acceptée/refusée/retirée, contrôle des disponibilités | Validation serveur des règles à compléter |
| Groupes | Offre activable, capacité, cours daté, prix et conditions conservés, inscrits, annulation collective, transfert, retrait partiel de places | Concurrence réelle à valider côté serveur |
| Annulations et remboursements | Délais, prix restant dû, registre des montants payés/remboursés, états de remboursement simulés | Aucun remboursement bancaire réel |
| Planning | Semaine type, plusieurs plages, pauses, exceptions datées, occupations privées, délai, horizon et intervalle entre séances | Synchronisation Google/Outlook non active |
| Configuration coach | Profil, portrait, offres/niveaux/tarifs, formats, adresse, rayon, déplacement, règles, préparation, préférences | Écriture serveur des nouveaux champs à raccorder |
| Dossier et publication | Références fictives, soumission, décisions équipe, expiration, blocage et publication explicite | Aucun justificatif réel vérifié |
| Activité | Clients, notes privées, revenus calculés, export CSV, compte de versement fictif | Comptabilité et versements réels hors de cette reprise |
| Fidélisation | Avis après séance, réponse coach, favoris, prochaines disponibilités et alertes | Notifications externes reportées |
| Assistance | Demande par séance, signalement, suivi et décisions de modération en mode test | Opérations réelles et habilitations serveur à construire |
| Outils de démo | Changement de compte, mode présentation/test, avance du temps, réinitialisation | À distinguer des fonctionnalités de production |

## Modes

- `/` : démonstration locale ; code `123456`, stockage `partant-native-preview-v1`. Une installation neuve inclut une séance passée avec Sarah pour essayer les avis.
- `/?data=connected` : données Supabase de développement. Le socle connecté existant utilise les RPC de réservation, modification, annulation et ouverture de cours. **Les nouveaux parcours avancés locaux ne sont pas automatiquement connectés.**
- Sur iOS/Android, `EXPO_PUBLIC_DATA_MODE=preview` ou `connected` choisit le mode initial.
- `/?tools=connections` : atelier technique conservé pour les branchements.

La création d’une offre collective n’ouvre aucun créneau avant la programmation d’un cours. Le cours conserve son tarif, sa durée, sa capacité, son lieu et ses conditions. Une tentative de paiement non confirmée ne consomme aucune place. Les contrôles de capacité et de propriété des réservations sont rejoués lors des actions.

## Vérification et limites

Validation de cette livraison : **133 assertions** (18 métier de base, 68 règles avancées, 33 parcours DOM client/groupe et 14 parcours DOM de configuration/après-séance), TypeScript sans erreur, exports web/iOS/Android réussis.

Les scripts `test-native-model.cjs`, `test-native-complete.cjs`, `test-native-web.cjs` et `test-native-settings-web.cjs` vérifient les règles métier et plusieurs parcours dans le bundle React Native Web. Ils sont accompagnés du contrôle TypeScript et des exports web/iOS/Android.

**La parité visuelle exhaustive n’est pas validée.** Chrome headless ne démarre pas dans l’environnement de travail ; jsdom ne mesure ni les pixels, ni les photographies affichées, ni le clavier ou les gestes sur téléphone. Certains dialogues historiques sont des écrans natifs séparés : vérifier leurs transitions lors de la recette. Les exports iOS/Android ne sont pas des applications signées ni des tests sur appareils.

## Suite

1. Effectuer la [recette native](recette-react-native.md), comparer le HTML et le natif à 390 et 430 px puis sur téléphone ; corriger les écarts dans React Native.
2. Étendre progressivement le modèle serveur et ses autorisations aux parcours avancés désormais disponibles localement.
3. Terminer les branchements 1–3 : authentification, géographie réelle et agendas ; seuls les comptes Apple Developer sont disponibles à ce jour.
4. Paiements réels et communications externes restent reportés à la demande de l’utilisateur.

La reprise fonctionnelle permet de poursuivre le produit dans React Native. Le MVP connecté et la validation sur appareils restent à terminer.

## Corrections de navigation après retour utilisateur

Messages et Notifications sont rétablis dans chaque onglet coach, avec compteurs et accès permanents à zéro non-lu. Le compte client regroupe échanges, préférences et aide, sans doubler les accès Séances/Favoris de la navigation. Les réponses d’onboarding restent des préférences : elles ordonnent le tri « Pour vous », sans imposer les filtres d’Explorer. Le secteur choisi reste conservé.

Vérification complémentaire : 28 assertions DOM dans `test-native-navigation-web.cjs` (création de compte, fin/passage d’onboarding, filtres explicites, accès et lecture coach, organisation client, isolation des conversations). Les suites de réservation et de configuration passent également (33 + 14 assertions). TypeScript et exports web/iOS/Android réussis. Il ne s’agit pas d’une validation visuelle sur appareil.

## Disponibilités reliées aux offres

La limite de trois plages par jour est supprimée. Chaque plage hebdomadaire ou exception datée autorise toutes les offres du coach, ou une sélection de leurs identifiants. Les anciens réglages sans sélection restent compatibles. La durée et le tarif sont définis dans Séances & tarifs ; ils ne sont pas dupliqués dans le planning. Les créneaux proposés respectent la durée entière, les pauses et les occupations communes à toutes les offres.

Le client peut découvrir un coach sur sa deuxième offre disponible même si sa première offre est fermée à cette heure. La carte et le tri par prix utilisent la formule présentée. L’Agenda coach comporte un sélecteur d’offre. Les groupes restent des cours datés, programmables dans les plages autorisées. Les changements d’horaires conservent les réservations et cours déjà confirmés.

Validation : 26 assertions métier ciblées, 10 assertions DOM de configuration puis réservation au tarif de l’offre, suites existantes de réservation et réglages réussies. TypeScript et exports web/iOS/Android vérifiés. Les affectations par plage sont pour l’instant locales ; leur contrôle et persistance serveur restent à raccorder.

## Précision utilisateur : un planning décidé par le coach

Aucun mode distinct « heures fixes ». Le coach renseigne ses horaires sans heure préremplie sur les nouvelles plages. La cadence universelle de 30 min est retirée : la durée de ses offres et sa pause déterminent les départs, avec un espacement personnalisable. Un aperçu rend ces choix visibles. Les nouveaux comptes coach n’ont aucune plage ouverte par défaut ; les comptes fictifs gardent leurs horaires de démonstration. La recherche client intègre les horaires précis disponibles.

Les réservations existantes restent conservées. Cette évolution porte sur le moteur local ; les règles avancées restent à raccorder au serveur. Contrôles : 35 assertions métier de disponibilités, tests DOM de configuration/réservation, TypeScript et exports natifs/web.

## Version 6 — cohérence et outils quotidiens

La livraison est détaillée dans [Améliorations produit 6](ameliorations-produit-6.md). Elle ajoute les brouillons de réglages et leur abandon confirmé, les retours contextualisés, l’édition explicite des exceptions, la copie de journées, les lieux par prestation, les rendez-vous directs, le diagnostic des disponibilités, la duplication de cours, les noms facultatifs des participants, les progrès de mise en ligne et les confirmations de changements de réservation. Les réglages coach sont regroupés ; les sélections client sont conservées.

Ces évolutions sont locales. Les nouveaux champs et contrôles n’ont pas été déployés sur le serveur. Les paiements et communications externes restent différés. Le HTML archivé est inchangé.

## Version 7 — lieux configurables et planning allégé

L’introduction « À votre rythme » est retirée de Disponibilités. Le diagnostic quitte l’Agenda et devient un lien d’aide secondaire à la fin des disponibilités.

Lieux & déplacements permet d’enregistrer plusieurs lieux du même type, avec nom, adresse et consignes : salles de musculation, pistes, terrains, piscines, studios, parcs, chez le coach ou autres lieux. Les suggestions suivent la spécialité, sans restreindre le catalogue. Domicile contient un secteur, un rayon et un supplément ; l’adresse du client est saisie à la réservation. Visio possède ses propres consignes. Les anciennes données sont reprises sans changer leurs identifiants.

Chaque prestation peut autoriser une sélection précise de lieux. Profils, choix de réservation, filtres, cours collectifs et rendez-vous directs utilisent leurs noms et adresses. Les nouvelles réservations et les cours conservent une copie du nom, de l’adresse et des consignes, indépendante des modifications ultérieures. Le contrôle géographique du rayon et la persistance serveur des lieux restent à raccorder ; les données demeurent locales dans cette simulation.

Tests ajoutés : `test-native-locations.cjs` et `test-native-locations-web.cjs`. Tester notamment deux salles différentes, une prestation limitée à une seule salle, les conditions d’accès visibles avant paiement et le supplément à domicile.

## Version 8 — horaires sans pause ni espacement

À la demande de l’utilisateur, les contrôles Pause et Espacement sont retirés, y compris leur doublon dans les règles de réservation. Les jours et plages constituent l’entrée du planning. Les départs suivent le début exact de la plage et la durée de la prestation ; un temps libre se définit en laissant un intervalle entre deux plages. Les anciennes valeurs sont neutralisées à la lecture et à l’enregistrement, même pour un compte ayant déjà utilisé ces options. Les séances confirmées restent conservées et les conflits de durée restent bloqués.

Les champs historiques restent compatibles avec le stockage existant mais n’affectent plus les horaires locaux. Cette modification ne change pas le moteur serveur de développement.

### Suite du MVP après cette simplification

La couverture client/coach est déjà large. Le prochain complément produit prioritaire est l’affectation d’un lieu à une plage (actuellement les plages autorisent des prestations et les prestations autorisent des lieux, sans restriction du lieu par plage). Puis étendre la persistance serveur et ses contrôles aux nouveaux parcours locaux ; terminer authentification, carte multi-coachs et agendas ; raccorder paiements/commissions/versements/remboursements puis communications externes aux étapes convenues ; effectuer une recette réelle à deux comptes et sur téléphones, y compris les outils équipe. Les packs, abonnements, programme de fidélité et liste d’attente ordonnée sont des évolutions ultérieures, non nécessaires à ce premier périmètre.
