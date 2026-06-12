const axios = require('axios');
const fs = require('fs');

async function construireReferentiel() {
    console.log("⏳ Démarrage du scraper avec système Anti-Ban...");
    const referentiel = [];

    try {
        const urlProvinces = 'https://ezanvakti.emushaf.net/sehirler/2';
        const reponseProvinces = await axios.get(urlProvinces);
        const provinces = reponseProvinces.data;

        console.log(`✅ ${provinces.length} provinces trouvées. Récupération des districts...`);

        for (const province of provinces) {
            let succes = false;
            let tentatives = 0;
            const maxTentatives = 5;

            // Boucle de Retry (Recul exponentiel)
            while (!succes && tentatives < maxTentatives) {
                try {
                    console.log(`Extraction : ${province.SehirAdi}...`);
                    const urlDistricts = `https://ezanvakti.emushaf.net/ilceler/${province.SehirID}`;
                    const reponseDistricts = await axios.get(urlDistricts);
                    
                    const districtsFormates = reponseDistricts.data.map(district => ({
                        id: district.IlceID,
                        nom: district.IlceAdi
                    }));

                    referentiel.push({
                        province_id: province.SehirID,
                        province_nom: province.SehirAdi,
                        districts: districtsFormates
                    });

                    succes = true; // La requête a fonctionné, on sort de la boucle de retry
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause standard

                } catch (erreur) {
                    if (erreur.response && erreur.response.status === 429) {
                        tentatives++;
                        const tempsAttente = tentatives * 5000; // 5s, 10s, 15s...
                        console.log(`⚠️ Pare-feu activé ! Pause de ${tempsAttente/1000}s avant de réessayer...`);
                        await new Promise(resolve => setTimeout(resolve, tempsAttente));
                    } else {
                        throw erreur; // Si c'est une autre erreur, on crash
                    }
                }
            }

            if (!succes) {
                console.log(`❌ Impossible de récupérer ${province.SehirAdi} après ${maxTentatives} tentatives.`);
            }
        }

        fs.writeFileSync('villes_turquie.json', JSON.stringify(referentiel, null, 2), 'utf-8');
        console.log("🎉 TERMINÉ ! Le fichier 'villes_turquie.json' a été créé.");

    } catch (erreur) {
        console.error("❌ Erreur fatale :", erreur.message);
    }
}

construireReferentiel();