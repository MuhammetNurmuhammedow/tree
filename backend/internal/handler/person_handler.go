package handler

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"familytree/internal/domain"
	"familytree/internal/service"
)

// PersonHandler handles /api/v1/persons routes.
type PersonHandler struct {
	svc *service.PersonService
}

// NewPersonHandler creates a new PersonHandler.
func NewPersonHandler(svc *service.PersonService) *PersonHandler {
	return &PersonHandler{svc: svc}
}

// RegisterRoutes mounts the person routes onto a Fiber router group.
func (h *PersonHandler) RegisterRoutes(r fiber.Router) {
	r.Get("/persons", h.GetAll)
	r.Get("/persons/search", h.Search)
	r.Get("/persons/:id", h.GetByID)
	r.Post("/persons", h.Create)
	r.Put("/persons/:id", h.Update)
	r.Delete("/persons/:id", h.Delete)
}

// GetAll godoc
// @Summary  List all persons
// @Tags     persons
// @Produce  json
// @Success  200 {array} domain.Person
// @Router   /api/v1/persons [get]
func (h *PersonHandler) GetAll(c *fiber.Ctx) error {
	persons, err := h.svc.GetAll()
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(persons)
}

// Search godoc
// @Summary  Search persons by name
// @Tags     persons
// @Produce  json
// @Param    q query string true "Search query"
// @Success  200 {array} domain.Person
// @Router   /api/v1/persons/search [get]
func (h *PersonHandler) Search(c *fiber.Ctx) error {
	q := c.Query("q")
	persons, err := h.svc.Search(q)
	if err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(persons)
}

// GetByID godoc
// @Summary  Get a person by ID
// @Tags     persons
// @Produce  json
// @Param    id path string true "Person UUID"
// @Success  200 {object} domain.Person
// @Router   /api/v1/persons/{id} [get]
func (h *PersonHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	p, err := h.svc.GetByID(id)
	if err != nil {
		return fiber.NewError(http.StatusNotFound, "kişi bulunamadı")
	}
	return c.JSON(p)
}

// Create godoc
// @Summary  Create a new person
// @Tags     persons
// @Accept   json
// @Produce  json
// @Param    body body domain.Person true "Person data"
// @Success  201 {object} domain.Person
// @Router   /api/v1/persons [post]
func (h *PersonHandler) Create(c *fiber.Ctx) error {
	var p domain.Person
	if err := c.BodyParser(&p); err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz JSON gövdesi")
	}
	if err := h.svc.Create(&p); err != nil {
		return fiber.NewError(http.StatusBadRequest, err.Error())
	}
	return c.Status(http.StatusCreated).JSON(p)
}

// Update godoc
// @Summary  Update an existing person
// @Tags     persons
// @Accept   json
// @Produce  json
// @Param    id   path string      true "Person UUID"
// @Param    body body domain.Person true "Updated person data"
// @Success  200 {object} domain.Person
// @Router   /api/v1/persons/{id} [put]
func (h *PersonHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	var p domain.Person
	if err := c.BodyParser(&p); err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz JSON gövdesi")
	}
	p.ID = id
	if err := h.svc.Update(&p); err != nil {
		return fiber.NewError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(p)
}

// Delete godoc
// @Summary  Delete a person
// @Tags     persons
// @Param    id path string true "Person UUID"
// @Success  204
// @Router   /api/v1/persons/{id} [delete]
func (h *PersonHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "geçersiz UUID")
	}
	if err := h.svc.Delete(id); err != nil {
		return fiber.NewError(http.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(http.StatusNoContent)
}

