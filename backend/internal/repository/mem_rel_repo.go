package repository

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"familytree/internal/domain"
)

// MemRelRepo is an in-memory implementation of domain.RelationshipRepository.
type MemRelRepo struct {
	mu   sync.RWMutex
	rels map[uuid.UUID]*domain.Relationship
}

func NewMemRelRepo() *MemRelRepo {
	return &MemRelRepo{rels: make(map[uuid.UUID]*domain.Relationship)}
}

func (r *MemRelRepo) GetByPersonID(personID uuid.UUID) ([]*domain.Relationship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*domain.Relationship
	for _, rel := range r.rels {
		if rel.PersonID == personID || rel.RelatedPersonID == personID {
			result = append(result, rel)
		}
	}
	return result, nil
}

func (r *MemRelRepo) GetByTreeID(treeID string) ([]*domain.Relationship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if treeID == "" {
		treeID = "my-tree"
	}
	var result []*domain.Relationship
	for _, rel := range r.rels {
		if rel.TreeID == treeID {
			result = append(result, rel)
		}
	}
	return result, nil
}

func (r *MemRelRepo) Create(rel *domain.Relationship) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	rel.ID = uuid.New()
	if rel.TreeID == "" {
		rel.TreeID = "my-tree"
	}
	now := time.Now()
	rel.CreatedAt = now
	rel.UpdatedAt = now
	r.rels[rel.ID] = rel
	return nil
}

func (r *MemRelRepo) Delete(id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.rels[id]; !ok {
		return errors.New("gatnaşyk tapylmady")
	}
	delete(r.rels, id)
	return nil
}

func (r *MemRelRepo) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.rels = make(map[uuid.UUID]*domain.Relationship)
}

func (r *MemRelRepo) GetAncestors(personID uuid.UUID) ([]*domain.Person, error) {
	// Not implemented for in-memory store (would need person repo reference)
	return nil, nil
}

func (r *MemRelRepo) GetDescendants(personID uuid.UUID) ([]*domain.Person, error) {
	return nil, nil
}

