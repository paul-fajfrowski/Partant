# Navigation sans impasse — livraison 20

## Validation reçue du propriétaire

Le 20 septembre 2026, le propriétaire confirme que la connexion Apple native fonctionne sur son iPhone, que les espaces client et coach sont séparés et que les actions importantes restent réservées aux comptes connectés. Cette validation porte sur le parcours essayé, pas sur tous les cas de consentement, d’annulation ou d’expiration de session.

## Décisions et corrections

La barre du haut est persistante sur les écrans secondaires : flèche Retour à gauche, fermeture du parcours à droite (libellé accessible « Revenir à l’exploration » ou « Revenir à mon agenda »). Le cœur reste disponible sur le profil coach. Les commandes mesurent au moins 44 points et le titre peut se répartir sur plusieurs lignes. Les écrans principaux conservent les onglets ; aucun bouton supplémentaire au milieu des contenus.

| Situation | Retour | Fermer le parcours |
| --- | --- | --- |
| Connexion | Écran d’origine, sinon exploration | Exploration publique, intention de connexion abandonnée |
| Code e-mail | Modifier son adresse sans perdre la séance choisie | Exploration |
| Création de profil après authentification | Choix explicite : continuer l’inscription ou quitter | Même choix, puis déconnexion avant exploration |
| Onboarding | Étape précédente, puis écran d’origine | Exploration, préférences déjà saisies conservées |
| Candidature coach | Compte client, texte conservé pendant la session | Exploration, sans changement de rôle |
| Profil, choix de séance, récapitulatif | Écran précédent | Exploration (ou agenda du coach prévisualisant son profil) |
| Confirmation de réservation | Séances, jamais le paiement | Exploration |
| Détail ouvert depuis la confirmation | Séances | Espace principal |
| Notifications, messages, réglages, assistance, groupes et autres sous-parcours | Origine conservée ; destination de repli si l’historique est vide | Espace principal selon le rôle |
| Données introuvables / route sans contenu | Retour disponible | Message explicite et bouton vers l’espace principal |

L’historique repart à zéro lors du choix d’un onglet ou d’un retour à l’espace principal. Les écrans d’authentification périmés sont exclus du retour après connexion. Les routes client ne sont pas proposées comme destination de repli au coach connecté. Les doublons immédiats sont évités ; l’état de rubrique et la position dans les notifications sont conservés.

Le bouton système Retour Android suit les mêmes règles et ferme d’abord une fenêtre modale ; à la racine il conserve le comportement système. Une opération de réservation/enregistrement en cours termine avant de permettre une sortie du parcours. Les fenêtres existantes gardent leur bouton Fermer.

Les brouillons de configuration coach et de messages gardent leur mécanisme existant de sauvegarde. La fermeture n’enregistre pas automatiquement un réglage non appliqué. Elle ne confirme ni n’annule une réservation. Le code e-mail déjà reçu reste saisissable après un retour, sans redemander un e-mail ni contourner le délai de renvoi.

Un coach retiré des résultats n’est plus remplacé silencieusement par le premier coach disponible : sa fiche présente l’état indisponible avec une sortie.

## Vérification

- TypeScript : compilation sans erreur.
- Export Expo web, iOS et Android : réussi (bundles JavaScript/Hermes, pas compilation Xcode signée).
- `test-navigation-exits-20.cjs` : client 29 contrôles, coach 19, profil incomplet 16, confirmation de réservation simulée 9.
- Régression navigation existante : 28 contrôles ; reprise de réservation après connexion : 8.
- Volume coach : 23 contrôles. Pagination/retour aux notifications : 13.
- Scénarios connectés exécutés avec un serveur fictif local, sans requête vers les comptes réels. Le scénario « incomplete » fournit une session authentifiée sans profil produit pour éprouver sa sortie.

Les tests DOM ne valident pas les gestes ni le rendu visuel sur iPhone. Le retour matériel Android est implémenté, mais n’a pas été essayé sur appareil dans cette livraison. Vérifier sur iPhone la barre en haut, le clavier, Retour/Fermer et la confirmation d’abandon d’inscription. Aucune modification de CocoaPods, du SDK Apple, des clés, de Supabase hébergé ou des réglages de signature Xcode. Aucun nouveau branchement externe.

## Essai

Simulation : `http://127.0.0.1:8081/simulation.html?mode=connected&version=navigation-20`.
Sur le même Mac, ouvrir le workspace existant `apps/mobile/ios/Partant.xcworkspace`, puis reconstruire avec ⌘R pour embarquer les corrections. Aucune nouvelle installation de pods nécessaire pour cette livraison.
