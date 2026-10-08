/**
 * Variant & SKU Combination Validator
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

/**
 * Validates SKU attributes against defined product variants.
 * Enforces CAT-04: Only valid declared variant combinations are accepted.
 *
 * @param {Array} definedVariants - Variants registered on the product: [{ name, options: [...] }]
 * @param {Object} candidateAttributes - Key-value pair, e.g., { "Size": "Medium", "Glaze Finish": "Speckled Sand" }
 * @param {Array} existingSkus - Existing SKUs for the product to prevent duplicate combinations.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSkuAttributes(definedVariants, candidateAttributes, existingSkus = []) {
  const errors = [];

  // Case 1: Product has defined variant dimensions
  if (definedVariants && definedVariants.length > 0) {
    if (!candidateAttributes || typeof candidateAttributes !== 'object' || Object.keys(candidateAttributes).length === 0) {
      errors.push(`This product has ${definedVariants.length} defined variant dimensions. Specific attributes must be provided.`);
      return { valid: false, errors };
    }

    const candidateKeys = Object.keys(candidateAttributes);
    const definedNames = definedVariants.map(v => v.name);

    // Check for missing dimensions
    for (const v of definedVariants) {
      if (!candidateAttributes.hasOwnProperty(v.name)) {
        errors.push(`Missing attribute value for variant dimension '${v.name}'. Permitted options: [${v.options.join(', ')}].`);
      }
    }

    // Check for extraneous / unknown dimensions
    for (const key of candidateKeys) {
      const match = definedVariants.find(v => v.name.toLowerCase() === key.toLowerCase());
      if (!match) {
        errors.push(`Attribute '${key}' is not a defined variant dimension for this product. Valid dimensions: [${definedNames.join(', ')}].`);
      } else {
        // Check if value is permitted
        const val = candidateAttributes[key];
        const isPermitted = match.options.some(opt => String(opt).toLowerCase() === String(val).toLowerCase());
        if (!isPermitted) {
          errors.push(`Invalid value '${val}' for variant '${match.name}'. Permitted options are: [${match.options.join(', ')}].`);
        }
      }
    }

    // Check for duplicate attribute combinations across existing SKUs for this product
    if (errors.length === 0 && existingSkus.length > 0) {
      const isDuplicate = existingSkus.some(sku => {
        const existingAttrs = sku.attributes || {};
        const existingKeys = Object.keys(existingAttrs);
        if (existingKeys.length !== definedNames.length) return false;

        return definedNames.every(name => {
          const v1 = String(existingAttrs[name] || '').toLowerCase();
          const v2 = String(candidateAttributes[name] || '').toLowerCase();
          return v1 === v2;
        });
      });

      if (isDuplicate) {
        errors.push('A SKU with this exact variant attribute combination already exists for this product. Duplicate combinations are rejected.');
      }
    }
  } else {
    // Case 2: Product has NO variant dimensions (standalone simple product)
    // If attributes are passed, they should be empty or a simple product can only have 1 SKU
    if (existingSkus.length >= 1) {
      errors.push('A standalone product without variants can only have one primary sellable SKU.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates price and stock constraints.
 * Enforces non-negative price and non-negative stock.
 */
function validatePriceAndStock(price, stockQuantity) {
  const errors = [];

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    errors.push('Price must be a valid non-negative decimal number.');
  }

  const parsedStock = parseInt(stockQuantity, 10);
  if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(Number(stockQuantity))) {
    errors.push('Stock quantity must be a non-negative integer.');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedPrice: parsedPrice.toFixed(2),
    sanitizedStock: parsedStock
  };
}

module.exports = {
  validateSkuAttributes,
  validatePriceAndStock
};
