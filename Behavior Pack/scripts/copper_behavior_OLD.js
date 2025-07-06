import {
  system,
  world,
  BlockPermutation,
  ItemStack,
  EntityInventoryComponent,
} from "@minecraft/server";
// Oxidization Mapping
const oxidizeMap = {
  "kado:cut_copper_vertical_slab": "kado:exposed_cut_copper_vertical_slab",
  "kado:exposed_cut_copper_vertical_slab": "kado:weathered_cut_copper_vertical_slab",
  "kado:weathered_cut_copper_vertical_slab": "kado:oxidized_cut_copper_vertical_slab"
};
// Reverse Mapping for De-Oxidization
const deoxidizeMap = Object.fromEntries(
  Object.entries(oxidizeMap).map(([d, o]) => [o, d])
);
// Wax Mapping
const waxMap = {
  "kado:cut_copper_vertical_slab": "kado:waxed_cut_copper_vertical_slab",
  "kado:exposed_cut_copper_vertical_slab": "kado:waxed_exposed_cut_copper_vertical_slab",
  "kado:weathered_cut_copper_vertical_slab": "kado:waxed_weathered_cut_copper_vertical_slab",
  "kado:oxidized_cut_copper_vertical_slab": "kado:waxed_oxidized_cut_copper_vertical_slab"
};
// Reverse Mapping for Un-Waxing
const unwaxMap = Object.fromEntries(Object.entries(waxMap).map(([u, w]) => [w, u]));
// All Vanilla Axe Type IDs
const axeIds = [
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  //"minecraft:copper_axe",  - Fall Game Drop -
  "minecraft:iron_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
  "minecraft:golden_axe"
];
// Reduce Durability Accounting for Unbreaking Enchantment (Not Working)
function damageAxe(item) {
  if (!item || !axeIds.includes(item.typeId)) return;
  const enchantmentsComponent = item.getComponent("minecraft:enchantments");
  // Access Enchantment Details - Not Tested
  const unbreakingEnchantment = enchantmentsComponent?.enchantments.getEnchantment("unbreaking");
  const unbreakingLevel = unbreakingEnchantment?.level ?? 0;
  const ignoreChance = 1 / (unbreakingLevel + 1);
  // Reduce Durability
  if (Math.random() < ignoreChance) {
    item.damage += 1;
  }
};
// Unified Custom Component Behavior
const copperBehaviorComponent = {
  // Oxidization Logic (Triggered by minecraft:tick)
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
    EntityInventoryComponent;
    const currentPlayer = world.getPlayers()[0];
    const currentPlayerInventory = currentPlayer.getComponent("inventory");
    const currentSlot = currentPlayerInventory.container.getSlot(player.selectedSlotIndex);
    const currentItem = currentSlot.getItem();
    // const info = {player: currentPlayer, inventory: currentPlayerInventory, slot: currentSlot, item: currentItem, amount: currentItemAmount }
    if (currentItem) {
      const currentId = block.typeId;
      const state = block.permutation.getAllStates();
      const isAxe = axeIds.includes(currentItem.typeId);
      const isHoneycomb = currentItem.typeId === "minecraft:honeycomb";
      console.log(`Item ID: ${currentItem.typeId}`);
      // Waxing Logic
      if (isHoneycomb && waxMap[currentId]) {
        block.setPermutation(BlockPermutation.resolve(waxMap[currentId], state));
        player.playSound("copper.wax.on", { location: player.location });
        if (currentItemAmount > 1) {
        const newStack = new ItemStack(currentItem.typeId, (currentItem.amount - 1))
          currentPlayerInventory.container.setItem(newStack)
        } else {
          currentPlayerInventory.container.setItem(currentItem.typeId, undefined)
        }
        return;
      }
        // Un-Waxing Logic
        if (isAxe && unwaxMap[currentId]) {
          block.setPermutation(BlockPermutation.resolve(unwaxMap[currentId], state));
          player.playSound("copper.wax.off", { location: player.location });
          damageAxe(currentItem);
          return;
        }
        // De-Oxidization Logic
        if (isAxe && deoxidizeMap[currentId]) {
          block.setPermutation(BlockPermutation.resolve(deoxidizeMap[currentId], state));
          player.playSound("copper.wax.off", { location: player.location });
          damageAxe(currentItem);
          return;
        }
      }
    }
};
// Component Registration Hook
system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("kado:copper_behavior", copperBehaviorComponent);
});
