package service

import (
	"errors"

	"github.com/google/uuid"

	"familytree/internal/domain"
)

type RelationshipService struct {
	relRepo    domain.RelationshipRepository
	personRepo domain.PersonRepository
}

func NewRelationshipService(rr domain.RelationshipRepository, pr domain.PersonRepository) *RelationshipService {
	return &RelationshipService{relRepo: rr, personRepo: pr}
}

func (s *RelationshipService) GetByPersonID(personID uuid.UUID) ([]*domain.Relationship, error) {
	return s.relRepo.GetByPersonID(personID)
}

func (s *RelationshipService) Create(rel *domain.Relationship) error {
	if rel.PersonID == uuid.Nil || rel.RelatedPersonID == uuid.Nil {
		return errors.New("person_id ve related_person_id zorunludur")
	}
	if rel.PersonID == rel.RelatedPersonID {
		return errors.New("kişi kendisiyle ilişkilendirilemez")
	}
	return s.relRepo.Create(rel)
}

func (s *RelationshipService) Delete(id uuid.UUID) error {
	return s.relRepo.Delete(id)
}

