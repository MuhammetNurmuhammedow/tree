package handler

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"familytree/internal/domain"
	"familytree/internal/service"
)

type RelationshipHandler struct {
	svc *service.RelationshipService
}

func NewRelationshipHandler(svc *service.RelationshipService) *RelationshipHandler {
	return &RelationshipHandler{svc: svc}
}

func (h *RelationshipHandler) RegisterRoutes(r fiber.Router) {
	r.Post("/relationships", h.Create)
	r.Delete("/relationships/:id", h.Delete)
	r.Get("/persons/:id/relationships", h.GetByPersonID)
}

func (h *RelationshipHandler) Create(c *fiber.Ctx) error {
	var rel domain.Relationship
	if err := c.BodyParser(&rel); err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz JSON gövdesi")
	}
	if err := h.svc.Create(&rel); err != nil {
		return fiber.NewError(http.StatusBadRequest, err.Error())
	}
	return c.Status(http.StatusCreated).JSON(rel)
}

func (h *RelationshipHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	if err := h.svc.Delete(id); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

func (h *RelationshipHandler) GetByPersonID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	rels, err := h.svc.GetByPersonID(id)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(rels)
}

