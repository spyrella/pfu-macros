const dialogTitle = "Weapon Customizer";

/**
 * @typedef {"untyped", "physical", "air", "bolt", "dark", "earth", "fire", "ice", "light", "poison"} DamageType
 */
/**
 * @type {Object<DamageType, string>}
 */
const damageTypes = {
  physical: 'FU.DamagePhysical',
  air: 'FU.DamageAir',
  bolt: 'FU.DamageBolt',
  dark: 'FU.DamageDark',
  earth: 'FU.DamageEarth',
  fire: 'FU.DamageFire',
  ice: 'FU.DamageIce',
  light: 'FU.DamageLight',
  poison: 'FU.DamagePoison',
  untyped: 'FU.DamageNone',
};

/**
 * @typedef {"melee", "ranged"} WeaponType
 */
/**
 * @type {Object.<WeaponType, string>}
 */
const weaponTypes = {
  melee: 'FU.Melee',
  ranged: 'FU.Ranged',
};

// Get the current user and selected tokens
const user = game.user;
const controlledTokens = canvas.tokens.controlled;
let actors = [];

// Use selected tokens or the owned actor
if (controlledTokens.length > 0) {
  actors = controlledTokens.map((token) => token.actor);
} else {
  const actor = user.character;
  if (actor) {
    actors.push(actor);
  }
}

// Function to generate select options HTML
function generateSelectOptions(options) {
  return Object.entries(options).map(
    ([value, label]) => `<option value="${value}">${game.i18n.localize(label)}</option>`
  ).join('');
}

// Create the select fields HTML
const damageTypeOptions = generateSelectOptions(damageTypes);
const weaponTypeOptions = generateSelectOptions(weaponTypes);

// Function to generate weapon item options for a select input
function generateWeaponOptions(actor) {
  return actor.items.filter(item => item.type === 'weapon' || item.type === 'basic').map(
    item => `<option value="${item.id}">${item.name}</option>`
  ).join('');
}

function capFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getItemDetails(item, damageType, weaponType, accuracyMod = 0, damageMod = 0, hrZeroBool) {
  const die1 = item.system.attributes.primary.value;
  const die2 = item.system.attributes.secondary.value;
  const accMod = item.system.accuracy.value + accuracyMod;
  const dmgMod = item.system.damage.value + damageMod;
  const dmgType = capFirstLetter(damageType || item.system.damageType.value);
  const weapType = capFirstLetter(weaponType || item.system.type.value);
  const hrZeroLabel = hrZeroBool ? `HR0` : `HR`

  return `
    <div class="flexcol dialog-name">
      <div class="flexrow">
        <div class="dialog-image">
          <img src="${item.img}" data-tooltip="${item.name}" />
        </div>
        <h6 class="resource-content">
          ${item.name}
          <strong>【${(die1 + ' + ' + die2).toUpperCase()}】 +${accMod}</strong>
          <strong> ⬥ </strong>
          <strong>【${hrZeroLabel} + ${dmgMod}】</strong> ${dmgType}
        </h6>
      </div>
      <div class="individual-description align-left">
        <strong>${weapType}</strong>
      </div>
    </div>`;
}

const dialogContentTemplate = (weaponOptions, baseWeaponDetails, currentWeaponDetails) => `
  <form>
    <div>
      <div class="desc mb-3">
        <div id="base-item">${baseWeaponDetails}</div>
        <div style="text-align: center;margin:-5px 0 10px;"><i class="fa-solid fa-arrow-down"></i></div>
        <div id="current-item">${currentWeaponDetails}</div>
      </div
    </div>

    <div class="desc grid grid-2col gap-5">
      <div class="gap-2">
        <div class="form-group"><label for="weapon-item"><b>Weapon</b></label><select id="weapon-item">${weaponOptions}</select></div>
        <div class="form-group"><label for="damage-type"><b>Damage Type</b></label><select id="damage-type">${generateSelectOptions(damageTypes)}</select></div>
        <div class="form-group"><label for="weapon-type"><b>Weapon Type</b></label><select id="weapon-type">${generateSelectOptions(weaponTypes)}</select></div>
      </div>
      <div class="gap-2">
        <div class="form-group"><label for="accuracy-mod"><b>Accuracy Mod</b></label><input id="accuracy-mod" type="number" step="1" value="0"></div>
        <div class="form-group"><label for="damage-mod"><b>Damage Mod</b></label><input id="damage-mod" type="number" step="1" value="0"></div>
        <div class="grid grid-2col">
          <div class="form-group"><label for="hrzero"><b>HR0?</b></label><input id="hrzero" type="checkbox"></div>
        </div>
      </div>
    </div>
  </form>`;

if (actors.length > 0) {
  actors.forEach(actor => {
    const weaponOptions = generateWeaponOptions(actor);

    if (weaponOptions.length === 0) {
      ui.notifications.warn(`No weapons found for ${actor.name}`);
      return;
    }

    const initialWeaponId = actor.items.filter(item => item.type === 'weapon')[0]?.id;
    const initialWeapon = actor.items.get(initialWeaponId);
    let baseWeaponDetails = getItemDetails(initialWeapon);
    let currentWeaponDetails = baseWeaponDetails;

    const dialogContent = dialogContentTemplate(weaponOptions, baseWeaponDetails, currentWeaponDetails);

    // Create a dialog for the actor's weapon items
    const dialog = new Dialog(
      {
        title: dialogTitle,
        content: dialogContent,
        buttons: {
          modify: {
            label: "Modify",
            callback: async (html) => {
              const selectedWeaponId = html.find("#weapon-item").val();
              const damageType = html.find("#damage-type").val();
              const weaponType = html.find("#weapon-type").val();
              const accuracyMod = parseInt(html.find("#accuracy-mod").val(), 10);
              const damageMod = parseInt(html.find("#damage-mod").val(), 10);
              const selectedWeapon = actor.items.get(selectedWeaponId);

              // Modify the item with the selected values
              await selectedWeapon.update({
                "system.accuracy.value": selectedWeapon.system.accuracy.value + accuracyMod,
                "system.damage.value": selectedWeapon.system.damage.value + damageMod,
                "system.damageType.value": damageType,
                "system.type.value": weaponType
              });

              // Notify the user on success
              ui.notifications.info(`${selectedWeapon.name} modified for ${actor.name}`);
            },
          },
          clone: {
            label: "Clone",
            callback: async (html) => {
              const selectedWeaponId = html.find("#weapon-item").val();
              const damageType = html.find("#damage-type").val();
              const weaponType = html.find("#weapon-type").val();
              const accuracyMod = parseInt(html.find("#accuracy-mod").val(), 10);
              const damageMod = parseInt(html.find("#damage-mod").val(), 10);
              const selectedWeapon = actor.items.get(selectedWeaponId);

              // Fetch isEquipped value and slot from selected weapon
              const { value, slot } = selectedWeapon.system.isEquipped;

              // Modify the item with the selected values
              await selectedWeapon.update({
                "system.isEquipped.value": false,
                "system.isEquipped.slot": 'default'
              });

              // Create a new item based on the selected item
              const newItemData = foundry.utils.deepClone(selectedWeapon);
              const newItemName = `${newItemData.name} (Modified)`;

              // Create the new item and add it to the actor
              const newItem = await Item.create(newItemData, { parent: actor });

              // Modify the item with the selected values
              await newItem.update({
                "system.accuracy.value": newItemData.system.accuracy.value + accuracyMod,
                "system.damage.value": newItemData.system.damage.value + damageMod,
                "system.damageType.value": damageType,
                "system.type.value": weaponType,
                "system.isEquipped.value": value,
                "system.isEquipped.slot": slot
              });

              await newItem.update({ name: newItemName });

              // Notify the user on success
              ui.notifications.info(`${newItem.name} cloned and added to ${actor.name}`);
            },
          },

          tempRoll: {
            label: "Temp Roll",
            callback: async html => {
              const selectedWeaponId = html.find("#weapon-item").val();
              const damageType = html.find("#damage-type").val();
              const weaponType = html.find("#weapon-type").val();
              const accuracyMod = parseInt(html.find("#accuracy-mod").val(), 10);
              const damageMod = parseInt(html.find("#damage-mod").val(), 10);
              const selectedWeapon = actor.items.get(selectedWeaponId);
              const hrZeroChecked = html.find("#hrzero").prop("checked");
              const hrZeroBool = hrZeroChecked;

              // Store original values
              const originalValues = {
                accuracy: selectedWeapon.system.accuracy.value,
                damage: selectedWeapon.system.damage.value,
                damageType: selectedWeapon.system.damageType.value,
                weaponType: selectedWeapon.system.type.value
              };

              // Temporarily update values
              await selectedWeapon.update({
                "system.accuracy.value": originalValues.accuracy + accuracyMod,
                "system.damage.value": originalValues.damage + damageMod,
                "system.damageType.value": damageType || originalValues.damageType,
                "system.type.value": weaponType || originalValues.weaponType
              });

              // Roll for the selected weapon
              await selectedWeapon.roll(hrZeroBool);

              // Delay until roll animation completes
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Revert back to original values
              await selectedWeapon.update({
                "system.accuracy.value": originalValues.accuracy,
                "system.damage.value": originalValues.damage,
                "system.damageType.value": originalValues.damageType,
                "system.type.value": originalValues.weaponType
              });

              // Re-render the dialog to keep it open
              dialog.render(true);
            },
            close: false
          },
          cancel: {
            label: "Cancel",
            callback: () => { }
          }
        },
        render: (html) => {
          const modifyCurrentItemDetails = () => {
            const selectedWeaponId = html.find("#weapon-item").val();
            const selectedWeapon = actor.items.get(selectedWeaponId);
            const damageType = html.find("#damage-type").val();
            const weaponType = html.find("#weapon-type").val();
            const accuracyMod = parseInt(html.find("#accuracy-mod").val(), 10);
            const damageMod = parseInt(html.find("#damage-mod").val(), 10);
            const hrZeroChecked = html.find("#hrzero").prop("checked");
            const hrZeroBool = hrZeroChecked;
            baseWeaponDetails = getItemDetails(selectedWeapon);
            currentWeaponDetails = getItemDetails(selectedWeapon, damageType, weaponType, accuracyMod, damageMod, hrZeroBool);
            html.find("#base-item").html(baseWeaponDetails);
            html.find("#current-item").html(currentWeaponDetails);
          };
          html.find("#weapon-item").change(modifyCurrentItemDetails);
          html.find("#damage-type").change(modifyCurrentItemDetails);
          html.find("#weapon-type").change(modifyCurrentItemDetails);
          html.find("#accuracy-mod").change(modifyCurrentItemDetails);
          html.find("#damage-mod").change(modifyCurrentItemDetails);
          html.find("#hrzero").change(modifyCurrentItemDetails);

        },
      },
      {
        width: 420,
        classes: ['dialog', 'backgroundstyle'],
      }
    );
    dialog.render(true);
  });
} else {
  ui.notifications.warn('FU.ChatApplyEffectNoActorsSelected', { localize: true });
}