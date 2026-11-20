# @csb/web

frontend-ul, vite + react + ts. ecranele sunt dupa figma (pagina Prototip).

```bash
npm run dev:web        # din root, porneste pe http://localhost:5173
```

`/api` merge prin proxy-ul din vite la backend (`http://localhost:3000`), deci local nu trebuie cors.
pe desktop aplicatia apare intr-o rama de telefon 393x852 ca in figma, pe telefon e pe tot ecranul.

## mod demo (fara backend)

pt prezentare si cine vrea sa vada aplicatia fara sa porneasca baza de date.

```bash
npm run dev:web        # apoi deschizi http://localhost:5173/?demo
VITE_DEMO=1 npm run build -w apps/web   # build doar cu demo
```

- pe login alegi rolul: student (Ana Popescu), profesor sau administrator
- `src/api/demo.ts` face aceleasi verificari ca backendul: de la 18:00 pt studenti, limita pe zi, locuri pe interval, mentenanta anuleaza rezervarile
- datele stau in localStorage si se refac in fiecare zi relativ la azi; din profil le poti reseta
- sesiunea de demo e separata de cea reala (`csb.session.demo`)

pe main, workflow-ul `pages` publica demo-ul la https://ip-echipa5.github.io/PlayUSV/
(o singura data: settings → pages → source = github actions, trebuie admin pe repo)
