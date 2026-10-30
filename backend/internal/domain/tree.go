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
type SearchResultItem struct {
	PersonID   string `json:"person_id"`
	FullName   string `json:"full_name"`
	TreeID     string `json:"tree_id"`
	TreeName   string `json:"tree_name"`
	IsMyTree   bool   `json:"is_my_tree"`
	Gender     string `json:"gender"`
	Years      string `json:"years"`
	BirthPlace string `json:"birth_place,omitempty"`
}

