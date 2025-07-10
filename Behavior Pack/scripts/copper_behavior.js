import {
  world,
  system,
  BlockPermutation,
  ItemStack,
  MolangVariableMap,
} from "@minecraft/server";
// Oxidization Map
const oxidizeMap = {
  "kado:cut_copper_vertical_slab": "kado:exposed_cut_copper_vertical_slab",
  "kado:exposed_cut_copper_vertical_slab": "kado:weathered_cut_copper_vertical_slab",
  "kado:weathered_cut_copper_vertical_slab": "kado:oxidized_cut_copper_vertical_slab",
};
// De-Oxidization Map
const deoxidizeMap = {
  "kado:exposed_cut_copper_vertical_slab": "kado:cut_copper_vertical_slab",
  "kado:weathered_cut_copper_vertical_slab": "kado:exposed_cut_copper_vertical_slab",
  "kado:oxidized_cut_copper_vertical_slab": "kado:weathered_cut_copper_vertical_slab",
};
// Waxing Map
const waxMap = {
  "kado:cut_copper_vertical_slab": "kado:waxed_cut_copper_vertical_slab",
  "kado:exposed_cut_copper_vertical_slab": "kado:waxed_exposed_cut_copper_vertical_slab",
  "kado:weathered_cut_copper_vertical_slab": "kado:waxed_weathered_cut_copper_vertical_slab",
  "kado:oxidized_cut_copper_vertical_slab": "kado:waxed_oxidized_cut_copper_vertical_slab",
};
// Un-Waxing Map
const unwaxMap = {
  "kado:waxed_cut_copper_vertical_slab": "kado:cut_copper_vertical_slab",
  "kado:waxed_exposed_cut_copper_vertical_slab": "kado:exposed_cut_copper_vertical_slab",
  "kado:waxed_weathered_cut_copper_vertical_slab": "kado:weathered_cut_copper_vertical_slab",
  "kado:waxed_oxidized_cut_copper_vertical_slab": "kado:oxidized_cut_copper_vertical_slab",
};
// All Vanilla Axe Type IDs
const axeIds = [
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  // "minecraft:copper_axe",  - Fall Game Drop -
  "minecraft:iron_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
  "minecraft:golden_axe",
];
// Reduce Axe Durability Accounting for Unbreaking Enchantment
// NOT WORKING ~~~~~~~
function damageAxe(item) {
  if (!item || !axeIds.includes(item.typeId)) return;
  // Get unbreaking enchantment level
  const durability = item.getComponent('minecraft:durability');
  const enchantable = item.getComponent('minecraft:enchantable');
  const hasUnbreaking = enchantable.hasEnchantment('minecraft:unbreaking');
  if (hasUnbreaking) {
    const unbreaking = enchantable.getEnchantment('minecraft:unbreaking');
    const unbreakingLevel = unbreaking.level;
    const damageChance = durability.getDamageChance(unbreakingLevel);
    console.warn(`\nHas Unbreaking: ${hasUnbreaking}\nLevel: ${unbreakingLevel}\nDamage Chance: ${damageChance}\n~~~~~~~~~~~~~~~~~~~~`)
      // Calculate chance to consume durability --- NOT WORKING
    if ((100 / (unbreakingLevel + 1)) < damageChance) {
      const myAxe = item.clone
      const newAxe = new ItemStack(myAxe, durability.damage - 1);
      currentSlot.setItem(newAxe);
        // If the axe is broken, remove it
        if (durability.damage >= durability.maxDurability) {
          currentSlot.setItem();
        }
      }
    }
  }
// Unified Custom Component Behavior
const copperBehaviorComponent = {
  // Oxidization Logic (Triggered by minecraft:tick)
  // Needs vanilla 'other copper nearby' proximity testing.
  onTick({ block }) {
    const currentId = block.typeId;
    const nextId = oxidizeMap[currentId];
    if (!nextId) return;
    const state = block.permutation.getAllStates();
    const newPerm = BlockPermutation.resolve(nextId, state);
    block.setPermutation(newPerm);
  },
  // Interaction Logic
  onPlayerInteract({ block, player }) {
    const currentPlayer = world.getPlayers()[0];
    const currentPlayerInventory = currentPlayer.getComponent('inventory');
    const currentSlot = currentPlayerInventory.container.getSlot(player.selectedSlotIndex);
    const currentItem = currentSlot.getItem();
    const blockLocation = block.location;
    const waxOnParticleColor = new MolangVariableMap();
    const waxOffParticleColor = new MolangVariableMap();
    waxOnParticleColor.setColorRGB('variable.color', {red: 255, green: 180, blue: 0});
    waxOffParticleColor.setColorRGB('variable.color', {red: 150, green: 150, blue: 150});
    if (currentItem) {
      const currentId = block.typeId;
      const state = block.permutation.getAllStates();
      const isAxe = axeIds.includes(currentItem.typeId);
      const isHoneycomb = currentItem.typeId === 'minecraft:honeycomb';
      // Waxing Logic
      if (isHoneycomb && waxMap[currentId]) {
        block.setPermutation(BlockPermutation.resolve(waxMap[currentId], state));
        if (currentItem.amount > 1) {
        const newStack = new ItemStack(currentItem.typeId, currentItem.amount - 1)
        currentSlot.setItem(newStack)
        } else {
          currentSlot.setItem();
        };
        player.playSound("copper.wax.on", { location: player.location });
        for (let i = 0; i < 15; i++) {
          let particleLocation = {
            x: blockLocation.x + Math.random(),
            y: blockLocation.y + Math.random(),
            z: blockLocation.z + Math.random(),
          };
          player.spawnParticle('minecraft:wax_particle', particleLocation, waxOnParticleColor);
        };
        return;
      };
      // Un-Waxing Logic
      if (isAxe && unwaxMap[currentId]) {
        block.setPermutation(BlockPermutation.resolve(unwaxMap[currentId], state));
        player.playSound('copper.wax.off', { location: player.location });
        for (let i = 0; i < 15; i++) {
          let particleLocation = {
            x: blockLocation.x + Math.random(),
            y: blockLocation.y + Math.random(),
            z: blockLocation.z + Math.random(),
          };
          player.spawnParticle('minecraft:wax_particle', particleLocation, waxOffParticleColor);
        };
        damageAxe(currentItem);
        return;
      };
      // De-Oxidization Logic
      if (isAxe && deoxidizeMap[currentId]) {
        block.setPermutation(BlockPermutation.resolve(deoxidizeMap[currentId], state));
        player.playSound('copper.wax.off', { location: player.location });
        for (let i = 0; i < 15; i++) {
          let particleLocation = {
            x: blockLocation.x + Math.random(),
            y: blockLocation.y + Math.random(),
            z: blockLocation.z + Math.random(),
          };
          player.spawnParticle('minecraft:wax_particle', particleLocation, waxOffParticleColor);
        };
        damageAxe(currentItem);
        return;
      }
    }
  }
};
// Component Registration
system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent('kado:copper_behavior', copperBehaviorComponent);
});
