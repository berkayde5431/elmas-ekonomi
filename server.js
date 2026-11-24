const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'database.json');

// Veritabanı yoksa oluştur
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

function getDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Kullanıcı verisini getir
app.get('/api/user/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  if (!db[id]) {
    db[id] = { elmas: 100, rozetler: [], sonCalisma: 0 };
    saveDB(db);
  }
  res.json(db[id]);
});

// Çalışma komutu (30 saniye bekleme süreli)
app.post('/api/calis', (req, res) => {
  const { id } = req.body;
  const db = getDB();
  if (!db[id]) db[id] = { elmas: 100, rozetler: [], sonCalisma: 0 };

  const simdi = Date.now();
  if (simdi - db[id].sonCalisma < 30000) {
    const kalan = Math.ceil((30000 - (simdi - db[id].sonCalisma)) / 1000);
    return res.status(400).json({ hata: `Dinlenmelisin! ${kalan} saniye bekle.` });
  }

  const kazanc = Math.floor(Math.random() * 51) + 25; // 25-75 Elmas
  db[id].elmas += kazanc;
  db[id].sonCalisma = simdi;
  saveDB(db);
  res.json({ kazanc, user: db[id] });
});

// Kasa açma (Fiyat: 150 Elmas)
app.post('/api/kasa', (req, res) => {
  const { id } = req.body;
  const db = getDB();
  if (!db[id] || db[id].elmas < 150) {
    return res.status(400).json({ hata: 'Yetersiz Elmas! (150 💎 gerekli)' });
  }

  db[id].elmas -= 150;
  const sans = Math.random() * 100;
  let odul = 50;
  let mesaj = 'Sıradan Kasa: 50 💎 çıktı!';

  if (sans > 85) {
    odul = 500;
    mesaj = '🔥 EFSANEVİ! Tam 500 💎 kazandın!';
  } else if (sans > 50) {
    odul = 200;
    mesaj = '✨ NADİR! 200 💎 kazandın!';
  }

  db[id].elmas += odul;
  saveDB(db);
  res.json({ mesaj, user: db[id] });
});

// Rozet satın alma
app.post('/api/rozet-al', (req, res) => {
  const { id, rozetAdi, fiyat } = req.body;
  const db = getDB();
  if (!db[id]) return res.status(400).json({ hata: 'Kullanıcı bulunamadı.' });
  if (db[id].rozetler.includes(rozetAdi)) return res.status(400).json({ hata: 'Bu rozete zaten sahipsin!' });
  if (db[id].elmas < fiyat) return res.status(400).json({ hata: 'Elmasın yetmiyor!' });

  db[id].elmas -= fiyat;
  db[id].rozetler.push(rozetAdi);
  saveDB(db);
  res.json({ mesaj: `${rozetAdi} rozeti satın alındı!`, user: db[id] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor.`));
