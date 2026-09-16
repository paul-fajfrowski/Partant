# Parité du prototype et de React Native

État au 16 septembre 2026. **Le prototype HTML A1–A9 reste la référence stricte des écrans, textes, proportions, composants et parcours.** Une simplification provisoire du portage ne constitue pas une décision de modifier le produit.

## Référence conservée

- HTML validé : `outputs/partant.html` ; source : `work/partant.template.html`.
- SHA-256 du HTML inchangé : `4b32d715f836e39db9d7b9646c2c9a287f1ccafa2fefeae5d007c6e2f2705375`.
- Les trois graisses Hanken, la planche photo, les pictogrammes SVG, les profils fictifs, les objectifs sportifs et les secteurs franciliens sont repris depuis les fichiers du prototype.
- `scripts/extract-native-reference.cjs` extrait les données et pictogrammes sans écrire dans le HTML. Les horaires extraits sont un jeu de démonstration hebdomadaire, pas le moteur complet du planning HTML.
- L’interface est construite avec des composants React Native. Le prototype n’est pas affiché dans une WebView pour simuler un portage.

## État du portage

« Repris » signifie navigable dans cette première version native ; cela ne signifie pas parité visuelle entièrement validée.

| Parcours | État natif | Travail restant pour la parité complète |
| --- | --- | --- |
| Accueil particulier / coach | Repris | Comparaison visuelle sur appareils |
| Connexion e-mail et code | Démo fonctionnelle, code Supabase présent | Fournisseurs OAuth, modèle d’e-mail OTP, SMTP et tests réels |
| Onboarding, objectifs par sport, secteurs IDF | Repris | Contrôler l’ensemble des états et la fidélité visuelle |
| Découverte, filtres, comparaison | Repris | Carte identique au prototype ; recherche géographique connectée complète |
| Profils et disponibilités | Repris en partie | Galerie, avis détaillés, toutes les règles et formats du prototype |
| Favoris | Repris, isolés entre comptes de démo | Prochains créneaux multi-dates comme dans le HTML ; persistance serveur |
| Réservation et confirmation | Parcours complet de démonstration | Tous les états A5, reprise persistante du paiement interrompu et expiration |
| Paiement simulé | Choix Apple Pay/carte, réussite, refus, interruption | Aucun paiement réel ; intégration reportée à l’étape 4 |
| Séances, modification, annulation | Repris en partie | Harmoniser règles et délais, transfert de groupe et annulation partielle |
| Notifications | Création/réservation/modification/annulation locales ; lecture serveur | Préférences et totalité des événements A1–A9 ; push/SMS reportés |
| Conversations | Démo locale par séance | Envoi serveur, pièces jointes et intégration externe |
| Profil coach et offres | Modification du nom/description, création et activation d’offres | Tous les champs, tarifs, lieux et validations du HTML |
| Cours collectifs | Offre, capacité, cours daté et réservation de places | Annulation collective, liste détaillée des inscrits, transfert, alertes |
| Planning coach | Agenda et fermeture/réouverture locale | Semaine type, pauses, absences, règles, délais et récurrences |
| Activité coach | Aperçu calculé sur réservations de démo | Comptabilité, états de paiement, versements, documents |
| Lieux, règles, justificatifs, préférences coach | Menus conservés ; écrans partiels ou à porter | Reprendre les formulaires complets sans inventer une nouvelle interface |
| Agendas externes | État « Non connecté » fidèle à la réalité | OAuth Google/Outlook, jetons serveur, tâches de synchronisation et tests |
| Après-séance, avis, support/modération | À porter | Reprendre les parcours existants du prototype |

## Deux modes explicites

- `/` : démonstration locale, profils du prototype, code `123456`, stockage `partant-native-preview-v1`. Pas de paiement réel ni réservation envoyée au serveur.
- `/?data=connected` : même base d’interface, données Supabase de développement. Aucun profil fictif, avis inventé ou badge de vérification artificiel n’est ajouté aux données réelles. La carte schématique n’est pas utilisée pour positionner des coachs connectés.
- `/?tools=connections` : ancien atelier technique, conservé dans `src/ConnectedPilot.tsx` pour les essais de branchements. Il n’est plus l’accueil par défaut.

Le code connecté appelle les RPC existantes pour réserver, modifier, annuler et ouvrir un cours. L’écriture est contrôlée par Supabase ; les tests de cette livraison portent sur la démonstration native et les exports, pas sur de nouveaux essais OAuth/paiement en production.

Les cours locaux sont explicitement datés : créer l’offre ne suffit pas à ouvrir des heures. Le cours conserve un instantané de son tarif, de sa capacité, de sa durée et de son adresse. Sa durée bloque l’agenda avant la première inscription. Les capacités et les chevauchements sont recontrôlés à la réservation.

## Vérification

- TypeScript : aucune erreur.
- 18 assertions métier : capacités, chevauchements, propriété des réservations, annulation, notifications, isolation des préférences, fuseau Paris et objectifs sportifs.
- 27 assertions DOM sur le bundle React Native Web exporté : accueil, découverte, favoris, profil, onboarding, réservation après connexion, refus puis réussite simulés, notification coach, création d’offre collective, ouverture de cours et visibilité client.
- Exports JavaScript/Hermes web, iOS et Android générés. Cela ne vaut pas installation ni validation sur téléphone.
- La comparaison visuelle automatisée n’a pas pu être effectuée dans cet environnement : Chrome headless ne démarre pas. Les tests jsdom ne valident ni les pixels, ni les photos à l’écran, ni le clavier mobile.

## Suite, dans cet ordre

1. Comparer chaque écran natif au HTML aux largeurs 390 et 430 px, puis sur iOS/Android ; corriger toute divergence sans redessiner le produit.
2. Compléter les configurations coach et le moteur de planning partagé, puis les parcours collectifs avancés.
3. Reprendre les états A5 et les parcours après-séance, avis, assistance et modération.
4. Poursuivre les étapes de branchement 1–3 autorisées. Google Cloud et Microsoft Entra restent à créer/configurer ; seul le compte Apple Developer existe côté utilisateur.
5. Paiements réels et communications externes restent reportés conformément à la décision utilisateur.

Le MVP connecté et la parité native ne sont donc **pas terminés**. La validation visuelle du HTML ne valide pas automatiquement sa reconstruction native.
