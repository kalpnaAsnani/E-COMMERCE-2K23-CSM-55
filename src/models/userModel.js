/**
 * User Data Model
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findByEmail(email) {
    const res = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await query(
      'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  static async create({ email, password, firstName, lastName, role = 'customer' }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const res = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, first_name, last_name, role, created_at, updated_at`,
      [email.toLowerCase().trim(), passwordHash, firstName.trim(), lastName.trim(), role]
    );
    return res.rows[0];
  }

  static async verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

module.exports = UserModel;
