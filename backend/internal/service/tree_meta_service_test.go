package service

import (
	"strings"
	"testing"
	"unicode/utf8"

	"familytree/internal/domain"
	"familytree/internal/repository"
)

func newMetaService(t *testing.T, persons ...*domain.Person) *TreeMetaService {
	t.Helper()
	pr := repository.NewMemPersonRepo()
	for _, p := range persons {
		if err := pr.Create(p); err != nil {
			t.Fatal(err)
		}
	}
	return NewTreeMetaService(pr, nil)
}

func strPtr(s string) *string { return &s }

func TestTreeMetaDefaultTreesWithoutDB(t *testing.T) {
	svc := newMetaService(t, &domain.Person{TreeID: "my-tree", FirstName: "A", LastName: "B"})
	trees := svc.GetAllTrees()
	if len(trees) != 4 {
		t.Fatalf("default trees = %d, want 4", len(trees))
	}
	owned := 0
	for _, tr := range trees {
		if tr.IsOwner {
			owned++
			if tr.ID != "my-tree" || tr.MemberCount != 1 {
				t.Errorf("owned tree = %s with %d members, want my-tree with 1", tr.ID, tr.MemberCount)
			}
		}
	}
	if owned != 1 {
		t.Errorf("owned trees = %d, want 1", owned)
	}
}

func TestTreeMetaCreateTree(t *testing.T) {
	svc := newMetaService(t)
	tr := svc.CreateTree("Täze agaç", "")
	if !strings.HasPrefix(tr.ID, "tree-") || !tr.IsOwner {
		t.Errorf("CreateTree() = %+v", tr)
	}
	if len(svc.GetAllTrees()) != 5 {
		t.Error("created tree not listed")
	}
}

func TestTreeMetaSearch(t *testing.T) {
	svc := newMetaService(t,
		&domain.Person{TreeID: "my-tree", FirstName: "Batyr", LastName: "Berdiýew", BirthPlace: strPtr("Aşgabat"), IsLiving: true},
		&domain.Person{TreeID: "tree-amanow", FirstName: "Serdar", LastName: "Amanow", MaidenName: nil, BirthPlace: strPtr("Mary")},
		&domain.Person{TreeID: "tree-amanow", FirstName: "Jeren", LastName: "Amanowa", MaidenName: strPtr("Gurbanowa")},
	)

	if got := svc.Search("  ", ""); got != nil {
		t.Errorf("blank query should return nil, got %d", len(got))
	}

	got := svc.Search("BATYR", "")
	if len(got) != 1 || got[0].TreeName != "Berdiýewler Maşgala Agajy" || !got[0].IsMyTree {
		t.Errorf("case-insensitive name search = %+v", got)
	}

	if got[0].MatchField != "" || got[0].BirthYear != "" || !got[0].IsLiving {
		t.Errorf("name match fields = %+v", got[0])
	}

	got = svc.Search("mary", "")
	if len(got) != 1 || got[0].MatchField != "birth_place" || got[0].MatchContext != "Mary" || got[0].IsMyTree {
		t.Errorf("birth place search = %+v", got)
	}

	got = svc.Search("gurbanowa", "")
	if len(got) != 1 || got[0].MatchField != "maiden_name" || got[0].MatchContext != "Gurbanowa" {
		t.Errorf("maiden name search = %+v", got)
	}

	if got := svc.Search("amanow", "my-tree"); len(got) != 0 {
		t.Errorf("tree filter leaked %d results", len(got))
	}
	if got := svc.Search("amanow", "tree-amanow"); len(got) != 2 {
		t.Errorf("tree filter results = %d, want 2", len(got))
	}
}

func TestTreeMetaSearchBiographySnippet(t *testing.T) {
	bio := strings.Repeat("a", 40) + " inžener " + strings.Repeat("b", 40)
	svc := newMetaService(t, &domain.Person{FirstName: "Oraz", LastName: "Berdiýew", Biography: &bio})
	got := svc.Search("inžener", "")
	if len(got) != 1 {
		t.Fatalf("results = %d, want 1", len(got))
	}
	ctx := got[0].MatchContext
	if got[0].MatchField != "biography" || !strings.Contains(ctx, "inžener") || !strings.HasPrefix(ctx, "…") || !strings.HasSuffix(ctx, "…") {
		t.Errorf("snippet = %q (field %q)", ctx, got[0].MatchField)
	}
}

// Lower-casing can change a string's byte length: "İ" (2 bytes) lowers to "i"
// (1 byte) and "Ⱥ" (2 bytes) to "ⱥ" (3 bytes). The snippet must still be cut
// on rune boundaries of the original text without panicking.
func TestTreeMetaSearchBiographyUnicode(t *testing.T) {
	bio :="İSLAM İŞLERİNDE İLKİ " + strings.Repeat("ş", 10) + " inžener we mugallym bolup işledi"
	svc := newMetaService(t, &domain.Person{FirstName: "X", LastName: "Y", Biography: &bio})
	if ctx := svc.Search("inžener", "")[0].MatchContext; !utf8.ValidString(ctx) || !strings.Contains(ctx, "inžener") {
		t.Errorf("snippet is not valid UTF-8: %q", ctx)
	}

	bio2 := strings.Repeat("Ⱥ", 20) + " abc"
	svc2 := newMetaService(t, &domain.Person{FirstName: "X", LastName: "Y", Biography: &bio2})
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("Search panicked: %v", r)
		}
	}()
	svc2.Search("abc", "")
}
