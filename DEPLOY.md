# Deploy su Render

## Prerequisiti
- Account su [render.com](https://render.com)
- Repository GitHub con il codice del progetto

## Passaggi

### 1. Push su GitHub
```bash
git add .
git commit -m "Deploy su Render"
git push origin main
```

### 2. Deploy Backend su Render

1. Vai su [dashboard.render.com](https://dashboard.render.com)
2. Clicca "New +" → "Web Service"
3. Connetti il repository GitHub
4. Configura:
   - **Name**: `cogestione-vian-api`
   - **Region**: Frankfurt (o la più vicina)
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: Free
5. Clicca "Create Web Service"
6. Copia l'URL del backend (es: `https://cogestione-vian-api.onrender.com`)

### 3. Deploy Frontend su Render

1. Clicca "New +" → "Static Site"
2. Connetti lo stesso repository
3. Configura:
   - **Name**: `cogestione-vian-web`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Environment Variables**:
     - `VITE_API_URL`: URL del backend dal passo precedente
4. Clicca "Create Static Site"

### 4. Aggiorna l'URL API nel frontend

Dopo il primo deploy del backend, aggiorna la variabile `VITE_API_URL` nel frontend con l'URL corretto.

## Note Importanti

- **Free tier**: I servizi free su Render vanno in sleep dopo 15 minuti di inattività. Il primo caricamento può richiedere ~30 secondi.
- **Database**: Il database JSON è locale. Per produzione, considera un database vero (PostgreSQL, MongoDB).
- **HTTPS**: Render fornisce HTTPS automaticamente.

## Alternativa: Deploy con render.yaml

Se hai il CLI di Render installato, puoi usare il file `render.yaml`:

```bash
render deploy
```

Questo deployerà automaticamente entrambi i servizi secondo la configurazione nel file.
