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
