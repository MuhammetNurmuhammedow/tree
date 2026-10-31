package service

import (
	"fmt"

	"github.com/google/uuid"

	"familytree/internal/domain"
)

// TreeNode is a React Flow-compatible node representation.
type TreeNode struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Position Position       `json:"position"`
	Data     TreeNodeData   `json:"data"`
}

// Position is the x/y coordinate for React Flow (ELK.js sets this on the frontend).
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// TreeNodeData is the payload available inside the React PersonNode component.
type TreeNodeData struct {
	Person *domain.Person `json:"person"`
}

// TreeEdge is a React Flow-compatible edge (connection) representation.
type TreeEdge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`   // "bloodEdge" | "spouseEdge"
	Label  string `json:"label,omitempty"`
}

// TreeGraph is the full graph payload sent to the frontend.
type TreeGraph struct {
	Nodes []*TreeNode `json:"nodes"`
	Edges []*TreeEdge `json:"edges"`
}

// TreeService builds React Flow graph data from the database.
type TreeService struct {
	personRepo domain.PersonRepository
	relRepo    domain.RelationshipRepository
}

// NewTreeService creates a new TreeService.
func NewTreeService(pr domain.PersonRepository, rr domain.RelationshipRepository) *TreeService {
	return &TreeService{personRepo: pr, relRepo: rr}
}

// BuildTree assembles nodes and edges for a specific tree instance.
func (s *TreeService) BuildTree(treeID string) (*TreeGraph, error) {
	if treeID == "" {
		treeID = "my-tree"
	}
	persons, err := s.personRepo.GetByTreeID(treeID)
	if err != nil {
		return nil, fmt.Errorf("tree_service.BuildTree persons: %w", err)
	}

	graph := &TreeGraph{}

	// Build a set of valid person IDs in this tree for edge validation
	validNodeIDs := make(map[string]bool, len(persons))
	for _, p := range persons {
		validNodeIDs[p.ID.String()] = true
		graph.Nodes = append(graph.Nodes, &TreeNode{
			ID:       p.ID.String(),
			Type:     "personNode",
			Position: Position{X: 0, Y: 0},
			Data:     TreeNodeData{Person: p},
		})
	}

	// Collect edges only after all nodes are known
	for _, p := range persons {
		rels, err := s.relRepo.GetByPersonID(p.ID)
		if err != nil {
			return nil, fmt.Errorf("tree_service.BuildTree rels: %w", err)
		}
		for _, rel := range rels {
			edge := buildEdge(rel)
			if edge == nil {
				continue
			}
			// Skip edges where source or target node does not exist in this tree
			if !validNodeIDs[edge.Source] || !validNodeIDs[edge.Target] {
				continue
			}
			graph.Edges = append(graph.Edges, edge)
		}
	}

	graph.Edges = deduplicateEdges(graph.Edges)
	return graph, nil
}

// BuildFullTree assembles nodes and edges for every person in the database.
func (s *TreeService) BuildFullTree() (*TreeGraph, error) {
	return s.BuildTree("my-tree")
}

// BuildSubTree returns the graph rooted at a specific person (ancestors + descendants).
func (s *TreeService) BuildSubTree(rootID uuid.UUID) (*TreeGraph, error) {
	// For now, build the full tree and let the frontend filter by focus node.
	// Future: only fetch the connected component of rootID.
	return s.BuildFullTree()
}

func buildEdge(rel *domain.Relationship) *TreeEdge {
	src := rel.PersonID.String()
	tgt := rel.RelatedPersonID.String()

	switch rel.RelationshipType {
	case domain.RelParent, domain.RelAdoptiveParent:
		return &TreeEdge{
			ID:     "e-" + rel.ID.String(),
			Source: src,
			Target: tgt,
			Type:   "bloodEdge",
		}
	case domain.RelSpouse:
		label := "evli"
		if rel.Notes != nil && *rel.Notes != "" {
			label = *rel.Notes
		}
		return &TreeEdge{
			ID:     "e-" + rel.ID.String(),
			Source: src,
			Target: tgt,
			Type:   "spouseEdge",
			Label:  label,
		}
	case domain.RelFormerSpouse:
		label := "eski eş"
		if rel.Notes != nil && *rel.Notes != "" {
			label = *rel.Notes
		}
		return &TreeEdge{
			ID:     "e-" + rel.ID.String(),
			Source: src,
			Target: tgt,
			Type:   "spouseEdge",
			Label:  label,
		}
	default:
		return nil
	}
}

func deduplicateEdges(edges []*TreeEdge) []*TreeEdge {
	seen := make(map[string]bool)
	var result []*TreeEdge
	for _, e := range edges {
		if !seen[e.ID] {
			seen[e.ID] = true
			result = append(result, e)
		}
	}
	return result
}

