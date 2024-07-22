window.macroCache = window.macroCache || {};

// Retrieve the cached value of bypassClamping
let bypassClamping = window.macroCache.bypassClamping || false;

let targetedTokens = Array.from(game.user.targets);

if (targetedTokens.length > 0) {
    renderModifyStatsDialog(targetedTokens);
} else {
    ui.notifications.error("No token selected.");
}

function renderModifyStatsDialog(tokens) {
    let hasCharacter = tokens.some(token => token.actor.type === "character");
    let dialogContent = buildDialogContent(tokens, hasCharacter, bypassClamping);

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

function buildDialogContent(tokens, hasCharacter, bypassClamping) {
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
        </div>
        <div>
            <label><input type="checkbox" id="bypassClamping" ${bypassClamping ? 'checked' : ''}> Bypass Clamping</label>
        </div>`;

    return dialogContent;
}

async function handleOkButtonClick(html, tokens, hasCharacter) {
    let bypassClamping = html.find("#bypassClamping")[0].checked;
    window.macroCache.bypassClamping = bypassClamping; // Save the state to cache

    for (let token of tokens) {
        let changeHP = parseInt(html.find("#attributeHP")[0].value) || 0;
        let changeMP = parseInt(html.find("#attributeMP")[0].value) || 0;
        let changeIP = hasCharacter ? (parseInt(html.find("#attributeIP")[0].value) || 0) : 0;

        let currentHP = token.actor.system.resources.hp.value;
        let currentMP = token.actor.system.resources.mp.value;
        let currentIP = token.actor.system.resources.ip.value;
        let maxHP = token.actor.system.resources.hp.max;
        let maxMP = token.actor.system.resources.mp.max;
        let maxIP = token.actor.system.resources.ip.max;

        let newHP = currentHP + changeHP;
        let newMP = currentMP + changeMP;
        let newIP = currentIP + changeIP;

        if (html.find("#recoverHP")[0].checked) {
            newHP = maxHP;
        }
        if (html.find("#recoverMP")[0].checked) {
            newMP = maxMP;
        }
        if (hasCharacter && html.find("#recoverIP")[0].checked) {
            newIP = maxIP;
        }

        await applyAttributeChange(token.actor, "resources.hp", newHP, bypassClamping);
        await applyAttributeChange(token.actor, "resources.mp", newMP, bypassClamping);
        if (hasCharacter) {
            await applyAttributeChange(token.actor, "resources.ip", newIP, bypassClamping);
        }
    }
}

async function applyAttributeChange(actor, attribute, value, bypassClamp) {
    const current = foundry.utils.getProperty(actor.system, attribute);

    if (bypassClamp) {
        await actor.update({ [`system.${attribute}.value`]: value });
    } else {
        const max = foundry.utils.getProperty(actor.system, `${attribute}.max`);
        value = Math.clamped(value, 0, max);
        await actor.update({ [`system.${attribute}.value`]: value });
    }
}