package recorder

import (
	"io"
	"log/slog"
	"os"
	"sync"
	"sync/atomic"

	ffmpeg "github.com/u2takey/ffmpeg-go"
)

type LiveRecorder struct {
	StreamURL string

	initOnce   sync.Once
	writersMux sync.RWMutex
	writers    map[string]notifyWriter
	interrupt  atomic.Bool
}

func (r *LiveRecorder) Run() error {
	return ffmpeg.Input(r.StreamURL,
		ffmpeg.KwArgs{"rtsp_transport": "tcp"},
		ffmpeg.KwArgs{"buffer_size": "8192k"},
		ffmpeg.KwArgs{"timeout": "2000000"},
		ffmpeg.KwArgs{"strict": -2}).WithOutput(r).Output("-", ffmpeg.KwArgs{"c:v": "copy"},
		ffmpeg.KwArgs{"c:a": "aac"}, ffmpeg.KwArgs{"f": "mpegts"}).Run()
}

func (r *LiveRecorder) Interrupt() error {
	r.interrupt.Store(true)
	return nil
}

func (r *LiveRecorder) Write(p []byte) (int, error) {
	r.initOnce.Do(func() {
		r.writers = make(map[string]notifyWriter)
	})
	if r.interrupt.Load() {
		return 0, os.ErrClosed
	}
	var writers []notifyWriter
	r.writersMux.RLock()
	for _, w := range r.writers {
		writers = append(writers, w)
	}
	r.writersMux.RUnlock()
	if len(writers) == 0 {
		slog.Debug("No writer found")
		return len(p), nil
	}
	for _, w := range writers {
		_, err := w.w.Write(p)
		if err != nil {
			close(w.c)
			r.DelWriter(w.id)
		}
	}
	return len(p), nil
}

func (r *LiveRecorder) AddWriter(id string, w io.Writer) <-chan struct{} {
	r.initOnce.Do(func() {
		r.writers = make(map[string]notifyWriter)
	})
	r.writersMux.Lock()
	defer r.writersMux.Unlock()
	c := make(chan struct{})
	r.writers[id] = notifyWriter{w: w, c: c, id: id}
	slog.Info("Live recorder", "event", "add-writer", "id", id)
	return c
}

func (r *LiveRecorder) DelWriter(id string) {
	r.initOnce.Do(func() {
		r.writers = make(map[string]notifyWriter)
	})
	r.writersMux.Lock()
	defer r.writersMux.Unlock()
	delete(r.writers, id)
	slog.Info("Live recorder", "event", "del-writer", "id", id)
}

type notifyWriter struct {
	id string
	c  chan struct{}
	w  io.Writer
}
