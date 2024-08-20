async function regenerateFUIDsInCompendiums() {
    // Display confirmation dialog to the user
    const html = `
        <div class="warning-message">
            <p>${game.i18n.localize('FU.FUID.ChangeWarning2')}</p>
            <p>${game.i18n.localize('FU.FUID.ChangeWarning3')}</p>
        </div>
        `;

    const confirmation = await Dialog.confirm({
        title: game.i18n.localize('FU.FUID.Regenerate'),
        content: html,
        defaultYes: false,
        options: { classes: ['unique-dialog', 'backgroundstyle'] },
    });

    if (!confirmation) return;

    let totalItemsProcessed = 0;
    let totalItemsUpdated = 0;
    let totalItemsSkipped = 0;

    // Function to process each compendium
    async function processCompendium(pack) {
        if (pack.locked) {
            console.warn(`Compendium ${pack.metadata.label} is locked and will be skipped.`);
            return;
        }

        // Load the compendium and get all documents (items)
        const documents = await pack.getDocuments();
        totalItemsProcessed += documents.length;

        // Iterate over each document and update its FUID if necessary
        for (const doc of documents) {
            if (!doc.system.fuid) {
                // Only regenerate and update if system.fuid does not exist
                const newFUID = game.projectfu.util.slugify(doc.name);
                
                // Update the document with the new FUID
                await doc.update({ 'system.fuid': newFUID });
                console.log(`Updated ${doc.name}: FUID ${newFUID}`);
                totalItemsUpdated++;
            } else {
                console.log(`Skipped ${doc.name}: already has FUID ${doc.system.fuid}`);
                totalItemsSkipped++;
            }
        }
    }

    // Iterate over all compendiums
    for (let pack of game.packs.values()) {
        await processCompendium(pack);
    }

    // Log summary of the operation
    console.log(`\n--- FUID Regeneration Completed ---`);
    console.log(`Total Compendiums Processed: ${game.packs.size}`);
    console.log(`Total Items Processed: ${totalItemsProcessed}`);
    console.log(`Total Items Updated: ${totalItemsUpdated}`);
    console.log(`Total Items Skipped: ${totalItemsSkipped}`);
}

// Run the macro
regenerateFUIDsInCompendiums().catch(err => console.error(err));