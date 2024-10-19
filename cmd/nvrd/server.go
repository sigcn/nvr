package main

import (
	"encoding/json"
	"net/http"
	"path/filepath"

	"github.com/sigcn/nvr/camera"
	"github.com/sigcn/nvr/recorder"
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

type server struct {
	cameraStore     camera.Store
	recorderManager *recorder.Manager
}

func (s *server) handleMediaMPEGTS(w http.ResponseWriter, r *http.Request) {
	cameraID := r.PathValue("camera_id")
	if cameraID == "" {
		ErrBadRequest.MarshalTo(w)
		return
	}
	liveRecorder, err := s.recorderManager.Live(cameraID)
	if err != nil {
		ErrCameraNotFound.MarshalTo(w)
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
		ErrUnsupportedCameraType.MarshalTo(w)
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
