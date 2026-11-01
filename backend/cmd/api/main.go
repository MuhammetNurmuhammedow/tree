package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"familytree/config"
	"familytree/internal/domain"
	"familytree/internal/handler"
	"familytree/internal/repository"
	"familytree/internal/repository/postgres"
	"familytree/internal/service"
)

func main() {
	// ── Configuration ──────────────────────────────────────────────────────────
	cfg := config.Load()

	// ── Database / Repositories ────────────────────────────────────────────────
	var personRepo domain.PersonRepository
	var relRepo domain.RelationshipRepository
	var treeRepo *postgres.TreeRepo
	dbMode := "in-memory"

	pool, err := postgres.NewPool(cfg)
	if err != nil {
		log.Printf("⚠️ PostgreSQL bilen baglanyşyk gurup bolmady (%v). Wagtlaýyn ýatdaky (in-memory) tertip işledildi.", err)
		personRepo = repository.NewMemPersonRepo()
		relRepo = repository.NewMemRelRepo()
	} else {
		log.Println("🐘 PostgreSQL maglumat bazasy bilen baglanyşyk üstünlikli! (Host: " + cfg.DBHost + ", Port: " + cfg.DBPort + ")")
		migDir := "./migrations"
		if _, err := os.Stat(migDir); err == nil {
			if migErr := postgres.RunMigrations(pool, migDir); migErr != nil {
				log.Printf("⚠️ Migrations warning: %v", migErr)
			}
		}
		personRepo = postgres.NewPersonRepo(pool)
		relRepo = postgres.NewRelRepo(pool)
		treeRepo = postgres.NewTreeRepo(pool)
		dbMode = "postgresql"
	}

	// ── Services ───────────────────────────────────────────────────────────────
	personSvc := service.NewPersonService(personRepo)
	relSvc := service.NewRelationshipService(relRepo, personRepo)
	treeSvc := service.NewTreeService(personRepo, relRepo)
	seedSvc := service.NewSeedService(personRepo, relRepo)
	treeMetaSvc := service.NewTreeMetaService(personRepo, treeRepo)

	// Pre-seed demo data if repository is empty so the app has data immediately
	if existing, err := personRepo.GetAll(); err == nil && len(existing) == 0 {
		log.Println("🌱 Maglumat bazasy boş, nusga maşgala agaçlary ýüklenýär...")
		if err := seedSvc.SeedDemoData(); err != nil {
			log.Printf("Nusga maglumatlar ýüklenende ýalňyşlyk: %v", err)
		} else {
			log.Println("✅ Nusga maglumatlar üstünlikli ýüklendi!")
		}
	}

	// ── Upload directory ───────────────────────────────────────────────────────
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("Ýükleme bukjasyny döredip bolmady: %v", err)
	}

	// ── Fiber App ──────────────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName: "Family Tree API v1",
	})

	app.Use(recover.New())
	app.Use(fiberlogger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	app.Static("/uploads", filepath.Join(".", "uploads"))

	// ── Routes ─────────────────────────────────────────────────────────────────
	api := app.Group("/api/v1")

	handler.NewPersonHandler(personSvc, uploadDir).RegisterRoutes(api)
	handler.NewRelationshipHandler(relSvc).RegisterRoutes(api)
	handler.NewTreeHandler(treeSvc).RegisterRoutes(api)
	handler.NewMediaHandler(uploadDir).RegisterRoutes(api)

	// Trees management
	api.Get("/trees", func(c *fiber.Ctx) error {
		return c.JSON(treeMetaSvc.GetAllTrees())
	})

	api.Post("/trees", func(c *fiber.Ctx) error {
		var req struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.BodyParser(&req); err != nil || req.Name == "" {
			return fiber.NewError(fiber.StatusBadRequest, "agajyň ady hökmany")
		}
		newTree := treeMetaSvc.CreateTree(req.Name, req.Description)
		return c.Status(fiber.StatusCreated).JSON(newTree)
	})

	// Search across all trees or filtered by treeId
	api.Get("/search", func(c *fiber.Ctx) error {
		q := c.Query("q")
		treeID := c.Query("treeId")
		results := treeMetaSvc.Search(q, treeID)
		return c.JSON(results)
	})

	// Seed endpoint
	api.Post("/seed", func(c *fiber.Ctx) error {
		if err := seedSvc.SeedDemoData(); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"message": "Nusga maşgala agaçlary üstünlikli ýüklendi"})
	})

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"env":    cfg.AppEnv,
			"mode":   dbMode,
		})
	})

	// ── Start ──────────────────────────────────────────────────────────────────
	addr := ":" + cfg.AppPort
	log.Printf("🌳 Family Tree API [%s] → http://localhost%s", dbMode, addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Serweri işledip bolmady: %v", err)
	}
}
