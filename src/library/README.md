# Shared Libraries
Folder ini berisi utilitas dan layanan yang digunakan di seluruh aplikasi.

- `global-queue.ts`: Antrian perintah global (FIFO).
- `session-manager.ts`: Pengatur sesi interaktif (State Machine).
- `garbage-collector.ts`: Pembersihan otomatis file temporary dan log.
- `user-service.ts`: Manajemen statistik dan peringatan user.
- `database.ts`: Driver database JSON sederhana.
- `functions.ts`: Kumpulan helper (isOwner, isAdmin, markAsRead, getRandomDelay, sleep).
- `logger.ts` & `file-logger.ts`: Sistem logging konsol dan file dengan rotasi.
- `presence-manager.ts`: Pengatur status online bot secara cerdas.
- `globals.ts` & `decorators.ts`: Sistem injeksi global dan decorator plugin.
- `sticker-utils.ts`: Utilitas pemrosesan stiker.
- `converter.ts`: Utilitas konversi tipe data.
