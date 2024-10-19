package recorder

import (
	"errors"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	ffmpeg "github.com/u2takey/ffmpeg-go"
)

type FSRecorder struct {
	Path      string
	StreamURL string

	rinit   sync.Once
	process atomic.Pointer[os.Process]
}

func (r *FSRecorder) init() {
	r.rinit.Do(func() {
		os.Mkdir(r.Path, 0600)
		os.Mkdir(filepath.Join(r.Path, time.Now().Format("2006-01")), 0600)
	})
}

func (r *FSRecorder) Run() error {
	r.init()
	retryCount := 0
retry:
	s := ffmpeg.Input(r.StreamURL,
		ffmpeg.KwArgs{"rtsp_transport": "tcp"},
		ffmpeg.KwArgs{"buffer_size": "8192k"},
		ffmpeg.KwArgs{"timeout": "2000000"},
		ffmpeg.KwArgs{"strict": -2}).
		Output(filepath.Join(r.Path, "%Y-%m", "%d_%H-%M-%S.ts"),
			ffmpeg.KwArgs{"c:v": "copy"},
			ffmpeg.KwArgs{"c:a": "aac"},
			ffmpeg.KwArgs{"strftime": "1"},
			ffmpeg.KwArgs{"f": "segment"},
			ffmpeg.KwArgs{"segment_time": "7200"},
			ffmpeg.KwArgs{"reset_timestamps": "1"})

	cmd := s.Compile()
	if err := cmd.Start(); err != nil {
		return err
	}
	r.process.Store(cmd.Process)
	err := cmd.Wait()
	if err != nil {
		os.Mkdir(filepath.Join(r.Path, time.Now().Format("2006-01")), 0600)
		if retryCount == 0 {
			retryCount++
			goto retry
		}
	}
	return err
}

func (r *FSRecorder) Interrupt() error {
	if p := r.process.Load(); p != nil {
		return p.Kill()
	}
	return errors.New("not started yet")
}
