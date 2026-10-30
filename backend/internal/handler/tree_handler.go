package handler

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"familytree/internal/service"
)

// TreeHandler handles /api/v1/tree routes.
type TreeHandler struct {
	svc *service.TreeService
}

// NewTreeHandler creates a new TreeHandler.
func NewTreeHandler(svc *service.TreeService) *TreeHandler {
	return &TreeHandler{svc: svc}
}

// RegisterRoutes mounts tree routes onto a Fiber router group.
func (h *TreeHandler) RegisterRoutes(r fiber.Router) {
	r.Get("/tree", h.GetFullTree)
	r.Get("/tree/:rootId", h.GetSubTree)
}

// GetFullTree returns the complete family tree as React Flow nodes + edges.
func (h *TreeHandler) GetFullTree(c *fiber.Ctx) error {
	treeID := c.Query("treeId")
	if treeID == "" {
		treeID = "my-tree"
	}
	graph, err := h.svc.BuildTree(treeID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(graph)
}

// GetSubTree returns a sub-tree rooted at the given person.
func (h *TreeHandler) GetSubTree(c *fiber.Ctx) error {
	rootID, err := uuid.Parse(c.Params("rootId"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	graph, err := h.svc.BuildSubTree(rootID)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(graph)
}

