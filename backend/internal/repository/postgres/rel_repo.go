package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"familytree/internal/domain"
)

// RelRepo implements domain.RelationshipRepository using PostgreSQL.
type RelRepo struct {
	pool *pgxpool.Pool
}

func NewRelRepo(pool *pgxpool.Pool) *RelRepo {
	return &RelRepo{pool: pool}
}

const relSelectCols = `
	id, tree_id, person_id, related_person_id,
	relationship_type, marriage_date, divorce_date,
	notes, created_at, updated_at
`

func scanRel(row pgx.Row) (*domain.Relationship, error) {
	var r domain.Relationship
	var relTypeStr string
	err := row.Scan(
		&r.ID,
		&r.TreeID,
		&r.PersonID,
		&r.RelatedPersonID,
		&relTypeStr,
		&r.MarriageDate,
		&r.DivorceDate,
		&r.Notes,
		&r.CreatedAt,
		&r.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("gatnaşyk tapylmady")
		}
		return nil, err
	}
	r.RelationshipType = domain.RelationshipType(relTypeStr)
	return &r, nil
}

func (r *RelRepo) GetByPersonID(personID uuid.UUID) ([]*domain.Relationship, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT ` + relSelectCols + ` FROM relationships 
		WHERE person_id = $1 OR related_person_id = $1
		ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query, personID)
	if err != nil {
		return nil, fmt.Errorf("getByPersonID rels: %w", err)
	}
	defer rows.Close()

	var result []*domain.Relationship
	for rows.Next() {
		rel, err := scanRel(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, rel)
	}
	return result, rows.Err()
}

func (r *RelRepo) GetByTreeID(treeID string) ([]*domain.Relationship, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if treeID == "" {
		treeID = "my-tree"
	}

	query := `SELECT ` + relSelectCols + ` FROM relationships WHERE tree_id = $1 ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query, treeID)
	if err != nil {
		return nil, fmt.Errorf("getByTreeID rels: %w", err)
	}
	defer rows.Close()

	var result []*domain.Relationship
	for rows.Next() {
		rel, err := scanRel(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, rel)
	}
	return result, rows.Err()
}

func (r *RelRepo) Create(rel *domain.Relationship) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if rel.ID == uuid.Nil {
		rel.ID = uuid.New()
	}
	if rel.TreeID == "" {
		rel.TreeID = "my-tree"
	}
	now := time.Now()
	rel.CreatedAt = now
	rel.UpdatedAt = now

	query := `
		INSERT INTO relationships (
			id, tree_id, person_id, related_person_id,
			relationship_type, marriage_date, divorce_date,
			notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (person_id, related_person_id, relationship_type) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query,
		rel.ID,
		rel.TreeID,
		rel.PersonID,
		rel.RelatedPersonID,
		string(rel.RelationshipType),
		rel.MarriageDate,
		rel.DivorceDate,
		rel.Notes,
		rel.CreatedAt,
		rel.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create relationship: %w", err)
	}
	return nil
}

func (r *RelRepo) Delete(id uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM relationships WHERE id = $1`
	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete relationship: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return errors.New("gatnaşyk tapylmady")
	}
	return nil
}

func (r *RelRepo) Clear() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, _ = r.pool.Exec(ctx, `DELETE FROM relationships`)
}

// GetAncestors retrieves all parents, grandparents, etc. recursively.
func (r *RelRepo) GetAncestors(personID uuid.UUID) ([]*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		WITH RECURSIVE ancestors AS (
			-- Base case: direct parents
			SELECT person_id AS id
			FROM relationships
			WHERE related_person_id = $1 AND relationship_type IN ('parent', 'adoptive_parent')

			UNION

			-- Recursive case: parents of ancestors
			SELECT r.person_id
			FROM relationships r
			INNER JOIN ancestors a ON r.related_person_id = a.id
			WHERE r.relationship_type IN ('parent', 'adoptive_parent')
		)
		SELECT p.id, p.tree_id, p.first_name, p.last_name, p.maiden_name,
		       p.gender, p.birth_date, p.birth_place, p.death_date, p.death_place,
		       p.is_living, p.avatar_url, p.biography, p.created_at, p.updated_at
		FROM persons p
		INNER JOIN ancestors a ON p.id = a.id
	`
	rows, err := r.pool.Query(ctx, query, personID)
	if err != nil {
		return nil, fmt.Errorf("getAncestors: %w", err)
	}
	defer rows.Close()

	var result []*domain.Person
	for rows.Next() {
		p, err := scanPerson(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// GetDescendants retrieves all children, grandchildren, etc. recursively.
func (r *RelRepo) GetDescendants(personID uuid.UUID) ([]*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		WITH RECURSIVE descendants AS (
			-- Base case: direct children
			SELECT related_person_id AS id
			FROM relationships
			WHERE person_id = $1 AND relationship_type IN ('parent', 'adoptive_parent')

			UNION

			-- Recursive case: children of descendants
			SELECT r.related_person_id
			FROM relationships r
			INNER JOIN descendants d ON r.person_id = d.id
			WHERE r.relationship_type IN ('parent', 'adoptive_parent')
		)
		SELECT p.id, p.tree_id, p.first_name, p.last_name, p.maiden_name,
		       p.gender, p.birth_date, p.birth_place, p.death_date, p.death_place,
		       p.is_living, p.avatar_url, p.biography, p.created_at, p.updated_at
		FROM persons p
		INNER JOIN descendants d ON p.id = d.id
	`
	rows, err := r.pool.Query(ctx, query, personID)
	if err != nil {
		return nil, fmt.Errorf("getDescendants: %w", err)
	}
	defer rows.Close()

	var result []*domain.Person
	for rows.Next() {
		p, err := scanPerson(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

