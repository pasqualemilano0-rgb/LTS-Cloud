# LTS CLOUD V0.6 — Hosting (fase laboratorio)

L'inventario è dichiarativo, non interroga server o provider. La console esistente resta invariata; il laboratorio è un processo HTTP sintetico esclusivamente locale. Nessun accesso a LTS Registro Viaggi, LTS privato, Officina Iodice o ai loro dati.

## Prova locale gratuita

Richiede Python 3 sul PC. Da una copia del repository:
```sh
python3 hosting/lab_server.py
```
Aprire http://127.0.0.1:8765/ e http://127.0.0.1:8765/health sullo stesso PC.
Interrompere con Ctrl+C. Non pubblicare il servizio tramite tunnel, proxy o forwarding.
Il server non richiede credenziali, non salva dati e non è adatto alla produzione.

## Fasi successive (non ancora attive)

- Server Linux dedicato, Docker isolato e controllo risorse.
- Valutare Coolify e costi reali prima dell'installazione.
- Inventario autenticato in sola lettura, senza socket Docker pubblico.
- Deploy/rollback di una sola app sintetica, HTTPS e backup prima di ogni progetto reale.
- Nessuna migrazione, nessuna modifica DNS, nessun servizio a pagamento senza autorizzazione separata.

La CI esegue il server HTTP locale su una porta effimera e verifica l'inventario in Chromium desktop/mobile. Non avvia infrastrutture esterne.
