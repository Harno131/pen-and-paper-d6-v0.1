# 🔧 GitHub Repository erstellen

## ❌ Problem:
Das Repository `pen-and-paper-d6-v0.1` wurde noch nicht auf GitHub erstellt.

---

## ✅ Lösung:

### Schritt 1: Repository auf GitHub erstellen

1. Gehe zu https://github.com/new
2. **Repository-Name:** `pen-and-paper-d6-v0.1`
3. **WICHTIG:**
   - ✅ Lass es **PRIVAT** (wenn du willst)
   - ❌ **KEINE** README hinzufügen
   - ❌ **KEINE** .gitignore hinzufügen
   - ❌ **KEINE** License hinzufügen
   - **Lass es komplett LEER!**
4. Klicke "Create repository"

---

### Schritt 2: Code pushen

**Nach dem Erstellen zeigt GitHub dir Befehle an. Verwende diese:**

```powershell
git remote add origin https://github.com/Harno131/pen-and-paper-d6-v0.1.git
git branch -M main
git push -u origin main
```

**Oder falls der Remote schon existiert (aber falsch ist):**

```powershell
git remote set-url origin https://github.com/Harno131/pen-and-paper-d6-v0.1.git
git push -u origin main
```

---

## 📋 Alternativ: Altes Repository umbenennen

Falls du das alte Repository `PenAndPaperD6` umbenennen willst:

1. Gehe zu https://github.com/Harno131/PenAndPaperD6/settings
2. Scrolle runter zu "Repository name"
3. Ändere zu: `pen-and-paper-d6-v0.1`
4. Klicke "Rename"

Dann pushen:
```powershell
git remote set-url origin https://github.com/Harno131/pen-and-paper-d6-v0.1.git
git push -u origin main
```
