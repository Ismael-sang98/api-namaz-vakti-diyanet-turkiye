const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.set('json spaces', 2);

const PORT = process.env.PORT || 3000;

// ⚙️ CONSTANTES D'INGÉNIERIE
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Durée de vie du cache local : 24 heures
const AXIOS_TIMEOUT_MS = 8000; // Délai d'attente max : 8 secondes
const MAX_CACHE_SIZE = 1000; // Nombre max de villes en RAM

// 🧠 Base de données en mémoire (L1 Cache - pour le développement local et la durée de vie de la fonction Vercel)
const cacheLocal = {};

app.get('/api/horaires/mensuel', async (req, res) => {
    const villeIdBrut = req.query.ville || '9541';

    // 1. SÉCURITÉ : Validation stricte des entrées
    if (!/^\d+$/.test(villeIdBrut)) {
        return res.status(400).json({
            success: false,
            erreur: "Format d'ID invalide. Chiffres uniquement."
        });
    }
    
    const villeId = villeIdBrut;
    const maintenant = Date.now();

    // 💡 OPTIMISATION VERCEL (L2 Cache - CDN Edge)
    // s-maxage=86400 : Indique aux serveurs Vercel de garder le JSON en cache pendant 24 heures.
    // stale-while-revalidate=43200 : Permet à Vercel de servir un vieux cache pendant qu'il se met à jour en arrière-plan.
    // C'est le secret pour supporter des millions de requêtes gratuitement.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    // 2. GESTION DU CACHE LOCAL (Sert surtout quand on teste sur notre machine)
    if (cacheLocal[villeId] && (maintenant - cacheLocal[villeId].timestamp < CACHE_TTL_MS)) {
        console.log(`⚡ [CACHE LOCAL] Hit pour la ville ${villeId}`);
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

        // 4. FAIL-FAST : Sécurité contre les changements d'interface
        if (horairesMensuels.length === 0) {
            throw new Error("Structure DOM invalide. Le site cible a peut-être changé.");
        }

        const reponseFinale = {
            success: true,
            ville_id: villeId,
            source: "diyanet_officiel",
            derniere_mise_a_jour: new Date().toISOString(),
            total_jours: horairesMensuels.length,
            horaires: horairesMensuels
        };

        // 5. PRÉVENTION DES FUITES MÉMOIRE LOCALES
        if (Object.keys(cacheLocal).length >= MAX_CACHE_SIZE) {
            console.warn("🧹 [MÉMOIRE] Nettoyage d'urgence du cache local.");
            for (let key in cacheLocal) delete cacheLocal[key]; 
        }

        cacheLocal[villeId] = { timestamp: maintenant, donnees: reponseFinale };
        res.json(reponseFinale);

    } catch (error) {
        console.error(`❌ [ERREUR] Ville ${villeId} :`, error.message);
        
        const statusCode = error.code === 'ECONNABORTED' ? 504 : 502;
        res.status(statusCode).json({ 
            success: false, 
            erreur: "Le service officiel est temporairement indisponible." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend de Production (v2.0 avec Edge Cache) en écoute sur le port ${PORT}`);
});