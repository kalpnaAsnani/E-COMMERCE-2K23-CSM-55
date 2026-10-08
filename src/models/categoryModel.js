/**
 * Category Data Model
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { query } = require('../config/database');

class CategoryModel {
  static async create({ name, slug, description = null, parent_id = null, is_active = true }) {
    const res = await query(
      `INSERT INTO categories (name, slug, description, parent_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, parent_id, name, slug, description, is_active, created_at, updated_at`,
      [name.trim(), slug.trim().toLowerCase(), description, parent_id, is_active]
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await query(
      `SELECT c.id, c.parent_id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at,
              p.name AS parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findBySlug(slug) {
    const res = await query(
      `SELECT id, parent_id, name, slug, description, is_active, created_at, updated_at
       FROM categories
       WHERE slug = $1`,
      [slug.trim().toLowerCase()]
    );
    return res.rows[0] || null;
  }

  static async findAll({ activeOnly = false } = {}) {
    let sql = `
      SELECT c.id, c.parent_id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at,
             p.name AS parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
    `;
    const params = [];

    if (activeOnly) {
      sql += ' WHERE c.is_active = true';
    }

    sql += ' ORDER BY c.parent_id NULLS FIRST, c.name ASC';

    const res = await query(sql, params);
    return res.rows;
  }

  static async update(id, fields) {
    const allowed = ['name', 'slug', 'description', 'parent_id', 'is_active'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        let val = fields[key];
        if (key === 'slug') val = String(val).trim().toLowerCase();
        if (key === 'name') val = String(val).trim();
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
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, parent_id, name, slug, description, is_active, created_at, updated_at
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  }

  static async deactivate(id) {
    return this.update(id, { is_active: false });
  }

  static async delete(id) {
    const res = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return res.rows[0] || null;
  }
}

module.exports = CategoryModel;
