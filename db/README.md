# Database seed

Les scripts `.sql` de ce dossier sont exécutés automatiquement par MariaDB
au premier démarrage du conteneur (montés sur `/docker-entrypoint-initdb.d`).
Ils ne sont rejoués que si le volume `healthai_db_data` est vide.

Pour reseeder :

```bash
docker compose down -v   # supprime le volume
docker compose up -d db
```
