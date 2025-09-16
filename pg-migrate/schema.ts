// schema.ts - Database schema definition
const schema = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'SERIAL', primaryKey: true },
      { name: 'email', type: 'VARCHAR(255)', nullable: false },
      { name: 'name', type: 'VARCHAR(255)', nullable: false },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'NOW()' }
    ],
    indexes: [
      { name: 'idx_users_email', columns: ['email'], unique: true }
    ]
  },
  {
    name: 'posts',
    columns: [
      { name: 'id', type: 'SERIAL', primaryKey: true },
      { name: 'title', type: 'VARCHAR(255)', nullable: false },
      { name: 'content', type: 'TEXT', nullable: true },
      { name: 'author_id', type: 'INT', nullable: false },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'NOW()' }
    ],
    indexes: [
      { name: 'idx_posts_author_id', columns: ['author_id'] }
    ],
    relations: [
      { type: 'many-to-one', columns: ['author_id'], reference: { table: 'users', columns: ['id'] } }
    ]
  },
  {
    name: 'categories',
    columns: [
      { name: 'id', type: 'SERIAL', primaryKey: true },
      { name: 'name', type: 'VARCHAR(255)', nullable: false },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'NOW()' }
    ],
    indexes: [
      { name: 'idx_categories_name', columns: ['name'], unique: true }
    ]
  },
  {
    name: 'post_categories',
    columns: [
      { name: 'post_id', type: 'INT', nullable: false },
      { name: 'category_id', type: 'INT', nullable: false }
    ],
    indexes: [
      { name: 'idx_post_categories_post_id', columns: ['post_id'] },
      { name: 'idx_post_categories_category_id', columns: ['category_id'] }
    ],
    relations: [
      { type: 'many-to-one', columns: ['post_id'], reference: { table: 'posts', columns: ['id'] } },
      { type: 'many-to-one', columns: ['category_id'], reference: { table: 'categories', columns: ['id'] } }
    ],
    constraints: [
      { type: 'unique', name: 'uniq_post_category', columns: ['post_id', 'category_id'] }
      // or use composite primary:
      // { type: 'primary', name: 'pk_post_category', columns: ['post_id', 'category_id'] }
    ]
  }
]

export default schema;
