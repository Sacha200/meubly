# Diagramme de Classes Corrigé - Application Meubly

## 🔧 Architecture d'Authentification Réelle

### **Authentification Supabase (Principal)**
```
┌─────────────────────────────────────┐
│         Supabase Auth              │
├─────────────────────────────────────┤
│ + signInWithPassword()             │
│ + signUp()                         │
│ + signOut()                        │
│ + getSession()                     │
│ + onAuthStateChange()              │
└─────────────────────────────────────┘
```

### **AuthStore (Wrapper Pinia)**
```
┌─────────────────────────────────────┐
│            AuthStore               │
├─────────────────────────────────────┤
│ - user: User                       │
│ - session: Session                 │
├─────────────────────────────────────┤
│ + init(): void                     │
│ + isAuthenticated(): Boolean       │
│ + userEmail(): String              │
│ + userName(): String               │
└─────────────────────────────────────┘
```

### **User (Entité métier)**
```
┌─────────────────────────────────────┐
│              User                  │
├─────────────────────────────────────┤
│ - user_id: String                  │
│ - username: String                 │
│ - email: String                    │
│ - lastname: String                 │
│ - role: String                     │
│ - created_at: Date                 │
├─────────────────────────────────────┤
│ + register(userData): User         │
│ + login(credentials): Session      │
│ + logout(): void                   │
└─────────────────────────────────────┘
```

## 🔗 Relations Corrigées

```
Supabase Auth ||──|| AuthStore        (1:1)  "fournit l'état"
AuthStore ||──|| User                 (1:1)  "gère l'utilisateur"
User ||──o{ Furniture                 (1:N)  "favorise"
```

## 📋 **Explication de l'architecture :**

### **Pourquoi AuthStore + Supabase ?**

1. **Supabase Auth** = Service d'authentification externe
2. **AuthStore** = Gestion d'état réactive dans l'app Vue.js
3. **User** = Entité métier avec données supplémentaires

### **Flux d'authentification :**
```
1. Utilisateur se connecte → Supabase Auth
2. Supabase Auth → Met à jour AuthStore
3. AuthStore → Notifie tous les composants
4. Composants → Accèdent à l'état via AuthStore
```

### **Avantages de cette approche :**
- ✅ **Séparation des responsabilités**
- ✅ **Réactivité Vue.js**
- ✅ **Centralisation de l'état**
- ✅ **Facilité de test**

### **Inconvénients :**
- ❌ **Redondance** (Supabase + Pinia)
- ❌ **Complexité** (2 systèmes d'état)
- ❌ **Confusion** (Auth0 configuré mais non utilisé)

## 🎯 **Recommandation :**

**Garder AuthStore** car il sert de **bridge** entre Supabase et Vue.js, mais **supprimer Auth0** qui n'est pas utilisé. 