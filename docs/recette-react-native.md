# Recette de la version React Native

> Recette exécutée le 18 septembre : [résultats, limites et démonstration visible](recette-2026-09-18.md).

Utiliser l’aperçu local sur le port 8081. La démonstration fonctionne sans Supabase ; aucune action ne débite de carte ni n’envoie de SMS. Tester dans un seul onglet pour les changements de compte. Le stockage HTML est indépendant de celui de React Native.

## Scénarios à rejouer

1. **Découvrir.** Ouvrir Partant comme particulier. Choisir une pratique, un objectif adapté, un budget et un secteur IDF. Chercher par date/heure puis par coach. Alterner carte et liste, filtrer les formats, comparer et ajouter un favori.
2. **Réserver.** Ouvrir Thomas, choisir un créneau et un lieu. Se connecter avec `alex@example.test` / `123456`. Vérifier le résumé et le total, simuler le paiement, retrouver la confirmation et la séance. Exporter l’ICS, lire les consignes et envoyer un message.
3. **Paiement interrompu.** Dans « À propos de la simulation », activer le mode test. Refuser une tentative, la reprendre, puis réussir. Vérifier qu’une seule réservation existe et que les essais refusés n’ont pris aucune place. Avancer le temps pour tester l’expiration.
4. **Échanges.** Changer de compte fictif vers Thomas. Lire les notifications de réservation et de modification ; vérifier la conversation et les accusés de lecture. Proposer un autre créneau. Revenir à Alex pour refuser puis accepter une nouvelle proposition : l’ancienne séance doit rester réservée jusqu’à l’acceptation.
5. **Cours collectif.** Avec Thomas, créer/activer une offre de groupe, fixer le maximum et le prix par personne, programmer deux cours futurs. Avec Alex, réserver plusieurs places ; vérifier le nombre restant, retirer une partie des places, transférer vers l’autre cours et contrôler l’historique financier. Avec le coach, consulter les inscrits puis annuler le cours.
6. **Planning.** Configurer plusieurs plages libres avec leurs offres et lieux, une exception fermée, une occupation privée et un délai de réservation. Les intervalles sans coaching sont les espaces laissés entre les plages. Vérifier les créneaux côté client. Les séances déjà confirmées doivent être conservées.
7. **Configuration.** Modifier portrait, présentation, offres, niveaux, tarifs, formats, adresse et supplément de déplacement. Vérifier le devis côté client et que les cours déjà programmés gardent leurs conditions. Essayer les consignes, notes client et export CSV.
8. **Dossier.** Soumettre les quatre références fictives, passer dans l’espace équipe en mode test, motiver une décision. Une approbation ne publie pas silencieusement le coach. Une modification d’identité invalide son dossier. Ne pas importer de justificatifs réels dans cette démonstration.
9. **Après-séance.** Une démonstration neuve contient une séance passée de Sarah pour Alex. Laisser un avis, y répondre avec Sarah, demander de l’aide et traiter un signalement depuis l’espace équipe. Sinon, terminer une séance depuis les outils de test.
10. **Confidentialité locale.** Passer d’Alex à Nina : réservations, favoris, messages et export personnel doivent correspondre au compte sélectionné. La suppression est bloquée tant que des séances confirmées subsistent.

## Revue visuelle et appareil

Comparer chaque parcours au HTML archivé, à 390 et 430 px. Vérifier notamment les photos, Hanken, pills, arrondis, espaces, textes longs, boutons fixes, retours et fenêtres de sélection. Sur iOS/Android : safe areas, clavier, retour système Android, défilement, import photo et partage ICS/CSV/JSON. Les contrôles DOM ne remplacent pas cette revue.

## Ce qui nécessite encore un service réel

La démo utilise un stockage local. Le mode connecté utilise Supabase pour les écritures métier, les justificatifs et les droits équipe ; les scénarios testés sont détaillés dans le rapport du 18 septembre. Google/Apple et Calendar sont configurés, mais les consentements et échanges réels restent à valider. Outlook, paiement bancaire et communications externes restent différés.

## Ajustements demandés après la reprise native

- Coach : Messages et Notifications doivent être accessibles depuis chacun des quatre onglets, avec et sans non-lus. Lire une conversation retire son compteur ; le bandeau de notification est réservé à l’Agenda. Vérifier le retour vers les onglets depuis ces deux écrans.
- Client : « Mon espace » regroupe échanges, préférences et aide. Séances et favoris restent dans la navigation principale ; l’assistance et le suivi des demandes ont une seule entrée.
- Onboarding : terminer ou passer ne doit pas activer automatiquement les filtres sport, budget, distance, format ou date d’Explorer. La localisation reste le secteur choisi. Les préférences sont enregistrées dans le profil et influencent le tri « Pour vous ». Les filtres choisis volontairement dans Explorer restent fonctionnels. Un changement de compte efface les critères temporaires du compte précédent.
- Le script `scripts/test-native-navigation-web.cjs` rejoue ces régressions sur le bundle web, y compris une création de compte complète et les boîtes de réception vides.

## Disponibilités par type de séance

Dans Réglages → Séances & tarifs, créer plusieurs formules, chacune avec son nom, son format, sa durée et son prix. Dans Disponibilités, chaque plage peut proposer toutes les offres (y compris les futures) ou une sélection explicite. Exemple : renforcement 60 min à 50 € de 9 h à 12 h, puis renforcement express 30 min à 30 € de 14 h à 17 h. Une plage accueille autant de rendez-vous que sa durée le permet ; le nombre de plages n’est plus limité à trois.

Tester une quatrième plage, deux offres différentes sur la même plage, puis une exception datée affectée à une autre offre. Modifier une heure doit conserver la sélection d’offres. Une réservation occupe le coach pour toutes ses offres pendant sa durée : pas de double réservation. Un tarif n’est pas saisi une deuxième fois dans le planning ; créer une autre formule dans Séances & tarifs si ses conditions diffèrent.

L’Agenda permet de choisir la séance dont on consulte les créneaux. Côté client, choisir un horaire où seule la deuxième offre est disponible : le coach doit rester trouvable, afficher cette formule et réserver à son prix. Vérifier aussi que la durée complète tient dans la plage.

Les groupes nécessitent toujours un cours daté et une capacité ; affecter une offre de groupe à une plage autorise sa programmation, sans ouvrir automatiquement un cours récurrent. Les réservations confirmées et cours déjà programmés conservent leurs conditions lors des changements de planning.

Les anciens réglages de démonstration restent compatibles et proposent toutes les offres. Les affectations par plage sont persistées et contrôlées côté serveur en mode connecté ; leur trajet interface → serveur fait partie de la recette.

## Le coach décide de ses horaires

Une seule logique de disponibilités, sans mode « heures fixes ». Une nouvelle plage ne contient aucune heure préremplie. Un nouveau coach commence avec les sept jours fermés. Les horaires existants des comptes fictifs restent les données de démonstration de ces coachs.

Le premier départ est l’heure de début saisie par le coach, par exemple 9 h 10. Les départs suivants suivent la durée de l’offre. Aucun réglage de pause ou d’espacement n’est imposé ; le coach laisse des intervalles entre ses plages si nécessaire. L’aperçu affiche le résultat avant sauvegarde. Les réservations et occupations enlèvent ensuite les créneaux incompatibles. Ce réglage n’est pas une seconde catégorie de planning.

Tester 9 h 10–13 h 10 avec une offre d’une heure : départs à 9 h 10, 10 h 10, 11 h 10 et 12 h 10. Vérifier ensuite deux plages séparées, puis la recherche côté client : les heures réellement configurées doivent être sélectionnables, y compris 18 h 10. Les cours collectifs gardent leur date et leur heure choisies par le coach.

## Version 6 — nouveaux parcours

Suivre les neuf scénarios de [la recette des améliorations produit](ameliorations-produit-6.md#recette-à-effectuer-sur-téléphone), notamment la persistance des brouillons, les copies et exceptions, les rendez-vous directs et leur incidence sur les créneaux clients, les doublons de cours, puis les confirmations de modification et d’annulation. Les horaires doivent rester entièrement décidés par le coach.
