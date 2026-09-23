# Agenda compact et simulation coach — livraison 30

## Parcours livré

- Plages sous forme de lignes horaire + chevron, sans carte. Les cibles tactiles restent d’au moins 48 px ; la navigation clavier conserve son indicateur de focus.
- Deux plages visibles par date. « + N autres plages » ouvre la liste complète dans la même fenêtre de détail. Aucune plage supprimée ou tronquée du modèle.
- Sur ordinateur, la zone de disponibilités conserve une hauteur commune de 180 px sur les sept colonnes : les rendez-vous restent alignés même si une journée est très remplie.
- Sur mobile, réservations, cours collectifs et rendez-vous directs sont triés ensemble par heure. Les indisponibilités/occupations connues restent visibles. La gestion des départs est repliée par défaut et accessible depuis une ligne dédiée.
- Dans le détail, les alias historiques d’un même lieu sont fusionnés uniquement pour l’affichage, en préservant les différences d’accès, de zone et de frais. Les lieux communs aux offres ne sont présentés qu’une fois. Une seule offre se déplie à la fois ; le prix et la durée restent toujours visibles.
- Toutes les opérations de réservation et leurs contrôles restent dans le moteur existant. Aucune modification du domaine serveur, des comptes réels ou des disponibilités enregistrées.

## Coach fictif pour la recette

`simulation.html?mode=coach`, ou `/?data=preview&recette=coach-realiste-30&surface=web`.

Thomas propose du renforcement individuel (60 min, 60 €), du duo (60 min, 80 € la séance), du running/mobilité (45 min, 45 €) et un circuit collectif (45 min, 18 € par personne, 6 places). Chaque plage précise ses offres et son lieu. Une semaine habituelle comporte six plages en semaine, deux le samedi et aucune le dimanche. Des réservations, des cours avec trois participants et des rendez-vous directs permettent de tester le quotidien d’un coach.

Le studio « Atelier Voltaire » est fictif. Stockage de démonstration isolé : `partant-native-recette-coach-realiste-30`. Le scénario ne s’amorce qu’en mode non connecté, ne crée aucun compte et n’écrit rien dans Supabase. Les modifications faites dans ce scénario restent locales.

## E-mail : limite explicite

Le propriétaire demande un code à la place du lien. Le 23 septembre, l’API Supabase confirme le plan Free et une création du projet le 16 septembre. Sa capture montre toujours le modèle standard avec un lien. La dernière lecture réussie des réglages SMTP (livraison 21) indiquait un expéditeur standard ; la nouvelle lecture CLI n’a pas abouti, aucune configuration distante n’a été changée.

La restriction officielle du 3 juin 2026 reste publiée : les nouveaux projets gratuits ne peuvent pas personnaliser leurs modèles avec l’expéditeur par défaut. L’envoi de code nécessite `{{ .Token }}` dans le modèle ; changer seulement `signInWithOtp` ou le texte de l’application ne suffit pas.

Un modèle français sans lien est préparé dans `supabase/templates/email-code.html`, **non déployé**. À l’activation d’un expéditeur SMTP autorisé, l’utiliser pour Magic Link et Confirm Signup, vérifier la réception et la validation du code pour un compte nouveau et existant, puis passer l’écran partagé en code principal. La saisie de code et `verifyOtp` existent déjà. Le parcours actuel reste compatible avec le lien réellement envoyé. Aucun achat, changement de forfait, expéditeur inventé ou suppression de confirmation.

Sources officielles :
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier

## Validation

Résultats consignés après exécution ci-dessous. Les contrôles navigateur et les bundles iOS ne constituent pas un build Xcode signé ni une recette sur iPhone physique.

- TypeScript : passe.
- Projection des disponibilités : 12 contrôles ; projection de l’agenda : 13 contrôles.
- Chromium : 39 contrôles de densité, dépliage, conservation des données et isolation de la démo à 390/768/1440 px ; 20 contrôles de consultation/modification d’une plage à 390/1440 px.
- Non-régression WebApp : 45 contrôles ; e-mail actuel : 10 contrôles DOM avec réponses simulées.
- Exports Expo web et iOS/Hermes : passent. Pas de nouvelle compilation signée Xcode ni d’envoi d’e-mail réel.
- Captures locales : `/private/tmp/partant-agenda-30`.
