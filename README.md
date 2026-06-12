
# 🕌 Diyanet Namaz Vakitleri API (Prayer Times API)

🇹🇷 Türkçe | 🇫🇷 Français | 🇬🇧 English

🇹🇷 Proje Hakkında

Türkiye Cumhuriyeti Diyanet İşleri Başkanlığı'nın resmi namaz vakitlerini anlık olarak çeken, hızlı, hafif ve üretime hazır (production-ready) bir REST API. Bu proje, özellikle dakikası dakikasına doğru verilere ihtiyaç duyan ve tek bir istekle bir yıldan fazla veriyi sunabilen Çevrimdışı Öncelikli (Offline-First) mobil uygulamalara güç vermek üzere tasarlanmıştır.

Temel Özellikler

Resmi Veri Kaynağı (DOM Scraping): Veriler doğrudan resmi Diyanet web sitesinin DOM tablolarından anlık olarak çekilir. Bu sayede coğrafi Temkin vakitleri hesaplamalarının %100 doğruluğu garanti edilir.

Akıllı RAM Önbellekleme (In-Memory Cache): Diyanet'in güvenlik duvarı (WAF) tarafından engellenmeyi (HTTP 429 Too Many Requests) önlemek ve milisaniyelik yanıt süreleri sağlamak için API, her ilçe için 24 saatlik bir Node.js RAM önbelleği (cache) mimarisi kullanır.

Mobil Uyumlu Yapı: Döndürülen JSON verisinde Miladi tarihler, Hicri tarihler ve 6 günlük namaz vakti temiz bir şekilde ayrıştırılmıştır.

Tam Şehir Referans Dosyası: Proje, 81 ilin ve tüm ilçelerin Diyanet sistemindeki resmi ID'lerini listeleyen bir villes_turquie.json (statik JSON) dosyası içerir.

Kullanım (Endpoint)

GET /api/horaires/mensuel?ville={ILCE_ID}


Örnek İstek (Kadıköy, İstanbul):
http://localhost:3000/api/horaires/mensuel?ville=9541

Örnek JSON Yanıtı:

{
  "success": true,
  "ville_id": "9541",
  "source": "diyanet_officiel",
  "total_jours": 396,
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


Yerel Kurulum (Local Setup)

git clone [https://github.com/KULLANICI_ADINIZ/api-diyanet-turquie.git](https://github.com/KULLANICI_ADINIZ/api-diyanet-turquie.git)
cd api-diyanet-turquie
npm install
node index.js


🇫🇷 À propos du projet

Une API REST rapide, légère et robuste pour récupérer les horaires de prière officiels de la Présidence des Affaires Religieuses de Turquie (Diyanet). Ce projet a été architecturé pour alimenter des applications mobiles Offline-First nécessitant des données d'une précision absolue, couvrant plus d'une année d'horaires en une seule requête HTTP.

Fonctionnalités Principales

Extraction DOM Officielle : Les données proviennent directement du site officiel du Diyanet, garantissant les micro-ajustements locaux (Temkin vakitleri).

Mise en Cache Intelligente (In-Memory Cache) : Pour éviter d'être bloqué par le pare-feu du Diyanet (Erreur HTTP 429) et garantir des temps de réponse ultra-rapides, l'API intègre un cache RAM de 24 heures par ville côté serveur.

Formatage Prêt pour le Mobile : Le JSON sépare proprement les dates grégoriennes, hégiriennes et les 6 horaires.

Référentiel des Villes Inclus : Contient le fichier statique villes_turquie.json listant les identifiants officiels de tous les districts de Turquie.

Utilisation & Installation

Voir les sections de requêtes et d'installation dans la partie Turque ci-dessus.

🇬🇧 About The Project

A fast, lightweight, and production-ready REST API to fetch official prayer times from the Turkish Directorate of Religious Affairs (Diyanet). Engineered to power Offline-First mobile applications, it delivers over a year's worth of minute-perfect schedules in a single request.

Key Features

Official DOM Scraping: Data is extracted directly from the official Diyanet website, ensuring exact local topographical adjustments (Temkin vakitleri).

Smart In-Memory Caching: To prevent being blocked by Diyanet's WAF (HTTP 429 Error) and to ensure millisecond response times, the Node.js API features a 24-hour RAM cache architecture per city.

Mobile-Ready Formatting: The JSON cleanly separates Gregorian dates, Hijri dates, and the 6 daily prayer times.

Included City Repository: Includes a static villes_turquie.json file mapping all 81 provinces and their districts to their official Diyanet IDs.

Usage & Setup

Please refer to the Turkish section above for API endpoints, JSON response examples, and installation commands.
