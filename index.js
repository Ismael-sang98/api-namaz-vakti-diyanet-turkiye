const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));
app.set('json spaces', 2);

const PORT = process.env.PORT || 3000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const AXIOS_TIMEOUT_MS = 10000; // Augmenté à 10s pour contrer les Cold Starts
const MAX_CACHE_SIZE = 1000;
const cacheLocal = {};

// 🆕 ROUTE D'ACCUEIL (Healthcheck) : Fini le "Cannot GET /" !
app.get('/', (req, res) => {
    res.json({
        service: "Diyanet Namaz Vakitleri API",
        status: "Online",
        version: "2.1",
        documentation: "Voir le fichier README.md sur GitHub",
        endpoint_test: "/api/horaires/mensuel?ville=9541"
    });
});

app.get('/api/horaires/mensuel', async (req, res) => {
    const villeIdBrut = req.query.ville;

    if (!villeIdBrut) {
        return res.status(400).json({ success: false, erreur: "Paramètre 'ville' requis." });
    }

    if (!/^\d+$/.test(villeIdBrut)) {
        return res.status(400).json({ success: false, erreur: "Format d'ID invalide." });
    }
    
    const villeId = villeIdBrut;
    const maintenant = Date.now();

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    if (cacheLocal[villeId] && (maintenant - cacheLocal[villeId].timestamp < CACHE_TTL_MS)) {
        return res.json(cacheLocal[villeId].donnees);
    }

    const urlDiyanet = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${villeId}`;

    // 🛡️ NOUVEAU : Fonction de réessai automatique (Retry Pattern)
    const fetchAvecReessai = async (url, retries = 2) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await axios.get(url, {
                    timeout: AXIOS_TIMEOUT_MS,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                        'Accept': 'text/html'
                    }
                });
            } catch (error) {
                if (i === retries - 1) throw error; // Si c'est le dernier essai, on jette l'erreur
                console.warn(`⚠️ [RÉSEAU] Échec de la tentative ${i + 1}. Nouvel essai dans 1 seconde...`);
                await new Promise(res => setTimeout(res, 1000)); // Pause de 1s avant de réessayer
            }
        }
    };

    try {
        // Remplacement de l'appel direct par notre fonction robuste
        const response = await fetchAvecReessai(urlDiyanet);

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

        if (horairesMensuels.length === 0) {
            const err = new Error("DOM_PARSE_ERROR");
            err.isDomError = true;
            throw err;
        }

        const reponseFinale = {
            success: true,
            ville_id: villeId,
            source: "diyanet_officiel",
            derniere_mise_a_jour: new Date().toISOString(),
            total_jours: horairesMensuels.length,
            horaires: horairesMensuels
        };

        if (Object.keys(cacheLocal).length >= MAX_CACHE_SIZE) {
            const oldestKey = Object.keys(cacheLocal).sort((a, b) => cacheLocal[a].timestamp - cacheLocal[b].timestamp)[0];
            delete cacheLocal[oldestKey];
        }

        cacheLocal[villeId] = { timestamp: maintenant, donnees: reponseFinale };
        res.json(reponseFinale);

    } catch (error) {
        if (error.isDomError) {
            return res.status(503).json({ success: false, erreur: "Structure du site Diyanet modifiée. Mise à jour nécessaire." });
        }
        const statusCode = error.code === 'ECONNABORTED' ? 504 : 502;
        res.status(statusCode).json({ success: false, erreur: "Le service officiel est temporairement indisponible." });
    }
});

// 🛠️ ADAPTATION SERVERLESS POUR VERCEL
if (process.env.NODE_ENV !== 'production') {
    // Mode local (Mac)
    app.listen(PORT, () => {
        console.log(`✅ Backend local en écoute sur le port ${PORT}`);
    });
}
// Mode Production (Vercel)
module.exports = app;