package main

import (
	"flag"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"

	"github.com/rs/zerolog"
	"github.com/sigcn/nvr/camera"
	"github.com/sigcn/nvr/recorder"
	ffmpeg "github.com/u2takey/ffmpeg-go"
	"github.com/use-go/onvif/sdk"
)

var (
	storePath string
	listen    string
	logLevel  int
)

func main() {
	flag.StringVar(&storePath, "store", "/var/lib/nvrd", "store path")
	flag.StringVar(&listen, "listen", ":2998", "listen addr")
	flag.IntVar(&logLevel, "V", 0, "logging level")
	flag.Parse()

	sdk.Logger = sdk.Logger.Level(zerolog.InfoLevel)
	ffmpeg.LogCompiledCommand = false
	slog.SetLogLoggerLevel(slog.Level(logLevel))
	if logLevel <= -2 {
		sdk.Logger = sdk.Logger.Level(zerolog.DebugLevel)
		ffmpeg.LogCompiledCommand = true
	}

	if err := os.MkdirAll(storePath, 0600); err != nil && !os.IsExist(err) {
		slog.Error("Creating store", "path", storePath, "err", err)
	}

	httpserver := server{
		cameraStore:     &camera.FileStore{Path: filepath.Join(storePath, "cameras")},
		recorderManager: &recorder.Manager{},
	}

	cameras, err := httpserver.cameraStore.List()
	if err != nil {
		panic(err)
	}

	for _, cam := range cameras {
		streamURL, err := cam.StreamURL()
		if err != nil {
			slog.Error("Boot", "op", "get stream url", "err", err)
			continue
		}
		if err := httpserver.recorderManager.Add(cam.ID(), streamURL, filepath.Join(storePath, "videos")); err != nil {
			slog.Error("Boot", "op", "add", "err", err)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET    /media/{camera_id}/live.ts", httpserver.handleMediaMPEGTS)
	mux.HandleFunc("POST   /v1/api/cameras", httpserver.handleCreateCamera)
	mux.HandleFunc("GET    /v1/api/cameras", httpserver.handleListCameras)
	mux.HandleFunc("DELETE /v1/api/cameras/{camera_id}", httpserver.handleDeleteCamera)
	mux.HandleFunc("PATCH  /v1/api/cameras/{camera_id}/remark", httpserver.handleUpdateCameraRemark)
	err = http.ListenAndServe(listen, corsMiddleware(mux))
	if err != nil {
		panic(err)
	}
}
