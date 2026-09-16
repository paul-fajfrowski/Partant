# Recette de la version React Native

Utiliser l’aperçu local sur le port 8081. La démonstration fonctionne sans Supabase ; aucune action ne débite de carte ni n’envoie de SMS. Tester dans un seul onglet pour les changements de compte. Le stockage HTML est indépendant de celui de React Native.

## Scénarios à rejouer

1. **Découvrir.** Ouvrir Partant comme particulier. Choisir une pratique, un objectif adapté, un budget et un secteur IDF. Chercher par date/heure puis par coach. Alterner carte et liste, filtrer les formats, comparer et ajouter un favori.
2. **Réserver.** Ouvrir Thomas, choisir un créneau et un lieu. Se connecter avec `alex@example.test` / `123456`. Vérifier le résumé et le total, simuler le paiement, retrouver la confirmation et la séance. Exporter l’ICS, lire les consignes et envoyer un message.
3. **Paiement interrompu.** Dans « À propos de la simulation », activer le mode test. Refuser une tentative, la reprendre, puis réussir. Vérifier qu’une seule réservation existe et que les essais refusés n’ont pris aucune place. Avancer le temps pour tester l’expiration.
4. **Échanges.** Changer de compte fictif vers Thomas. Lire les notifications de réservation et de modification ; vérifier la conversation et les accusés de lecture. Proposer un autre créneau. Revenir à Alex pour refuser puis accepter une nouvelle proposition : l’ancienne séance doit rester réservée jusqu’à l’acceptation.
5. **Cours collectif.** Avec Thomas, créer/activer une offre de groupe, fixer le maximum et le prix par personne, programmer deux cours futurs. Avec Alex, réserver plusieurs places ; vérifier le nombre restant, retirer une partie des places, transférer vers l’autre cours et contrôler l’historique financier. Avec le coach, consulter les inscrits puis annuler le cours.
6. **Planning.** Configurer une semaine avec une pause, une exception fermée, une occupation privée, un intervalle entre séances et un délai de réservation. Vérifier les créneaux côté client. Les séances déjà confirmées doivent être conservées.
7. **Configuration.** Modifier portrait, présentation, offres, niveaux, tarifs, formats, adresse et supplément de déplacement. Vérifier le devis côté client et que les cours déjà programmés gardent leurs conditions. Essayer les consignes, notes client et export CSV.
8. **Dossier.** Soumettre les quatre références fictives, passer dans l’espace équipe en mode test, motiver une décision. Une approbation ne publie pas silencieusement le coach. Une modification d’identité invalide son dossier. Ne pas importer de justificatifs réels dans cette démonstration.
9. **Après-séance.** Une démonstration neuve contient une séance passée de Sarah pour Alex. Laisser un avis, y répondre avec Sarah, demander de l’aide et traiter un signalement depuis l’espace équipe. Sinon, terminer une séance depuis les outils de test.
10. **Confidentialité locale.** Passer d’Alex à Nina : réservations, favoris, messages et export personnel doivent correspondre au compte sélectionné. La suppression est bloquée tant que des séances confirmées subsistent.

## Revue visuelle et appareil

Comparer chaque parcours au HTML archivé, à 390 et 430 px. Vérifier notamment les photos, Hanken, pills, arrondis, espaces, textes longs, boutons fixes, retours et fenêtres de sélection. Sur iOS/Android : safe areas, clavier, retour système Android, défilement, import photo et partage ICS/CSV/JSON. Les contrôles DOM ne remplacent pas cette revue.

## Ce qui nécessite encore un service réel

Les cours et écritures avancées de démonstration sont locaux. OAuth Google/Apple, synchronisation Google/Outlook, stockage des justificatifs, contrôle des droits équipe et opérations avancées de réservation restent à raccorder ou compléter côté serveur. Paiement bancaire et communications externes restent différés.
