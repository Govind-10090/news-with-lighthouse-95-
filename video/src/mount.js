// ==========================================
// Video MFE - Remote Component
// ==========================================

import { apiClient, analytics, UI, VirtualFeedManager } from 'shared';
import './style.css';

export function mount(container, navigate) {
  let playbackInterval = null;
  let virtualFeed = null;
  const abortController = new AbortController();
  const { signal } = abortController;

  // Render initial loading state
  container.innerHTML = `
    <div class="video-mfe-container fade-in" id="video-content-wrapper">
      ${UI.getHeroSkeleton()}
    </div>
  `;

  const contentWrapper = document.getElementById('video-content-wrapper');

  // Load video database from apiClient
  apiClient.request('https://api.chronicle.com/video/list', { signal })
    .then((videoDatabase) => {
      if (!videoDatabase || videoDatabase.length === 0) return;

      const featuredVideo = videoDatabase[0];

      // Retrieve saved progress (if any)
      const savedSeconds = parseFloat(localStorage.getItem(`video_progress_${featuredVideo.id}`)) || 0;

      // Render video interface
      contentWrapper.innerHTML = `
        <!-- Interactive Hero Player -->
        <section class="featured-video-player" id="main-player-wrapper">
          <img class="featured-video-element" src="${featuredVideo.image}" alt="Featured documentary poster" id="player-main-image" width="100%" height="auto">
          
          <!-- Subtitles Display -->
          <div id="player-subtitles" style="position: absolute; bottom: 85px; left: 50%; transform: translateX(-50%); background-color: rgba(0,0,0,0.85); color: #fff; padding: 6px 16px; border-radius: 4px; font-size: 1rem; max-width: 80%; text-align: center; font-weight: 500; display: none; z-index: 10; border: 1px solid rgba(255,255,255,0.15);"></div>

          <!-- Custom Controller Overlay -->
          <div class="player-overlay" id="player-ui">
            <div class="player-header">
              <span class="video-badge">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: red; animation: flash 1s infinite; display: inline-block; vertical-align: middle; margin-right: 4px;"></span>
                ${featuredVideo.badge}
              </span>
              <div class="time-counter" id="duration-counter">00:00 / 24:12</div>
            </div>

            <button class="play-center-btn" id="overlay-play-btn" aria-label="Play Video">
              <svg id="center-play-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <svg id="center-pause-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><line x1="18" y1="4" x2="18" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/></svg>
            </button>

            <div class="player-controls-bar">
              <!-- Title -->
              <h2 class="player-title">${featuredVideo.title}</h2>

              <!-- Timeline -->
              <div class="progress-timeline-wrapper" id="timeline-progress-bg" tabindex="0" role="slider" aria-label="Timeline progress pointer" aria-valuemin="0" aria-valuemax="1452">
                <div class="progress-bar-bg" style="width: 100%;">
                  <div class="progress-bar-fill" id="timeline-progress-fill" style="width: 0%"></div>
                </div>
              </div>

              <!-- Controls row -->
              <div class="controls-actions-row">
                <div class="controls-left">
                  <button class="control-icon-btn" id="bottom-play-btn" aria-label="Play or Pause video">
                    <svg id="bottom-play-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <svg id="bottom-pause-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><line x1="18" y1="4" x2="18" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/></svg>
                  </button>
                  <button class="control-icon-btn" id="volume-toggle" aria-label="Mute or Unmute volume">
                    <svg id="volume-high-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    <svg id="volume-mute-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
                  </button>
                  <button class="control-icon-btn" id="caption-toggle" aria-label="Toggle subtitles captions" style="font-weight: 700; font-size: 0.8rem; border: 1.5px solid currentColor; padding: 1px 4px; border-radius: 3px; line-height: 1;">CC</button>
                </div>
                <div class="controls-right">
                  <button class="control-icon-btn" id="fullscreen-btn" aria-label="Toggle Fullscreen view">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Video Grid -->
        <section>
          <h3 class="video-grid-header">LATEST DOCUMENTARIES & DISPATCHES</h3>
          <div class="video-grid" id="video-grid-container">
            <!-- Dynamic virtualized video dispatches go here -->
          </div>
          <div id="video-scroll-trigger" class="infinite-loading-container">
            <div class="loader-spinner"></div>
          </div>
        </section>
      `;

      // Interactive Media Control Logic
      let isPlaying = false;
      let isMuted = false;
      let captionsEnabled = true;
      let currentSecond = savedSeconds;
      const totalSeconds = 24 * 60 + 12; // 1452 seconds

      const mainImage = document.getElementById('player-main-image');
      const overlayPlayBtn = document.getElementById('overlay-play-btn');
      const bottomPlayBtn = document.getElementById('bottom-play-btn');
      
      const centerPlayIcon = document.getElementById('center-play-icon');
      const centerPauseIcon = document.getElementById('center-pause-icon');
      const bottomPlayIcon = document.getElementById('bottom-play-icon');
      const bottomPauseIcon = document.getElementById('bottom-pause-icon');
      
      const timelineFill = document.getElementById('timeline-progress-fill');
      const timelineBg = document.getElementById('timeline-progress-bg');
      const durationCounter = document.getElementById('duration-counter');
      const subtitlesDiv = document.getElementById('player-subtitles');
      const captionToggleBtn = document.getElementById('caption-toggle');
      
      const volumeToggleBtn = document.getElementById('volume-toggle');
      const volumeHighIcon = document.getElementById('volume-high-icon');
      const volumeMuteIcon = document.getElementById('volume-mute-icon');

      function formatTime(secs) {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      }

      function updateSubtitles() {
        if (!captionsEnabled || !isPlaying) {
          subtitlesDiv.style.display = 'none';
          return;
        }

        const cycleTime = currentSecond % 25;
        const match = featuredVideo.subtitles.find(sub => cycleTime >= sub.start && cycleTime <= sub.end);

        if (match) {
          subtitlesDiv.textContent = match.text;
          subtitlesDiv.style.display = 'block';
        } else {
          subtitlesDiv.style.display = 'none';
        }
      }

      function updateProgressUI() {
        const percent = (currentSecond / totalSeconds) * 100;
        timelineFill.style.width = `${percent}%`;
        durationCounter.textContent = `${formatTime(currentSecond)} / 24:12`;
        timelineBg.setAttribute('aria-valuenow', Math.round(currentSecond));
      }

      // Initialize with saved progress
      updateProgressUI();

      function play() {
        isPlaying = true;
        centerPlayIcon.style.display = 'none';
        centerPauseIcon.style.display = 'block';
        bottomPlayIcon.style.display = 'none';
        bottomPauseIcon.style.display = 'block';
        
        mainImage.style.transform = 'scale(1.02)';
        mainImage.style.filter = 'brightness(0.9)';
        
        analytics.trackEvent('Video', 'playback_start', featuredVideo.title, Math.round(currentSecond));

        playbackInterval = setInterval(() => {
          currentSecond += 1.5;
          if (currentSecond >= totalSeconds) {
            currentSecond = 0;
            pause();
          }
          updateProgressUI();
          updateSubtitles();
          
          // Save play progression periodically
          localStorage.setItem(`video_progress_${featuredVideo.id}`, currentSecond.toString());
        }, 100);
      }

      function pause() {
        isPlaying = false;
        centerPlayIcon.style.display = 'block';
        centerPauseIcon.style.display = 'none';
        bottomPlayIcon.style.display = 'block';
        bottomPauseIcon.style.display = 'none';
        mainImage.style.transform = 'none';
        mainImage.style.filter = 'none';
        
        clearInterval(playbackInterval);
        updateSubtitles();
        analytics.trackEvent('Video', 'playback_pause', featuredVideo.title, Math.round(currentSecond));
        localStorage.setItem(`video_progress_${featuredVideo.id}`, currentSecond.toString());
      }

      function togglePlay() {
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      }

      overlayPlayBtn.addEventListener('click', togglePlay);
      bottomPlayBtn.addEventListener('click', togglePlay);

      // Scrubbing timeline interaction
      timelineBg.addEventListener('click', (e) => {
        const rect = timelineBg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const clickedPercentage = clickX / width;
        
        currentSecond = clickedPercentage * totalSeconds;
        updateProgressUI();
        updateSubtitles();
        
        analytics.trackEvent('Video', 'scrub', featuredVideo.title, Math.round(currentSecond));
        localStorage.setItem(`video_progress_${featuredVideo.id}`, currentSecond.toString());
      });

      // Volume Toggle
      volumeToggleBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
          volumeHighIcon.style.display = 'none';
          volumeMuteIcon.style.display = 'block';
          analytics.trackEvent('Video', 'mute', featuredVideo.title);
        } else {
          volumeHighIcon.style.display = 'block';
          volumeMuteIcon.style.display = 'none';
          analytics.trackEvent('Video', 'unmute', featuredVideo.title);
        }
      });

      // Caption Toggle
      captionToggleBtn.addEventListener('click', () => {
        captionsEnabled = !captionsEnabled;
        if (captionsEnabled) {
          captionToggleBtn.style.backgroundColor = 'white';
          captionToggleBtn.style.color = 'black';
          analytics.trackEvent('Video', 'captions_on', featuredVideo.title);
        } else {
          captionToggleBtn.style.backgroundColor = 'transparent';
          captionToggleBtn.style.color = 'rgba(255,255,255,0.85)';
          subtitlesDiv.style.display = 'none';
          analytics.trackEvent('Video', 'captions_off', featuredVideo.title);
        }
        updateSubtitles();
      });

      // Initial active styling for CC button
      captionToggleBtn.style.backgroundColor = 'white';
      captionToggleBtn.style.color = 'black';

      // Initialize Virtualized scroll grid for dispatches
      const videoGridContainer = document.getElementById('video-grid-container');
      virtualFeed = new VirtualFeedManager(videoGridContainer, (cardEl, video) => {
        cardEl.className = 'video-card';
        cardEl.setAttribute('data-video-id', video.id);
        cardEl.setAttribute('tabindex', '0');
        cardEl.innerHTML = `
          <div class="video-thumbnail-wrapper">
            <img class="video-thumbnail-img" src="${video.image}" alt="${video.title}" loading="lazy" width="100%" height="auto">
            <div class="video-play-overlay-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
            <span class="video-duration-pill">${video.duration}</span>
          </div>
          <div class="video-card-meta">
            <span class="video-badge" style="background: var(--bg-darker); color: var(--text-secondary); border: 1px solid var(--border-color);">${video.category}</span>
            <span>${video.time}</span>
          </div>
          <h4 class="video-card-title">${video.title}</h4>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: -6px;">${video.views}</div>
        `;
        
        UI.makeAccessibleButton(cardEl, `Play dispatch: ${video.title}`, () => {
          analytics.trackEvent('Video', 'click_related', video.title);
          navigate('/premium');
        });
      }, { tagName: 'article' });

      // Populate initial videos (page 1, slice(1))
      videoDatabase.slice(1).forEach(video => {
        virtualFeed.appendItem(video, () => {
          analytics.trackEvent('Video', 'click_related', video.title);
          navigate('/premium');
        });
      });

      // Init infinite scroll triggers
      let videoPageIndex = 2;
      let isTriggerIntersecting = false;
      let isLoadingMore = false;

      const observerTrigger = document.getElementById('video-scroll-trigger');
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px 400px 0px',
        threshold: 0.1
      };

      const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isTriggerIntersecting = entry.isIntersecting;
          if (entry.isIntersecting && !signal.aborted) {
            loadMoreVideoItems();
          }
        });
      }, observerOptions);

      if (observerTrigger) {
        scrollObserver.observe(observerTrigger);
      }

      signal.addEventListener('abort', () => {
        scrollObserver.disconnect();
      });

      function loadMoreVideoItems() {
        if (isLoadingMore || signal.aborted) return;
        isLoadingMore = true;

        apiClient.request(`https://api.chronicle.com/video/list?page=${videoPageIndex}`, { signal })
          .then((newVideos) => {
            isLoadingMore = false;
            if (newVideos && newVideos.length > 0) {
              videoPageIndex++;
              newVideos.forEach(video => {
                virtualFeed.appendItem(video, () => {
                  analytics.trackEvent('Video', 'click_related', video.title);
                  navigate('/premium');
                });
              });

              // Check if still intersecting
              setTimeout(() => {
                if (!signal.aborted && isTriggerIntersecting) {
                  loadMoreVideoItems();
                }
              }, 150);
            }
          })
          .catch((err) => {
            isLoadingMore = false;
            if (err.name === 'AbortError') return;
            console.warn('Failed to load infinite scroll videos:', err);
          });
      }
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      console.error('Failed to load video database:', err);
      throw err;
    });

  // Return unmount hook for cleaning up timer intervals
  return () => {
    console.log('[Video MFE] Cleaning up playback intervals');
    abortController.abort();
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  };
}
