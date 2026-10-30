package domain

import (
	"time"

	"github.com/google/uuid"
)

// GenderType represents a person's gender.
type GenderType string

const (
	GenderMale    GenderType = "male"
	GenderFemale  GenderType = "female"
	GenderOther   GenderType = "other"
	GenderUnknown GenderType = "unknown"
)

// Person is the core domain model representing an individual in the family tree.
type Person struct {
	ID         uuid.UUID  `db:"id"          json:"id"`
	TreeID     string     `db:"tree_id"     json:"tree_id"`
	FirstName  string     `db:"first_name"  json:"first_name"`
	LastName   string     `db:"last_name"   json:"last_name"`
	MaidenName *string    `db:"maiden_name" json:"maiden_name,omitempty"`
	Gender     GenderType `db:"gender"      json:"gender"`
	BirthDate  *time.Time `db:"birth_date"  json:"birth_date,omitempty"`
	BirthPlace *string    `db:"birth_place" json:"birth_place,omitempty"`
	DeathDate  *time.Time `db:"death_date"  json:"death_date,omitempty"`
	DeathPlace *string    `db:"death_place" json:"death_place,omitempty"`
	IsLiving   bool       `db:"is_living"   json:"is_living"`
	AvatarURL  *string    `db:"avatar_url"  json:"avatar_url,omitempty"`
	Biography  *string    `db:"biography"   json:"biography,omitempty"`
	CreatedAt  time.Time  `db:"created_at"  json:"created_at"`
	UpdatedAt  time.Time  `db:"updated_at"  json:"updated_at"`
}

// FullName returns the person's full display name.
func (p *Person) FullName() string {
	return p.FirstName + " " + p.LastName
}

// Age returns the person's age in years. Returns -1 if birth date is unknown.
func (p *Person) Age() int {
	if p.BirthDate == nil {
		return -1
	}
	end := time.Now()
	if p.DeathDate != nil {
		end = *p.DeathDate
	}
	years := end.Year() - p.BirthDate.Year()
	if end.YearDay() < p.BirthDate.YearDay() {
		years--
	}
	return years
}

// PersonRepository defines the persistence interface for persons.
type PersonRepository interface {
	GetByID(id uuid.UUID) (*Person, error)
	GetAll() ([]*Person, error)
	GetByTreeID(treeID string) ([]*Person, error)
	Search(query string) ([]*Person, error)
	Create(p *Person) error
	Update(p *Person) error
	Delete(id uuid.UUID) error
}

