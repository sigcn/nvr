package recorder

import (
	"errors"
	"log/slog"
	"sync"
	"time"
)

type Recorder interface {
	Run() error
	Interrupt() error
}

type Manager struct {
	managerInit sync.Once

	recordersMux  sync.RWMutex
	liveRecorders map[string]Recorder
	fsRecorders   map[string]Recorder
}

func (m *Manager) init() {
	m.managerInit.Do(func() {
		m.liveRecorders = make(map[string]Recorder)
		m.fsRecorders = make(map[string]Recorder)
	})
}

func (m *Manager) Live(id string) (Recorder, error) {
	m.init()
	r, ok := m.liveRecorders[id]
	if !ok {
		return nil, errors.New("not found")
	}
	return r, nil
}

func (m *Manager) Add(id string, streamURL, storePath string) error {
	if _, ok := m.liveRecorders[id]; ok {
		return nil
	}

	m.init()

	liveRecorder := LiveRecorder{StreamURL: streamURL}
	fsRecorder := FSRecorder{StreamURL: streamURL, Path: storePath}

	m.liveRecorders[id] = &liveRecorder
	m.fsRecorders[id] = &fsRecorder
	go func() {
		slog.Info("Live recorder", "event", "add", "id", id, "stream_url", streamURL)
		for {
			if _, ok := m.liveRecorders[id]; !ok {
				break
			}
			if err := liveRecorder.Run(); err != nil {
				slog.Error("Live recorder", "event", "exited", "err", err)
				time.Sleep(3 * time.Second)
			}
		}
	}()
	go func() {
		slog.Info("FS recorder", "event", "add", "id", id, "stream_url", streamURL)
		for {
			if _, ok := m.fsRecorders[id]; !ok {
				break
			}
			if err := fsRecorder.Run(); err != nil {
				slog.Error("FS recorder", "event", "exited", "err", err)
				time.Sleep(3 * time.Second)
			}
		}
	}()
	return nil
}

func (m *Manager) Delete(id string) error {
	m.recordersMux.Lock()
	defer m.recordersMux.Unlock()
	r1, ok1 := m.liveRecorders[id]
	r2, ok2 := m.fsRecorders[id]
	if ok1 {
		delete(m.liveRecorders, id)
		r1.Interrupt()
	}
	if ok2 {
		delete(m.fsRecorders, id)
		r2.Interrupt()
	}
	return nil
}

func (m *Manager) Count() int {
	return len(m.liveRecorders)
}
