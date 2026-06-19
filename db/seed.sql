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

-- ===========================================================================
-- Foundational backfill, one well-known paper per research direction so the
-- map, feed, and glossary are not sparse on day one. INSERT OR IGNORE on slug
-- makes this safe to re-run. All explainers are original plain-language summaries.
-- ===========================================================================
INSERT OR IGNORE INTO articles
  (slug, arxiv_id, original_title, plain_title, hook, whats_going_on, why_it_matters,
   difficulty, read_minutes, is_ai4good, is_foundational, source_url, pdf_url,
   authors, institution, published_date, status, reviewer_name, ai_model, published_at)
VALUES
(
  'deep-residual-learning', '1512.03385',
  'Deep Residual Learning for Image Recognition',
  'How to train very deep networks without them falling apart',
  'Stacking more layers used to make image models worse, not better. This paper found a simple trick that fixed it.',
  'Researchers wanted deeper networks because depth usually helps a model see more. Past a point, though, adding layers made accuracy drop even on the training data, which made no sense. The fix was the **residual connection**, a shortcut that lets a layer pass its input straight through and only learn the small change on top. With these shortcuts the team trained networks over a hundred layers deep and won the 2015 ImageNet contest by a wide margin.',
  'Residual connections are now in almost every large model, including the ones behind modern language and image tools. The idea is small and easy to add, which is part of why it spread so fast. It is a clean example of how one fix can unlock a whole direction of research.',
  'Beginner', 4, 0, 1,
  'https://arxiv.org/abs/1512.03385', 'https://arxiv.org/pdf/1512.03385',
  '["Kaiming He","Xiangyu Zhang","Shaoqing Ren","Jian Sun"]', 'Microsoft Research',
  '2015-12-10', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-3 days')
),
(
  'generative-adversarial-networks', '1406.2661',
  'Generative Adversarial Nets',
  'Two networks playing a forgery game taught computers to create',
  'Long before modern image generators, this paper had two networks compete, and the result was machines that could make new pictures from scratch.',
  'The setup is a game between two networks. One, the generator, tries to make fake images. The other, the discriminator, tries to tell fakes from real photos. As each gets better, the generator is pushed to make more convincing images, until its output starts to look real. This was one of the first methods that could **generate** believable new images instead of just sorting existing ones.',
  'This kicked off the wave of AI that creates rather than classifies. The adversarial idea showed up in art tools, photo editing, and data generation for years. Newer methods like diffusion have taken over for images, but the question it asked, how do you teach a machine to make something new, is still central.',
  'Intermediate', 4, 0, 1,
  'https://arxiv.org/abs/1406.2661', 'https://arxiv.org/pdf/1406.2661',
  '["Ian Goodfellow","Jean Pouget-Abadie","Mehdi Mirza","Bing Xu","David Warde-Farley","Sherjil Ozair","Aaron Courville","Yoshua Bengio"]', 'University of Montreal',
  '2014-06-10', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-4 days')
),
(
  'playing-atari-deep-rl', '1312.5602',
  'Playing Atari with Deep Reinforcement Learning',
  'One program that learned to play Atari games from the pixels',
  'This system learned to play dozens of Atari games on its own, using nothing but the screen and the score.',
  'Most game-playing programs are told the rules. This one was not. It saw only the raw pixels and the score, then learned by trial and error which actions led to more points. It paired that trial-and-error approach, called **reinforcement learning**, with a deep network that read the screen. On several games it reached or passed human skill, all from the same setup with no game-specific tuning.',
  'This was a striking proof that one general method could learn many different tasks from scratch. It launched a decade of work on agents that learn by doing, leading to systems that play Go, control robots, and tune other AI. It is the cleanest early example of learning a skill purely from feedback.',
  'Intermediate', 4, 0, 1,
  'https://arxiv.org/abs/1312.5602', 'https://arxiv.org/pdf/1312.5602',
  '["Volodymyr Mnih","Koray Kavukcuoglu","David Silver","Alex Graves","Ioannis Antonoglou","Daan Wierstra","Martin Riedmiller"]', 'DeepMind',
  '2013-12-19', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-5 days')
),
(
  'alphafold-protein-structure', '',
  'Highly accurate protein structure prediction with AlphaFold',
  'The AI that cracked a 50-year-old biology puzzle',
  'Working out the shape a protein folds into took scientists months in a lab. This system does it in minutes, often near perfectly.',
  'Proteins are chains of building blocks that fold into 3D shapes, and the shape decides what the protein does. Predicting that shape from the chain alone was an open problem for fifty years. **AlphaFold** learned the patterns from known structures and now predicts shapes with accuracy close to lab experiments. Its team later released predicted shapes for nearly every known protein, for free.',
  'This is one of the clearest cases of AI speeding up real science. Researchers use the predictions to study diseases, design medicines, and understand life at the molecular level. It moved a hard problem from years of lab work to an afternoon on a computer.',
  'Beginner', 4, 1, 1,
  'https://www.nature.com/articles/s41586-021-03819-2', '',
  '["John Jumper","Richard Evans","Alexander Pritzel","Demis Hassabis"]', 'DeepMind',
  '2021-07-15', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-6 days')
),
(
  'graphcast-weather-forecasting', '2212.12794',
  'GraphCast: Learning skillful medium-range global weather forecasting',
  'A weather model that keeps up with the supercomputers',
  'This model predicts ten days of global weather in under a minute, and it is often more accurate than the traditional forecast.',
  'Standard forecasts run huge physics simulations on supercomputers. **GraphCast** instead learned from decades of past weather and predicts the next steps directly. It produces a ten-day global forecast in well under a minute, and in tests it matched or beat the leading physics-based system on most measures, including the tracks of major storms.',
  'Faster, cheaper forecasts help with everything from daily planning to early warnings for extreme weather. It also shows learned models can rival decades of carefully built physics code in a serious scientific field. That makes it a strong example of AI pointed at a real-world problem.',
  'Intermediate', 4, 1, 0,
  'https://arxiv.org/abs/2212.12794', 'https://arxiv.org/pdf/2212.12794',
  '["Remi Lam","Alvaro Sanchez-Gonzalez","Matthew Willson","Peter Battaglia"]', 'Google DeepMind',
  '2022-12-24', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-7 days')
),
(
  'concrete-problems-ai-safety', '1606.06565',
  'Concrete Problems in AI Safety',
  'A practical checklist of ways AI can go wrong',
  'Instead of distant doom, this paper lists the small, concrete ways an AI can do the wrong thing while looking like it is working.',
  'The authors set aside science-fiction worries and focus on everyday failure modes. Examples include a cleaning robot that knocks things over to finish faster, a system that games its own reward, or one that behaves well in testing but not in the real world. For each problem they suggest research directions to study it. The point is to make safety a normal engineering topic with clear, testable questions.',
  'This paper helped turn AI safety from a vague worry into a working research field. Many of the problems it named are now active areas, especially as models are given more freedom to act. It is a good starting point for anyone who wants to understand what alignment actually means in practice.',
  'Beginner', 4, 0, 1,
  'https://arxiv.org/abs/1606.06565', 'https://arxiv.org/pdf/1606.06565',
  '["Dario Amodei","Chris Olah","Jacob Steinhardt","Paul Christiano","John Schulman","Dan Mane"]', 'Google Brain and OpenAI',
  '2016-06-21', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-8 days')
),
(
  'model-cards', '1810.03993',
  'Model Cards for Model Reporting',
  'A short label that says what an AI model is and is not good for',
  'Food comes with a nutrition label. This paper proposes the same idea for AI models, so people know where they work and where they fail.',
  'A **model card** is a short document that ships with a model. It says what the model was built for, how it was tested, and where it performs worse, for example across different groups of people. The goal is to surface gaps in fairness and reliability before the model is used in the real world, rather than after something goes wrong.',
  'Model cards are now common practice at major AI labs and on model-sharing sites. They are a simple, low-cost step toward using AI responsibly, and they make it harder to quietly ship a model that fails for some people. This is a practical piece of the fairness and accountability conversation.',
  'Beginner', 3, 1, 0,
  'https://arxiv.org/abs/1810.03993', 'https://arxiv.org/pdf/1810.03993',
  '["Margaret Mitchell","Simone Wu","Andrew Zaldivar","Timnit Gebru"]', 'Google',
  '2018-10-05', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-9 days')
),
(
  'bert-language-understanding', '1810.04805',
  'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
  'The model that taught computers to read both directions at once',
  'For a few years, this one model quietly powered a huge chunk of Google Search and a wave of language tools.',
  'Earlier models read text left to right. **BERT** reads the whole sentence at once, looking both ways, which helps it understand how words depend on each other. It learns by playing fill-in-the-blank on huge amounts of text: hide a word, guess it from the context. After that general training, it can be quickly adapted to specific jobs like answering questions or judging sentiment.',
  'BERT made the now-standard recipe popular: train one big model on lots of text, then fine-tune it for each task. That recipe is behind most modern language tools. It also went straight into real products, including search, soon after release.',
  'Intermediate', 4, 0, 1,
  'https://arxiv.org/abs/1810.04805', 'https://arxiv.org/pdf/1810.04805',
  '["Jacob Devlin","Ming-Wei Chang","Kenton Lee","Kristina Toutanova"]', 'Google AI Language',
  '2018-10-11', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-10 days')
),
(
  'word2vec-word-embeddings', '1301.3781',
  'Efficient Estimation of Word Representations in Vector Space',
  'Turning words into numbers that capture meaning',
  'This paper showed you can turn words into lists of numbers where "king minus man plus woman" lands near "queen".',
  'Computers need numbers, not words. **Word2Vec** learns to place each word at a point in space so that words used in similar ways sit close together. A surprising result was that simple arithmetic on these points captured real relationships, like capital cities to their countries. It learned all of this just by reading lots of text and predicting nearby words.',
  'Turning words into meaningful numbers, called **embeddings**, became a building block for nearly all language AI that followed. The same idea now applies to images, products, and papers. It is one of the most practical ideas a newcomer can pick up early.',
  'Beginner', 3, 0, 1,
  'https://arxiv.org/abs/1301.3781', 'https://arxiv.org/pdf/1301.3781',
  '["Tomas Mikolov","Kai Chen","Greg Corrado","Jeffrey Dean"]', 'Google',
  '2013-01-16', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-11 days')
),
(
  'knowledge-distillation', '1503.02531',
  'Distilling the Knowledge in a Neural Network',
  'Teaching a small model to copy a big one',
  'Big models are accurate but slow. This paper shows how to pour most of that skill into a small, fast model.',
  'The trick is to train a small student model to copy the outputs of a large teacher model, not just the right answers but how confident the teacher is across all the options. Those soft signals carry extra hints that help the student learn more than it could from the labels alone. The result is a smaller model that runs faster and cheaper while keeping much of the accuracy. This is called **distillation**.',
  'Distillation is a big reason capable AI can run on phones and in browsers. As models get larger, shrinking them down without losing much skill becomes more valuable. It is one of the core tools for making AI practical and affordable.',
  'Intermediate', 3, 0, 0,
  'https://arxiv.org/abs/1503.02531', 'https://arxiv.org/pdf/1503.02531',
  '["Geoffrey Hinton","Oriol Vinyals","Jeff Dean"]', 'Google',
  '2015-03-09', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-12 days')
),
(
  'grad-cam-explanations', '1610.02391',
  'Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization',
  'A heatmap that shows where a model is actually looking',
  'When an image model says "dog", this method draws a heatmap over the photo showing which pixels made it decide that.',
  'Deep models are often a black box: they give an answer with no reason. **Grad-CAM** highlights the parts of an image that pushed the model toward its prediction, producing a rough heatmap over the picture. If the model says "train" but the heatmap lights up the rails instead of the train, you have learned something about how it really works, and where it might be fooled.',
  'Being able to see why a model decided something matters a lot in areas like medicine, where a wrong reason is dangerous even when the answer happens to be right. Grad-CAM made this kind of check simple and popular. It is a practical entry point into interpretability, the study of opening the black box.',
  'Intermediate', 3, 0, 0,
  'https://arxiv.org/abs/1610.02391', 'https://arxiv.org/pdf/1610.02391',
  '["Ramprasaath R. Selvaraju","Michael Cogswell","Abhishek Das","Ramakrishna Vedantam","Devi Parikh","Dhruv Batra"]', 'Georgia Institute of Technology',
  '2016-10-07', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-13 days')
),
(
  'react-reasoning-acting', '2210.03629',
  'ReAct: Synergizing Reasoning and Acting in Language Models',
  'Letting a language model think out loud and use tools',
  'This paper lets a model switch between reasoning step by step and taking actions, like looking something up, so it can solve tasks it could not before.',
  'A plain language model answers in one shot and cannot check facts. **ReAct** has the model interleave two things: a short thought about what to do next, and an action such as searching a database or a website. It reads the result, thinks again, and continues until it has an answer. This loop lets the model gather information it did not memorise and correct itself along the way.',
  'This think-and-act loop is the backbone of modern AI **agents**, the systems that browse, use tools, and complete multi-step tasks. It made models far more useful for real work than answering from memory alone. If you have seen an AI search the web and reason about what it finds, this is the idea underneath.',
  'Intermediate', 4, 0, 0,
  'https://arxiv.org/abs/2210.03629', 'https://arxiv.org/pdf/2210.03629',
  '["Shunyu Yao","Jeffrey Zhao","Dian Yu","Nan Du","Izhak Shafran","Karthik Narasimhan","Yuan Cao"]', 'Princeton University and Google Research',
  '2022-10-06', 'published', 'Marginalia Editorial', 'hand-written', datetime('now','-14 days')
);

-- Tag the backfill articles to their research directions.
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='deep-residual-learning' AND d.slug IN ('computer-vision','deep-learning');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='generative-adversarial-networks' AND d.slug IN ('generative-models');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='playing-atari-deep-rl' AND d.slug IN ('reinforcement-learning');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='alphafold-protein-structure' AND d.slug IN ('ai-for-health');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='graphcast-weather-forecasting' AND d.slug IN ('ai-for-climate');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='concrete-problems-ai-safety' AND d.slug IN ('ai-alignment');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='model-cards' AND d.slug IN ('fairness');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='bert-language-understanding' AND d.slug IN ('large-language-models');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='word2vec-word-embeddings' AND d.slug IN ('machine-learning');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='knowledge-distillation' AND d.slug IN ('efficient-ai');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='grad-cam-explanations' AND d.slug IN ('interpretability');
INSERT OR IGNORE INTO article_directions (article_id, direction_id)
SELECT a.id, d.id FROM articles a, directions d WHERE a.slug='react-reasoning-acting' AND d.slug IN ('ai-agents');

-- More plain-language glossary terms, growing the dictionary alongside the articles.
INSERT OR IGNORE INTO glossary_terms (term, definition, status) VALUES
('gradient descent', 'The basic training loop: nudge the model a tiny step in the direction that lowers its error, then repeat many times.', 'approved'),
('overfitting', 'When a model memorises its training examples instead of the general pattern, so it looks great in practice and fails on anything new.', 'approved'),
('convolution', 'A small filter slid across an image to pick up local features like edges and textures. The core operation in most vision models.', 'approved'),
('generative model', 'A model that creates new content, such as images or text, rather than sorting or scoring things that already exist.', 'approved'),
('diffusion model', 'A way to generate images by starting from pure noise and removing it step by step until a picture appears. The method behind most modern image generators.', 'approved'),
('reinforcement learning', 'Learning by trial and error: an agent takes actions, gets rewards, and works out a strategy that earns more reward.', 'approved'),
('hallucination', 'When an AI states something false with confidence. Common in language models because they predict fluent text, not verified facts.', 'approved'),
('bias', 'Systematic unfairness in a model, often because the data it learned from was unbalanced, which can mean worse results for some groups of people.', 'approved'),
('distillation', 'Training a small, fast model to copy a large, accurate one, so you keep most of the skill at a fraction of the cost.', 'approved'),
('tokenization', 'Splitting text into the small chunks, called tokens, that a language model actually reads. A token is often a word piece, not a whole word.', 'approved'),
('backpropagation', 'The method that works out how much each parameter contributed to the error, so training knows which way to adjust them.', 'approved'),
('agent', 'An AI system that takes several steps toward a goal, often planning, using tools, or calling other models along the way.', 'approved');
