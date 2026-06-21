<div align="center">

# 🕌 Diyanet Namaz Vakitleri API

**A production-ready REST API serving official Turkish prayer times — powered by Diyanet.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg?logo=vercel)](https://api-diyanet-horaires.vercel.app)

</div>

---

🇹🇷 [Türkçe](#-türkçe) · 🇫🇷 [Français](#-français) · 🇬🇧 [English](#-english)

---

## 🇹🇷 Türkçe

### Proje Hakkında

Türkiye Cumhuriyeti Diyanet İşleri Başkanlığı'nın resmi web sitesinden anlık olarak namaz vakitlerini çeken, hızlı, hafif ve üretime hazır bir REST API. Dakikası dakikasına doğru verilere ihtiyaç duyan **Çevrimdışı Öncelikli (Offline-First)** mobil uygulamalar için tasarlanmıştır.

### Özellikler

- **Resmi Veri Kaynağı** — Veriler, Diyanet'in resmi sitesinden doğrudan DOM tablosundan çekilir. Temkin vakitleri dahil %100 doğruluk garantisi.
- **Akıllı Önbellekleme** — Sunucu tarafında 24 saatlik RAM önbelleği + Vercel Edge Cache (CDN düzeyinde) sayesinde milisaniyelik yanıt süreleri.
- **Retry Mekanizması** — Vercel cold start durumlarına karşı otomatik yeniden deneme (exponential backoff).
- **Güvenlik** — HTTP güvenlik başlıkları (Helmet), hız sınırı (30 istek/dakika) ve regex tabanlı girdi doğrulama.
- **Mobil Uyumlu JSON** — Miladi tarih, Hicri tarih ve 6 günlük namaz vakti açık ve ayrıştırılmış şekilde döndürülür.
- **Şehir Referans Dosyası** — 81 il ve tüm ilçeleri kapsayan `villes_turquie.json` statik dosyası dahildir.

### Teknolojiler

| Paket | Amaç |
|---|---|
| `express` v5 | HTTP çerçevesi |
| `axios` | HTTP istemcisi |
| `cheerio` | DOM ayrıştırıcı (scraping) |
| `helmet` | HTTP güvenlik başlıkları |
| `express-rate-limit` | Hız sınırı |
| `cors` | CORS desteği |

### API Kullanımı

#### Endpoint

```
GET /api/horaires/mensuel?ville={ILCE_ID}
```

#### Parametre

| Parametre | Tür | Zorunlu | Açıklama |
|---|---|---|---|
| `ville` | `string` (sayısal) | ✅ Evet | Diyanet ilçe ID'si. `villes_turquie.json` dosyasından bulunabilir. |

#### Örnek İstek

```
GET https://api-diyanet-horaires.vercel.app/api/horaires/mensuel?ville=9541
```

> `9541` → Kadıköy, İstanbul

#### Başarılı Yanıt (`200 OK`)

```json
{
  "success": true,
  "ville_id": "9541",
  "source": "diyanet_officiel",
  "derniere_mise_a_jour": "2026-06-21T10:00:00.000Z",
  "total_jours": 30,
  "horaires": [
    {
      "date": "13 Haziran 2026 Cumartesi",
      "date_hijri": "27 Zilhicce 1447",
      "imsak": "03:24",
      "gunes": "05:24",
      "ogle": "13:09",
      "ikindi": "17:11",
      "aksam": "20:44",
      "yatsi": "22:36"
    }
  ]
}
```

#### Hata Yanıtları

| HTTP Kodu | Açıklama |
|---|---|
| `400` | `ville` parametresi eksik veya geçersiz format |
| `502` | Diyanet sitesine ulaşılamıyor |
| `503` | Diyanet site yapısı değişti (güncelleme gerekli) |
| `504` | İstek zaman aşımına uğradı |

### Yerel Kurulum

```bash
git clone https://github.com/Ismael-sang98/api-namaz-vakti-diyanet-turkiye.git
cd api-namaz-vakti-diyanet-turkiye
npm install
node index.js
# → http://localhost:3000
```

### İlçe ID'si Nasıl Bulunur?

`villes_turquie.json` dosyasını açın ve istediğiniz ili/ilçeyi arayın:

```json
{
  "il": "İstanbul",
  "ilceler": [
    { "ad": "Kadıköy", "id": "9541" },
    { "ad": "Beşiktaş", "id": "9554" }
  ]
}
```

### Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request açmadan önce lütfen bir issue oluşturun.

---

## 🇫🇷 Français

### À propos du projet

Une API REST rapide, légère et prête pour la production, qui récupère en temps réel les horaires de prière officiels de la Présidence des Affaires Religieuses de Turquie (Diyanet). Conçue pour alimenter des applications mobiles **Offline-First** nécessitant des données d'une précision absolue.

### Fonctionnalités

- **Source officielle** — Les données sont extraites directement du tableau DOM du site officiel Diyanet, garantissant les ajustements locaux (Temkin vakitleri) à 100%.
- **Mise en cache intelligente** — Cache RAM 24h côté serveur + Cache Edge Vercel (niveau CDN) pour des temps de réponse en millisecondes.
- **Mécanisme de retry** — Nouvelle tentative automatique contre les cold starts de Vercel (backoff exponentiel).
- **Sécurité** — En-têtes HTTP sécurisés (Helmet), limitation de débit (30 req/min) et validation des entrées par regex.
- **JSON mobile-ready** — Le JSON sépare clairement dates grégoriennes, dates hégiriennes et les 6 horaires quotidiens.
- **Référentiel des villes** — Fichier statique `villes_turquie.json` listant les 81 provinces et tous leurs districts.

### Technologies

| Package | Rôle |
|---|---|
| `express` v5 | Framework HTTP |
| `axios` | Client HTTP |
| `cheerio` | Parseur DOM (scraping) |
| `helmet` | En-têtes de sécurité HTTP |
| `express-rate-limit` | Limitation de débit |
| `cors` | Support CORS |

### Utilisation de l'API

#### Endpoint

```
GET /api/horaires/mensuel?ville={DISTRICT_ID}
```

#### Paramètre

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `ville` | `string` (numérique) | ✅ Oui | ID du district Diyanet. Disponible dans `villes_turquie.json`. |

#### Exemple de requête

```
GET https://api-diyanet-horaires.vercel.app/api/horaires/mensuel?ville=9541
```

> `9541` → Kadıköy, Istanbul

#### Réponse réussie (`200 OK`)

```json
{
  "success": true,
  "ville_id": "9541",
  "source": "diyanet_officiel",
  "derniere_mise_a_jour": "2026-06-21T10:00:00.000Z",
  "total_jours": 30,
  "horaires": [
    {
      "date": "13 Haziran 2026 Cumartesi",
      "date_hijri": "27 Zilhicce 1447",
      "imsak": "03:24",
      "gunes": "05:24",
      "ogle": "13:09",
      "ikindi": "17:11",
      "aksam": "20:44",
      "yatsi": "22:36"
    }
  ]
}
```

#### Réponses d'erreur

| Code HTTP | Description |
|---|---|
| `400` | Paramètre `ville` absent ou format invalide |
| `502` | Service Diyanet inaccessible |
| `503` | Structure du site Diyanet modifiée (mise à jour nécessaire) |
| `504` | Délai d'attente dépassé |

### Installation locale

```bash
git clone https://github.com/Ismael-sang98/api-namaz-vakti-diyanet-turkiye.git
cd api-namaz-vakti-diyanet-turkiye
npm install
node index.js
# → http://localhost:3000
```

### Trouver un ID de district

Ouvrez le fichier `villes_turquie.json` et recherchez votre province/district :

```json
{
  "il": "İstanbul",
  "ilceler": [
    { "ad": "Kadıköy", "id": "9541" },
    { "ad": "Beşiktaş", "id": "9554" }
  ]
}
```

### Contribuer

Les contributions sont les bienvenues ! Merci d'ouvrir une issue avant de soumettre une pull request.

---

## 🇬🇧 English

### About The Project

A fast, lightweight, and production-ready REST API that scrapes official prayer times in real time from the Turkish Directorate of Religious Affairs (Diyanet). Built to power **Offline-First** mobile applications requiring minute-perfect prayer schedules.

### Features

- **Official data source** — Data is extracted directly from the DOM table of the official Diyanet website, guaranteeing 100% accuracy including local topographical adjustments (Temkin vakitleri).
- **Smart caching** — 24-hour server-side RAM cache + Vercel Edge Cache (CDN level) for millisecond response times.
- **Retry mechanism** — Automatic retry with exponential backoff to handle Vercel cold starts.
- **Security** — HTTP security headers (Helmet), rate limiting (30 req/min per IP), and regex-based input validation.
- **Mobile-ready JSON** — The response cleanly separates Gregorian dates, Hijri dates, and the 6 daily prayer times.
- **City reference file** — Includes a static `villes_turquie.json` file mapping all 81 provinces and their districts to their official Diyanet IDs.

### Tech Stack

| Package | Purpose |
|---|---|
| `express` v5 | HTTP framework |
| `axios` | HTTP client |
| `cheerio` | DOM parser (scraping) |
| `helmet` | HTTP security headers |
| `express-rate-limit` | Rate limiting |
| `cors` | CORS support |

### API Usage

#### Endpoint

```
GET /api/horaires/mensuel?ville={DISTRICT_ID}
```

#### Parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ville` | `string` (numeric) | ✅ Yes | Diyanet district ID. Find it in `villes_turquie.json`. |

#### Example Request

```
GET https://api-diyanet-horaires.vercel.app/api/horaires/mensuel?ville=9541
```

> `9541` → Kadıköy, Istanbul

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "ville_id": "9541",
  "source": "diyanet_officiel",
  "derniere_mise_a_jour": "2026-06-21T10:00:00.000Z",
  "total_jours": 30,
  "horaires": [
    {
      "date": "13 Haziran 2026 Cumartesi",
      "date_hijri": "27 Zilhicce 1447",
      "imsak": "03:24",
      "gunes": "05:24",
      "ogle": "13:09",
      "ikindi": "17:11",
      "aksam": "20:44",
      "yatsi": "22:36"
    }
  ]
}
```

#### Error Responses

| HTTP Code | Description |
|---|---|
| `400` | Missing `ville` parameter or invalid format |
| `502` | Diyanet upstream service unreachable |
| `503` | Diyanet site structure changed (update needed) |
| `504` | Request timed out |

### Local Setup

```bash
git clone https://github.com/Ismael-sang98/api-namaz-vakti-diyanet-turkiye.git
cd api-namaz-vakti-diyanet-turkiye
npm install
node index.js
# → http://localhost:3000
```

### Finding a District ID

Open `villes_turquie.json` and search for your province/district:

```json
{
  "il": "İstanbul",
  "ilceler": [
    { "ad": "Kadıköy", "id": "9541" },
    { "ad": "Beşiktaş", "id": "9554" }
  ]
}
```

### Contributing

Contributions are welcome! Please open an issue before submitting a pull request.

---

## License

Distributed under the **ISC License**. See [`LICENSE`](LICENSE) for more information.
