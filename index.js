const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🧠 Notre base de données temporaire en mémoire RAM (Le Cache)
const cacheLocal = {};

app.get('/api/horaires/mensuel', async (req, res) => {
    const villeId = req.query.ville || '9541'; 
    const maintenant = Date.now();

    // 1. VÉRIFICATION DU CACHE
    // Si on a déjà les données pour cette ville et qu'elles ont moins de 24 heures (86 400 000 ms)
    if (cacheLocal[villeId] && (maintenant - cacheLocal[villeId].timestamp < 86400000)) {
        console.log(`⚡ Rapide ! Données servies depuis le CACHE pour la ville ${villeId}`);
        return res.json(cacheLocal[villeId].donnees);
    }

    // 2. SI PAS DE CACHE, ON SCRAPE LE DIYANET
    console.log(`🌐 Lent... Scraping en direct du Diyanet pour la ville ${villeId}`);
    const urlDiyanet = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${villeId}`;

    try {
        const response = await axios.get(urlDiyanet, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        });

        const $ = cheerio.load(response.data);
        const horairesMensuels = [];

        $('table tbody tr').each((index, element) => {
            const tds = $(element).find('td');
            if (tds.length === 8) {
                horairesMensuels.push({
                    date: $(tds[0]).text().trim(),
                    date_hijri: $(tds[1]).text().trim(),
                    imsak: $(tds[2]).text().trim(),
                    gunes: $(tds[3]).text().trim(),
                    ogle: $(tds[4]).text().trim(),
                    ikindi: $(tds[5]).text().trim(),
                    aksam: $(tds[6]).text().trim(),
                    yatsi: $(tds[7]).text().trim()
                });
            }
        });

        const reponseFinale = {
            success: true,
            ville_id: villeId,
            source: "diyanet_officiel",
            total_jours: horairesMensuels.length,
            horaires: horairesMensuels
        };

        // 3. ON SAUVEGARDE DANS LE CACHE POUR LES PROCHAINS UTILISATEURS
        cacheLocal[villeId] = {
            timestamp: maintenant,
            donnees: reponseFinale
        };

        res.json(reponseFinale);

    } catch (error) {
        console.error("Erreur de scraping :", error.message);
        res.status(500).json({ success: false, erreur: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend avec CACHE activé sur le port ${PORT}`);
});