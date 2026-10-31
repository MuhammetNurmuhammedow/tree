-- seed_turkmen_trees.sql
BEGIN;

-- 1. Arassalamak (Öňki ähli baglanyşyk şemalaryny we agaçlaryny pozmak)
TRUNCATE TABLE relationships, persons, trees CASCADE;

-- 2. 4 Sany Täze Türkmen Agaçlaryny Döretmek
INSERT INTO trees (id, name, description, owner_name, is_owner, created_at) VALUES
('my-tree', 'Berdiýewler Maşgala Agajy', 'Meniň maşgala nesil agajym (Doly redaktirleme rugsady bar)', 'Merdan Berdiýew', TRUE, NOW()),
('tree-amanow', 'Amanowlar Maşgala Agajy', 'Mary welaýatynyň taryhy sülalesi (Gözden geçirme)', 'Serdar Amanow', FALSE, NOW() - INTERVAL '15 days'),
('tree-gurbanow', 'Gurbanowlar Maşgala Agajy', 'Daşoguz welaýatyndan bolan ata-babalarymyzyň agajy (Gözden geçirme)', 'Röwşen Gurbanow', FALSE, NOW() - INTERVAL '30 days'),
('tree-myradow', 'Myradowlar Maşgala Agajy', 'Balkan welaýatynyň Hazar ýakasy nesil agajy (Gözden geçirme)', 'Şöhrat Myradow', FALSE, NOW() - INTERVAL '45 days');

-- 3. AGAÇ 1: Berdiýewler Maşgala Agajy (my-tree - 14 agza, 4 nesil)
-- Garry ata-eneler (Nesil 1)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000001', 'my-tree', 'Oraz', 'Berdiýew', 'male', '1940-04-12', 'Aşgabat', false, 'Ata tarapdan uly garry ata. Beýik Watançylyk urşundan soňky gurluşyklarda zähmet çeken inžener.'),
('11111111-0001-0000-0000-000000000002', 'my-tree', 'Gülşirin', 'Berdiýewa', 'female', '1944-08-25', 'Aşgabat', true, 'Ata tarapdan garry ene. Mugallym bolup köp ýyl işlän.');
UPDATE persons SET maiden_name = 'Annaýewa' WHERE id = '11111111-0001-0000-0000-000000000002';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000003', 'my-tree', 'Nazar', 'Saparow', 'male', '1942-11-03', 'Mary', false, 'Ene tarapdan garry ata. Taryhçy alym.'),
('11111111-0001-0000-0000-000000000004', 'my-tree', 'Ogulbagt', 'Saparowa', 'female', '1946-02-18', 'Mary', true, 'Ene tarapdan garry ene. Halypa el hünärmeni.');
UPDATE persons SET maiden_name = 'Meredowa' WHERE id = '11111111-0001-0000-0000-000000000004';

-- Ene-atalar, Daýylar (Nesil 2)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000005', 'my-tree', 'Batyr', 'Berdiýew', 'male', '1968-05-15', 'Aşgabat', true, 'Kakam. Ykdysatçy, maşgala baştutany.'),
('11111111-0001-0000-0000-000000000006', 'my-tree', 'Maral', 'Berdiýewa', 'female', '1972-09-20', 'Mary', true, 'Ejem. Lukman, maşgala lukmany.');
UPDATE persons SET maiden_name = 'Saparowa' WHERE id = '11111111-0001-0000-0000-000000000006';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000007', 'my-tree', 'Döwlet', 'Berdiýew', 'male', '1974-03-10', 'Aşgabat', true, 'Kakamiň dogany (Daýy/Kakaň inisi). Telekeçi.'),
('11111111-0001-0000-0000-000000000008', 'my-tree', 'Aýgül', 'Berdiýewa', 'female', '1978-07-14', 'Ahal, Änew', true, 'Gelnejem.');
UPDATE persons SET maiden_name = 'Kulyýewa' WHERE id = '11111111-0001-0000-0000-000000000008';

-- Esasy Şahs, Ýanýoldaşy, Uýasy, Doganoglan (Nesil 3)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000009', 'my-tree', 'Merdan', 'Berdiýew', 'male', '1995-06-12', 'Aşgabat', true, 'Agajyň eýesi (Men). Programma üpjünçiligi inženeri.'),
('11111111-0001-0000-0000-000000000010', 'my-tree', 'Selbi', 'Berdiýewa', 'female', '1998-10-05', 'Aşgabat', true, 'Ýanýoldaşym. Lingwist we terjimeçi.');
UPDATE persons SET maiden_name = 'Ýusubowa' WHERE id = '11111111-0001-0000-0000-000000000010';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000011', 'my-tree', 'Jennet', 'Berdiýewa', 'female', '2001-01-22', 'Aşgabat', true, 'Uýam. Sungatşynas.'),
('11111111-0001-0000-0000-000000000012', 'my-tree', 'Resul', 'Berdiýew', 'male', '2003-12-08', 'Aşgabat', true, 'Doganoglanym (Döwlet daýymyň ogly). Talyby.');

-- Çagalar / Agtyklar (Nesil 4)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('11111111-0001-0000-0000-000000000013', 'my-tree', 'Allanur', 'Berdiýew', 'male', '2021-04-18', 'Aşgabat', true, 'Oglum.'),
('11111111-0001-0000-0000-000000000014', 'my-tree', 'Aýlar', 'Berdiýewa', 'female', '2023-09-02', 'Aşgabat', true, 'Gyzym.');

-- Berdiýewler Baglanyşyklary (Relationships)
-- 1. Nesil Nikalary
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('my-tree', '11111111-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000002', 'spouse', '1966-06-10'),
('my-tree', '11111111-0001-0000-0000-000000000003', '11111111-0001-0000-0000-000000000004', 'spouse', '1970-10-15');

-- 2. Nesil Çagalar (Ata tarap: Batyr & Döwlet)
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('my-tree', '11111111-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000005', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000005', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000001', '11111111-0001-0000-0000-000000000007', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000002', '11111111-0001-0000-0000-000000000007', 'parent');

-- Ene tarap: Maral
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('my-tree', '11111111-0001-0000-0000-000000000003', '11111111-0001-0000-0000-000000000006', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000004', '11111111-0001-0000-0000-000000000006', 'parent');

-- 2. Nesil Nikalary (Batyr <-> Maral, Döwlet <-> Aýgül)
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('my-tree', '11111111-0001-0000-0000-000000000005', '11111111-0001-0000-0000-000000000006', 'spouse', '1993-08-20'),
('my-tree', '11111111-0001-0000-0000-000000000007', '11111111-0001-0000-0000-000000000008', 'spouse', '1999-05-12');

-- 3. Nesil Çagalar (Batyr & Maral -> Merdan & Jennet)
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('my-tree', '11111111-0001-0000-0000-000000000005', '11111111-0001-0000-0000-000000000009', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000006', '11111111-0001-0000-0000-000000000009', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000005', '11111111-0001-0000-0000-000000000011', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000006', '11111111-0001-0000-0000-000000000011', 'parent');

-- Döwlet & Aýgül -> Resul
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('my-tree', '11111111-0001-0000-0000-000000000007', '11111111-0001-0000-0000-000000000012', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000008', '11111111-0001-0000-0000-000000000012', 'parent');

-- 3. Nesil Nika (Merdan <-> Selbi)
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('my-tree', '11111111-0001-0000-0000-000000000009', '11111111-0001-0000-0000-000000000010', 'spouse', '2019-11-09');

-- 4. Nesil Çagalar (Merdan & Selbi -> Allanur & Aýlar)
INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('my-tree', '11111111-0001-0000-0000-000000000009', '11111111-0001-0000-0000-000000000013', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000010', '11111111-0001-0000-0000-000000000013', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000009', '11111111-0001-0000-0000-000000000014', 'parent'),
('my-tree', '11111111-0001-0000-0000-000000000010', '11111111-0001-0000-0000-000000000014', 'parent');


-- 4. AGAÇ 2: Amanowlar Maşgala Agajy (tree-amanow - 7 agza, Mary)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('22222222-0002-0000-0000-000000000001', 'tree-amanow', 'Muhammet', 'Amanow', 'male', '1945-02-14', 'Mary', false, 'Mary sebitiniň abraýly ýaşulysy.'),
('22222222-0002-0000-0000-000000000002', 'tree-amanow', 'Täzegül', 'Amanowa', 'female', '1949-06-21', 'Baýramaly', true, 'Garry ene.');
UPDATE persons SET maiden_name = 'Durdyýewa' WHERE id = '22222222-0002-0000-0000-000000000002';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('22222222-0002-0000-0000-000000000003', 'tree-amanow', 'Serdar', 'Amanow', 'male', '1975-08-30', 'Mary', true, 'Agajyň eýesi. Oba hojalyk hünärmeni.'),
('22222222-0002-0000-0000-000000000004', 'tree-amanow', 'Gözel', 'Amanowa', 'female', '1979-03-12', 'Mary', true, 'Mugallym.');
UPDATE persons SET maiden_name = 'Begmyradowa' WHERE id = '22222222-0002-0000-0000-000000000004';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('22222222-0002-0000-0000-000000000005', 'tree-amanow', 'Maksat', 'Amanow', 'male', '1982-11-19', 'Mary', true, 'Inisi. Inžener.'),
('22222222-0002-0000-0000-000000000006', 'tree-amanow', 'Yhlas', 'Amanow', 'male', '2004-05-14', 'Mary', true, 'Talyp.'),
('22222222-0002-0000-0000-000000000007', 'tree-amanow', 'Leýli', 'Amanowa', 'female', '2008-09-28', 'Mary', true, 'Mekdep okuwçysy.');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('tree-amanow', '22222222-0002-0000-0000-000000000001', '22222222-0002-0000-0000-000000000002', 'spouse', '1972-04-18'),
('tree-amanow', '22222222-0002-0000-0000-000000000003', '22222222-0002-0000-0000-000000000004', 'spouse', '2001-09-08');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('tree-amanow', '22222222-0002-0000-0000-000000000001', '22222222-0002-0000-0000-000000000003', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000002', '22222222-0002-0000-0000-000000000003', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000001', '22222222-0002-0000-0000-000000000005', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000002', '22222222-0002-0000-0000-000000000005', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000003', '22222222-0002-0000-0000-000000000006', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000004', '22222222-0002-0000-0000-000000000006', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000003', '22222222-0002-0000-0000-000000000007', 'parent'),
('tree-amanow', '22222222-0002-0000-0000-000000000004', '22222222-0002-0000-0000-000000000007', 'parent');


-- 5. AGAÇ 3: Gurbanowlar Maşgala Agajy (tree-gurbanow - 6 agza, Daşoguz)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('33333333-0003-0000-0000-000000000001', 'tree-gurbanow', 'Baýram', 'Gurbanow', 'male', '1938-03-24', 'Daşoguz', false, 'Garry ata. Zähmet weterany.'),
('33333333-0003-0000-0000-000000000002', 'tree-gurbanow', 'Ogulşat', 'Gurbanowa', 'female', '1943-11-15', 'Köneürgenç', true, 'Garry ene.');
UPDATE persons SET maiden_name = 'Rejepowa' WHERE id = '33333333-0003-0000-0000-000000000002';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('33333333-0003-0000-0000-000000000003', 'tree-gurbanow', 'Röwşen', 'Gurbanow', 'male', '1970-07-04', 'Daşoguz', true, 'Agajyň eýesi. Lukman.'),
('33333333-0003-0000-0000-000000000004', 'tree-gurbanow', 'Aýna', 'Gurbanowa', 'female', '1974-12-19', 'Daşoguz', true, 'Farmasewt.');
UPDATE persons SET maiden_name = 'Hojayewa' WHERE id = '33333333-0003-0000-0000-000000000004';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('33333333-0003-0000-0000-000000000005', 'tree-gurbanow', 'Kuwwat', 'Gurbanow', 'male', '1998-04-10', 'Daşoguz', true, 'Arhitektor.'),
('33333333-0003-0000-0000-000000000006', 'tree-gurbanow', 'Şasenem', 'Gurbanowa', 'female', '2003-08-25', 'Daşoguz', true, 'Talyp gyz.');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('tree-gurbanow', '33333333-0003-0000-0000-000000000001', '33333333-0003-0000-0000-000000000002', 'spouse', '1965-10-12'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000003', '33333333-0003-0000-0000-000000000004', 'spouse', '1996-05-20');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('tree-gurbanow', '33333333-0003-0000-0000-000000000001', '33333333-0003-0000-0000-000000000003', 'parent'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000002', '33333333-0003-0000-0000-000000000003', 'parent'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000003', '33333333-0003-0000-0000-000000000005', 'parent'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000004', '33333333-0003-0000-0000-000000000005', 'parent'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000003', '33333333-0003-0000-0000-000000000006', 'parent'),
('tree-gurbanow', '33333333-0003-0000-0000-000000000004', '33333333-0003-0000-0000-000000000006', 'parent');


-- 6. AGAÇ 4: Myradowlar Maşgala Agajy (tree-myradow - 6 agza, Balkan)
INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('44444444-0004-0000-0000-000000000001', 'tree-myradow', 'Kakamyrat', 'Myradow', 'male', '1941-09-09', 'Türkmenbaşy', false, 'Garry ata. Deňizçi kapitan.'),
('44444444-0004-0000-0000-000000000002', 'tree-myradow', 'Dursun', 'Myradowa', 'female', '1946-04-17', 'Hazar', true, 'Garry ene.');
UPDATE persons SET maiden_name = 'Allanazarowa' WHERE id = '44444444-0004-0000-0000-000000000002';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('44444444-0004-0000-0000-000000000003', 'tree-myradow', 'Şöhrat', 'Myradow', 'male', '1973-10-23', 'Balkanabat', true, 'Agajyň eýesi. Nebit-gaz inženeri.'),
('44444444-0004-0000-0000-000000000004', 'tree-myradow', 'Maýsa', 'Myradowa', 'female', '1977-01-30', 'Türkmenbaşy', true, 'Iňlis dili mugallymy.');
UPDATE persons SET maiden_name = 'Çaryýewa' WHERE id = '44444444-0004-0000-0000-000000000004';

INSERT INTO persons (id, tree_id, first_name, last_name, gender, birth_date, birth_place, is_living, biography) VALUES
('44444444-0004-0000-0000-000000000005', 'tree-myradow', 'Arslan', 'Myradow', 'male', '2001-06-11', 'Balkanabat', true, 'Kompýuter grafika dizaýneri.'),
('44444444-0004-0000-0000-000000000006', 'tree-myradow', 'Merjen', 'Myradowa', 'female', '2006-03-14', 'Türkmenbaşy', true, 'Talyp gyz.');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type, marriage_date) VALUES
('tree-myradow', '44444444-0004-0000-0000-000000000001', '44444444-0004-0000-0000-000000000002', 'spouse', '1969-11-25'),
('tree-myradow', '44444444-0004-0000-0000-000000000003', '44444444-0004-0000-0000-000000000004', 'spouse', '1999-08-14');

INSERT INTO relationships (tree_id, person_id, related_person_id, relationship_type) VALUES
('tree-myradow', '44444444-0004-0000-0000-000000000001', '44444444-0004-0000-0000-000000000003', 'parent'),
('tree-myradow', '44444444-0004-0000-0000-000000000002', '44444444-0004-0000-0000-000000000003', 'parent'),
('tree-myradow', '44444444-0004-0000-0000-000000000003', '44444444-0004-0000-0000-000000000005', 'parent'),
('tree-myradow', '44444444-0004-0000-0000-000000000004', '44444444-0004-0000-0000-000000000005', 'parent'),
('tree-myradow', '44444444-0004-0000-0000-000000000003', '44444444-0004-0000-0000-000000000006', 'parent'),
('tree-myradow', '44444444-0004-0000-0000-000000000004', '44444444-0004-0000-0000-000000000006', 'parent');

COMMIT;

