# ⚙️ Git Konfiguration

## Git braucht deine Identität

Bevor du committen kannst, musst du Git sagen, wer du bist:

```powershell
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"
```

**Beispiel:**
```powershell
git config --global user.name "Florian"
git config --global user.email "florian@example.com"
```

**Dann nochmal committen:**
```powershell
git commit -m "Initial commit - Rollenspiel-App mit neuem Startbildschirm"
```

---

## Oder nur für dieses Repository:

Falls du es nur für dieses Projekt setzen willst (ohne `--global`):

```powershell
git config user.name "Dein Name"
git config user.email "deine@email.com"
```
