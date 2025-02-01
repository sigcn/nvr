package main

import (
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/rs/zerolog"
	"github.com/sigcn/nvr/account"
	"github.com/sigcn/nvr/camera"
	"github.com/sigcn/nvr/cmd/nvrd/ui"
	"github.com/sigcn/nvr/recorder"
	ffmpeg "github.com/u2takey/ffmpeg-go"
	"github.com/use-go/onvif/sdk"
)

var (
	version string = "dev"

	storePath string
	listen    string
	logLevel  int
)

func main() {
	flag.StringVar(&storePath, "store", "/var/lib/nvrd", "store path")
	flag.StringVar(&listen, "listen", ":2998", "listen addr")
	flag.IntVar(&logLevel, "loglevel", 0, "logging level")
	flag.BoolFunc("v", "print version", printVersion)
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
		apiKeyStore:     &account.SimpleApiKeyStore{Path: storePath},
	}

	go httpserver.watchProcessSignal()

	mux := http.NewServeMux()
	mux.HandleFunc("GET    /media/{camera_id}/live.ts", httpserver.handleMediaMPEGTS)
	mux.HandleFunc("POST   /v1/api/keys", httpserver.handleCreateApiKey)
	mux.HandleFunc("DELETE /v1/api/keys", httpserver.handleDeleteApiKey)
	mux.HandleFunc("POST   /v1/api/cameras", httpserver.handleCreateCamera)
	mux.HandleFunc("GET    /v1/api/cameras", httpserver.handleListCameras)
	mux.HandleFunc("GET    /v1/api/cameras/{camera_id}", httpserver.handleGetCamera)
	mux.HandleFunc("DELETE /v1/api/cameras/{camera_id}", httpserver.handleDeleteCamera)
	mux.HandleFunc("PATCH  /v1/api/cameras/{camera_id}/remark", httpserver.handleUpdateCameraRemark)
	mux.HandleFunc("POST   /v1/api/cameras/{camera_id}/move", httpserver.handleMoveCamera)
	mux.HandleFunc("POST   /v1/api/cameras/reload", httpserver.handleReloadCameras)
	mux.HandleFunc("GET    /v1/api/stat", handleStat)
	mux.HandleFunc("GET    /v1/api/settings", handleQuerySettings)
	mux.HandleFunc("GET    /", handleStaticFiles)

	slog.Info("Serving", "addr", listen)
	if err := http.ListenAndServe(listen, corsMiddleware(httpserver.middlewareApiKey(mux))); err != nil {
		panic(err)
	}
}

func handleStaticFiles(w http.ResponseWriter, r *http.Request) {
	f, err := ui.FS.Open(strings.TrimPrefix(r.URL.Path, "/"))
	if err != nil {
		http.ServeFileFS(w, r, ui.FS, "index.html")
		return
	}
	f.Close()
	http.ServeFileFS(w, r, ui.FS, strings.TrimPrefix(r.URL.Path, "/"))
}

func printVersion(s string) error {
	info, err := readBuildInfo()
	if err != nil {
		return err
	}
	fmt.Println(info.GoVersion)
	fmt.Println("version\t", version)
	fmt.Println("commit\t", info.VCSRevision)
	fmt.Println("time\t", info.VCSTime)
	os.Exit(0)
	return nil
}
