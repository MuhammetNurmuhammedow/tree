package service

import (
	"testing"

	"github.com/google/uuid"

	"familytree/internal/domain"
	"familytree/internal/repository"
)

func TestRelationshipServiceCreateValidation(t *testing.T) {
	a, b := uuid.New(), uuid.New()
	tests := []struct {
		name    string
		rel     domain.Relationship
		wantErr bool
	}{
		{"valid", domain.Relationship{PersonID: a, RelatedPersonID: b, RelationshipType: domain.RelSpouse}, false},
		{"missing person", domain.Relationship{RelatedPersonID: b, RelationshipType: domain.RelSpouse}, true},
		{"missing related", domain.Relationship{PersonID: a, RelationshipType: domain.RelSpouse}, true},
		{"self link", domain.Relationship{PersonID: a, RelatedPersonID: a, RelationshipType: domain.RelSpouse}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewRelationshipService(repository.NewMemRelRepo(), repository.NewMemPersonRepo())
			r := tt.rel
			if err := svc.Create(&r); (err != nil) != tt.wantErr {
				t.Fatalf("Create() err = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestRelationshipServiceDelete(t *testing.T) {
	rr := repository.NewMemRelRepo()
	svc := NewRelationshipService(rr, repository.NewMemPersonRepo())
	r := &domain.Relationship{PersonID: uuid.New(), RelatedPersonID: uuid.New(), RelationshipType: domain.RelParent}
	if err := svc.Create(r); err != nil {
		t.Fatal(err)
	}
	if err := svc.Delete(r.ID); err != nil {
		t.Fatalf("Delete() = %v", err)
	}
	if err := svc.Delete(r.ID); err == nil {
		t.Error("deleting a missing relationship should fail")
	}
}
