# Livraison 19 — connexion iPhone et espaces personnels

20 septembre 2026. Changements autorisés par le propriétaire après le premier build réussi sur iPhone. Source de travail : `apps/mobile`. Le prototype HTML archivé n’est pas modifié.

## Livré

- Sur iPhone, « Continuer avec Apple » utilise `expo-apple-authentication` 57.0.2 et la fenêtre native Apple. Un nonce aléatoire est haché pour Apple et vérifié par Supabase lors de l’échange du jeton. Annulation récupérable, appels réseau bornés, doublons de callback dédupliqués et possibilité de réessayer après erreur. Le nom du premier consentement est proposé à l’inscription.
- Le bouton système Apple est localisé, accessible et arrondi. Google et Apple web conservent OAuth ; les messages internes à Partant ne présentent plus la configuration technique au moment de la connexion.
- Supabase : seul `auth.external.apple.client_id` a été modifié pour accepter `com.paulfajfrowski.partant.web,com.paulfajfrowski.partant`. Diff relu après application : aucun changement déclaré restant. Aucun secret Apple renouvelé ni autre fournisseur modifié. Le script de renouvellement conserve désormais l’identifiant natif.
- La navigation utilise le rôle du compte renvoyé par le serveur. Les boutons de bascule coach/client sont réservés à la démo. Le coach dispose de « Mon compte professionnel ». L’inscription permet toujours de choisir son premier rôle ; une reconnexion ne réattribue pas ce rôle.
- « Devenir coach » ouvre une candidature explicite dans le compte client. Le projet professionnel est envoyé par la commande serveur d’assistance existante, avec suivi privé et réponse de l’équipe. La demande ne publie pas de profil, n’attribue aucun badge et ne transforme pas automatiquement le compte client. L’activation professionnelle reste un processus accompagné ; le double rôle n’est pas implémenté.
- Sans compte : découverte, profils, tarifs et créneaux restent visibles ; Mon espace, Favoris et Séances présentent une invitation claire. Pas de faux profil invité ni de réglages personnels accessibles. Une action protégée déclenche la connexion.
- La destination, le coach, l’offre, le créneau et le brouillon de séance sont conservés pendant 30 minutes pour reprendre après authentification. Un créneau n’est pas bloqué par cette conservation : le serveur revalide la réservation. L’intention est supprimée après connexion, abandon explicite ou déconnexion ; aucun paiement automatique après connexion.
- Les mentions de données fictives sont limitées à la démo. Le mode connecté reste explicitement sans encaissement au moment de réserver. Aucun faux badge de vérification.

## Xcode et fichiers locaux

Le dossier `apps/mobile/ios` est versionné, hormis Pods, caches, fichiers personnels Xcode et `.xcode.env.local`. Bundle ID et équipe restent ceux de Partant. L’entitlement Sign in with Apple, les localisations du bouton et CocoaPods sont configurés ; `ExpoAppleAuthentication` apparaît dans Podfile.lock. Aucun `expo prebuild --clean` n’a été exécuté.

Les corrections du premier build sont conservées : User Script Sandboxing désactivé pour les scripts de compilation et cache temporaire ExpoModulesJSI sous `~/Library/Caches/Partant-ExpoModulesJSI`. Le script `postinstall` réapplique ce correctif ciblé, avec arrêt explicite si le script fournisseur change. Le plugin Expo conserve le réglage de sandbox lors d’un futur prebuild.

Sur la machine actuelle : rouvrir `apps/mobile/ios/Partant.xcworkspace` puis relancer avec Cmd+R. Le module natif ayant été ajouté, une simple actualisation JavaScript ne suffit pas. Garder le mode Release et `EXPO_PUBLIC_DATA_MODE=connected` dans `.env`.

Depuis un nouveau clone : installer les dépendances avec `npm ci` dans `apps/mobile`, renseigner `.env` à partir de `.env.example`, puis `pod install` dans `ios` et ouvrir le workspace. Les clés privées et les variables locales ne sont pas dans Git.

## Limites et prochaine recette

- Le propriétaire ne possède pas de domaine Partant et reporte son achat. Aucun domaine inventé ni achat effectué. Le nom affiché par l’app reste Partant. Le domaine technique Supabase peut donc encore apparaître chez Google ou dans OAuth web ; il n’est pas modifiable par le texte du bouton. La connexion Apple iOS native évite ce parcours web.
- La boucle observée avec la clé d’accès Apple web n’a pas été reproduite sur l’iPhone par l’agent. Elle est remplacée par le parcours natif ; la réussite du consentement natif doit être confirmée sur l’appareil.
- Paiements, versements, e-mails métier/SMTP, SMS/push et Outlook restent reportés. Les connexions Google et Apple web avaient été validées par le propriétaire ; la recette native est distincte.
- La tentative `xcodebuild` de cette livraison s’est arrêtée avant compilation : accès CoreSimulator indisponible dans l’environnement de l’agent et workspace rejeté. Les exports JavaScript iOS/Android ne prouvent pas une compilation native ni une signature iPhone.
- Advisor Supabase relu : sept informations RLS sur les tables privées volontairement sans accès client, et un avertissement « leaked password protection disabled ». Aucune politique d’accès n’a été relâchée par cette livraison.

Recette iPhone : connexion Apple (premier consentement, adresse masquée, reconnexion, annulation, réseau interrompu), Google et retour dans Partant, persistance après redémarrage, même rôle au retour, réservation commencée sans compte, compte coach professionnel et déconnexion. Contrôler que le compte Apple web existant retrouve la même identité ; ne pas annoncer de fusion automatique avant ce test.

## Validation automatisée

- TypeScript : succès.
- Exports Metro iOS, Android et web : succès.
- 19 contrôles Auth/nonce/callback/reprise avec fournisseurs simulés.
- 61 contrôles du domaine connecté (droits, commandes, lieux et confidentialité).
- 9 contrôles DOM du parcours client connecté, 8 du coach connecté, 8 de reprise d’une séance commencée sans compte. Backend de test entièrement simulé, aucun compte QA créé dans Supabase.
- 28 contrôles DOM de navigation existante, 13 de pagination des notifications et 23 de volume coach.
- Workspace, Info.plist et entitlements : syntaxe vérifiée avec plutil. `pod install` terminé avec succès.

Ces résultats ne remplacent pas la recette visuelle et le consentement Apple sur iPhone.

Sources : [Expo AppleAuthentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/), [Supabase Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple), [domaines personnalisés](https://supabase.com/docs/guides/platform/custom-domains).
