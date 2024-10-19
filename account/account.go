package account

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"

	"storj.io/common/base58"
)

type User struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ApiKeyStore interface {
	Create(user User) (string, error)
	Remove(apiKey string) error
	Verify(apiKey string) (*User, error)
}

type SimpleApiKeyStore struct {
	Path string

	initOnce       sync.Once
	tokensMux      sync.RWMutex
	tokens         map[string]*User
	lastTokensHash []byte
}

func (s *SimpleApiKeyStore) init() {
	s.initOnce.Do(func() {
		s.tokens = make(map[string]*User)
		os.Mkdir(s.Path, 0600)
		go func() {
			if err := s.Load(); err != nil {
				slog.Error("Api key store load", "err", err)
			}
		}()
		go func() {
			ticker := time.NewTicker(10 * time.Second)
			for {
				<-ticker.C
				if s.changed() {
					s.Save()
				}
			}
		}()
	})
}

func (s *SimpleApiKeyStore) Create(user User) (string, error) {
	s.init()
	b := make([]byte, 32)
	io.ReadFull(rand.Reader, b)
	apiKey := fmt.Sprintf("sk-%s", base58.Encode(b))
	s.tokens[apiKey] = &user
	return apiKey, nil
}

func (s *SimpleApiKeyStore) Remove(apiKey string) error {
	s.init()
	s.tokensMux.Lock()
	defer s.tokensMux.Unlock()
	delete(s.tokens, apiKey)
	return nil
}

func (s *SimpleApiKeyStore) Verify(apiKey string) (*User, error) {
	s.init()
	s.tokensMux.RLock()
	defer s.tokensMux.RUnlock()
	u, ok := s.tokens[apiKey]
	if ok {
		return u, nil
	}
	return nil, errors.New("invalid api key")
}

func (s *SimpleApiKeyStore) Load() error {
	s.init()
	f, err := os.Open(filepath.Join(s.Path, "api-keys.json"))
	if err != nil {
		return err
	}
	defer f.Close()
	if err := json.NewDecoder(f).Decode(&s.tokens); err != nil {
		return err
	}
	s.changed()
	slog.Info("Api key store load", "key-count", len(s.tokens))
	return nil
}

func (s *SimpleApiKeyStore) Save() error {
	s.init()

	f, err := os.Create(filepath.Join(s.Path, "api-keys.json"))
	if err != nil {
		return err
	}
	json.NewEncoder(f).Encode(s.tokens)
	err = f.Close()
	if err != nil {
		return err
	}
	slog.Info("Api key store saved", "key-count", len(s.tokens))
	return nil
}

func (s *SimpleApiKeyStore) changed() bool {
	sha256Hash := sha256.New()

	s.tokensMux.RLock()
	for k := range s.tokens {
		sha256Hash.Write([]byte(k))
	}
	s.tokensMux.RUnlock()

	hash := sha256Hash.Sum(nil)
	if bytes.Equal(hash, s.lastTokensHash) {
		return false
	}
	s.lastTokensHash = hash
	return true
}
