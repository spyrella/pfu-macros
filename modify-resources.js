let targetedTokens = Array.from(game.user.targets);

if (targetedTokens.length > 0) {
    renderModifyStatsDialog(targetedTokens);
} else {
    ui.notifications.error("No token selected.");
}

function renderModifyStatsDialog(tokens) {
    let hasCharacter = tokens.some(token => token.actor.type === "character");
    let dialogContent = buildDialogContent(tokens, hasCharacter);

    let dialog = new Dialog({
        title: "Modify Stats",
        content: dialogContent,
        buttons: {
            ok: {
                label: "OK",
                callback: (html) => handleOkButtonClick(html, tokens, hasCharacter)
            },
            cancel: {
                label: "Cancel"
            }
        }
    });

    dialog.render(true);

}

function buildDialogContent(tokens, hasCharacter) {
    let tokenInfo = tokens.map(token => {
        let ipField = '';
        if (hasCharacter && token.actor.type === "character") {
            ipField = `<span><b>IP:</b> ${token.actor.system.resources.ip.value}/${token.actor.system.resources.ip.max}</span>`;
        }
        let icon = `<img src="${token.actor.img}" style="width: 36px; height: 36px; vertical-align: middle; margin-right: 5px;">`;
        return `<div class="flexcol">${icon}<strong>${token.name}</strong>
        <span><b>HP:</b> ${token.actor.system.resources.hp.value}/${token.actor.system.resources.hp.max}</span>
        <span><b>MP:</b> ${token.actor.system.resources.mp.value}/${token.actor.system.resources.mp.max}</span>
        ${ipField}</div><br>`;
    }).join('');

    let dialogContent = `
        <div class="flexrow">${tokenInfo}</div>
        <div>
            <p>Enter the amount to increase/decrease HP:</p>
            <input type="number" id="attributeHP" value="">
        </div>
        <div>
            <p>Enter the amount to increase/decrease MP:</p>
            <input type="number" id="attributeMP" value="">
        </div>`;

    if (hasCharacter) {
        dialogContent += `
            <div>
                <p>Enter the amount to increase/decrease IP:</p>
                <input type="number" id="attributeIP" value="">
            </div>`;
    }

    // Add recover checkboxes
    dialogContent += `
        <div>
            <label><input type="checkbox" id="recoverHP"> Recover All HP</label>
            <label><input type="checkbox" id="recoverMP"> Recover All MP</label>
            ${hasCharacter ? '<label><input type="checkbox" id="recoverIP"> Recover All IP</label>' : ''}
        </div>`;

    return dialogContent;
}

function handleOkButtonClick(html, tokens, hasCharacter) {
    tokens.forEach(token => {
        let changeHP = parseInt(html.find("#attributeHP")[0].value) || 0;
        let changeMP = parseInt(html.find("#attributeMP")[0].value) || 0;
        let changeIP = hasCharacter ? (parseInt(html.find("#attributeIP")[0].value) || 0) : 0;

        let currentHP = token.actor.system.resources.hp.value;
        let currentMP = token.actor.system.resources.mp.value;
        let currentIP = token.actor.system.resources.ip.value;
        let maxHP = token.actor.system.resources.hp.max;
        let maxMP = token.actor.system.resources.mp.max;
        let maxIP = token.actor.system.resources.ip.max;

        let newHP = Math.min(maxHP, Math.max(0, currentHP + changeHP));
        let newMP = Math.min(maxMP, Math.max(0, currentMP + changeMP));
        let newIP = hasCharacter && token.actor.type !== "npc" ? Math.min(maxIP, Math.max(0, currentIP + changeIP)) : currentIP;

        if (html.find("#recoverHP")[0].checked) {
            newHP = maxHP;
        }
        if (html.find("#recoverMP")[0].checked) {
            newMP = maxMP;
        }
        if (hasCharacter && html.find("#recoverIP")[0].checked) {
            newIP = maxIP;
        }

        token.actor.update({
            "system.resources.hp.value": newHP,
            "system.resources.mp.value": newMP,
            "system.resources.ip.value": newIP
        });
    });
}