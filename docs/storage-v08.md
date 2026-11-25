# V0.8 Storage — laboratorio isolato
La console mostra cartelle logiche e capacità previste. Non ha accesso a file o storage reali; non accetta upload dal browser.
Il modulo Python usa una directory temporanea privata, ID casuali indipendenti dai nomi originali, due identità sintetiche passate esplicitamente dal test, controllo del proprietario su tutte le operazioni, 1 MiB massimo per file e 20 oggetti per sessione. SHA-256 rileva alterazioni accidentali, non sostituisce autenticazione crittografica. I dati sono eliminati alla chiusura normale; non c'è persistenza né cifratura a riposo. Non usare per documenti personali.
Test: python3 tests/storage_lab_test.py. Nessun servizio remoto o dipendenza nuova.
Prima dell'integrazione produttiva: autenticazione reale, autorizzazioni lato server, cifratura, quote, rate limiting, scansione file, audit, backup e ripristino. Nessuna migrazione o connessione ai progetti esistenti.
