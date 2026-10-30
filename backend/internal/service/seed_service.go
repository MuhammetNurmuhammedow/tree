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

	d1945, _ := time.Parse("2006-01-02", "1945-03-12")
	d1948, _ := time.Parse("2006-01-02", "1948-07-25")
	d1950, _ := time.Parse("2006-01-02", "1950-11-04")
	d1952, _ := time.Parse("2006-01-02", "1952-01-19")
	d1975, _ := time.Parse("2006-01-02", "1975-06-15")
	d1978, _ := time.Parse("2006-01-02", "1978-09-20")
	d1980, _ := time.Parse("2006-01-02", "1980-04-10")
	d2005, _ := time.Parse("2006-01-02", "2005-08-14")
	d2009, _ := time.Parse("2006-01-02", "2009-12-03")

	cityIst := "İstanbul"
	cityAnk := "Ankara"
	cityIzm := "İzmir"
	maidenYilmaz := "Yılmaz"
	maidenDemir := "Demir"

	// ── TREE 1: Kaya Ailesi (Benim Ağacım) ────────────────────────────────────
	dede1 := &domain.Person{
		TreeID: "my-tree", FirstName: "Mehmet", LastName: "Kaya", Gender: domain.GenderMale,
		BirthDate: &d1945, BirthPlace: &cityIst, IsLiving: true,
	}
	nine1 := &domain.Person{
		TreeID: "my-tree", FirstName: "Fatma", LastName: "Kaya", MaidenName: &maidenYilmaz, Gender: domain.GenderFemale,
		BirthDate: &d1948, BirthPlace: &cityIst, IsLiving: true,
	}
	dede2 := &domain.Person{
		TreeID: "my-tree", FirstName: "Ali", LastName: "Öztürk", Gender: domain.GenderMale,
		BirthDate: &d1950, BirthPlace: &cityAnk, IsLiving: true,
	}
	nine2 := &domain.Person{
		TreeID: "my-tree", FirstName: "Ayşe", LastName: "Öztürk", MaidenName: &maidenDemir, Gender: domain.GenderFemale,
		BirthDate: &d1952, BirthPlace: &cityAnk, IsLiving: true,
	}
	baba := &domain.Person{
		TreeID: "my-tree", FirstName: "Ahmet", LastName: "Kaya", Gender: domain.GenderMale,
		BirthDate: &d1975, BirthPlace: &cityIst, IsLiving: true,
	}
	anne := &domain.Person{
		TreeID: "my-tree", FirstName: "Zeynep", LastName: "Kaya", MaidenName: &maidenDemir, Gender: domain.GenderFemale,
		BirthDate: &d1978, BirthPlace: &cityAnk, IsLiving: true,
	}
	amca := &domain.Person{
		TreeID: "my-tree", FirstName: "Emre", LastName: "Kaya", Gender: domain.GenderMale,
		BirthDate: &d1980, BirthPlace: &cityIst, IsLiving: true,
	}
	cocuk1 := &domain.Person{
		TreeID: "my-tree", FirstName: "Can", LastName: "Kaya", Gender: domain.GenderMale,
		BirthDate: &d2005, BirthPlace: &cityIzm, IsLiving: true,
	}
	cocuk2 := &domain.Person{
		TreeID: "my-tree", FirstName: "Elif", LastName: "Kaya", Gender: domain.GenderFemale,
		BirthDate: &d2009, BirthPlace: &cityIzm, IsLiving: true,
	}

	family1 := []*domain.Person{dede1, nine1, dede2, nine2, baba, anne, amca, cocuk1, cocuk2}
	for _, p := range family1 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels1 := []*domain.Relationship{
		{TreeID: "my-tree", PersonID: dede1.ID, RelatedPersonID: nine1.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "my-tree", PersonID: dede1.ID, RelatedPersonID: baba.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: nine1.ID, RelatedPersonID: baba.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: dede1.ID, RelatedPersonID: amca.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: nine1.ID, RelatedPersonID: amca.ID, RelationshipType: domain.RelParent},

		{TreeID: "my-tree", PersonID: dede2.ID, RelatedPersonID: nine2.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "my-tree", PersonID: dede2.ID, RelatedPersonID: anne.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: nine2.ID, RelatedPersonID: anne.ID, RelationshipType: domain.RelParent},

		{TreeID: "my-tree", PersonID: baba.ID, RelatedPersonID: anne.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "my-tree", PersonID: baba.ID, RelatedPersonID: cocuk1.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: anne.ID, RelatedPersonID: cocuk1.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: baba.ID, RelatedPersonID: cocuk2.ID, RelationshipType: domain.RelParent},
		{TreeID: "my-tree", PersonID: anne.ID, RelatedPersonID: cocuk2.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels1 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	// ── TREE 2: Demir Ailesi (Başkasının Ağacı - Sadece İnceleme) ─────────────
	d1940, _ := time.Parse("2006-01-02", "1940-02-10")
	d2018, _ := time.Parse("2006-01-02", "2018-05-14")
	d1944, _ := time.Parse("2006-01-02", "1944-08-20")
	d1972, _ := time.Parse("2006-01-02", "1972-11-15")
	d1976, _ := time.Parse("2006-01-02", "1976-04-03")
	d2002, _ := time.Parse("2006-01-02", "2002-09-28")

	cityBur := "Bursa"
	dDede := &domain.Person{
		TreeID: "tree-demir", FirstName: "Süleyman", LastName: "Demir", Gender: domain.GenderMale,
		BirthDate: &d1940, BirthPlace: &cityBur, DeathDate: &d2018, IsLiving: false,
	}
	dNine := &domain.Person{
		TreeID: "tree-demir", FirstName: "Hatice", LastName: "Demir", Gender: domain.GenderFemale,
		BirthDate: &d1944, BirthPlace: &cityBur, IsLiving: true,
	}
	dBaba := &domain.Person{
		TreeID: "tree-demir", FirstName: "Murat", LastName: "Demir", Gender: domain.GenderMale,
		BirthDate: &d1972, BirthPlace: &cityBur, IsLiving: true,
	}
	dAnne := &domain.Person{
		TreeID: "tree-demir", FirstName: "Selin", LastName: "Demir", Gender: domain.GenderFemale,
		BirthDate: &d1976, BirthPlace: &cityIst, IsLiving: true,
	}
	dTorun := &domain.Person{
		TreeID: "tree-demir", FirstName: "Deniz", LastName: "Demir", Gender: domain.GenderFemale,
		BirthDate: &d2002, BirthPlace: &cityBur, IsLiving: true,
	}

	family2 := []*domain.Person{dDede, dNine, dBaba, dAnne, dTorun}
	for _, p := range family2 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels2 := []*domain.Relationship{
		{TreeID: "tree-demir", PersonID: dDede.ID, RelatedPersonID: dNine.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "tree-demir", PersonID: dDede.ID, RelatedPersonID: dBaba.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-demir", PersonID: dNine.ID, RelatedPersonID: dBaba.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-demir", PersonID: dBaba.ID, RelatedPersonID: dAnne.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "tree-demir", PersonID: dBaba.ID, RelatedPersonID: dTorun.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-demir", PersonID: dAnne.ID, RelatedPersonID: dTorun.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels2 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	// ── TREE 3: Yılmaz Ailesi (Başkasının Ağacı - Sadece İnceleme) ────────────
	d1938, _ := time.Parse("2006-01-02", "1938-01-05")
	d1942, _ := time.Parse("2006-01-02", "1942-06-11")
	d1970, _ := time.Parse("2006-01-02", "1970-12-25")
	cityAnt := "Antalya"

	yDede := &domain.Person{
		TreeID: "tree-yilmaz", FirstName: "Kemal", LastName: "Yılmaz", Gender: domain.GenderMale,
		BirthDate: &d1938, BirthPlace: &cityAnt, IsLiving: true,
	}
	yNine := &domain.Person{
		TreeID: "tree-yilmaz", FirstName: "Emine", LastName: "Yılmaz", Gender: domain.GenderFemale,
		BirthDate: &d1942, BirthPlace: &cityAnt, IsLiving: true,
	}
	yOzan := &domain.Person{
		TreeID: "tree-yilmaz", FirstName: "Ozan", LastName: "Yılmaz", Gender: domain.GenderMale,
		BirthDate: &d1970, BirthPlace: &cityAnt, IsLiving: true,
	}

	family3 := []*domain.Person{yDede, yNine, yOzan}
	for _, p := range family3 {
		if err := s.personRepo.Create(p); err != nil {
			return err
		}
	}

	rels3 := []*domain.Relationship{
		{TreeID: "tree-yilmaz", PersonID: yDede.ID, RelatedPersonID: yNine.ID, RelationshipType: domain.RelSpouse},
		{TreeID: "tree-yilmaz", PersonID: yDede.ID, RelatedPersonID: yOzan.ID, RelationshipType: domain.RelParent},
		{TreeID: "tree-yilmaz", PersonID: yNine.ID, RelatedPersonID: yOzan.ID, RelationshipType: domain.RelParent},
	}
	for _, r := range rels3 {
		if err := s.relRepo.Create(r); err != nil {
			return err
		}
	}

	return nil
}
