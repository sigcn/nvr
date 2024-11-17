package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/sigcn/nvr/account"
	"github.com/sigcn/nvr/camera"
	"github.com/sigcn/nvr/errdefs"
	"github.com/sigcn/nvr/recorder"
	"golang.org/x/time/rate"
)

type CreateCamera struct {
	Type     string `json:"type"`
	Addr     string `json:"addr"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type ListCamera struct {
	ID     string      `json:"id"`
	Type   string      `json:"type"`
	Remark string      `json:"remark"`
	Meta   camera.Meta `json:"meta"`
}

type UpdateRemark struct {
	Remark string `json:"remark"`
}

type CreateApiKey struct {
	ID       string `json:"id"`
	Password string `json:"password"`
}

type CreateApiKeyResponse struct {
	Key  string       `json:"key"`
	User account.User `json:"user"`
}

type server struct {
	cameraStore     camera.Store
	recorderManager *recorder.Manager
	apiKeyStore     account.ApiKeyStore
}

func (s *server) handleCreateApiKey(w http.ResponseWriter, r *http.Request) {
	var req CreateApiKey
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest.MarshalTo(w)
		return
	}
	storedPassword := os.Getenv("NVRD_ADMIN_PASSWORD")
	if storedPassword == "" {
		storedPassword = "admin"
	}
	if req.ID != "admin" || req.Password != storedPassword {
		ErrForbidden(errors.New("user or password invalid")).MarshalTo(w)
		return
	}
	user := account.User{ID: "admin", Name: "Administrator"}
	apiKey, err := s.apiKeyStore.Create(user)
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}
	Ok(CreateApiKeyResponse{Key: apiKey, User: user}).MarshalTo(w)
}

func (s *server) handleDeleteApiKey(w http.ResponseWriter, r *http.Request) {
	apiKey := r.Header.Get("X-ApiKey")
	if err := s.apiKeyStore.Remove(apiKey); err != nil {
		Err(err).MarshalTo(w)
		return
	}
	Ok(nil).MarshalTo(w)
}

func (s *server) handleMediaMPEGTS(w http.ResponseWriter, r *http.Request) {
	cameraID := r.PathValue("camera_id")
	if cameraID == "" {
		ErrBadRequest.MarshalTo(w)
		return
	}
	pos := r.URL.Query().Get("pos")
	if pos != "" {
		fsRecorder, err := s.recorderManager.FS(cameraID)
		if err != nil {
			errdefs.ErrCameraNotFound.MarshalTo(w)
			return
		}
		posSecs, err := strconv.ParseInt(pos, 10, 64)
		if err != nil {
			ErrBadRequest.Wrap(err).MarshalTo(w)
			return
		}

		var writer io.Writer = w
		r, _ := strconv.ParseInt(r.URL.Query().Get("rate"), 10, 64)
		if r > 0 {
			writer = &ratelimitWriter{w: w, limiter: rate.NewLimiter(rate.Limit(r), int(r*3))}
		}
		if err := fsRecorder.(*recorder.FSRecorder).Read(time.Unix(posSecs, 0), writer); err != nil {
			Err(err).MarshalTo(w)
			return
		}
		return
	}
	liveRecorder, err := s.recorderManager.Live(cameraID)
	if err != nil {
		errdefs.ErrCameraNotFound.MarshalTo(w)
		return
	}
	<-liveRecorder.(*recorder.LiveRecorder).AddWriter(generateID(), w)
}

func (s *server) handleCreateCamera(w http.ResponseWriter, r *http.Request) {
	var req CreateCamera
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest.MarshalTo(w)
		return
	}

	if req.Type != "onvif" {
		errdefs.ErrUnsupportedCameraType.MarshalTo(w)
		return
	}

	cam, err := camera.NewONVIFCamera(req.Addr, req.Username, req.Password)
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}

	err = s.cameraStore.Create(cam)
	if err != nil {
		Err(err).MarshalTo(w)
	}

	streamURL, err := cam.StreamURL()
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}
	if err := s.recorderManager.Add(cam.CID, streamURL, filepath.Join(storePath, "videos")); err != nil {
		Err(err).MarshalTo(w)
		return
	}

	Ok(nil).MarshalTo(w)
}

func (s *server) handleListCameras(w http.ResponseWriter, r *http.Request) {
	cams, err := s.cameraStore.List()
	if err != nil {
		Err(err).MarshalTo(w)
		return
	}
	var list []ListCamera
	for _, cam := range cams {
		list = append(list, ListCamera{
			ID:     cam.ID(),
			Type:   cam.Type(),
			Remark: cam.Remark(),
			Meta:   cam.Meta(),
		})
	}
	Ok(list).MarshalTo(w)
}

func (s *server) handleDeleteCamera(w http.ResponseWriter, r *http.Request) {
	cameraID := r.PathValue("camera_id")
	s.recorderManager.Delete(cameraID)
	s.cameraStore.Delete(cameraID)
	Ok(nil).MarshalTo(w)
}

func (s *server) handleUpdateCameraRemark(w http.ResponseWriter, r *http.Request) {
	cameraID := r.PathValue("camera_id")

	var req UpdateRemark

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrBadRequest.MarshalTo(w)
		return
	}

	if err := s.cameraStore.UpdateRemark(cameraID, req.Remark); err != nil {
		Err(err).MarshalTo(w)
		return
	}
	Ok(nil).MarshalTo(w)
}

func (s *server) handleReloadCameras(w http.ResponseWriter, r *http.Request) {
	reloadCameras(s.cameraStore, s.recorderManager)
	Ok(nil).MarshalTo(w)
}

func (s *server) middlewareApiKey(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/v1/api/") && !strings.HasPrefix(r.URL.Path, "/media/") {
			next.ServeHTTP(w, r)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/v1/api/keys") {
			next.ServeHTTP(w, r)
			return
		}
		apiKey := r.URL.Query().Get("api_key")
		if apiKey == "" {
			apiKey = r.Header.Get("X-ApiKey")
		}
		u, err := s.apiKeyStore.Verify(apiKey)
		if err != nil {
			ErrForbidden(err).MarshalTo(w)
			return
		}
		r.Header.Set("X-UID", u.ID)
		r.Header.Set("X-User", u.Name)
		next.ServeHTTP(w, r)
	})
}

func (s *server) watchProcessSignal() {
	reloadCameras(s.cameraStore, s.recorderManager)
	processSig := make(chan os.Signal, 1)
	signal.Notify(processSig, os.Interrupt, syscall.SIGTERM, syscall.SIGHUP)
	for {
		sig := <-processSig
		switch sig {
		case os.Interrupt, syscall.SIGTERM:
			stopCameras(s.cameraStore, s.recorderManager)
			if err := s.apiKeyStore.(*account.SimpleApiKeyStore).Save(); err != nil {
				slog.Warn("Api key store", "event", "save", "err", err)
			}
			os.Exit(0)
		case syscall.SIGHUP:
			reloadCameras(s.cameraStore, s.recorderManager)
			if err := s.apiKeyStore.(*account.SimpleApiKeyStore).Load(); err != nil {
				slog.Warn("Api key store", "event", "load", "err", err)
			}
		default:
			slog.Info("Signal", "sig", sig)
		}
	}
}

func reloadCameras(cameraStore camera.Store, recorderManager *recorder.Manager) {
	cameras, err := cameraStore.List()
	if err != nil {
		panic(err)
	}
	for _, cam := range cameras {
		streamURL, err := cam.StreamURL()
		if err != nil {
			slog.Error("Boot", "op", "get stream url", "err", err)
			continue
		}
		if err := recorderManager.Add(cam.ID(), streamURL, filepath.Join(storePath, "videos")); err != nil {
			slog.Error("Boot", "op", "add", "err", err)
		}
	}
	slog.Info("Cameras load", "live-count", recorderManager.Count())
}

func stopCameras(cameraStore camera.Store, recorderManager *recorder.Manager) {
	cameras, err := cameraStore.List()
	if err != nil {
		panic(err)
	}
	for _, cam := range cameras {
		if err := recorderManager.Delete(cam.ID()); err != nil {
			slog.Error("Boot", "op", "add", "err", err)
		}
	}
	slog.Info("Cameras stop", "live-count", recorderManager.Count())
}

type ratelimitWriter struct {
	w       io.Writer
	limiter *rate.Limiter
}

func (r *ratelimitWriter) Write(p []byte) (int, error) {
	r.limiter.WaitN(context.Background(), len(p))
	return r.w.Write(p)
}
