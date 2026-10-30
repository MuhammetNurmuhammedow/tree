package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// App
	AppPort string
	AppEnv  string

	// Auth
	JWTSecret string

	// CORS
	CORSOrigins string
}

// Load reads .env file (if present) and returns a populated Config.
func Load() *Config {
	// In production the env vars are injected by Docker / Kubernetes.
	// In development we fall back to the .env file.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	return &Config{
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "familytree"),
		DBPassword:  getEnv("DB_PASSWORD", "secret"),
		DBName:      getEnv("DB_NAME", "familytree"),
		DBSSLMode:   getEnv("DB_SSLMODE", "disable"),
		AppPort:     getEnv("APP_PORT", "8080"),
		AppEnv:      getEnv("APP_ENV", "development"),
		JWTSecret:   getEnv("JWT_SECRET", "changeme"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
	}
}


func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

