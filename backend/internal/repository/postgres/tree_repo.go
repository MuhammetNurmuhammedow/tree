package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"familytree/internal/domain"
)

// TreeRepo provides access to the trees table in PostgreSQL.
type TreeRepo struct {
	pool *pgxpool.Pool
}

func NewTreeRepo(pool *pgxpool.Pool) *TreeRepo {
	return &TreeRepo{pool: pool}
}

func (r *TreeRepo) GetAll() ([]*domain.Tree, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT t.id, t.name, COALESCE(t.description, ''), t.owner_name, t.is_owner, t.created_at,
		       COUNT(p.id) AS member_count
		FROM trees t
		LEFT JOIN persons p ON t.id = p.tree_id
		GROUP BY t.id, t.name, t.description, t.owner_name, t.is_owner, t.created_at
		ORDER BY t.created_at ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("getAll trees: %w", err)
	}
	defer rows.Close()

	var result []*domain.Tree
	for rows.Next() {
		var t domain.Tree
		err := rows.Scan(
			&t.ID,
			&t.Name,
			&t.Description,
			&t.OwnerName,
			&t.IsOwner,
			&t.CreatedAt,
			&t.MemberCount,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, &t)
	}
	return result, rows.Err()
}

func (r *TreeRepo) Create(t *domain.Tree) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if t.CreatedAt.IsZero() {
		t.CreatedAt = time.Now()
	}

	query := `
		INSERT INTO trees (id, name, description, owner_name, is_owner, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description
	`
	_, err := r.pool.Exec(ctx, query,
		t.ID,
		t.Name,
		t.Description,
		t.OwnerName,
		t.IsOwner,
		t.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("create tree: %w", err)
	}
	return nil
}

