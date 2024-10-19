package camera

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type Store interface {
	Get(id string) (Camera, error)
	List() ([]Camera, error)
	Delete(id string) error
	UpdateRemark(cameraID, remark string) error
	Create(cam Camera) error
}

type FileStore struct {
	Path string

	storeInit sync.Once
}

func (s *FileStore) Get(id string) (Camera, error) {
	s.init()
	f, err := os.Open(filepath.Join(s.Path, fmt.Sprintf("%s_%s", "onvif", id)))
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var cam ONVIFCamera
	json.NewDecoder(f).Decode(&cam)
	return &cam, nil
}

func (s *FileStore) List() ([]Camera, error) {
	s.init()
	cams, err := os.ReadDir(s.Path)
	if err != nil {
		return nil, err
	}
	var cameras []Camera
	for _, cam := range cams {
		if !strings.HasPrefix(cam.Name(), "onvif") {
			slog.Error("Load cameras", "op", "drop", "cam", cam.Name())
			continue
		}
		f, err := os.Open(filepath.Join(s.Path, cam.Name()))
		if err != nil {
			slog.Error("Load cameras", "op", "open", "err", err)
			continue
		}
		var c ONVIFCamera
		json.NewDecoder(f).Decode(&c)
		f.Close()
		if err := c.init(); err != nil {
			slog.Error("Load cameras", "op", "init", "err", err)
		}
		cameras = append(cameras, &c)
	}
	return cameras, nil
}

func (s *FileStore) Delete(id string) error {
	s.init()
	return os.Remove(filepath.Join(s.Path, fmt.Sprintf("%s_%s", "onvif", id)))
}

func (s *FileStore) Create(cam Camera) error {
	s.init()
	camFile, err := os.Create(filepath.Join(s.Path, fmt.Sprintf("%s_%s", cam.Type(), cam.ID())))
	if err != nil {
		return err
	}
	if err := json.NewEncoder(camFile).Encode(cam); err != nil {
		return err
	}
	return camFile.Close()
}

func (s *FileStore) UpdateRemark(cameraID, remark string) error {
	s.init()
	f, err := os.OpenFile(filepath.Join(s.Path, fmt.Sprintf("%s_%s", "onvif", cameraID)), os.O_RDWR, 0666)
	if err != nil {
		return err
	}
	defer f.Close()
	var cam ONVIFCamera
	json.NewDecoder(f).Decode(&cam)
	cam.Desc = remark

	f.Truncate(0)
	f.Seek(0, 0)
	return json.NewEncoder(f).Encode(cam)
}

func (s *FileStore) init() {
	s.storeInit.Do(func() {
		os.Mkdir(s.Path, 0600)
	})
}
