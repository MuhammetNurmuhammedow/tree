package service

import (
	"errors"
	"strings"

	"github.com/google/uuid"

	"familytree/internal/domain"
)

// PersonService handles business logic for persons.
type PersonService struct {
	repo domain.PersonRepository
}

// NewPersonService creates a new PersonService.
func NewPersonService(repo domain.PersonRepository) *PersonService {
	return &PersonService{repo: repo}
}

func (s *PersonService) GetByID(id uuid.UUID) (*domain.Person, error) {
	return s.repo.GetByID(id)
}

func (s *PersonService) GetAll() ([]*domain.Person, error) {
	return s.repo.GetAll()
}

func (s *PersonService) Search(query string) ([]*domain.Person, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return s.repo.GetAll()
	}
	return s.repo.Search(query)
}

// Create validates and persists a new person.
func (s *PersonService) Create(p *domain.Person) error {
	if err := validate(p); err != nil {
		return err
	}
	// Automatically mark as deceased if death date is set
	if p.DeathDate != nil {
		p.IsLiving = false
	}
	return s.repo.Create(p)
}

// Update validates and updates an existing person.
func (s *PersonService) Update(p *domain.Person) error {
	if err := validate(p); err != nil {
		return err
	}
	if p.DeathDate != nil {
		p.IsLiving = false
	}
	return s.repo.Update(p)
}

func (s *PersonService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}

// validate enforces domain rules for a person.
func validate(p *domain.Person) error {
	if strings.TrimSpace(p.FirstName) == "" {
		return errors.New("first_name boş olamaz")
	}
	if strings.TrimSpace(p.LastName) == "" {
		return errors.New("last_name boş olamaz")
	}
	if p.BirthDate != nil && p.DeathDate != nil {
		if p.DeathDate.Before(*p.BirthDate) {
			return errors.New("ölüm tarihi, doğum tarihinden önce olamaz")
		}
	}
	return nil
}

