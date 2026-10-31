package service

import (
	"time"

	"familytree/internal/domain"
)

type SeedService struct {
	personRepo domain.PersonRepository
	relRepo    domain.RelationshipRepository
}

func NewSeedService(pr domain.PersonRepository, rr domain.RelationshipRepository) *SeedService {
	return &SeedService{personRepo: pr, relRepo: rr}
}

type clearable interface {
	Clear()
}

func (s *SeedService) SeedDemoData() error {
	if c, ok := s.personRepo.(clearable); ok {
		c.Clear()
	}
	if c, ok := s.relRepo.(clearable); ok {
		c.Clear()
	}

	pDate := func(s string) *time.Time {
		t, err := time.Parse("2006-01-02", s)
		if err != nil {
			return nil
		}
		return &t
	}
	pStr := func(s string) *string {
		return &s
	}

	// ── AGAÇ 1: Berdiýewler Maşgala Agajy (my-tree - 14 agza, 4 nesil) ──────────
	// Garry ata-eneler
	oraz := &domain.Person{
		TreeID: "my-tree", FirstName: "Oraz", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("1940-04-12"), BirthPlace: pStr("Aşgabat"), IsLiving: false,
		Biography: pStr("Ata tarapdan uly garry ata. Beýik Watançylyk urşundan soňky gurluşyklarda zähmet çeken inžener."),
	}
	gulsirin := &domain.Person{
		TreeID: "my-tree", FirstName: "Gülşirin", LastName: "Berdiýewa", MaidenName: pStr("Annaýewa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1944-08-25"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Ata tarapdan garry ene. Mugallym bolup köp ýyl işlän."),
	}
	nazar := &domain.Person{
		TreeID: "my-tree", FirstName: "Nazar", LastName: "Saparow", Gender: domain.GenderMale,
		BirthDate: pDate("1942-11-03"), BirthPlace: pStr("Mary"), IsLiving: false,
		Biography: pStr("Ene tarapdan garry ata. Taryhçy alym."),
	}
	ogulbagt := &domain.Person{
		TreeID: "my-tree", FirstName: "Ogulbagt", LastName: "Saparowa", MaidenName: pStr("Meredowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1946-02-18"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Ene tarapdan garry ene. Halypa el hünärmeni."),
	}

	// Ene-atalar, Daýylar
	batyr := &domain.Person{
		TreeID: "my-tree", FirstName: "Batyr", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("1968-05-15"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Kakam. Ykdysatçy, maşgala baştutany."),
	}
	maral := &domain.Person{
		TreeID: "my-tree", FirstName: "Maral", LastName: "Berdiýewa", MaidenName: pStr("Saparowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1972-09-20"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Ejem. Lukman, maşgala lukmany."),
	}
	dowlet := &domain.Person{
		TreeID: "my-tree", FirstName: "Döwlet", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("1974-03-10"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Kakamiň dogany (Daýy/Kakaň inisi). Telekeçi."),
	}
	aygul := &domain.Person{
		TreeID: "my-tree", FirstName: "Aýgül", LastName: "Berdiýewa", MaidenName: pStr("Kulyýewa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1978-07-14"), BirthPlace: pStr("Ahal, Änew"), IsLiving: true,
		Biography: pStr("Gelnejem."),
	}

	// Esasy Şahs, Ýanýoldaşy, Uýasy, Doganoglan
	merdan := &domain.Person{
		TreeID: "my-tree", FirstName: "Merdan", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("1995-06-12"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Agajyň eýesi (Men). Programma üpjünçiligi inženeri."),
	}
	selbi := &domain.Person{
		TreeID: "my-tree", FirstName: "Selbi", LastName: "Berdiýewa", MaidenName: pStr("Ýusubowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1998-10-05"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Ýanýoldaşym. Lingwist we terjimeçi."),
	}
	jennet := &domain.Person{
		TreeID: "my-tree", FirstName: "Jennet", LastName: "Berdiýewa", Gender: domain.GenderFemale,
		BirthDate: pDate("2001-01-22"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Uýam. Sungatşynas."),
	}
	resul := &domain.Person{
		TreeID: "my-tree", FirstName: "Resul", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("2003-12-08"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Doganoglanym (Döwlet daýymyň ogly). Talyby."),
	}

	// Çagalar / Agtyklar
	allanur := &domain.Person{
		TreeID: "my-tree", FirstName: "Allanur", LastName: "Berdiýew", Gender: domain.GenderMale,
		BirthDate: pDate("2021-04-18"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Oglum."),
	}
	aylar := &domain.Person{
		TreeID: "my-tree", FirstName: "Aýlar", LastName: "Berdiýewa", Gender: domain.GenderFemale,
		BirthDate: pDate("2023-09-02"), BirthPlace: pStr("Aşgabat"), IsLiving: true,
		Biography: pStr("Gyzym."),
	}

	family1 := []*domain.Person{oraz, gulsirin, nazar, ogulbagt, batyr, maral, dowlet, aygul, merdan, selbi, jennet, resul, allanur, aylar}
	for _, p := range family1 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels1 := []*domain.Relationship{
		// Garry atalar nikalary
		{TreeID: "my-tree", PersonID: oraz.ID, RelatedPersonID: gulsirin.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1966-06-10")},
		{TreeID: "my-tree", PersonID: nazar.ID, RelatedPersonID: ogulbagt.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1970-10-15")},

		// Oraz & Gülşirin -> Batyr & Döwlet
		{TreeID: "my-tree", PersonID: oraz.ID, RelatedPersonID: batyr.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: gulsirin.ID, RelatedPersonID: batyr.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: oraz.ID, RelatedPersonID: dowlet.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: gulsirin.ID, RelatedPersonID: dowlet.ID, RelationshipType: domain.RelParent},

		// Nazar & Ogulbagt -> Maral
		{TreeID: "my-tree", PersonID: nazar.ID, RelatedPersonID: maral.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: ogulbagt.ID, RelatedPersonID: maral.ID, RelationshipType: domain.RelParent},

		// Batyr <-> Maral, Döwlet <-> Aýgül
		{TreeID: "my-tree", PersonID: batyr.ID, RelatedPersonID: maral.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1993-08-20")},
		{TreeID: "my-tree", PersonID: dowlet.ID, RelatedPersonID: aygul.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1999-05-12")},

		// Batyr & Maral -> Merdan & Jennet
		{TreeID: "my-tree", PersonID: batyr.ID, RelatedPersonID: merdan.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: maral.ID, RelatedPersonID: merdan.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: batyr.ID, RelatedPersonID: jennet.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: maral.ID, RelatedPersonID: jennet.ID, RelationshipType: domain.RelParent},

		// Döwlet & Aýgül -> Resul
		{TreeID: "my-tree", PersonID: dowlet.ID, RelatedPersonID: resul.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: aygul.ID, RelatedPersonID: resul.ID, RelationshipType: domain.RelParent},

		// Merdan <-> Selbi
		{TreeID: "my-tree", PersonID: merdan.ID, RelatedPersonID: selbi.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("2019-11-09")},

		// Merdan & Selbi -> Allanur & Aýlar
		{TreeID: "my-tree", PersonID: merdan.ID, RelatedPersonID: allanur.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: selbi.ID, RelatedPersonID: allanur.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: merdan.ID, RelatedPersonID: aylar.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: selbi.ID, RelatedPersonID: aylar.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels1 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	// ── AGAÇ 2: Amanowlar Maşgala Agajy (tree-amanow - 7 agza, Mary) ───────────
	amMuhammet := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Muhammet", LastName: "Amanow", Gender: domain.GenderMale,
		BirthDate: pDate("1945-02-14"), BirthPlace: pStr("Mary"), IsLiving: false,
		Biography: pStr("Mary sebitiniň abraýly ýaşulysy."),
	}
	amTazegul := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Täzegül", LastName: "Amanowa", MaidenName: pStr("Durdyýewa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1949-06-21"), BirthPlace: pStr("Baýramaly"), IsLiving: true,
		Biography: pStr("Garry ene."),
	}
	amSerdar := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Serdar", LastName: "Amanow", Gender: domain.GenderMale,
		BirthDate: pDate("1975-08-30"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Agajyň eýesi. Oba hojalyk hünärmeni."),
	}
	amGozel := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Gözel", LastName: "Amanowa", MaidenName: pStr("Begmyradowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1979-03-12"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Mugallym."),
	}
	amMaksat := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Maksat", LastName: "Amanow", Gender: domain.GenderMale,
		BirthDate: pDate("1982-11-19"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Inisi. Inžener."),
	}
	amYhlas := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Yhlas", LastName: "Amanow", Gender: domain.GenderMale,
		BirthDate: pDate("2004-05-14"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Talyp."),
	}
	amLeyli := &domain.Person{
		TreeID: "tree-amanow", FirstName: "Leýli", LastName: "Amanowa", Gender: domain.GenderFemale,
		BirthDate: pDate("2008-09-28"), BirthPlace: pStr("Mary"), IsLiving: true,
		Biography: pStr("Mekdep okuwçysy."),
	}

	family2 := []*domain.Person{amMuhammet, amTazegul, amSerdar, amGozel, amMaksat, amYhlas, amLeyli}
	for _, p := range family2 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels2 := []*domain.Relationship{
		{TreeID: "tree-amanow", PersonID: amMuhammet.ID, RelatedPersonID: amTazegul.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1972-04-18")},
		{TreeID: "tree-amanow", PersonID: amSerdar.ID, RelatedPersonID: amGozel.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("2001-09-08")},

		{TreeID: "tree-amanow", PersonID: amMuhammet.ID, RelatedPersonID: amSerdar.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amTazegul.ID, RelatedPersonID: amSerdar.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amMuhammet.ID, RelatedPersonID: amMaksat.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amTazegul.ID, RelatedPersonID: amMaksat.ID, RelationshipType: domain.RelParent},

		{TreeID: "tree-amanow", PersonID: amSerdar.ID, RelatedPersonID: amYhlas.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amGozel.ID, RelatedPersonID: amYhlas.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amSerdar.ID, RelatedPersonID: amLeyli.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-amanow", PersonID: amGozel.ID, RelatedPersonID: amLeyli.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels2 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	// ── AGAÇ 3: Gurbanowlar Maşgala Agajy (tree-gurbanow - 6 agza, Daşoguz) ────
	gbBayram := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Baýram", LastName: "Gurbanow", Gender: domain.GenderMale,
		BirthDate: pDate("1938-03-24"), BirthPlace: pStr("Daşoguz"), IsLiving: false,
		Biography: pStr("Garry ata. Zähmet weterany."),
	}
	gbOgulsat := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Ogulşat", LastName: "Gurbanowa", MaidenName: pStr("Rejepowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1943-11-15"), BirthPlace: pStr("Köneürgenç"), IsLiving: true,
		Biography: pStr("Garry ene."),
	}
	gbRowsen := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Röwşen", LastName: "Gurbanow", Gender: domain.GenderMale,
		BirthDate: pDate("1970-07-04"), BirthPlace: pStr("Daşoguz"), IsLiving: true,
		Biography: pStr("Agajyň eýesi. Lukman."),
	}
	gbAyna := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Aýna", LastName: "Gurbanowa", MaidenName: pStr("Hojayewa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1974-12-19"), BirthPlace: pStr("Daşoguz"), IsLiving: true,
		Biography: pStr("Farmasewt."),
	}
	gbKuwwat := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Kuwwat", LastName: "Gurbanow", Gender: domain.GenderMale,
		BirthDate: pDate("1998-04-10"), BirthPlace: pStr("Daşoguz"), IsLiving: true,
		Biography: pStr("Arhitektor."),
	}
	gbSasenem := &domain.Person{
		TreeID: "tree-gurbanow", FirstName: "Şasenem", LastName: "Gurbanowa", Gender: domain.GenderFemale,
		BirthDate: pDate("2003-08-25"), BirthPlace: pStr("Daşoguz"), IsLiving: true,
		Biography: pStr("Talyp gyz."),
	}

	family3 := []*domain.Person{gbBayram, gbOgulsat, gbRowsen, gbAyna, gbKuwwat, gbSasenem}
	for _, p := range family3 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels3 := []*domain.Relationship{
		{TreeID: "tree-gurbanow", PersonID: gbBayram.ID, RelatedPersonID: gbOgulsat.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1965-10-12")},
		{TreeID: "tree-gurbanow", PersonID: gbRowsen.ID, RelatedPersonID: gbAyna.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1996-05-20")},

		{TreeID: "tree-gurbanow", PersonID: gbBayram.ID, RelatedPersonID: gbRowsen.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-gurbanow", PersonID: gbOgulsat.ID, RelatedPersonID: gbRowsen.ID, RelationshipType: domain.RelParent},

		{TreeID: "tree-gurbanow", PersonID: gbRowsen.ID, RelatedPersonID: gbKuwwat.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-gurbanow", PersonID: gbAyna.ID, RelatedPersonID: gbKuwwat.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-gurbanow", PersonID: gbRowsen.ID, RelatedPersonID: gbSasenem.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-gurbanow", PersonID: gbAyna.ID, RelatedPersonID: gbSasenem.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels3 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	// ── AGAÇ 4: Myradowlar Maşgala Agajy (tree-myradow - 6 agza, Balkan) ───────
	myKakamyrat := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Kakamyrat", LastName: "Myradow", Gender: domain.GenderMale,
		BirthDate: pDate("1941-09-09"), BirthPlace: pStr("Türkmenbaşy"), IsLiving: false,
		Biography: pStr("Garry ata. Deňizçi kapitan."),
	}
	myDursun := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Dursun", LastName: "Myradowa", MaidenName: pStr("Allanazarowa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1946-04-17"), BirthPlace: pStr("Hazar"), IsLiving: true,
		Biography: pStr("Garry ene."),
	}
	mySohrat := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Şöhrat", LastName: "Myradow", Gender: domain.GenderMale,
		BirthDate: pDate("1973-10-23"), BirthPlace: pStr("Balkanabat"), IsLiving: true,
		Biography: pStr("Agajyň eýesi. Nebit-gaz inženeri."),
	}
	myMaysa := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Maýsa", LastName: "Myradowa", MaidenName: pStr("Çaryýewa"), Gender: domain.GenderFemale,
		BirthDate: pDate("1977-01-30"), BirthPlace: pStr("Türkmenbaşy"), IsLiving: true,
		Biography: pStr("Iňlis dili mugallymy."),
	}
	myArslan := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Arslan", LastName: "Myradow", Gender: domain.GenderMale,
		BirthDate: pDate("2001-06-11"), BirthPlace: pStr("Balkanabat"), IsLiving: true,
		Biography: pStr("Kompýuter grafika dizaýneri."),
	}
	myMerjen := &domain.Person{
		TreeID: "tree-myradow", FirstName: "Merjen", LastName: "Myradowa", Gender: domain.GenderFemale,
		BirthDate: pDate("2006-03-14"), BirthPlace: pStr("Türkmenbaşy"), IsLiving: true,
		Biography: pStr("Talyp gyz."),
	}

	family4 := []*domain.Person{myKakamyrat, myDursun, mySohrat, myMaysa, myArslan, myMerjen}
	for _, p := range family4 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels4 := []*domain.Relationship{
		{TreeID: "tree-myradow", PersonID: myKakamyrat.ID, RelatedPersonID: myDursun.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1969-11-25")},
		{TreeID: "tree-myradow", PersonID: mySohrat.ID, RelatedPersonID: myMaysa.ID, RelationshipType: domain.RelSpouse, MarriageDate: pDate("1999-08-14")},

		{TreeID: "tree-myradow", PersonID: myKakamyrat.ID, RelatedPersonID: mySohrat.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-myradow", PersonID: myDursun.ID, RelatedPersonID: mySohrat.ID, RelationshipType: domain.RelParent},

		{TreeID: "tree-myradow", PersonID: mySohrat.ID, RelatedPersonID: myArslan.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-myradow", PersonID: myMaysa.ID, RelatedPersonID: myArslan.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-myradow", PersonID: mySohrat.ID, RelatedPersonID: myMerjen.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-myradow", PersonID: myMaysa.ID, RelatedPersonID: myMerjen.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels4 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	return nil
}
