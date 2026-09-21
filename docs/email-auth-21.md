# E-mail de connexion et journal Xcode — livraison 21

## Constat et décision

Le propriétaire reçoit un lien alors que l’écran demandait un code. `signInWithOtp` de Supabase envoie un lien par défaut ; le code ne serait fourni qu’en adaptant les modèles d’e-mail avec `{{ .Token }}`.

Vérifications distantes en lecture seule le 20 septembre : organisation Partant en offre **free**, projet créé le 16 septembre 2026, SMTP personnalisé désactivé, longueur OTP configurée à 8 chiffres, retour natif `partant://` autorisé. Depuis le 3 juin 2026, Supabase interdit la personnalisation des modèles des nouveaux projets gratuits utilisant son expéditeur standard. Aucun contournement, achat, changement d’offre ou branchement SMTP n’a été effectué. Ces intégrations ont été reportées par le propriétaire.

Sources officielles : [Connexion sans mot de passe](https://supabase.com/docs/guides/auth/auth-email-passwordless), [restriction des modèles gratuits](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

## Correction livrée

- Le parcours connecté annonce un **lien personnel** et affiche « Votre lien vous attend », l’adresse destinataire et les instructions de retour sur le même appareil.
- Aucun code obligatoire sur cet écran. « Mon e-mail contient un code » ouvre la saisie facultative ; on peut revenir aux instructions du lien. La démo conserve son code fictif.
- Renvoi du lien après le délai existant, modification d’adresse, reprise d’un envoi déjà effectué sans nouvel e-mail. Un échec d’envoi ne mène pas à une fausse confirmation.
- Les erreurs de quota parlent d’e-mail, et les erreurs d’expiration de code ou de lien.
- Le nom et le rôle choisis pour l’inscription sont conservés avant le départ vers la messagerie. Les comptes existants gardent le rôle du serveur. Les intentions de réservation restent indépendantes.
- L’envoi est limité à 30 secondes d’attente côté interface. Les quotas Supabase et la vérification d’identité sont inchangés.
- Aucun changement de modèles ou de sécurité Supabase à distance. Apple natif, Google, signature, Pods et réglages Xcode inchangés.

Pour activer ultérieurement les codes : configurer le fournisseur d’e-mails autorisé, adapter et vérifier les modèles concernés (connexion et confirmation d’inscription), y afficher `{{ .Token }}`, tester la réception réelle puis rendre le champ code principal. Ne pas simplement changer le texte de l’app en promettant un code.

## Recette du 21 septembre

- TypeScript : passe.
- Exports Expo web / iOS / Android : passent. Il s’agit de bundles JS/Hermes, pas d’un nouveau build signé Xcode.
- `test-email-link-21.cjs` : 10 contrôles du parcours e-mail ; variante `callback` : 4 contrôles du retour PKCE avec son vérificateur conservé sur l’appareil.
- `test-auth-feedback-web.cjs success` : 6 contrôles ; `limited` : 11 contrôles (double appui, quota, pas de fausse confirmation, connexions sociales disponibles).
- Reprise de réservation : 8 contrôles ; parcours connecté client : 9 ; coach : 8 ; sorties de navigation client : 29.
- Auth native / reprise : 19 contrôles avec réponses fournisseur simulées.

Les réponses réseau des scénarios sont fictives ; aucun e-mail réel ni compte de test n’a été créé. La réception puis l’ouverture d’un nouvel e-mail sur le téléphone restent à valider par le propriétaire. Les sorties de navigation de la livraison 20 sont désormais confirmées fonctionnelles par le propriétaire.

## Analyse du journal Xcode fourni

25 036 lignes analysées. Aucun diagnostic `error:` de compilateur, aucun `BUILD FAILED`, aucune commande terminée avec un code non nul détectés. Le fichier ne contient pas non plus de marqueur final `BUILD SUCCEEDED` : il ne permet pas, seul, de certifier le résultat du build.

Les messages « Removed stale file » correspondent au nettoyage des anciens produits de compilation. Les diagnostics concernent les bibliothèques natives (Expo, React Native, WebView, SVG, safe-area-context) : API dépréciées, nullabilité, ordre d’initialisation C++, objets sans symboles et scripts de build. Les variantes arm64 et x86_64 du simulateur répètent de nombreux messages. Aucun avertissement relevé dans les sources `ios/Partant` elles-mêmes.

Aucun masquage global d’avertissements, suppression de caches ou modification des dépendances n’est nécessaire pour corriger cet écart e-mail. Conserver le build fonctionnel ; traiter les avertissements de dépendances lors d’une mise à jour maîtrisée.
