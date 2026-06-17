const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.set('json spaces', 2);

const PORT = process.env.PORT || 3000;

// CONSTANTES D'INGÉNIERIE
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Durée de vie du cache : 24 heures
const AXIOS_TIMEOUT_MS = 8000; // Délai d'attente max : 8 secondes
const MAX_CACHE_SIZE = 1000; // Nombre max de villes en RAM

// Base de données en mémoire
const cacheLocal = {};

app.get('/api/horaires/mensuel', async (req, res) => {
    const villeIdBrut = req.query.ville || '9541';

    // 1. SÉCURITÉ : Validation stricte des entrées
    // Exige que la valeur ne soit composée strictement que de chiffres
    if (!/^\d+$/.test(villeIdBrut)) {
        return res.status(400).json({
            success: false,
            erreur: "Format d'ID invalide. Chiffres uniquement."
        });
    }
    
    const villeId = villeIdBrut;
    const maintenant = Date.now();

    // 2. GESTION DU CACHE
    if (cacheLocal[villeId] && (maintenant - cacheLocal[villeId].timestamp < CACHE_TTL_MS)) {
        console.log(`⚡ [CACHE] Hit pour la ville ${villeId}`);
        return res.json(cacheLocal[villeId].donnees);
    }

    console.log(`🌐 [RÉSEAU] Scraping Diyanet pour la ville ${villeId}...`);
    const urlDiyanet = `https://namazvakitleri.diyanet.gov.tr/tr-TR/${villeId}`;

    try {
        // 3. RÉSILIENCE : Ajout du Timeout
        const response = await axios.get(urlDiyanet, {
            timeout: AXIOS_TIMEOUT_MS,
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

        // 4. FAIL-FAST : Sécurité contre les changements d'interface du Diyanet
        if (horairesMensuels.length === 0) {
            throw new Error("Structure DOM invalide. Le site cible a peut-être changé.");
        }

        const reponseFinale = {
            success: true,
            ville_id: villeId,
            source: "diyanet_officiel",
            derniere_mise_a_jour: new Date().toISOString(), // Ajout utile pour l'app mobile
            total_jours: horairesMensuels.length,
            horaires: horairesMensuels
        };

        // 5. PRÉVENTION DES FUITES MÉMOIRE
        if (Object.keys(cacheLocal).length >= MAX_CACHE_SIZE) {
            console.warn("🧹 [MÉMOIRE] Nettoyage d'urgence du cache (Flush).");
            for (let key in cacheLocal) delete cacheLocal[key]; 
        }

        cacheLocal[villeId] = { timestamp: maintenant, donnees: reponseFinale };
        res.json(reponseFinale);

    } catch (error) {
        console.error(`❌ [ERREUR] Ville ${villeId} :`, error.message);
        
        // Code HTTP dynamique : 504 si Diyanet met trop de temps, 502 sinon
        const statusCode = error.code === 'ECONNABORTED' ? 504 : 502;
        res.status(statusCode).json({ 
            success: false, 
            erreur: "Le service officiel est temporairement indisponible." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend de Production (v2.0) en écoute sur le port ${PORT}`);
});