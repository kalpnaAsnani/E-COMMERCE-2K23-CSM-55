/**
 * SKU Data Model
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { query } = require('../config/database');

class SkuModel {
  static async create({ product_id, sku_code, attributes = {}, price, stock_quantity = 0, is_active = true }) {
    const res = await query(
      `INSERT INTO skus (product_id, sku_code, attributes, price, stock_quantity, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, product_id, sku_code, attributes, price, stock_quantity, is_active, created_at, updated_at`,
      [
        product_id,
        sku_code.trim().toUpperCase(),
        typeof attributes === 'string' ? attributes : JSON.stringify(attributes),
        parseFloat(price).toFixed(2),
        parseInt(stock_quantity, 10),
        is_active
      ]
    );

    const row = res.rows[0];
    return {
      ...row,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
      price: parseFloat(row.price).toFixed(2),
      stock_quantity: parseInt(row.stock_quantity, 10)
    };
  }

  static async findById(id) {
    const res = await query(
      `SELECT s.id, s.product_id, s.sku_code, s.attributes, s.price, s.stock_quantity, s.is_active,
              s.created_at, s.updated_at,
              p.name AS product_name, p.slug AS product_slug, p.status AS product_status
       FROM skus s
       JOIN products p ON s.product_id = p.id
       WHERE s.id = $1`,
      [id]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
      price: parseFloat(row.price).toFixed(2),
      stock_quantity: parseInt(row.stock_quantity, 10)
    };
  }

  static async findByCode(skuCode) {
    const res = await query(
      `SELECT id, product_id, sku_code, attributes, price, stock_quantity, is_active, created_at, updated_at
       FROM skus
       WHERE UPPER(sku_code) = UPPER($1)`,
      [skuCode.trim()]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
      price: parseFloat(row.price).toFixed(2),
      stock_quantity: parseInt(row.stock_quantity, 10)
    };
  }

  static async findByProductId(productId) {
    const res = await query(
      `SELECT id, product_id, sku_code, attributes, price, stock_quantity, is_active, created_at, updated_at
       FROM skus
       WHERE product_id = $1
       ORDER BY id ASC`,
      [productId]
    );
    return res.rows.map(row => ({
      ...row,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
      price: parseFloat(row.price).toFixed(2),
      stock_quantity: parseInt(row.stock_quantity, 10)
    }));
  }

  static async update(id, fields) {
    const allowed = ['price', 'stock_quantity', 'is_active', 'sku_code'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        let val = fields[key];
        if (key === 'price') val = parseFloat(val).toFixed(2);
        if (key === 'stock_quantity') val = parseInt(val, 10);
        if (key === 'sku_code') val = String(val).trim().toUpperCase();
        updates.push(`${key} = $${paramIndex}`);
        values.push(val);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE skus
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, product_id, sku_code, attributes, price, stock_quantity, is_active, created_at, updated_at
    `;

    const res = await query(sql, values);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes,
      price: parseFloat(row.price).toFixed(2),
      stock_quantity: parseInt(row.stock_quantity, 10)
    };
  }

  static async delete(id) {
    const res = await query('DELETE FROM skus WHERE id = $1 RETURNING id', [id]);
    return res.rows[0] || null;
  }
}

module.exports = SkuModel;
