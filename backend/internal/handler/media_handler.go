package handler

import (
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AllowedImageExtensions lists the valid photo file extensions.
var AllowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
	".avif": true,
}

// ValidateAndSaveImage validates file size, extension, MIME type, and saves to uploadDir.
func ValidateAndSaveImage(file *multipart.FileHeader, c *fiber.Ctx, uploadDir string) (string, error) {
	// Limit: 10 MB
	if file.Size > 10<<20 {
		return "", errors.New("dosya boyutu 10MB'dan büyük olamaz")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !AllowedImageExtensions[ext] {
		return "", errors.New("sadece resim dosyaları (.jpg, .jpeg, .png, .webp, .gif) yüklenebilir")
	}

	// Verify magic bytes
	f, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("dosya açılamadı: %w", err)
	}
	defer f.Close()

	buffer := make([]byte, 512)
	n, err := f.Read(buffer)
	if err != nil && n == 0 {
		return "", errors.New("dosya içeriği okunamadı")
	}

	mimeType := http.DetectContentType(buffer[:n])
	if !strings.HasPrefix(mimeType, "image/") {
		return "", errors.New("geçersiz dosya türü, resim dosyası tespit edilemedi")
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("yükleme dizini oluşturulamadı: %w", err)
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveFile(file, savePath); err != nil {
		return "", fmt.Errorf("dosya kaydedilemedi: %w", err)
	}

	return "/uploads/" + filename, nil
}

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
		return fiber.NewError(http.StatusBadRequest, "resim dosyası bulunamadı")
	}

	url, err := ValidateAndSaveImage(file, c, h.uploadDir)
	if err != nil {
		return fiber.NewError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(fiber.Map{
		"url":      url,
		"filename": filepath.Base(url),
		"size":     file.Size,
	})
}

