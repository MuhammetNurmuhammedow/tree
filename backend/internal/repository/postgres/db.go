package postgres

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"familytree/config"
)

// NewPool initializes and returns a pgx connection pool with auto-retry.
func NewPool(cfg *config.Config) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("postgres parse config: %w", err)
	}

	poolConfig.MaxConns = 25
	poolConfig.MinConns = 2
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute

	maxAttempts := 15
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
		if err == nil {
			pingErr := pool.Ping(ctx)
			if pingErr == nil {
				cancel()
				log.Printf("🐘 PostgreSQL baglanyşygy üstünlikli guruldy (synanyşyk %d/%d).", attempt, maxAttempts)
				return pool, nil
			}
			pool.Close()
			lastErr = pingErr
		} else {
			lastErr = err
		}
		cancel()

		if attempt < maxAttempts {
			log.Printf("⏳ PostgreSQL garaşylýar (%s:%s, synanyşyk %d/%d): %v", cfg.DBHost, cfg.DBPort, attempt, maxAttempts, lastErr)
			time.Sleep(2 * time.Second)
		}
	}

	return nil, fmt.Errorf("postgres connect failed after %d attempts: %w", maxAttempts, lastErr)
}

// RunMigrations runs all *.up.sql migration files found in migrationsDir.
func RunMigrations(pool *pgxpool.Pool, migrationsDir string) error {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			files = append(files, entry.Name())
		}
	}
	sort.Strings(files)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for _, f := range files {
		filePath := filepath.Join(migrationsDir, f)
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", f, err)
		}

		if _, err := pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("execute migration %s: %w", f, err)
		}
		log.Printf("Applied migration: %s", f)
	}

	return nil
}
