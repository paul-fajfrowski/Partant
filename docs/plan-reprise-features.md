# Plan de reprise de Partant par feature

Plan préparé le 13 octobre 2026 pour Wilson à partir des directives de Paul. Base Git : `main`, commit `38ac3bd`, livraison 38 du 6 octobre. Le travail commence par la recette et les corrections des parcours existants, puis l'observation d'usage. Chaque feature est un lot de travail borné, même lorsqu'il s'agit de valider une fonction déjà implémentée.

Références : [décisions persistantes](../AGENTS.md), [transfert et todo de Paul](../ETAT_DU_PROJET.md), [livraison 38](corrections-produit-38.md), [recette terrain](recette-terrain-38.md). Les guides historiques doivent être lus avec les corrections des livraisons ultérieures.

## Méthode de livraison

1. Prendre une seule feature à la fois. Vérifier ses prérequis et créer sa branche depuis la dernière version intégrée de `main`. Les noms ci-dessous sont proposés ; aucune branche n'est créée par ce plan.
2. Reproduire le scénario existant avant de corriger. Garder la source React Native/Web commune et la DA validée. Ne pas transformer un test en refonte.
3. Limiter les commits au lot. Pour un défaut indépendant ou un lot devenu trop large, ouvrir une petite correction distincte avant de reprendre la recette.
4. Exécuter les contrôles adaptés aux changements et rejouer le scénario réel concerné. Utiliser le workflow [QA](../.github/workflows/qa.yml) comme référence de régression ; les tests automatisés ne remplacent pas les essais physiques.
5. Présenter le résultat, les preuves, les limites et le diff. Pousser uniquement la branche du lot, avec une PR dédiée lorsqu'il y a des modifications à intégrer. Intégrer ce lot après revue avant de commencer le suivant. Aucun push regroupant plusieurs features sur `main`.
6. Si la recette ne nécessite aucun changement produit, livrer seulement son compte rendu. Un réglage local, une habilitation ou une configuration distante n'est pas transféré par un push Git.

Une feature termine avec ses scénarios réussis, ses corrections rejouées et ses preuves conservées. Un prérequis manquant donne le statut « Bloqué » avec la dépendance précise ; il ne vaut pas validation. Pour chaque essai, noter commit, appareil/OS ou navigateur, date, résultat attendu/obtenu et preuve sans secret ni donnée personnelle inutile.

Si les règles métier changent, régénérer le domaine serveur et maintenir `product-api`, `google-calendar` et `push-dispatch` synchronisés sur le projet de développement. Consigner les déploiements dans le lot : la fusion Git ne déploie pas le serveur. Préserver les correctifs natifs, le postinstall, les callbacks existants et le consentement Calendar distinct du login.

## Ordre de travail

| Lot | Feature | Branche proposée | Prérequis | Statut |
| --- | --- | --- | --- | --- |
| F01 | Préparer l'environnement et le build iPhone | `feature/01-environnement-recette` | Accès Mac, signature Apple et iPhone | Web connecté prêt ; installation iPhone bloquée |
| F01 bis | Corriger les nouveaux avis de dépendances | `feature/01bis-dependances` | Diagnostic du contrôle de sécurité F01 | Correctif PR 1 validé par la CI Linux |
| F02 | Valider connexion et sessions | `feature/02-auth-sessions` | Web connecté prêt ; signature/appareil pour le volet iPhone | Prochaine étape autorisée ; commencer par le web |
| F03 | Valider l'équipe et les dossiers | `feature/03-equipe-dossiers` | F02, opérateur désigné par Paul | À faire |
| F04 | Valider la configuration et la publication coach | `feature/04-activation-coach` | F03, dossier coach validé | À faire |
| F05 | Valider découverte, prix et navigation client | `feature/05-decouverte-client` | F04, offres et ouvertures réalistes | À faire |
| F06 | Valider les réservations entre appareils | `feature/06-reservations` | F05, deux comptes et second client pour concurrence | À faire |
| F07 | Valider messages et notifications internes | `feature/07-communication-interne` | F06, séances de test | À faire |
| F08 | Valider Google Calendar réel | `feature/08-recette-calendar` | F06, agenda de test et consentement explicite | À faire |
| F09 | Valider les push iPhone | `feature/09-recette-push-ios` | F06, build signé et appareil enregistré | À faire |
| F10 | Valider ergonomie et accessibilité iPhone | `feature/10-recette-native` | F02 à F09, dernier build réinstallé | À faire |
| F11 | Observer la première utilisation | `feature/11-observation-usage` | Recette technique sans blocage et testeurs volontaires | À faire |

Cet ordre est la séquence proposée. Si F03 attend la désignation de l'opérateur, des essais indépendants restent possibles avec un coach de test déjà validé et autorisé ; F03 conserve alors son statut bloqué. Aucune auto-validation ni attribution de droits à un compte deviné.

Le [bilan F01 du 13 octobre](f01-environnement-recette.md) consigne les installations, les résultats et les blocages restants. Le [correctif F01 bis](f01bis-dependances.md) traite les avis `shell-quote` et `source-map-js` détectés par le contrôle existant : seules les dépendances concernées ont changé, les mitigations antérieures restent en place et le contrôle passe sans ajouter d'exception. Les réservations et la DA restent hors de ce correctif.

Le propriétaire autorise la reprise F02 dans une nouvelle conversation. La recette web peut avancer pendant que Paul prépare l'accès Apple ; le volet iPhone et la clôture physique de F01 restent conditionnés à la signature et à un appareil réel.

## F01 Préparer l'environnement et le build iPhone

**Objectif :** disposer d'une copie de travail reproductible et du binaire exact à tester.

- Vérifier Node selon `.nvmrc`, dépendances mobile/QA/Calendar, CocoaPods, Xcode, disque et accès de signature. Suivre [l'installation du collègue](../ETAT_DU_PROJET.md) ; prévoir au moins 10 Go de marge pour le build.
- Configurer uniquement les variables publiques locales fournies par Paul. Vérifier le mode connecté et ouvrir la WebApp locale sans écraser un serveur existant.
- Établir l'état initial de la recette automatisée selon la CI. Identifier tout échec avant de modifier le produit.
- Compiler et installer le workspace `apps/mobile/ios/Partant.xcworkspace` sur l'iPhone ; noter le commit et la configuration. Préserver le projet iOS versionné et ses correctifs.

**Critère de fin :** la WebApp et le binaire signé du commit attendu s'ouvrent en mode connecté ; l'état initial des contrôles est documenté. Une compilation Hermes seule ne valide pas l'installation iPhone.

## F02 Valider connexion et sessions

**Objectif :** entrer et revenir dans le bon compte sur iPhone et WebApp.

- Tester Apple et Google : succès, abandon, reprise et reconnexion. Tester le lien e-mail lorsque sa réception est possible avec le fournisseur actuel ; consigner sa limite si elle bloque.
- Vérifier inscription, réservation reprise après connexion, routes protégées, séparation client/coach et déconnexion suivie d'un retour navigateur.
- Tester persistance et migration des sessions natives SecureStore, ainsi que l'invalidation des anciennes réponses de profil lors d'un changement de compte.

**Critère de fin :** les scénarios exécutés retrouvent le bon espace sans données du compte précédent ; aucune route ne confère un rôle. Le code e-mail demeure reporté tant que le fournisseur n'est pas activé et réellement testé.

## F03 Valider l'équipe et les dossiers

**Objectif :** faire instruire un dossier réel de test par un opérateur autorisé.

- Obtenir de Paul l'identité explicite de l'opérateur et le rôle voulu. Appliquer l'habilitation prévue puis configurer et tester MFA, conformément à la [livraison 37](equipe-securisee-37.md).
- Tester refus sans rôle/MFA, pagination serveur, détail à la demande et attribution exclusive avant décision ; vérifier également les accès aux fichiers privés.
- Rejouer dépôt → demande de correction → nouvelle soumission → validation/refus par pratique, avec acteur, motif et preuves. Tester expiration des pièces et nouvelle discipline sans validation héritée.

**Critère de fin :** un opérateur désigné traite le dossier ; le coach voit les décisions et reste incapable de s'auto-valider. Les fixtures techniques sont isolées et nettoyées.

## F04 Valider la configuration et la publication coach

**Objectif :** obtenir une offre réellement réservable sur le serveur de développement.

- Configurer présentation, discipline, offre, durée, format, tarif et lieux cohérents ; vérifier les documents requis et les états de vérification.
- Tester semaine → jour → plage, brouillon puis sauvegarde serveur, duplication, chevauchement et copie de journée ; tester une date ponctuelle séparément.
- Rejouer fermeture/réouverture des départs, rendez-vous extérieur, indisponibilité et protection des réservations existantes.
- Vérifier checklist et publication avec un départ réservable, y compris sans semaine récurrente ; tester suspension et remise en ligne selon les droits existants.

**Critère de fin :** le coach configuré apparaît avec un départ admissible ; les états dossier/planning/publication concordent. Les horaires restent choisis par le coach, sans pause ni cadence imposée.

## F05 Valider découverte prix et navigation client

**Objectif :** retrouver la bonne prestation et conserver les choix jusqu'au récapitulatif.

- Tester recherche libre par prochaine disponibilité, nom du coach, discipline, date explicite sans résultat et alternatives.
- Comparer budget, tri, carte, profil et récapitulatif : supplément domicile, duo pour deux et groupe par place. Vérifier éligibilité de l'adresse et du secteur sans faire confiance à des coordonnées client.
- Tester onboarding facultatif, favoris, comparaison, séance à venir et nouvelle réservation sans anciens filtres restrictifs.
- Tester liens de profil, rechargement, Retour/Avancer web, ouverture native app fermée/ouverte et destinations protégées. Vérifier les retours locaux et la conservation de l'intention.

**Critère de fin :** offre, date, heure, lieu et prix restent cohérents ; les routes respectent le compte et ne transportent aucun jeton. La navigation ne redonne pas accès au paiement d'une séance confirmée.

## F06 Valider les réservations entre appareils

**Objectif :** retrouver une même séance et ses changements côté client iPhone et coach WebApp.

- Réserver en individuel, duo et groupe ; vérifier les places, disponibilités et rendez-vous après accusé serveur.
- Tester double clic, perte de réponse, reprise réseau et reconnexion sans réservation en double.
- Faire concourir deux clients sur un créneau individuel et sur la dernière place collective ; vérifier une seule admission et un refus compréhensible.
- Rejouer modification, proposition, acceptation/refus, annulation, annulation partielle et transfert collectif selon les règles existantes ; comparer les historiques des participants.

**Critère de fin :** états cohérents sur les deux appareils, aucune sur-réservation et reprise sans doublon. Chaque paiement affiché reste une simulation.

## F07 Valider messages et notifications internes

**Objectif :** conserver des échanges privés et des actions fiables autour des séances.

- Tester conversation par personne, accès facultatif aux séances et absence d'accès à un tiers.
- Vérifier brouillons isolés par compte, coupure réseau, renvoi du même message et affichage de l'envoi après accusé serveur.
- Tester rubriques, historique paginé, actions anciennes/lues encore en attente et retour conservant la position.
- Vérifier que les messages et leur badge restent dans Messages ; distinguer événement lu et action résolue.

**Critère de fin :** aucun message doublonné ou exposé à un tiers ; toutes les actions attendues restent accessibles. Ce lot couvre la communication interne existante.

## F08 Valider Google Calendar réel

**Objectif :** vérifier la synchronisation avec un agenda réellement consenti.

- Consentir séparément du login Google sur un agenda de test ; vérifier sélection des agendas et destination des séances.
- Créer une occupation extérieure et vérifier qu'elle bloque effectivement la réservation ; tester modification, suppression et rendez-vous extérieur Partant.
- Vérifier création/modification/annulation des événements de séance et absence de doublon ou de blocage par les propres événements Partant.
- Tester conflit pendant la réservation, révocation, expiration/reconnexion et reprise après erreur sans fausse disponibilité.

**Critère de fin :** événements et disponibilités concordent entre Google et Partant ; les erreurs et conflits testés sont documentés. La clé de chiffrement Calendar existante est préservée.

## F09 Valider les push iPhone

**Objectif :** prouver la réception APNs et l'ouverture de la bonne destination.

- Vérifier le build, l'environnement APNs Sandbox et l'enregistrement de l'appareil ; utiliser la clé push dédiée existante.
- Tester autorisation/refus, préférences, premier plan, arrière-plan et application fermée.
- Toucher une notification et vérifier séance/conversation et compte concernés ; tester déconnexion, changement de compte et reprise.

**Critère de fin :** réception observée sur l'iPhone et ouverture correcte, sans notification privée au mauvais compte. Une tâche cron réussie ne vaut pas push reçu ; Production, TestFlight et Android restent hors de ce lot.

## F10 Valider ergonomie et accessibilité iPhone

**Objectif :** terminer la recette physique du dernier binaire corrigé.

- Vérifier clavier, champs, scroll, grandes polices, VoiceOver, dialogues imbriqués, fermeture, retour et brouillons.
- Importer portrait et justificatif de test depuis l'iPhone ; vérifier formats, erreurs et confidentialité.
- Rejouer les parcours affectés par les corrections F02 à F09, y compris navigation et autorisations, puis comparer avec la WebApp.

**Critère de fin :** aucun défaut bloquant sur les scénarios retenus ; preuves physiques et limites consignées. Toute modification native impose un nouveau build et une réinstallation. La recette Android reste distincte, à planifier avec un appareil cible.

## F11 Observer la première utilisation

**Objectif :** repérer les frictions après la validation technique.

- Faire essayer première réservation et première configuration coach à des volontaires sans expliquer les étapes.
- Consigner hésitations, erreurs, temps et aide demandée ; concentrer le pilote sur un secteur et quelques disciplines réellement disponibles.
- Classer les corrections ; traiter chaque changement retenu dans un lot séparé en préservant le périmètre et la DA.

**Critère de fin :** observations concrètes et prochaines corrections priorisées. Une petite série de tests ne valide pas l'adoption commerciale ; aucun tracking supplémentaire n'est activé implicitement.

## Lots ultérieurs à préparer séparément

Ces sujets font partie de la todo de Paul mais ne sont pas engagés par la préparation du plan. Ils ont leurs propres prérequis et ne doivent pas rejoindre une PR de recette.

| Lot ultérieur | Périmètre | Dépendance et critère de fin |
| --- | --- | --- |
| L01 Confidentialité et identité | Identité juridique/contact, conservation, demandes, purges et déclarations de distribution | Informations de Paul et validation adaptée ; notice et pratiques concordantes avant ouverture publique. |
| L02 Domaine et e-mails | Domaine, boîte support, hébergement, SMTP, modèles français et callbacks | Reprise explicite des sujets reportés et choix des services/coûts ; réception réelle par un testeur externe. |
| L03 Distribution bêta | Signature/distribution, TestFlight et APNs Production ; recette Android séparée | Autorisation de distribution et appareils disponibles ; installation et services vérifiés dans l'environnement cible. |
| L04 Paiement marketplace | Qualification visio collective/règles Apple, Stripe Connect, encaissement, commission, remboursements, versements et webhooks | Réouverture explicite du paiement et configuration fournisseur ; parcours complet en test avant tout encaissement réel. Aucun IBAN provisoire. |
| L05 Sauvegarde et restauration | Préproduction/production et exercice complet données, Auth, Storage et réglages/secrets | Environnement isolé et accès autorisés ; restauration mesurée, documentée et vérifiée. |
| L06 Maintenance et surveillance | Maintenance PostgreSQL, santé, alertes et procédure d'incident | Sauvegarde/revue préalable, fenêtre de maintenance et opérateur/canal désignés ; alertes reçues et responsabilités documentées. |
| L07 Charge et données | Mesure de charge, révision globale, normalisation ciblée, assistance paginée et concurrence des dossiers | Volume cible convenu ; capacité mesurée puis corrections livrées une par une, sans seuil inventé. |

Outlook, SMS, iCloud bidirectionnel, push navigateur/Android et nouvelles fonctionnalités commerciales restent reportés. Une réservation de développement n'est jamais un paiement.

## Suivi à remplir pour chaque feature

- Branche et commit testé :
- Prérequis vérifiés ou dépendance bloquante :
- Scénarios exécutés et environnement :
- Défauts reproduits et corrections :
- Contrôles automatisés et recette réelle :
- Preuves et nettoyage des données de test :
- Déploiements serveur éventuels :
- Limites restantes :
- PR ou compte rendu, résultat de revue :
- Statut final et prochain lot :
