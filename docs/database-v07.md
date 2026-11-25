# V0.7 Database — laboratorio PostgreSQL
Schema SQL dedicato, due tabelle, ruoli NOLOGIN e RLS con verifica del proprietario. Nessun servizio esterno, dato reale, password o API key. La dashboard è un inventario statico, non un editor o un client SQL.
La CI usa un cluster PostgreSQL 16 effimero su socket Unix privato, senza TCP; autenticazione peer locale e ruoli sintetici simulati con SET ROLE. Non è autenticazione utente reale. Lo script elimina il cluster al termine. Non usare i file SQL direttamente su database esistenti.
Su Linux dedicato con PostgreSQL 16 già installato, utente non root: bash tests/database_lab.sh. Non sono richiesti nuovi servizi cloud.
Futuro: decidere se integrare PostgreSQL diretto o Supabase Self-Hosted; progettare identity mapping, API autorizzate, segreti e backup prima di un collegamento reale. Nessuna migrazione.
