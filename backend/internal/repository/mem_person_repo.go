package repository

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"

	"familytree/internal/domain"
)

// MemPersonRepo is an in-memory implementation of domain.PersonRepository.
// Used for local development without a database.
type MemPersonRepo struct {
	mu      sync.RWMutex
	persons map[uuid.UUID]*domain.Person
}

func NewMemPersonRepo() *MemPersonRepo {
	return &MemPersonRepo{persons: make(map[uuid.UUID]*domain.Person)}
}

func (r *MemPersonRepo) GetByID(id uuid.UUID) (*domain.Person, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.persons[id]
	if !ok {
		return nil, errors.New("adam tapylmady")
	}
	return p, nil
}

func (r *MemPersonRepo) GetAll() ([]*domain.Person, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]*domain.Person, 0, len(r.persons))
	for _, p := range r.persons {
		result = append(result, p)
	}
	return result, nil
}

func (r *MemPersonRepo) GetByTreeID(treeID string) ([]*domain.Person, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if treeID == "" {
		treeID = "my-tree"
	}
	result := make([]*domain.Person, 0)
	for _, p := range r.persons {
		if p.TreeID == treeID {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *MemPersonRepo) Search(query string) ([]*domain.Person, error) {
	// Simple substring search for in-memory store
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*domain.Person
	for _, p := range r.persons {
		if contains(p.FirstName, query) || contains(p.LastName, query) {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *MemPersonRepo) Create(p *domain.Person) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p.ID = uuid.New()
	if p.TreeID == "" {
		p.TreeID = "my-tree"
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now
	r.persons[p.ID] = p
	return nil
}

func (r *MemPersonRepo) Update(p *domain.Person) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.persons[p.ID]; !ok {
		return errors.New("adam tapylmady")
	}
	p.UpdatedAt = time.Now()
	r.persons[p.ID] = p
	return nil
}

func (r *MemPersonRepo) Delete(id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.persons, id)
	return nil
}

func (r *MemPersonRepo) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.persons = make(map[uuid.UUID]*domain.Person)
}

func contains(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	return len(s) >= len(substr) && (s == substr ||
		func() bool {
			for i := 0; i <= len(s)-len(substr); i++ {
				if s[i:i+len(substr)] == substr {
					return true
				}
			}
			return false
		}())
}

