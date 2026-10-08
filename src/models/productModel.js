/**
 * Product & Variant Data Model
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { query } = require('../config/database');

class ProductModel {
  static async create({ category_id, name, slug, description = null, status = 'draft', specifications = {} }) {
    const res = await query(
      `INSERT INTO products (category_id, name, slug, description, status, specifications, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, category_id, name, slug, description, status, specifications, created_at, updated_at`,
      [
        category_id,
        name.trim(),
        slug.trim().toLowerCase(),
        description,
        status,
        typeof specifications === 'string' ? specifications : JSON.stringify(specifications)
      ]
    );
    const row = res.rows[0];
    return {
      ...row,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications
    };
  }

  static async findById(id) {
    const res = await query(
      `SELECT p.id, p.category_id, p.name, p.slug, p.description, p.status, p.specifications,
              p.created_at, p.updated_at,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications
    };
  }

  static async findBySlug(slug) {
    const res = await query(
      `SELECT p.id, p.category_id, p.name, p.slug, p.description, p.status, p.specifications,
              p.created_at, p.updated_at,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1`,
      [slug.trim().toLowerCase()]
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications
    };
  }

  static async findAll({ status, category_id, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT p.id, p.category_id, p.name, p.slug, p.description, p.status, p.specifications,
             p.created_at, p.updated_at,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
    const params = [];
    const where = [];

    if (status) {
      params.push(status);
      where.push(`p.status = $${params.length}`);
    }

    if (category_id) {
      params.push(category_id);
      where.push(`p.category_id = $${params.length}`);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await query(sql, params);
    const products = res.rows.map(row => ({
      ...row,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications
    }));

    if (products.length === 0) return [];

    const productIds = products.map(p => p.id);
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
    const skusRes = await query(
      `SELECT product_id, stock_quantity FROM skus WHERE product_id IN (${placeholders})`,
      productIds
    );

    const skuMap = new Map();
    for (const s of skusRes.rows) {
      if (!skuMap.has(s.product_id)) skuMap.set(s.product_id, { count: 0, totalStock: 0 });
      const entry = skuMap.get(s.product_id);
      entry.count++;
      entry.totalStock += parseInt(s.stock_quantity, 10);
    }

    return products.map(p => {
      const meta = skuMap.get(p.id) || { count: 0, totalStock: 0 };
      return {
        ...p,
        sku_count: meta.count,
        total_stock: meta.totalStock
      };
    });
  }

  static async update(id, fields) {
    const allowed = ['name', 'slug', 'description', 'category_id', 'status', 'specifications'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        let val = fields[key];
        if (key === 'slug') val = String(val).trim().toLowerCase();
        if (key === 'name') val = String(val).trim();
        if (key === 'specifications' && typeof val === 'object') {
          val = JSON.stringify(val);
        }
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
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, category_id, name, slug, description, status, specifications, created_at, updated_at
    `;

    const res = await query(sql, values);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      specifications: typeof row.specifications === 'string' ? JSON.parse(row.specifications) : row.specifications
    };
  }

  static async delete(id) {
    const res = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return res.rows[0] || null;
  }

  static async addVariant(productId, { name, options = [] }) {
    const res = await query(
      `INSERT INTO variants (product_id, name, options, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING id, product_id, name, options, created_at`,
      [productId, name.trim(), typeof options === 'string' ? options : JSON.stringify(options)]
    );
    const row = res.rows[0];
    return {
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    };
  }

  static async getVariants(productId) {
    const res = await query(
      `SELECT id, product_id, name, options, created_at
       FROM variants
       WHERE product_id = $1
       ORDER BY id ASC`,
      [productId]
    );
    return res.rows.map(row => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    }));
  }

  static async getSkus(productId) {
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

  static async getAssets(productId) {
    const res = await query(
      `SELECT id, product_id, sku_id, url, role, alt_text, sort_order, created_at
       FROM assets
       WHERE product_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [productId]
    );
    return res.rows;
  }
}

module.exports = ProductModel;
