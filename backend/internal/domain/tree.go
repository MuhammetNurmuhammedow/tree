package domain

import "time"

// Tree represents a distinct family tree instance.
type Tree struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	OwnerName   string    `json:"owner_name"`
	IsOwner     bool      `json:"is_owner"` // true if owned by current session user
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}

// SearchResultItem represents a person match across all trees.
// It carries raw values only; the frontend renders all labels in the UI language.
type SearchResultItem struct {
	PersonID   string `json:"person_id"`
	FullName   string `json:"full_name"`
	TreeID     string `json:"tree_id"`
	TreeName   string `json:"tree_name"`
	IsMyTree   bool   `json:"is_my_tree"`
	Gender     string `json:"gender"`
	IsLiving   bool   `json:"is_living"`
	BirthYear  string `json:"birth_year,omitempty"`
	DeathYear  string `json:"death_year,omitempty"`
	BirthPlace string `json:"birth_place,omitempty"`
	MaidenName string `json:"maiden_name,omitempty"`
	// MatchField is set when the match was not on the name:
	// "maiden_name" | "birth_place" | "death_place" | "biography".
	MatchField   string `json:"match_field,omitempty"`
	MatchContext string `json:"match_context,omitempty"`
}

