-- Generated migration SQL
-- Generated at: 2025-10-01T07:18:32.733Z

-- Create table: users
CREATE TABLE users (
  id SERIAL NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Create table: posts
CREATE TABLE posts (
  id SERIAL NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_author_id ON posts (author_id);

-- Create table: categories
CREATE TABLE categories (
  id SERIAL NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_categories_name ON categories (name);

-- Create table: post_categories
CREATE TABLE post_categories (
  post_id INT NOT NULL,
  category_id INT NOT NULL
);

CREATE INDEX idx_post_categories_post_id ON post_categories (post_id);
CREATE INDEX idx_post_categories_category_id ON post_categories (category_id);

-- table relation
-- Create relations for table: posts
ALTER TABLE posts ADD CONSTRAINT fk_posts_author_id FOREIGN KEY (author_id) REFERENCES users (id);

-- Create relations for table: post_categories
ALTER TABLE post_categories ADD CONSTRAINT fk_post_categories_post_id FOREIGN KEY (post_id) REFERENCES posts (id);
ALTER TABLE post_categories ADD CONSTRAINT fk_post_categories_category_id FOREIGN KEY (category_id) REFERENCES categories (id);

