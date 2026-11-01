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

// PersonRepo implements domain.PersonRepository using PostgreSQL.
type PersonRepo struct {
	pool *pgxpool.Pool
}

func NewPersonRepo(pool *pgxpool.Pool) *PersonRepo {
	return &PersonRepo{pool: pool}
}

const personSelectCols = `
	id, tree_id, first_name, last_name, maiden_name,
	gender, birth_date, birth_place, death_date, death_place,
	is_living, avatar_url, biography, created_at, updated_at
`

func scanPerson(row pgx.Row) (*domain.Person, error) {
	var p domain.Person
	var genderStr string
	err := row.Scan(
		&p.ID,
		&p.TreeID,
		&p.FirstName,
		&p.LastName,
		&p.MaidenName,
		&genderStr,
		&p.BirthDate,
		&p.BirthPlace,
		&p.DeathDate,
		&p.DeathPlace,
		&p.IsLiving,
		&p.AvatarURL,
		&p.Biography,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("adam tapylmady")
		}
		return nil, err
	}
	p.Gender = domain.GenderType(genderStr)
	return &p, nil
}

func (r *PersonRepo) GetByID(id uuid.UUID) (*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT ` + personSelectCols + ` FROM persons WHERE id = $1`
	row := r.pool.QueryRow(ctx, query, id)
	return scanPerson(row)
}

func (r *PersonRepo) GetAll() ([]*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT ` + personSelectCols + ` FROM persons ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("getAll persons: %w", err)
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

func (r *PersonRepo) GetByTreeID(treeID string) ([]*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if treeID == "" {
		treeID = "my-tree"
	}

	query := `SELECT ` + personSelectCols + ` FROM persons WHERE tree_id = $1 ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query, treeID)
	if err != nil {
		return nil, fmt.Errorf("getByTreeID persons: %w", err)
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

func (r *PersonRepo) Search(query string) ([]*domain.Person, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pattern := "%" + query + "%"
	sqlQuery := `SELECT ` + personSelectCols + ` FROM persons 
		WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR (maiden_name IS NOT NULL AND maiden_name ILIKE $1)
		ORDER BY first_name ASC`
	rows, err := r.pool.Query(ctx, sqlQuery, pattern)
	if err != nil {
		return nil, fmt.Errorf("search persons: %w", err)
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

func (r *PersonRepo) Create(p *domain.Person) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	if p.TreeID == "" {
		p.TreeID = "my-tree"
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now

	query := `
		INSERT INTO persons (
			id, tree_id, first_name, last_name, maiden_name,
			gender, birth_date, birth_place, death_date, death_place,
			is_living, avatar_url, biography, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := r.pool.Exec(ctx, query,
		p.ID,
		p.TreeID,
		p.FirstName,
		p.LastName,
		p.MaidenName,
		string(p.Gender),
		p.BirthDate,
		p.BirthPlace,
		p.DeathDate,
		p.DeathPlace,
		p.IsLiving,
		p.AvatarURL,
		p.Biography,
		p.CreatedAt,
		p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create person: %w", err)
	}
	return nil
}

func (r *PersonRepo) Update(p *domain.Person) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	p.UpdatedAt = time.Now()
	query := `
		UPDATE persons SET
			tree_id = $2,
			first_name = $3,
			last_name = $4,
			maiden_name = $5,
			gender = $6,
			birth_date = $7,
			birth_place = $8,
			death_date = $9,
			death_place = $10,
			is_living = $11,
			avatar_url = $12,
			biography = $13,
			updated_at = $14
		WHERE id = $1
	`
	tag, err := r.pool.Exec(ctx, query,
		p.ID,
		p.TreeID,
		p.FirstName,
		p.LastName,
		p.MaidenName,
		string(p.Gender),
		p.BirthDate,
		p.BirthPlace,
		p.DeathDate,
		p.DeathPlace,
		p.IsLiving,
		p.AvatarURL,
		p.Biography,
		p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("update person: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return errors.New("adam tapylmady")
	}
	return nil
}

func (r *PersonRepo) Delete(id uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM persons WHERE id = $1`
	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete person: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return errors.New("adam tapylmady")
	}
	return nil
}

func (r *PersonRepo) Clear() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, _ = r.pool.Exec(ctx, `DELETE FROM persons`)
}

