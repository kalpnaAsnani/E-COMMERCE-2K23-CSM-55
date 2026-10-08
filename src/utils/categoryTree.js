/**
 * Category Tree Utility Functions
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

/**
 * Builds a nested hierarchical tree from a flat list of category records.
 * @param {Array} categories - Array of category database rows.
 * @returns {Array} - Array of root categories with nested children arrays.
 */
function buildTree(categories) {
  const categoryMap = new Map();
  const tree = [];

  // Clone items to avoid mutating input rows
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      ...cat,
      children: []
    });
  }

  for (const cat of categories) {
    const node = categoryMap.get(cat.id);
    if (cat.parent_id === null || cat.parent_id === undefined) {
      tree.push(node);
    } else {
      const parentNode = categoryMap.get(cat.parent_id);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // If parent not in list (e.g. inactive parent in filtered query), treat as top-level
        tree.push(node);
      }
    }
  }

  return tree;
}

/**
 * Checks if setting targetParentId as parent of categoryId creates a cycle.
 * A category cannot become its own ancestor.
 * @param {number|string} categoryId - The ID of the category being updated.
 * @param {number|string|null} targetParentId - The proposed parent ID.
 * @param {Function} queryFn - Database query function.
 * @returns {Promise<{ hasCycle: boolean, reason?: string }>}
 */
async function detectCycle(categoryId, targetParentId, queryFn) {
  if (!targetParentId) {
    return { hasCycle: false };
  }

  const catId = parseInt(categoryId, 10);
  const parentId = parseInt(targetParentId, 10);

  if (catId === parentId) {
    return {
      hasCycle: true,
      reason: 'A category cannot be its own parent.'
    };
  }

  // Traverse upwards from targetParentId to root. If catId is encountered, a cycle is created.
  let currentId = parentId;
  const visited = new Set([currentId]);

  while (currentId !== null && currentId !== undefined) {
    if (currentId === catId) {
      return {
        hasCycle: true,
        reason: 'Cycle detected: Proposed parent is a descendant of this category.'
      };
    }

    const res = await queryFn('SELECT id, parent_id FROM categories WHERE id = $1', [currentId]);
    if (res.rows.length === 0) {
      return {
        hasCycle: false,
        error: 'Target parent category does not exist.'
      };
    }

    currentId = res.rows[0].parent_id;

    if (currentId !== null && visited.has(currentId)) {
      // Pre-existing cycle in database
      return {
        hasCycle: true,
        reason: 'Cycle detected in existing category ancestry chain.'
      };
    }
    if (currentId !== null) {
      visited.add(currentId);
    }
  }

  return { hasCycle: false };
}

module.exports = {
  buildTree,
  detectCycle
};
