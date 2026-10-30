package domain

import (
	"time"

	"github.com/google/uuid"
)

// RelationshipType describes the type of family bond between two persons.
type RelationshipType string

const (
	RelParent          RelationshipType = "parent"
	RelChild           RelationshipType = "child"
	RelSpouse          RelationshipType = "spouse"
	RelFormerSpouse    RelationshipType = "former_spouse"
	RelAdoptiveParent  RelationshipType = "adoptive_parent"
	RelAdoptiveChild   RelationshipType = "adoptive_child"
)

// Relationship represents a directed family bond between two persons.
type Relationship struct {
	ID               uuid.UUID        `db:"id"                 json:"id"`
	TreeID           string           `db:"tree_id"            json:"tree_id"`
	PersonID         uuid.UUID        `db:"person_id"          json:"person_id"`
	RelatedPersonID  uuid.UUID        `db:"related_person_id"  json:"related_person_id"`
	RelationshipType RelationshipType `db:"relationship_type"  json:"relationship_type"`
	MarriageDate     *time.Time       `db:"marriage_date"      json:"marriage_date,omitempty"`
	DivorceDate      *time.Time       `db:"divorce_date"       json:"divorce_date,omitempty"`
	Notes            *string          `db:"notes"              json:"notes,omitempty"`
	CreatedAt        time.Time        `db:"created_at"         json:"created_at"`
	UpdatedAt        time.Time        `db:"updated_at"         json:"updated_at"`
}

// RelationshipRepository defines the persistence interface for relationships.
type RelationshipRepository interface {
	GetByPersonID(personID uuid.UUID) ([]*Relationship, error)
	Create(r *Relationship) error
	Delete(id uuid.UUID) error

	// GetAncestors returns all ancestors of the given person using a recursive CTE.
	GetAncestors(personID uuid.UUID) ([]*Person, error)
	// GetDescendants returns all descendants of the given person using a recursive CTE.
	GetDescendants(personID uuid.UUID) ([]*Person, error)
}

