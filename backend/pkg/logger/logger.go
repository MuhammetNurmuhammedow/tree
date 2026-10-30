package logger

import "log"

// Logger wraps the standard log package.
type Logger struct{}

func New(_ string) *Logger { return &Logger{} }
func (l *Logger) Sync()    {}
func (l *Logger) Info(msg string)  { log.Println("[INFO]", msg) }
func (l *Logger) Error(msg string) { log.Println("[ERROR]", msg) }
