-- ============================================================================
-- SYSTEM — Citations initiales (Document 5, section 4) — 27 citations
-- À exécuter après schema.sql dans le SQL Editor de Supabase.
-- ============================================================================

insert into quotes (text, author, source) values
-- Sun Tzu — L'Art de la guerre
('Connais l''ennemi et connais-toi toi-même ; tu n''as rien à craindre de cent batailles.', 'Sun Tzu', 'L''Art de la guerre, III'),
('La suprême excellence consiste à vaincre sans combattre.', 'Sun Tzu', 'L''Art de la guerre, III'),
('Les occasions se multiplient à mesure qu''elles sont saisies.', 'Sun Tzu', 'L''Art de la guerre, V'),
-- Friedrich Nietzsche
('Ce qui ne me tue pas me rend plus fort.', 'Friedrich Nietzsche', 'Crépuscule des idoles, 1888'),
('Celui qui a un « pourquoi » peut supporter n''importe quel « comment ».', 'Friedrich Nietzsche', 'attribué'),
('Deviens ce que tu es.', 'Friedrich Nietzsche', 'attribué, d''après Pindare'),
-- Laozi — Tao Te King
('Un voyage de mille lieues commence toujours par un premier pas.', 'Laozi', 'Tao Te King, 64'),
('Celui qui connaît les autres est sage ; celui qui se connaît soi-même est éclairé.', 'Laozi', 'Tao Te King, 33'),
('L''homme supérieur est comme l''eau : il nourrit toutes choses sans lutter contre elles.', 'Laozi', 'Tao Te King, 8'),
-- Gengis Khan (attribuées)
('Je suis le fléau de Dieu. Si tu n''avais pas commis de grands péchés, Dieu ne t''aurait pas envoyé un châtiment tel que moi.', 'Gengis Khan', 'attribuée'),
('La plus grande joie d''un homme est de vaincre ceux qui l''affrontent, de les chasser, de prendre ce qui leur appartient.', 'Gengis Khan', 'attribuée'),
-- Miyamoto Musashi
('Ne fais rien qui soit inutile.', 'Miyamoto Musashi', 'Dokkōdō'),
('Accepte simplement ce qui arrive, sans te plaindre.', 'Miyamoto Musashi', 'Dokkōdō'),
('Apprends une chose et tu en connaîtras dix mille.', 'Miyamoto Musashi', 'attribuée au Traité des cinq anneaux'),
-- Nicolas Machiavel — Le Prince
('Chacun voit ce que tu parais être, peu sentent ce que tu es.', 'Nicolas Machiavel', 'Le Prince, XV'),
('Les hommes oublient plus vite la mort de leur père que la perte de leur patrimoine.', 'Nicolas Machiavel', 'Le Prince, XVII'),
('Il vaut mieux être craint qu''aimé, si l''on ne peut être l''un et l''autre.', 'Nicolas Machiavel', 'Le Prince, XVII'),
-- Les 48 lois du pouvoir — Robert Greene
('Ne surpasse jamais ton maître : ne décroche pas les lauriers qui appartiennent à autrui.', 'Les 48 lois du pouvoir', 'Loi 1'),
('Cache tes intentions : garde les gens dans l''ignorance et dans un étonnement perpétuel.', 'Les 48 lois du pouvoir', 'Loi 3'),
('Ne dépasse pas l''objectif poursuivi : dans la victoire, apprends quand t''arrêter.', 'Les 48 lois du pouvoir', 'Loi 47'),
-- 365 jours — méditation quotidienne
('Fais aujourd''hui ce que les autres ne veulent pas, tu vivras demain ce que les autres ne peuvent pas.', '365 jours', 'citation populaire'),
('La discipline est le pont entre les objectifs et l''accomplissement.', '365 jours', 'attribuée à Jim Rohn'),
('Petit à petit, l''oiseau fait son nid.', '365 jours', 'proverbe'),
-- Jésus-Christ
('Je suis le chemin, la vérité et la vie.', 'Jésus-Christ', 'Jean 14, 6'),
('Demandez, et l''on vous donnera ; cherchez, et vous trouverez ; frappez, et l''on vous ouvrira.', 'Jésus-Christ', 'Matthieu 7, 7'),
('Ne vous inquiétez donc pas du lendemain : le lendemain s''inquiétera de lui-même.', 'Jésus-Christ', 'Matthieu 6, 34'),
('Je vous donne un commandement nouveau : que vous vous aimiez les uns les autres.', 'Jésus-Christ', 'Jean 13, 34');
