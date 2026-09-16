# Décision : React Native dès le départ

Décision utilisateur du 16 septembre 2026.

L’application Partant sera développée en **React Native, TypeScript et Expo**, pour iOS et Android. Il n’est pas prévu de construire une application Swift pour la migrer ensuite. L’aperçu web Expo sert à tester sans publication.

Le prototype HTML validé reste une référence de parcours et de direction artistique : Hanken Grotesk, #141414, blanc, gris, boutons pillules, surfaces arrondies, photographie et sobriété. Le HTML n’est pas une application React Native ; ses écrans devront être reconstruits en composants natifs. Les règles métier partagées restent côté serveur.

Supabase héberge les comptes, données, fichiers et fonctions serveur. Les secrets des prestataires restent côté serveur. Les services sont développés en TypeScript pour être utilisables par React Native.

Périmètre autorisé maintenant : étapes 1–3 (fondations, connexion/découverte, agendas Google et Outlook). Paiement Stripe et communications externes (étapes 4–5) sont explicitement reportés.

Le prototype A1–A9 est implémenté et la revue visuelle mobile a été validée par l’utilisateur. Le MVP connecté B1–B8 n’est pas terminé. Ne pas confondre interface simulée et intégration vérifiée.

## Fidélité confirmée par l’utilisateur

Le prototype est la référence clé : tout ce qui est repris en React Native doit lui être identique en design et en parcours. Le suivi détaillé se trouve dans [la matrice de parité](../parite-prototype-react-native.md). Les composants natifs reprennent les actifs du prototype ; les écrans provisoires doivent être signalés, puis complétés, sans redéfinir le produit.
