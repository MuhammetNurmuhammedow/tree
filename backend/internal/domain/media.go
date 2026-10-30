package domain

import (
	"time"

	"github.com/google/uuid"
)

// Media represents an uploaded file (photo, document) linked to a person or relationship.
type Media struct {
	ID        uuid.UUID  `db:"id"         json:"id"`
	PersonID  *uuid.UUID `db:"person_id"  json:"person_id,omitempty"`
	URL       string     `db:"url"        json:"url"`
	Caption   *string    `db:"caption"    json:"caption,omitempty"`
	MimeType  string     `db:"mime_type"  json:"mime_type"`
	SizeBytes int64      `db:"size_bytes" json:"size_bytes"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
}

