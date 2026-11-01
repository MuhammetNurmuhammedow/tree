package service

import (
	"testing"
	"time"

	"familytree/internal/domain"
	"familytree/internal/repository"
)

func date(s string) *time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return &t
}

func TestPersonServiceCreateValidation(t *testing.T) {
	tests := []struct {
		name    string
		person  domain.Person
		wantErr bool
	}{
		{"valid", domain.Person{FirstName: "Batyr", LastName: "Berdiýew", Gender: domain.GenderMale}, false},
		{"missing gender", domain.Person{FirstName: "Batyr", LastName: "Berdiýew"}, true},
		{"unsupported gender", domain.Person{FirstName: "Batyr", LastName: "Berdiýew", Gender: "other"}, true},
		{"empty first name", domain.Person{FirstName: "  ", LastName: "Berdiýew", Gender: domain.GenderMale}, true},
		{"empty last name", domain.Person{FirstName: "Batyr", LastName: "", Gender: domain.GenderMale}, true},
		{"death before birth", domain.Person{
			FirstName: "Oraz", LastName: "Berdiýew", Gender: domain.GenderMale,
			BirthDate: date("1940-04-12"), DeathDate: date("1930-01-01"),
		}, true},
		{"death after birth", domain.Person{
			FirstName: "Oraz", LastName: "Berdiýew", Gender: domain.GenderMale,
			BirthDate: date("1940-04-12"), DeathDate: date("2010-01-01"),
		}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewPersonService(repository.NewMemPersonRepo())
			p := tt.person
			err := svc.Create(&p)
			if (err != nil) != tt.wantErr {
				t.Fatalf("Create() err = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestPersonServiceCreateDefaults(t *testing.T) {
	svc := NewPersonService(repository.NewMemPersonRepo())
	p := &domain.Person{FirstName: "Oraz", LastName: "Berdiýew", Gender: domain.GenderMale, IsLiving: true, DeathDate: date("2010-01-01")}
	if err := svc.Create(p); err != nil {
		t.Fatal(err)
	}
	if p.IsLiving {
		t.Error("person with death date should be marked not living")
	}
	if p.TreeID != "my-tree" {
		t.Errorf("TreeID = %q, want default my-tree", p.TreeID)
	}
	if p.ID.String() == "00000000-0000-0000-0000-000000000000" {
		t.Error("ID was not assigned")
	}
}

func TestPersonServiceSearchEmptyReturnsAll(t *testing.T) {
	svc := NewPersonService(repository.NewMemPersonRepo())
	for _, n := range []string{"Batyr", "Maral"} {
		if err := svc.Create(&domain.Person{FirstName: n, LastName: "Berdiýew", Gender: domain.GenderFemale}); err != nil {
			t.Fatal(err)
		}
	}
	got, err := svc.Search("   ")
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 {
		t.Errorf("Search(blank) returned %d persons, want 2", len(got))
	}
}

func TestPersonAge(t *testing.T) {
	p := &domain.Person{BirthDate: date("1940-04-12"), DeathDate: date("2010-04-11")}
	if got := p.Age(); got != 69 {
		t.Errorf("Age() = %d, want 69", got)
	}
	if got := (&domain.Person{}).Age(); got != -1 {
		t.Errorf("Age() without birth date = %d, want -1", got)
	}
}
