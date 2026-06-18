-- ===========================================================================
-- Marginalia — seed data
-- Hand-curated research-direction taxonomy (the map skeleton) + a few
-- hand-written foundational explainers so the site isn't empty on day one.
--
-- Apply after schema:  npm run db:seed:local   (or :remote)
-- Safe to re-run: uses INSERT OR IGNORE keyed on unique slugs.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Research directions — four branches: foundations, methods, applied, society
-- parent rows first, then children referencing them by slug via subselect.
-- ---------------------------------------------------------------------------

-- Top-level branch anchors
INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, sort_order) VALUES
('foundations', 'Foundations', 'foundations',
 'The core ideas that make modern AI work: how machines learn patterns from data.', 1),
('methods', 'Methods & Models', 'methods',
 'The building blocks researchers combine to build AI systems: architectures, training tricks, and ways to make models efficient.', 2),
('applied', 'AI for Good', 'applied',
 'Where AI meets real-world problems: health, climate, education, accessibility, and more.', 3),
('society', 'Safety & Society', 'society',
 'Making AI trustworthy: alignment, fairness, interpretability, and the human side of the technology.', 4);

-- Foundations children
INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'machine-learning', 'Machine Learning', 'foundations',
 'Teaching computers to improve at a task by showing them examples instead of writing explicit rules.',
 d.id, 1 FROM directions d WHERE d.slug = 'foundations';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'deep-learning', 'Deep Learning', 'foundations',
 'A family of methods that stack many simple layers so a model can learn rich patterns, the engine behind most modern AI.',
 d.id, 2 FROM directions d WHERE d.slug = 'foundations';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'reinforcement-learning', 'Reinforcement Learning', 'foundations',
 'Learning by trial and error: an agent takes actions, gets rewards, and figures out a strategy that works.',
 d.id, 3 FROM directions d WHERE d.slug = 'foundations';

-- Methods children
INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'large-language-models', 'Large Language Models', 'methods',
 'Models trained on huge amounts of text that can read, write, summarise, and reason in natural language.',
 d.id, 1 FROM directions d WHERE d.slug = 'methods';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'computer-vision', 'Computer Vision', 'methods',
 'Getting computers to understand images and video: recognising objects, scenes, and actions.',
 d.id, 2 FROM directions d WHERE d.slug = 'methods';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'generative-models', 'Generative Models', 'methods',
 'Models that create new things (images, text, audio, or video) rather than just classifying what already exists.',
 d.id, 3 FROM directions d WHERE d.slug = 'methods';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-agents', 'AI Agents', 'methods',
 'Systems that plan and take multi-step actions to reach a goal, often using tools or other models.',
 d.id, 4 FROM directions d WHERE d.slug = 'methods';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'efficient-ai', 'Efficient AI', 'methods',
 'Making models smaller, faster, and cheaper to run so AI can work on phones and modest hardware.',
 d.id, 5 FROM directions d WHERE d.slug = 'methods';

-- Applied (AI for Good) children
INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-for-health', 'AI for Health', 'applied',
 'Helping doctors and patients, from spotting disease in scans to discovering new medicines.',
 d.id, 1 FROM directions d WHERE d.slug = 'applied';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-for-climate', 'AI for Climate', 'applied',
 'Using AI to forecast weather, model the climate, and make energy systems cleaner and more efficient.',
 d.id, 2 FROM directions d WHERE d.slug = 'applied';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-for-education', 'AI for Education', 'applied',
 'Personalised tutoring, accessible learning, and tools that help teachers reach every student.',
 d.id, 3 FROM directions d WHERE d.slug = 'applied';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-for-accessibility', 'AI for Accessibility', 'applied',
 'Technology that opens the world up: live captions, image descriptions, and assistive communication.',
 d.id, 4 FROM directions d WHERE d.slug = 'applied';

-- Society children
INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'ai-alignment', 'Alignment', 'society',
 'Making sure AI systems actually do what people intend, even as they get more capable.',
 d.id, 1 FROM directions d WHERE d.slug = 'society';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'interpretability', 'Interpretability', 'society',
 'Opening the black box: understanding why a model made a particular decision.',
 d.id, 2 FROM directions d WHERE d.slug = 'society';

INSERT OR IGNORE INTO directions (slug, name, branch, plain_description, parent_id, sort_order)
SELECT 'fairness', 'Fairness & Bias', 'society',
 'Finding and fixing the ways AI can treat people unequally, so the technology works for everyone.',
 d.id, 3 FROM directions d WHERE d.slug = 'society';

-- ---------------------------------------------------------------------------
-- Glossary seed
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO glossary_terms (term, definition, status) VALUES
('neural network', 'A model loosely inspired by the brain, made of layers of simple units that pass numbers to each other to learn patterns.', 'approved'),
('transformer', 'A neural-network design that learns which parts of the input to pay attention to. It powers most modern language models.', 'approved'),
('training', 'The process of showing a model many examples and nudging its internal numbers until it gets good at a task.', 'approved'),
('parameter', 'One of the adjustable numbers inside a model. Big models have billions of them.', 'approved'),
('fine-tuning', 'Taking an already-trained model and training it a bit more on a specific task or style.', 'approved'),
('benchmark', 'A standard test used to compare how well different AI models perform on the same task.', 'approved'),
('inference', 'Actually using a trained model to make a prediction or generate an answer (as opposed to training it).', 'approved'),
('embedding', 'A way of turning words, images, or papers into lists of numbers so a computer can measure how similar they are.', 'approved');

-- ---------------------------------------------------------------------------
-- A reviewer identity for the hand-written seed articles
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO users (email, name, role) VALUES
('editorial@marginalia.org', 'Marginalia Editorial', 'editor');

-- ---------------------------------------------------------------------------
-- Hand-written foundational explainers (status = published).
-- These lock the article template + tone before the AI pipeline turns on.
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO articles
  (slug, arxiv_id, original_title, plain_title, hook, whats_going_on, why_it_matters,
   difficulty, read_minutes, is_ai4good, is_foundational, source_url, pdf_url,
   authors, institution, published_date, status, reviewer_name, ai_model,
   published_at)
VALUES
(
  'attention-is-all-you-need',
  '1706.03762',
  'Attention Is All You Need',
  'The idea that taught machines to read: meet the Transformer',
  'Almost every chatbot, translator, and AI writing tool you have used is built on the one idea introduced in this paper.',
  'Before 2017, computers read sentences one word at a time, in order, which made them slow and forgetful over long passages. This paper introduced the **Transformer**, a design built around an idea called *attention*: instead of reading strictly left to right, the model looks at every word at once and learns which other words matter most for understanding each one. When you read "the trophy did not fit in the suitcase because it was too big," you instantly know "it" means the trophy. Attention lets a model make that kind of connection. Removing the slow step-by-step reading also meant these models could be trained on far more text, far faster.',
  'The Transformer is the foundation under large language models like the ones powering today''s AI assistants. Understanding it is the single biggest "aha" for a newcomer, because once you see how attention works, the rest of modern AI starts to make sense. It is also a great example of how one clean idea, shared openly, can reshape an entire field within a few years.',
  'Beginner', 4, 0, 1,
  'https://arxiv.org/abs/1706.03762',
  'https://arxiv.org/pdf/1706.03762',
  '["Ashish Vaswani","Noam Shazeer","Niki Parmar","Jakob Uszkoreit","Llion Jones","Aidan N. Gomez","Lukasz Kaiser","Illia Polosukhin"]',
  'Google Brain / Google Research',
  '2017-06-12',
  'published',
  'Marginalia Editorial',
  'hand-written',
  datetime('now', '-2 days')
),
(
  'imagenet-deep-learning',
  '',
  'ImageNet Classification with Deep Convolutional Neural Networks',
  'The moment computers learned to see',
  'In 2012, one model cut image-recognition errors so dramatically that it kicked off the entire deep-learning boom.',
  'For decades, getting a computer to tell a cat from a dog in a photo was painfully hard. This work trained a deep **convolutional neural network**, a model that scans an image in small patches and gradually builds up from edges, to shapes, to whole objects, on a million labelled pictures. It crushed the previous record in a famous contest called ImageNet. Two things made it possible: a huge labelled dataset, and using graphics cards (GPUs) to do the heavy maths fast. The result was so far ahead of everything else that the whole research community pivoted to deep learning almost overnight.',
  'This is the spark that lit the modern AI era. It showed that with enough data and computing power, neural networks could beat hand-crafted methods at real perception tasks. Everything from medical-image analysis to self-driving-car vision traces back to this turning point. That makes it essential context for anyone trying to understand why AI suddenly got so good around the 2010s.',
  'Beginner', 4, 1, 1,
  'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html',
  '',
  '["Alex Krizhevsky","Ilya Sutskever","Geoffrey E. Hinton"]',
  'University of Toronto',
  '2012-12-03',
  'published',
  'Marginalia Editorial',
  'hand-written',
  datetime('now', '-1 days')
);

-- Tag the seed articles to directions
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d
WHERE a.slug = 'attention-is-all-you-need'
  AND d.slug IN ('large-language-models','deep-learning');

INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d
WHERE a.slug = 'imagenet-deep-learning'
  AND d.slug IN ('computer-vision','deep-learning');

-- Make the most recent foundational pick the current Article of the Day
UPDATE articles
SET is_article_of_day = 1, day_date = date('now')
WHERE slug = 'attention-is-all-you-need';

-- ---------------------------------------------------------------------------
-- Sample member annotations, so the right margin shows real notes on day one.
-- Idempotent: each note inserts only if an identical one isn't already there.
-- ---------------------------------------------------------------------------
INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Priya D.',
  'The "it" example is what finally made attention click for me. The model just learns what each word is pointing at.', 'approved'
FROM articles a WHERE a.slug = 'attention-is-all-you-need'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'The "it" example is what finally made attention click for me. The model just learns what each word is pointing at.');

INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Marcus L.',
  'If you have ever used Google Translate, you have used this paper. Still wild that it is only from 2017.', 'approved'
FROM articles a WHERE a.slug = 'attention-is-all-you-need'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'If you have ever used Google Translate, you have used this paper. Still wild that it is only from 2017.');

INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Sam B.',
  'Quick heads up: "attention" here is not the human kind. It is the model scoring how much each word should look at the others.', 'approved'
FROM articles a WHERE a.slug = 'attention-is-all-you-need'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'Quick heads up: "attention" here is not the human kind. It is the model scoring how much each word should look at the others.');

INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Jordan K.',
  'The real unlock here was the GPUs. The idea had been around for years, it just got fast enough to actually work.', 'approved'
FROM articles a WHERE a.slug = 'imagenet-deep-learning'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'The real unlock here was the GPUs. The idea had been around for years, it just got fast enough to actually work.');

INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Aisha N.',
  'This is the before-and-after moment for AI vision. A lot of self-driving research traces back to roughly here.', 'approved'
FROM articles a WHERE a.slug = 'imagenet-deep-learning'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'This is the before-and-after moment for AI vision. A lot of self-driving research traces back to roughly here.');

INSERT INTO annotations (article_id, author_name, body, status)
SELECT a.id, 'Leo M.',
  'Reminder that telling a cat from a dog used to be a genuinely hard research problem. We forget how big this jump was.', 'approved'
FROM articles a WHERE a.slug = 'imagenet-deep-learning'
  AND NOT EXISTS (SELECT 1 FROM annotations x WHERE x.article_id = a.id
    AND x.body = 'Reminder that telling a cat from a dog used to be a genuinely hard research problem. We forget how big this jump was.');
