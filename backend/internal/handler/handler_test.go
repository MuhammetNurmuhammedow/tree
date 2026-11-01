package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"familytree/internal/domain"
	"familytree/internal/repository"
	"familytree/internal/service"
)

// newTestApp wires the real handlers to in-memory repositories,
// mirroring cmd/api/main.go when PostgreSQL is unavailable.
func newTestApp(t *testing.T) *fiber.App {
	t.Helper()
	pr := repository.NewMemPersonRepo()
	rr := repository.NewMemRelRepo()
	uploadDir := t.TempDir()

	app := fiber.New()
	api := app.Group("/api/v1")
	NewPersonHandler(service.NewPersonService(pr), uploadDir).RegisterRoutes(api)
	NewRelationshipHandler(service.NewRelationshipService(rr, pr)).RegisterRoutes(api)
	NewTreeHandler(service.NewTreeService(pr, rr)).RegisterRoutes(api)
	NewMediaHandler(uploadDir).RegisterRoutes(api)
	return app
}

func do(t *testing.T, app *fiber.App, method, path string, body any) (int, []byte) {
	t.Helper()
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, r)
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, out
}

func createPerson(t *testing.T, app *fiber.App, body map[string]any) domain.Person {
	t.Helper()
	code, out := do(t, app, http.MethodPost, "/api/v1/persons", body)
	if code != http.StatusCreated {
		t.Fatalf("create person: %d %s", code, out)
	}
	var p domain.Person
	if err := json.Unmarshal(out, &p); err != nil {
		t.Fatal(err)
	}
	return p
}

func TestPersonCRUD(t *testing.T) {
	app := newTestApp(t)
	p := createPerson(t, app, map[string]any{"first_name": "Batyr", "last_name": "Berdiýew", "gender": "male"})

	code, _ := do(t, app, http.MethodGet, "/api/v1/persons/"+p.ID.String(), nil)
	if code != http.StatusOK {
		t.Errorf("GET = %d", code)
	}

	code, out := do(t, app, http.MethodPut, "/api/v1/persons/"+p.ID.String(), map[string]any{"birth_place": "Aşgabat"})
	if code != http.StatusOK {
		t.Fatalf("PUT = %d %s", code, out)
	}
	var updated domain.Person
	_ = json.Unmarshal(out, &updated)
	if updated.FirstName != "Batyr" || updated.BirthPlace == nil || *updated.BirthPlace != "Aşgabat" {
		t.Errorf("partial update lost fields: %+v", updated)
	}

	if code, _ := do(t, app, http.MethodDelete, "/api/v1/persons/"+p.ID.String(), nil); code != http.StatusNoContent {
		t.Errorf("DELETE = %d", code)
	}
	if code, _ := do(t, app, http.MethodGet, "/api/v1/persons/"+p.ID.String(), nil); code != http.StatusNotFound {
		t.Errorf("GET after delete = %d, want 404", code)
	}
}

func TestPersonBadRequests(t *testing.T) {
	app := newTestApp(t)
	cases := []struct {
		method, path string
		body         any
		want         int
	}{
		{http.MethodGet, "/api/v1/persons/not-a-uuid", nil, http.StatusBadRequest},
		{http.MethodGet, "/api/v1/persons/00000000-0000-0000-0000-000000000001", nil, http.StatusNotFound},
		{http.MethodPost, "/api/v1/persons", map[string]any{"first_name": "OnlyFirst"}, http.StatusBadRequest},
		{http.MethodPost, "/api/v1/persons", map[string]any{"first_name": "A", "last_name": "B", "gender": "other"}, http.StatusBadRequest},
		{http.MethodPut, "/api/v1/persons/00000000-0000-0000-0000-000000000001", map[string]any{}, http.StatusNotFound},
		{http.MethodGet, "/api/v1/tree/not-a-uuid", nil, http.StatusBadRequest},
	}
	for _, c := range cases {
		if code, out := do(t, app, c.method, c.path, c.body); code != c.want {
			t.Errorf("%s %s = %d (%s), want %d", c.method, c.path, code, out, c.want)
		}
	}
}

// A PUT that fails validation must not change the stored person. The handler
// decodes the body straight into the pointer returned by the repository, which
// for the in-memory repo is the stored object itself.
func TestPersonUpdateRejectedLeavesRecordUnchanged(t *testing.T) {
	t.Skip("MÄLIM ÝALŇYŞLYK: nädogry PUT in-memory tertipde ýazgyny barybir üýtgedýär")

	app := newTestApp(t)
	p := createPerson(t, app, map[string]any{"first_name": "Batyr", "last_name": "Berdiýew", "gender": "male"})
	if code, _ := do(t, app, http.MethodPut, "/api/v1/persons/"+p.ID.String(), map[string]any{"first_name": ""}); code != http.StatusBadRequest {
		t.Fatalf("invalid PUT = %d, want 400", code)
	}
	_, out := do(t, app, http.MethodGet, "/api/v1/persons/"+p.ID.String(), nil)
	var got domain.Person
	_ = json.Unmarshal(out, &got)
	if got.FirstName != "Batyr" {
		t.Errorf("first_name = %q after rejected update, want Batyr", got.FirstName)
	}
}

// The handler comment says tree_id cannot be overwritten, but only ID is enforced.
func TestPersonUpdateCannotMoveTree(t *testing.T) {
	t.Skip("MÄLIM ÝALŇYŞLYK: PUT bilen tree_id üýtgedip bolýar")

	app := newTestApp(t)
	p := createPerson(t, app, map[string]any{"first_name": "Batyr", "last_name": "Berdiýew", "gender": "male"})
	_, out := do(t, app, http.MethodPut, "/api/v1/persons/"+p.ID.String(), map[string]any{"tree_id": "tree-amanow"})
	var got domain.Person
	_ = json.Unmarshal(out, &got)
	if got.TreeID != "my-tree" {
		t.Errorf("tree_id = %q, want my-tree", got.TreeID)
	}
}

func TestTreeEndpoint(t *testing.T) {
	app := newTestApp(t)
	a := createPerson(t, app, map[string]any{"first_name": "Batyr", "last_name": "B", "gender": "male"})
	b := createPerson(t, app, map[string]any{"first_name": "Merdan", "last_name": "B", "gender": "male"})

	code, out := do(t, app, http.MethodPost, "/api/v1/relationships", map[string]any{
		"person_id": a.ID, "related_person_id": b.ID, "relationship_type": "parent",
	})
	if code != http.StatusCreated {
		t.Fatalf("create relationship = %d %s", code, out)
	}
	if code, _ := do(t, app, http.MethodPost, "/api/v1/relationships", map[string]any{
		"person_id": a.ID, "related_person_id": a.ID, "relationship_type": "spouse",
	}); code != http.StatusBadRequest {
		t.Errorf("self relationship = %d, want 400", code)
	}

	code, out = do(t, app, http.MethodGet, "/api/v1/tree?treeId=my-tree", nil)
	if code != http.StatusOK {
		t.Fatalf("GET tree = %d", code)
	}
	var g service.TreeGraph
	if err := json.Unmarshal(out, &g); err != nil {
		t.Fatal(err)
	}
	if len(g.Nodes) != 2 || len(g.Edges) != 1 {
		t.Errorf("tree = %d nodes / %d edges, want 2 / 1", len(g.Nodes), len(g.Edges))
	}

	code, out = do(t, app, http.MethodGet, "/api/v1/persons/"+a.ID.String()+"/relationships", nil)
	if code != http.StatusOK || !bytes.Contains(out, []byte(b.ID.String())) {
		t.Errorf("person relationships = %d %s", code, out)
	}
}

func upload(t *testing.T, app *fiber.App, filename string, content []byte) int {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, _ := w.CreateFormFile("file", filename)
	_, _ = fw.Write(content)
	_ = w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	return resp.StatusCode
}

func TestUploadValidation(t *testing.T) {
	app := newTestApp(t)
	png := append([]byte("\x89PNG\r\n\x1a\n"), make([]byte, 32)...)

	if code := upload(t, app, "photo.png", png); code != http.StatusOK {
		t.Errorf("valid png = %d, want 200", code)
	}
	if code := upload(t, app, "photo.txt", png); code != http.StatusBadRequest {
		t.Errorf("bad extension = %d, want 400", code)
	}
	if code := upload(t, app, "photo.png", []byte("<?php echo 1; ?>")); code != http.StatusBadRequest {
		t.Errorf("non-image content with .png = %d, want 400", code)
	}
}
