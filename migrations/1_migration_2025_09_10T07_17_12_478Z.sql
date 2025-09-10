-- Generated migration SQL

CREATE TABLE users (
  id SERIAL NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT 'NOW()'
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE TABLE posts (
  id SERIAL NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT 'NOW()'
);

CREATE INDEX idx_posts_user_id ON posts (user_id);

