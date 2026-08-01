<script>
      const CLIENT_ID = 'REPLACE_WITH_YOUR_SPOTIFY_CLIENT_ID';
      const SCOPES = 'user-read-private user-top-read';
      const REDIRECT_URI = window.location.origin + window.location.pathname;
      const connectBtn = document.getElementById('connect-btn');
      const logoutBtn = document.getElementById('logout-btn');
      const statusText = document.getElementById('music-status');
      const trackList = document.getElementById('track-list');
      const TOKEN_KEY = 'bros-spotify-token';

      function getHashParams() {
        return window.location.hash
          .substring(1)
          .split('&')
          .reduce((acc, pair) => {
            const [key, value] = pair.split('=');
            if (key) acc[key] = decodeURIComponent(value);
            return acc;
          }, {});
      }

      function saveToken(token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      }

      function getToken() {
        return sessionStorage.getItem(TOKEN_KEY);
      }

      function clearToken() {
        sessionStorage.removeItem(TOKEN_KEY);
      }

      function buildAuthUrl() {
        const params = new URLSearchParams({
          client_id: CLIENT_ID,
          response_type: 'token',
          redirect_uri: REDIRECT_URI,
          scope: SCOPES,
          show_dialog: 'true',
        });
        return `https://accounts.spotify.com/authorize?${params}`;
      }

      async function fetchSpotify(path) {
        const token = getToken();
        if (!token) throw new Error('Token yok');
        const response = await fetch(`https://api.spotify.com/v1/${path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Spotify API hata: ${response.status}`);
        }
        return response.json();
      }

      function renderTracks(tracks) {
        trackList.innerHTML = '';
        if (!tracks.length) {
          trackList.innerHTML = '<p>Top tracks yüklenemiyor veya boş.</p>';
          return;
        }
        tracks.forEach((track) => {
          const item = document.createElement('article');
          item.className = 'track-item';
          item.innerHTML = `
            <div>
              <strong>${track.name}</strong>
              <small>${track.artists.map((artist) => artist.name).join(', ')}</small>
            </div>
            <button type="button">Çal</button>
          `;
          item.querySelector('button').addEventListener('click', () => {
            window.open(track.external_urls.spotify, '_blank');
          });
          trackList.appendChild(item);
        });
      }

      async function initialize() {
        const hash = getHashParams();
        if (hash.access_token) {
          saveToken(hash.access_token);
          window.location.hash = '';
        }

        const token = getToken();
        if (!token) {
          statusText.textContent = 'Spotify hesabınızla bağlanmak için Bağlan butonuna tıklayın.';
          return;
        }

        try {
          const profile = await fetchSpotify('me');
          statusText.textContent = `Hoş geldin, ${profile.display_name || profile.id}! En sevilen parçalarınızı getiriyorum...`;
          const topTracks = await fetchSpotify('me/top/tracks?limit=8');
          renderTracks(topTracks.items);
        } catch (error) {
          statusText.textContent = 'Spotify bağlantısı başarısız oldu. Tekrar bağlanmayı deneyin.';
          clearToken();
          console.error(error);
        }
      }

      connectBtn.addEventListener('click', () => {
        if (CLIENT_ID === 'REPLACE_WITH_YOUR_SPOTIFY_CLIENT_ID') {
          alert('Lütfen Spotify client ID girin.');
          return;
        }
        window.location.href = buildAuthUrl();
      });

      logoutBtn.addEventListener('click', () => {
        clearToken();
        trackList.innerHTML = '';
        statusText.textContent = 'Spotify bağlantısı temizlendi.';
      });

      window.addEventListener('load', initialize);
    </script>