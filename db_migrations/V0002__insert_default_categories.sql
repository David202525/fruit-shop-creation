INSERT INTO categories (name, slug, icon) VALUES
  ('Серверы', 'servers', 'Server'),
  ('Коммуникации', 'communications', 'MessageSquare'),
  ('Веб-сайты', 'websites', 'Globe'),
  ('Безопасность', 'security', 'Shield')
ON CONFLICT (slug) DO NOTHING;
