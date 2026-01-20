# Installation sur macOS

## Problème "L'application est endommagée"

Lors de l'installation de Glosaurus sur macOS, vous pouvez rencontrer le message :
> "Glosaurus.app est endommagé et ne peut pas être ouvert. Vous devez le placer dans la corbeille."

Ce message apparaît car l'application **n'est pas signée avec un certificat Apple Developer ID** ni notarisée. C'est une protection normale de macOS (Gatekeeper).

## Solutions

### Option 1 : Supprimer l'attribut de quarantaine (Recommandé pour test)

Ouvrez le Terminal et exécutez :

```bash
# Si l'app est dans /Applications
sudo xattr -cr /Applications/Glosaurus.app

# Ou si l'app est dans Téléchargements
sudo xattr -cr ~/Downloads/Glosaurus.app
```

Puis lancez l'application normalement.

### Option 2 : Autoriser dans Préférences Système

1. Essayez d'ouvrir l'app (le message d'erreur apparaît)
2. Allez dans **Préférences Système** → **Confidentialité et sécurité**
3. En bas, vous verrez un message concernant Glosaurus
4. Cliquez sur **Ouvrir quand même**
5. Confirmez

### Option 3 : Désactiver temporairement Gatekeeper (Non recommandé)

```bash
# Désactiver Gatekeeper
sudo spctl --master-disable

# Après installation, réactiver
sudo spctl --master-enable
```

## Pour les développeurs : Signature et notarisation

Pour distribuer publiquement l'app sans ces avertissements :

1. **Obtenir un certificat Developer ID** (Apple Developer Program, 99$/an)
2. **Signer l'application** avec le certificat
3. **Notariser l'app** via Apple
4. **Agrafer le ticket** de notarisation

Variables d'environnement pour GitHub Actions :
```yaml
APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
APPLE_ID: ${{ secrets.APPLE_ID }}
APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

Documentation Tauri : <https://tauri.app/v1/guides/distribution/sign-macos>

## Vérification du backend
```

Documentation Tauri : <https://tauri.app/v1/guides/distribution/sign-macos>

## Vérification du backend

Après installation, vérifiez que le backend fonctionne :

1. Ouvrez l'application
2. Dans votre navigateur, accédez à : <http://localhost:8000/docs>
3. Vous devriez voir l'interface FastAPI Swagger

Si le backend ne démarre pas, consultez les logs dans la console de l'app (Cmd+Option+I en mode développement).
