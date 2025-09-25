// js/api/gemini.js

async function callGemini(prompt, button) {
    const buttonIcon = button.querySelector('.gemini-icon') || button;
    const originalContent = buttonIcon.innerHTML;
    buttonIcon.innerHTML = `<i class="fas fa-spinner gemini-btn-spinner"></i>`;
    button.disabled = true;

    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };

    try {
        const configResponse = await fetch('/api/gemini/config');
        const config = await configResponse.json();

        if (!config.api_key_configured || !config.api_key) {
            console.error("Gemini API key not configured on server.");
            return "Erreur: Clé API Gemini non configurée sur le serveur.";
        }

        const apiModel = 'gemini-2.0-flash-exp';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${config.api_key}`;

        console.log("🤖 [GEMINI API] Prompt:", prompt);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMsg = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
            } catch (jsonError) {
                // Ignore
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Invalid response structure from API");
        }
    } catch (error) {
        console.error("❌ [GEMINI API] Call failed:", error);
        return `Désolé, une erreur est survenue: ${error.message}`;
    } finally {
        buttonIcon.innerHTML = originalContent;
        button.disabled = false;
    }
}

async function handleGenerateDescription(event) {
    const button = event.currentTarget;
    const modal = button.closest('.bg-gray-900');
    const nameInput = modal.querySelector('input[type="text"]');
    const descTextarea = modal.querySelector('textarea');
    const locationName = nameInput.value;

    if (!locationName) {
        alert("Veuillez d'abord entrer un nom pour le lieu.");
        return;
    }

    const prompt = `Rédige une courte description évocatrice pour un lieu de la Terre du Milieu nommé '${locationName}'. Décris son apparence, son atmosphère et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis.`;

    const result = await callGemini(prompt, button);
    descTextarea.value = result;
}

async function handleGenerateRegionDescription(event) {
    const button = event.currentTarget;
    const regionName = document.getElementById('edit-region-name').value;
    const descTextarea = document.getElementById('edit-region-desc');

    if (!regionName) {
        alert("Veuillez d'abord entrer un nom pour la région.");
        return;
    }

    const prompt = `Rédige une courte description évocatrice pour une région de la Terre du Milieu nommée '${regionName}'. Décris son apparence, son climat, sa géographie et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis et évocateur.`;

    const result = await callGemini(prompt, button);
    descTextarea.value = result;
}

async function handleGenerateAdventurers(event) {
    const button = event.currentTarget;

    const prompt = `Crée un groupe d'aventuriers pour les Terres du Milieu dans l'Eriador de la fin du Troisième Âge.

Voici la procédure à suivre :

a- Choisis aléatoirement un nombre d'aventurier entre 2 et 5
b- Pour chaque individu du nombre d'aventurier fais les choses suivantes dans l'ordre :
- Choisis un peuple aléatoirement (parmi : "Hobbits de la Comté", "Hommes de Bree", "Rôdeur du Nord", "Elfes du Lindon", "Nains des Montagnes Bleues"). Il faut que cette sélection soit réellement aléatoire.
- Choisis un Nom (dans le style des noms utilisés parmi les races de Tolkien, mais sans utiliser de noms trop connus comme Aragorn, Legolas, Frodo, etc)
- Choisis Occupation/rôle (garde-forestier, marchand, érudit, guerrier, etc.)
- Choisis un lien cohérent (famille, ami, collègue, redevable, etc) entre les aventuriers, en faisant en sorte que les aventuriers de races différentes ne soient pas de la même famille.

Puis décris leur quête ou objectif commun qui les unit dans cette aventure, sans préciser ce qu'ils devront faire pour l'atteindre. Explique pourquoi ce sont eux et pas d'autres aventuriers qui poursuivent cette quête.

Format de réponse en Markdown:
## Groupe d'aventuriers
[Description de chaque membre avec nom (en gras), peuple (en italique), occupation, lien avec les autres aventuriers]

## Quête
[Description de leur mission commune]

Reste fidèle à l'univers de Tolkien, à la géographie et l'histoire de l'Eriador.`;

    const result = await callGemini(prompt, button);

    const parts = result.split('## Quête');
    if (parts.length === 2) {
        const groupPart = parts[0].replace('## Groupe d\'aventuriers', '').trim();
        const questPart = parts[1].trim();

        const groupTextarea = document.getElementById('adventurers-group');
        const questTextarea = document.getElementById('adventurers-quest');

        if (groupTextarea) groupTextarea.value = groupPart;
        if (questTextarea) questTextarea.value = questPart;

        updateMarkdownContent('adventurers-content', groupPart);
        updateMarkdownContent('quest-content', questPart);

        localStorage.setItem('adventurersGroup', groupPart);
        localStorage.setItem('adventurersQuest', questPart);
        scheduleAutoSync();
    } else {
        const groupTextarea = document.getElementById('adventurers-group');
        if (groupTextarea) groupTextarea.value = result;
        updateMarkdownContent('adventurers-content', result);
        localStorage.setItem('adventurersGroup', result);
        scheduleAutoSync();
    }
}