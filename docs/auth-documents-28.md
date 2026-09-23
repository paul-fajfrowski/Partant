# Connexion et dossier coach — livraison 28

23 septembre 2026. Même source React Native pour iPhone et WebApp. Aucune modification des dépendances natives, des droits serveur ou des exigences de vérification.

## Connexion

Une lecture « invité » encore en cours pouvait bloquer la première lecture du compte authentifié : le verrou global de rafraîchissement imposait alors d’attendre le polling. Le test de concurrence reproduit ce défaut avec l’ancien hook de la livraison 27, puis passe avec le correctif, pour les adaptateurs iOS et web.

- Les lectures sont désormais isolées par génération de session. Une réponse ancienne ne peut ni écraser le compte ni bloquer sa lecture.
- L’inscription invalide les lectures antérieures ; son accusé serveur fait autorité. La vérification e-mail effectue directement cette opération sans lecture préalable redondante.
- Le formulaire laisse place à un état de connexion explicite pendant le retour OAuth, la récupération du compte et sa création. Une erreur de chargement propose Réessayer ou Revenir à l’accueil.
- Le nettoyage du stockage ne retarde plus la navigation ; le marqueur de compte routé est fixé au moment de la navigation effective.
- L’intention de réservation est conservée ; un nouveau client rejoint l’onboarding, un nouveau coach son dossier. Les rôles restent ceux du serveur.

Les délais imposés par Google/Apple et le réseau subsistent : il ne s’agit pas d’une promesse de connexion instantanée. Aucune authentification réelle avec le compte du propriétaire n’a été réalisée dans cette recette.

## Documents & vérifications

- Titre direct « Votre dossier coach », prochaine action visible en haut.
- Pièces communes comptées une fois, puis qualifications par pratique. Un sport ne répète plus les pièces communes dans son nombre de pièces spécifiques manquantes.
- Distinction entre pièces ajoutées, pratique prête à envoyer, en vérification et validée. Les exigences de contexte et les dates expirées empêchent un envoi prématuré.
- Ajout et modification dans une fenêtre dédiée, accessible immédiatement ; erreurs conservées dans cette fenêtre et fermeture après accusé serveur.
- Réutilisation d’un document existant ; bibliothèque secondaire repliable. Vérification et envoi par pratique conservés.
- Dossier toujours requis : aucune auto-validation ni option pour le contourner.

## Recette exécutée

- TypeScript sans erreur ; export web et bundle Hermes iOS réussis.
- 22 contrôles de concurrence et reprise du hook partagé (adaptateurs iOS et web), dont réponse invité retardée et lecture antérieure à une inscription.
- 19 contrôles Apple natif, nonce, annulation et reprise de parcours (réponses des fournisseurs simulées).
- 11 scénarios de transition, 91 assertions DOM : client/coach, 390/1440 px, code e-mail et retour OAuth, création de comptes, échec serveur et reprise. Services simulés, aucune donnée réelle modifiée.
- Dossier : 14 contrôles de réutilisation/envoi, 6 contrôles d’accusé serveur et échec/reprise ; ce dernier scénario également exécuté en largeur desktop.
- Navigation : 29 contrôles ; réglages/enregistrement/déconnexion retardée : 15.
- Navigateur Chrome : 45 contrôles WebApp, puis 16 contrôles ciblés du dossier incomplet et de l’éditeur en 390/1440 px. Captures inspectées ; aucun débordement horizontal détecté.

Scripts : `test-auth-races-28.cjs`, `test-auth-transition-28.cjs`, `test-documents-browser-28.cjs`. Pour les tests DOM : `PARTANT_QA_JSDOM` pointe vers jsdom. Les variantes de transition utilisent `PARTANT_QA_WIDTH=390|1440`, `PARTANT_QA_ROLE=client|coach`, `PARTANT_QA_METHOD=email|oauth`, `PARTANT_QA_NEW=1` et `PARTANT_QA_FAILURE=1`. Fixtures exclusivement fictives, sans sortie réseau.

Le bundle iOS ne constitue pas une compilation Xcode signée ni une recette sur iPhone physique. Recompiler le projet existant, puis confirmer Apple/Google/e-mail et le clavier de l’éditeur sur l’appareil. Aucun `pod install` supplémentaire requis par ces changements JavaScript seuls.

Références consultées : [événements Auth](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [changelog Supabase](https://supabase.com/changelog). Aucun changement de configuration Auth, de secret, de RLS ni déploiement serveur nécessaire.
