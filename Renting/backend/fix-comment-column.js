// fix-comment-column.js
// Run this ONCE to fix the Review.comment column: VARCHAR(255) → TEXT
// Usage: node fix-comment-column.js

const pool = require('./db');

async function fixCommentColumn() {
  try {
    console.log('Connecting to database...');

    // Check current column type first
    const [cols] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'renting_db' 
        AND TABLE_NAME   = 'Review' 
        AND COLUMN_NAME  = 'comment'
    `);

    if (cols.length > 0) {
      console.log('Current comment column type:', cols[0].COLUMN_TYPE);
      if (cols[0].COLUMN_TYPE.toLowerCase().includes('text')) {
        console.log('✅ Column is already TEXT — no change needed.');
        process.exit(0);
      }
    }

    // Alter the column
    await pool.execute('ALTER TABLE Review MODIFY COLUMN comment TEXT');
    console.log('✅ Success! Review.comment is now TEXT (supports unlimited characters).');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixCommentColumn();
