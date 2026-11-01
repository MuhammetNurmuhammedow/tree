package service

import (
	"strings"
	"sync"
	"time"
	"unicode"

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
		Name:        "Berdiýewler Maşgala Agajy",
		Description: "Meniň maşgala nesil agajym (Doly redaktirleme rugsady bar)",
		OwnerName:   "Merdan Berdiýew",
		IsOwner:     true,
		MemberCount: 14,
		CreatedAt:   time.Now().Add(-30 * 24 * time.Hour),
	}

	s.trees["tree-amanow"] = &domain.Tree{
		ID:          "tree-amanow",
		Name:        "Amanowlar Maşgala Agajy",
		Description: "Mary welaýatynyň taryhy sülalesi (Gözden geçirme)",
		OwnerName:   "Serdar Amanow",
		IsOwner:     false,
		MemberCount: 7,
		CreatedAt:   time.Now().Add(-60 * 24 * time.Hour),
	}

	s.trees["tree-gurbanow"] = &domain.Tree{
		ID:          "tree-gurbanow",
		Name:        "Gurbanowlar Maşgala Agajy",
		Description: "Daşoguz welaýatyndan bolan ata-babalarymyzyň agajy (Gözden geçirme)",
		OwnerName:   "Röwşen Gurbanow",
		IsOwner:     false,
		MemberCount: 6,
		CreatedAt:   time.Now().Add(-90 * 24 * time.Hour),
	}

	s.trees["tree-myradow"] = &domain.Tree{
		ID:          "tree-myradow",
		Name:        "Myradowlar Maşgala Agajy",
		Description: "Balkan welaýatynyň Hazar ýakasy nesil agajy (Gözden geçirme)",
		OwnerName:   "Şöhrat Myradow",
		IsOwner:     false,
		MemberCount: 6,
		CreatedAt:   time.Now().Add(-120 * 24 * time.Hour),
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
		OwnerName:   "Men",
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
		matchField := ""
		matchContext := ""

		if strings.Contains(fullName, query) {
			matched = true
		} else if maidenName != "" && strings.Contains(strings.ToLower(maidenName), query) {
			matched, matchField, matchContext = true, "maiden_name", maidenName
		} else if birthPlace != "" && strings.Contains(strings.ToLower(birthPlace), query) {
			matched, matchField, matchContext = true, "birth_place", birthPlace
		} else if deathPlace != "" && strings.Contains(strings.ToLower(deathPlace), query) {
			matched, matchField, matchContext = true, "death_place", deathPlace
		} else if snippet, ok := matchSnippet(biography, query); ok {
			matched, matchField, matchContext = true, "biography", snippet
		}

		if matched {
			treeName := p.TreeID
			isMyTree := false
			if t, ok := s.trees[p.TreeID]; ok {
				treeName = t.Name
				isMyTree = t.IsOwner
			}

			item := &domain.SearchResultItem{
				PersonID:     p.ID.String(),
				FullName:     p.FirstName + " " + p.LastName,
				TreeID:       p.TreeID,
				TreeName:     treeName,
				IsMyTree:     isMyTree,
				Gender:       string(p.Gender),
				IsLiving:     p.IsLiving,
				BirthPlace:   birthPlace,
				MaidenName:   maidenName,
				MatchField:   matchField,
				MatchContext: matchContext,
			}
			if p.BirthDate != nil {
				item.BirthYear = p.BirthDate.Format("2006")
			}
			if p.DeathDate != nil {
				item.DeathYear = p.DeathDate.Format("2006")
			}
			results = append(results, item)
		}
	}
	return results
}

// matchSnippet finds query (already lower-cased) in text case-insensitively and
// returns the match with some surrounding context. It works on runes and lowers
// them one by one, so offsets stay aligned with the original text even when
// lower-casing would change a string's byte length (e.g. "İ").
func matchSnippet(text, query string) (string, bool) {
	if text == "" || query == "" {
		return "", false
	}
	src := []rune(text)
	q := []rune(query)
	lower := make([]rune, len(src))
	for i, r := range src {
		lower[i] = unicode.ToLower(r)
	}

	idx := -1
	for i := 0; i+len(q) <= len(lower); i++ {
		if string(lower[i:i+len(q)]) == query {
			idx = i
			break
		}
	}
	if idx < 0 {
		return "", false
	}

	start := max(idx-15, 0)
	end := min(idx+len(q)+25, len(src))
	snippet := string(src[start:end])
	if start > 0 {
		snippet = "…" + snippet
	}
	if end < len(src) {
		snippet += "…"
	}
	return snippet, true
}
