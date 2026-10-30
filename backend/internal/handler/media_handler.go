package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
)

// MediaHandler handles /api/v1/upload routes.
type MediaHandler struct {
	uploadDir string
}

// NewMediaHandler creates a new MediaHandler.
func NewMediaHandler(uploadDir string) *MediaHandler {
	return &MediaHandler{uploadDir: uploadDir}
}

// RegisterRoutes mounts media routes onto a Fiber router group.
func (h *MediaHandler) RegisterRoutes(r fiber.Router) {
	r.Post("/upload", h.Upload)
}

// Upload accepts a multipart file and saves it to disk.
func (h *MediaHandler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, "dosya bulunamadı")
	}

	// Limit: 10 MB
	if file.Size > 10<<20 {
		return fiber.NewError(http.StatusRequestEntityTooLarge, "dosya 10MB'dan büyük olamaz")
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(h.uploadDir, filename)

	if err := c.SaveFile(file, savePath); err != nil {
		return fiber.NewError(http.StatusInternalServerError, "dosya kaydedilemedi")
	}

	return c.JSON(fiber.Map{
		"url":      "/uploads/" + filename,
		"filename": filename,
		"size":     file.Size,
	})
}

