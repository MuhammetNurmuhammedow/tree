package service

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"familytree/internal/domain"
	"familytree/internal/repository/postgres"
)

type TreeMetaService struct {
	mu         sync.RWMutex
	trees      map[string]*domain.Tree
	personRepo domain.PersonRepository
	treeRepo   *postgres.TreeRepo
}

func NewTreeMetaService(pr domain.PersonRepository, tr *postgres.TreeRepo) *TreeMetaService {
	s := &TreeMetaService{
		trees:      make(map[string]*domain.Tree),
		personRepo: pr,
		treeRepo:   tr,
	}

	// If DB repo is provided, load initial trees from database
	if tr != nil {
		if dbTrees, err := tr.GetAll(); err == nil && len(dbTrees) > 0 {
			for _, t := range dbTrees {
				s.trees[t.ID] = t
			}
			return s
		}
	}

	// Default trees fallback
	s.trees["my-tree"] = &domain.Tree{
		ID:          "my-tree",
		Name:        "Kaya Ailesi Soy Ağacı",
		Description: "Benim kendi aile ağacım (Tam Düzenleme Yetkisi)",
		OwnerName:   "Ben (Ahmet Kaya)",
		IsOwner:     true,
		MemberCount: 9,
		CreatedAt:   time.Now().Add(-30 * 24 * time.Hour),
	}

	s.trees["tree-demir"] = &domain.Tree{
		ID:          "tree-demir",
		Name:        "Demir Ailesi Soy Ağacı",
		Description: "Zeynep Demir'in anne tarafı sülalesi (Başkasının Ağacı - Sadece İnceleme)",
		OwnerName:   "Süleyman Demir",
		IsOwner:     false,
		MemberCount: 5,
		CreatedAt:   time.Now().Add(-60 * 24 * time.Hour),
	}

	s.trees["tree-yilmaz"] = &domain.Tree{
		ID:          "tree-yilmaz",
		Name:        "Yılmaz Ailesi Soy Ağacı",
		Description: "Fatma Yılmaz'ın ata soy ağacı (Başkasının Ağacı - Sadece İnceleme)",
		OwnerName:   "Kemal Yılmaz",
		IsOwner:     false,
		MemberCount: 3,
		CreatedAt:   time.Now().Add(-90 * 24 * time.Hour),
	}

	return s
}

func (s *TreeMetaService) GetAllTrees() []*domain.Tree {
	s.mu.Lock()
	defer s.mu.Unlock()

	// If DB repo is present, refresh from DB
	if s.treeRepo != nil {
		if dbTrees, err := s.treeRepo.GetAll(); err == nil && len(dbTrees) > 0 {
			res := make([]*domain.Tree, 0, len(dbTrees))
			for _, t := range dbTrees {
				s.trees[t.ID] = t
				res = append(res, t)
			}
			return res
		}
	}

	res := make([]*domain.Tree, 0, len(s.trees))
	for _, t := range s.trees {
		if persons, err := s.personRepo.GetByTreeID(t.ID); err == nil {
			t.MemberCount = len(persons)
		}
		res = append(res, t)
	}
	return res
}

func (s *TreeMetaService) CreateTree(name, description string) *domain.Tree {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := "tree-" + uuid.New().String()[:8]
	t := &domain.Tree{
		ID:          id,
		Name:        name,
		Description: description,
		OwnerName:   "Ben",
		IsOwner:     true, // Created by current user -> editable
		MemberCount: 0,
		CreatedAt:   time.Now(),
	}
	s.trees[id] = t

	// Persist to DB if repo available
	if s.treeRepo != nil {
		_ = s.treeRepo.Create(t)
	}

	return t
}

func (s *TreeMetaService) SearchAll(query string) []*domain.SearchResultItem {
	return s.Search(query, "")
}

func (s *TreeMetaService) Search(query string, filterTreeID string) []*domain.SearchResultItem {
	query = strings.ToLower(strings.TrimSpace(query))
	if query == "" {
		return nil
	}

	allPersons, err := s.personRepo.GetAll()
	if err != nil {
		return nil
	}

	var results []*domain.SearchResultItem
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, p := range allPersons {
		// If filtering to a specific tree, skip others
		if filterTreeID != "" && p.TreeID != filterTreeID {
			continue
		}

		fullName := strings.ToLower(p.FirstName + " " + p.LastName)
		birthPlace := ""
		if p.BirthPlace != nil {
			birthPlace = *p.BirthPlace
		}
		deathPlace := ""
		if p.DeathPlace != nil {
			deathPlace = *p.DeathPlace
		}
		maidenName := ""
		if p.MaidenName != nil {
			maidenName = *p.MaidenName
		}
		biography := ""
		if p.Biography != nil {
			biography = *p.Biography
		}

		matched := false
		matchContext := ""

		if strings.Contains(fullName, query) {
			matched = true
		} else if maidenName != "" && strings.Contains(strings.ToLower(maidenName), query) {
			matched = true
			matchContext = "Gyzlyk / Kızlık: " + maidenName
		} else if birthPlace != "" && strings.Contains(strings.ToLower(birthPlace), query) {
			matched = true
			matchContext = "Doglan ýeri: " + birthPlace
		} else if deathPlace != "" && strings.Contains(strings.ToLower(deathPlace), query) {
			matched = true
			matchContext = "Vefat ýeri: " + deathPlace
		} else if biography != "" && strings.Contains(strings.ToLower(biography), query) {
			matched = true
			// Show matching snippet of biography
			idx := strings.Index(strings.ToLower(biography), query)
			start := idx - 15
			if start < 0 {
				start = 0
			}
			end := idx + len(query) + 25
			if end > len(biography) {
				end = len(biography)
			}
			snippet := biography[start:end]
			if start > 0 {
				snippet = "…" + snippet
			}
			if end < len(biography) {
				snippet = snippet + "…"
			}
			matchContext = "Ýazgy: " + snippet
		}

		if matched {
			treeName := "Kaya Ailesi Soy Ağacı"
			isMyTree := true
			if t, ok := s.trees[p.TreeID]; ok {
				treeName = t.Name
				isMyTree = t.IsOwner
			}

			born := "?"
			if p.BirthDate != nil {
				born = p.BirthDate.Format("2006")
			}
			years := "d. " + born
			if !p.IsLiving && p.DeathDate != nil {
				years = fmt.Sprintf("%s – %s", born, p.DeathDate.Format("2006"))
			}

			results = append(results, &domain.SearchResultItem{
				PersonID:     p.ID.String(),
				FullName:     p.FirstName + " " + p.LastName,
				TreeID:       p.TreeID,
				TreeName:     treeName,
				IsMyTree:     isMyTree,
				Gender:       string(p.Gender),
				Years:        years,
				BirthPlace:   birthPlace,
				MaidenName:   maidenName,
				MatchContext: matchContext,
			})
		}
	}
	return results
}
