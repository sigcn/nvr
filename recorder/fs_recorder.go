package recorder

import (
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sigcn/nvr/errdefs"
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
			ffmpeg.KwArgs{"segment_time": "10000"},
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

func (r *FSRecorder) Read(t time.Time, w io.Writer) error {
	dir := path.Join(r.Path, t.Format("2006-01"))
	videoFile, err := r.findFirstVideoTimestamp(dir, t)
	if err != nil {
		return err
	}
	offset := max(t.Sub(*videoFile).Seconds(), 0)
	for {
		err = ffmpeg.Input(path.Join(dir, videoFile.Format("02_15-04-05.ts")),
			ffmpeg.KwArgs{"ss": offset}).WithOutput(w).Output("-",
			ffmpeg.KwArgs{"c": "copy"},
			ffmpeg.KwArgs{"f": "mpegts"}).Run()
		if err != nil {
			return err
		}

		videoFile, err = r.findNextVideoTimestamp(dir, *videoFile)
		if err != nil {
			return err
		}
		if videoFile == nil {
			break
		}
		offset = 0
	}
	return nil
}

func (r *FSRecorder) findNextVideoTimestamp(dir string, videoFile time.Time) (*time.Time, error) {
	videos, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for i, v := range videos {
		if videoFile.Format("02_15-04-05.ts") == v.Name() {
			if i == len(videos)-1 {
				break
			}
			nextVideo, err := time.ParseInLocation("2006-01-02_15-04-05.ts", fmt.Sprintf("%s-%s", filepath.Base(dir), videos[i+1].Name()), time.Local)
			if err != nil {
				return nil, err
			}
			return &nextVideo, nil
		}
	}
	return nil, nil
}

func (r *FSRecorder) findFirstVideoTimestamp(dir string, t time.Time) (*time.Time, error) {
	videos, err := os.ReadDir(dir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, errdefs.ErrVideoNotFound
		}
		return nil, err
	}
	for i, v := range videos {
		timestamp, err := time.ParseInLocation("2006-01-02_15-04-05.ts", fmt.Sprintf("%s-%s", filepath.Base(dir), v.Name()), time.Local)
		if err != nil {
			slog.Warn("Skip invalid video file", "dir", dir, "file", v.Name(), "err", err)
			continue
		}
		if timestamp.After(t) {
			last, err := time.ParseInLocation("2006-01-02_15-04-05.ts", fmt.Sprintf("%s-%s", filepath.Base(dir), videos[max(i-1, 0)].Name()), time.Local)
			if err != nil {
				return nil, err
			}
			return &last, nil
		}
	}
	latest, err := time.ParseInLocation("2006-01-02_15-04-05.ts", fmt.Sprintf("%s-%s", filepath.Base(dir), videos[len(videos)-1].Name()), time.Local)
	return &latest, err
}
