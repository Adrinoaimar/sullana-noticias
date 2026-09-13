PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  facebook_url TEXT NOT NULL UNIQUE,
  facebook_identifier TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'FACEBOOK_PAGE',
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  trust_level TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (trust_level IN ('OFFICIAL', 'TRUSTED_MEDIA', 'COMMUNITY', 'BUSINESS', 'UNVERIFIED')),
  auto_draft INTEGER NOT NULL DEFAULT 1 CHECK (auto_draft IN (0, 1)),
  auto_publish INTEGER NOT NULL DEFAULT 0 CHECK (auto_publish IN (0, 1)),
  last_checked_at TEXT,
  last_success_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_posts (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_post_id TEXT,
  text TEXT NOT NULL DEFAULT '',
  post_url TEXT NOT NULL,
  image_url TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content_hash TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'NEW' CHECK (processing_status IN ('NEW', 'RELEVANT', 'NOT_RELEVANT', 'DUPLICATE', 'VERIFY', 'DRAFTED', 'PUBLISHED', 'REJECTED', 'ERROR')),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'VERIFY', 'VERIFIED')),
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  reactions_json TEXT,
  UNIQUE(source_id, external_post_id),
  UNIQUE(content_hash)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS news_drafts (
  id INTEGER PRIMARY KEY,
  raw_post_id INTEGER NOT NULL UNIQUE REFERENCES raw_posts(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  original_post_url TEXT NOT NULL,
  original_published_at TEXT,
  image_type TEXT NOT NULL DEFAULT 'NO_IMAGE' CHECK (image_type IN ('SOURCE_IMAGE', 'OWNED_IMAGE', 'AUTHORIZED_IMAGE', 'GENERATED_ASSET', 'NO_IMAGE')),
  image_url TEXT,
  editorial_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (editorial_status IN ('DRAFT', 'PUBLISHED', 'REJECTED')),
  verification_status TEXT NOT NULL DEFAULT 'VERIFY' CHECK (verification_status IN ('UNVERIFIED', 'VERIFY', 'VERIFIED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY,
  draft_id INTEGER NOT NULL UNIQUE REFERENCES news_drafts(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  meta_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  canonical_url TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  original_post_url TEXT NOT NULL,
  original_published_at TEXT,
  image_type TEXT NOT NULL DEFAULT 'NO_IMAGE',
  image_url TEXT,
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id INTEGER PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  sources_checked INTEGER NOT NULL DEFAULT 0,
  posts_found INTEGER NOT NULL DEFAULT 0,
  new_posts INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'ERROR')),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  event_name TEXT NOT NULL,
  article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_posts_status ON raw_posts(processing_status, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name, created_at DESC);
