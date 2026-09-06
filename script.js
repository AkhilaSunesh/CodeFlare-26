/* ==========================================================================
  PERSEUS & MEDUSA: 10-SECOND CINEMATIC SCROLL-SCRUBBING ENGINE
   Clean Visual-First Scroll Scrubbing mapped to 50 Visual Sequence Frames
   ========================================================================== */

const TOTAL_FRAMES = 50;

(function() {
  const frameImages = [];
  let loadedCount = 0;
  let isSequenceReady = false;
  let currentRenderedFrame = -1;
  let isTicking = false;

  // DOM Elements
  let preloader, loaderBar, loaderStatus, canvas, ctx;
  let storyWrapper, steps, progressBar, beginMythBtn, returnTopBtn, bgMusic;

  function getFrameSrc(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `A_cinematic_second_sequence_frames/frame_${padded}.png`;
  }

  // =========================================================================
  // CANVAS RENDERING WITH OBJECT-FIT: COVER SCALING
  // =========================================================================
  function drawCoverImage(img) {
    if (!img || !img.complete || img.naturalWidth === 0 || !ctx || !canvas) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = img.naturalWidth;
    const iHeight = img.naturalHeight;

    const cAspect = cWidth / cHeight;
    const iAspect = iWidth / iHeight;

    let drawW, drawH, offX, offY;

    if (cAspect > iAspect) {
      drawW = cWidth;
      drawH = cWidth / iAspect;
      offX = 0;
      offY = (cHeight - drawH) / 2;
    } else {
      drawH = cHeight;
      drawW = cHeight * iAspect;
      offX = (cWidth - drawW) / 2;
      offY = 0;
    }

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.drawImage(img, offX, offY, drawW, drawH);
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const targetIdx = currentRenderedFrame >= 0 ? currentRenderedFrame : 0;
    if (frameImages[targetIdx] && frameImages[targetIdx].complete) {
      drawCoverImage(frameImages[targetIdx]);
    }
  }

  function renderFrame(frameIndex) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    if (idx === currentRenderedFrame && frameImages[idx]?.complete) return;

    const img = frameImages[idx];
    if (img && img.complete) {
      drawCoverImage(img);
      currentRenderedFrame = idx;
    }
  }

  // =========================================================================
  // SCROLL-SCRUBBING ENGINE & PROGRESS MAPPING
  // =========================================================================
  function updateScrubbing() {
    isTicking = false;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Reading progress bar
    if (progressBar && docHeight > 0) {
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = `${scrollPercent}%`;
    }

    if (!storyWrapper) return;

    const rect = storyWrapper.getBoundingClientRect();
    const scrollableDistance = rect.height - window.innerHeight;

    let progress = 0;
    if (scrollableDistance > 0) {
      progress = (-rect.top) / scrollableDistance;
      progress = Math.max(0, Math.min(1, progress));
    }

    // Map progress to frame index (0 to 49)
    const targetFrameIndex = Math.floor(progress * (TOTAL_FRAMES - 1));
    renderFrame(targetFrameIndex);

    // Is story wrapper in active viewport? (Wrapper is on screen when top <= 50 and bottom >= window.innerHeight * 0.2, or partially visible)
    const isWrapperInView = rect.top <= 50 && rect.bottom >= window.innerHeight * 0.2;

    // Synchronize soundtrack position with the 10-second cinematic progression
    if (bgMusic && !bgMusic.paused && isWrapperInView) {
      // Map 0.0 to 1.0 progress over the 10-second dramatic fight track
      const targetAudioTime = progress * 10;
      if (Math.abs(bgMusic.currentTime - targetAudioTime) > 0.8) {
        bgMusic.currentTime = targetAudioTime;
      }
    }

    // Progressive step visibility based on exact frame intervals
    if (steps) {
      steps.forEach((step) => {
        const rangeAttr = step.getAttribute('data-range');
        if (!rangeAttr) return;
        const [start, end] = rangeAttr.split(',').map(Number);

        const isWithinRange = progress >= start && progress < end;
        if (isWrapperInView && isWithinRange) {
          step.classList.add('visible');
        } else {
          step.classList.remove('visible');
        }
      });
    }
  }

  function onScroll() {
    if (!isTicking) {
      requestAnimationFrame(updateScrubbing);
      isTicking = true;
    }
  }

  // =========================================================================
  // INITIALIZATION & PRELOAD
  // =========================================================================
  function init() {
    preloader = document.getElementById('preloader');
    loaderBar = document.getElementById('loaderBar');
    loaderStatus = document.getElementById('loaderStatus');
    canvas = document.getElementById('sequence-canvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    storyWrapper = document.getElementById('story-wrapper');
    steps = document.querySelectorAll('.cinematic-step');
    progressBar = document.getElementById('progressBar');
    beginMythBtn = document.getElementById('beginMythBtn');
    returnTopBtn = document.getElementById('returnTopBtn');

    // Attach scroll and resize listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Preload safeguard timer
    const safeguardTimer = setTimeout(() => {
      if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
        resizeCanvas();
        updateScrubbing();
      }
    }, 4000);

    // Preload all 50 frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderBar) loaderBar.style.width = `${percent}%`;
        if (loaderStatus) loaderStatus.textContent = `Preloading sequence frames... ${percent}%`;

        if (i === 0 && !isSequenceReady) {
          resizeCanvas();
          renderFrame(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          clearTimeout(safeguardTimer);
          isSequenceReady = true;
          setTimeout(() => {
            if (preloader) preloader.classList.add('hidden');
            resizeCanvas();
            renderFrame(0);
            updateScrubbing();
          }, 200);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          clearTimeout(safeguardTimer);
          isSequenceReady = true;
          if (preloader) preloader.classList.add('hidden');
          resizeCanvas();
          updateScrubbing();
        }
      };

      frameImages.push(img);
    }

    // Audio Elements & Soundtrack Sync Engine
    bgMusic = document.getElementById('bgMusic');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    let isAudioEnabled = false;

    function playAudioSafely() {
      if (bgMusic && bgMusic.paused) {
        bgMusic.play().then(() => {
          isAudioEnabled = true;
          if (soundToggleBtn) {
            soundToggleBtn.classList.remove('muted');
            soundToggleBtn.querySelector('.sound-label').textContent = 'MYTH AUDIO: ON';
            soundToggleBtn.querySelector('.sound-icon').textContent = '🔊';
          }
        }).catch(() => {
          // Autoplay policy prevented playback until user interaction
        });
      }
    }

    if (soundToggleBtn && bgMusic) {
      soundToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (bgMusic.paused) {
          bgMusic.play().then(() => {
            isAudioEnabled = true;
            soundToggleBtn.classList.remove('muted');
            soundToggleBtn.querySelector('.sound-label').textContent = 'MYTH AUDIO: ON';
            soundToggleBtn.querySelector('.sound-icon').textContent = '🔊';
          });
        } else {
          bgMusic.pause();
          isAudioEnabled = false;
          soundToggleBtn.classList.add('muted');
          soundToggleBtn.querySelector('.sound-label').textContent = 'MYTH AUDIO: OFF';
          soundToggleBtn.querySelector('.sound-icon').textContent = '🔇';
        }
      });
    }

    // Fullscreen Toggle Engine
    const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');
    if (toggleFullscreenBtn) {
      toggleFullscreenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => {
            toggleFullscreenBtn.querySelector('span').textContent = 'EXIT FULLSCREEN';
          }).catch(() => {});
        } else {
          document.exitFullscreen().then(() => {
            toggleFullscreenBtn.querySelector('span').textContent = 'GO FULLSCREEN';
          }).catch(() => {});
        }
      });

      document.addEventListener('fullscreenchange', () => {
        if (toggleFullscreenBtn) {
          toggleFullscreenBtn.querySelector('span').textContent = document.fullscreenElement ? 'EXIT FULLSCREEN' : 'GO FULLSCREEN';
        }
      });
    }

    // Challenge Popup Modal Handlers (Appears on homescreen)
    const challengePopupModal = document.getElementById('challengePopupModal');
    const acceptChallengeBtn = document.getElementById('acceptChallengeBtn');
    const refuseChallengeBtn = document.getElementById('refuseChallengeBtn');
    const reconsiderBtn = document.getElementById('reconsiderBtn');
    const refusalOverlay = document.getElementById('refusalOverlay');
    const giftsSection = document.getElementById('gifts-section');
    const enterLairBtn = document.getElementById('enterLairBtn');
    const editorialIntro = document.getElementById('editorial-intro');

    function setModalScrollLock(isLocked) {
      document.documentElement.classList.toggle('modal-open', isLocked);
      document.body.classList.toggle('modal-open', isLocked);
    }

    setModalScrollLock(Boolean(challengePopupModal?.classList.contains('active')));

    if (acceptChallengeBtn) {
      acceptChallengeBtn.addEventListener('click', () => {
        // Start atmospheric soundtrack on user choice interaction
        playAudioSafely();

        // Dismiss challenge popup modal
        if (challengePopupModal) {
          challengePopupModal.classList.remove('active');
        }
        setModalScrollLock(false);

        // Smooth scroll to the newly revealed Divine Gifts Section
        if (giftsSection) {
          giftsSection.scrollIntoView({ behavior: 'smooth' });
        } else if (editorialIntro) {
          editorialIntro.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (refuseChallengeBtn) {
      refuseChallengeBtn.addEventListener('click', () => {
        if (refusalOverlay) {
          refusalOverlay.classList.add('active');
        }
      });
    }

    if (reconsiderBtn) {
      reconsiderBtn.addEventListener('click', () => {
        if (refusalOverlay) {
          refusalOverlay.classList.remove('active');
        }
      });
    }

    if (enterLairBtn) {
      enterLairBtn.addEventListener('click', () => {
        if (editorialIntro) {
          editorialIntro.scrollIntoView({ behavior: 'smooth' });
        } else if (storyWrapper) {
          storyWrapper.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Listen to user click anywhere to enable audio if allowed
    window.addEventListener('click', () => {
      if (!isAudioEnabled && bgMusic && bgMusic.paused) {
        playAudioSafely();
      }
    }, { once: true });

    // Step 2: "What Would You Do? Fight..." button trigger -> Opens Game as Popup in SAME Window
    const launchGameBtn = document.getElementById('launchGameBtn');
    const gamePopupLayer = document.getElementById('perseus-game');
    if (launchGameBtn) {
      launchGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gamePopupLayer) {
          gamePopupLayer.classList.add('active');
          const startModal = document.getElementById('gameStartModal');
          if (startModal) {
            startModal.classList.add('active');
          }
        }
      });
    }

    // Close / Resume story button inside game popup
    const closeGameBtn = document.getElementById('closeGameBtn');
    if (closeGameBtn) {
      closeGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gamePopupLayer) {
          gamePopupLayer.classList.remove('active');
        }
      });
    }

    if (returnTopBtn) {
      returnTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (challengePopupModal) {
          challengePopupModal.classList.add('active');
        }
        setModalScrollLock(true);
      });
    }

    resizeCanvas();
    updateScrubbing();
    initAmbientParticles();
    initMythAccordion();
    initPerseusGame();

    const epilogueSection = document.getElementById('epilogue');
    if (epilogueSection) {
      const revealEpilogue = () => {
        const rect = epilogueSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          epilogueSection.classList.add('in-view');
          window.removeEventListener('scroll', revealEpilogue);
        }
      };

      window.addEventListener('scroll', revealEpilogue, { passive: true });
      revealEpilogue();
    }
  }

  // =========================================================================
  // SECTION 5.5: QUESTIONS FROM THE MYTH (Accordion Logic)
  // =========================================================================
  function initMythAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    if (!accordionHeaders.length) return;

    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        const panel = item ? item.querySelector('.accordion-panel') : null;
        if (!item || !panel) return;

        const isCurrentlyActive = item.classList.contains('active');

        // Optional: close other accordion items for clean single-expanded view
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherHeader = otherItem.querySelector('.accordion-header');
            const otherPanel = otherItem.querySelector('.accordion-panel');
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
            if (otherPanel) otherPanel.style.maxHeight = null;
          }
        });

        if (isCurrentlyActive) {
          item.classList.remove('active');
          header.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = null;
        } else {
          item.classList.add('active');
          header.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });

    // Re-adjust active panel maxHeight on window resize
    window.addEventListener('resize', () => {
      document.querySelectorAll('.accordion-item.active').forEach(activeItem => {
        const panel = activeItem.querySelector('.accordion-panel');
        if (panel) {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });
  }

  function initAmbientParticles() {
    const ambientCanvas = document.getElementById('ambient-canvas');
    if (!ambientCanvas) return;
    const actx = ambientCanvas.getContext('2d');
    let width = ambientCanvas.width = window.innerWidth;
    let height = ambientCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = ambientCanvas.width = window.innerWidth;
      height = ambientCanvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speedY: -(Math.random() * 0.35 + 0.15),
        speedX: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.6 + 0.2,
        pulsing: Math.random() * 0.02 + 0.01,
        increasing: Math.random() > 0.5
      });
    }

    function animateParticles() {
      actx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.increasing) {
          p.opacity += p.pulsing;
          if (p.opacity >= 0.75) p.increasing = false;
        } else {
          p.opacity -= p.pulsing;
          if (p.opacity <= 0.15) p.increasing = true;
        }

        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        actx.beginPath();
        actx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        actx.fillStyle = `rgba(223, 177, 91, ${p.opacity})`;
        actx.shadowBlur = 6;
        actx.shadowColor = 'rgba(250, 228, 168, 0.6)';
        actx.fill();
        actx.shadowBlur = 0;
      });

      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  // =========================================================================
  // SECTION 4: MINI-GAME ENGINE: SHIELD OF PERSEUS
  // =========================================================================
  function initPerseusGame() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    // DOM Elements
    const playerShield = document.getElementById('playerShield');
    const shieldRipple = document.getElementById('shieldRipple');
    const dangerBar = document.getElementById('dangerBar');
    const gameTimerEl = document.getElementById('gameTimer');
    const hitsIcons = document.querySelectorAll('.shield-hit');
    const medusaFace = document.getElementById('medusaFace');
    const gazeAura = document.getElementById('gazeAura');
    const activeSnakesLayer = document.getElementById('activeSnakesLayer');
    const fxCanvas = document.getElementById('game-fx-canvas');
    const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

    // Modals
    const startModal = document.getElementById('gameStartModal');
    const gazeDeathModal = document.getElementById('gazeDeathModal');
    const sistersAwokenModal = document.getElementById('sistersAwokenModal');
    const victoryModal = document.getElementById('victoryModal');
    const victoryStep1 = document.getElementById('victoryStep1');
    const victoryStep2 = document.getElementById('victoryStep2');
    const startBtn = document.getElementById('startGameBtn');
    const victoryContinueBtn = document.getElementById('victoryContinueBtn');
    const retryButtons = document.querySelectorAll('.retry-btn');

    // Game Constants
    const TOTAL_SURVIVAL_TIME = 10; // 10 seconds rapid cinematic trial
    const GAZE_FILL_DURATION = 1.5; // 1.5 continuous seconds fills danger meter to 100%
    const MAX_HITS = 3;
    const SHIELD_RADIUS = 36; // Collision block radius in px

    // Game Mutable State
    let isPlaying = false;
    let isGameOver = false;
    let gameLoopId = null;
    let lastTime = 0;
    let timeRemaining = TOTAL_SURVIVAL_TIME;
    let dangerLevel = 0; // 0 to 1
    let hitsTaken = 0;
    let isHoveringGaze = false;
    let lastStrikeSpawn = 0;
    let nextStrikeInterval = 1200; // ms (faster strikes for 10s rush)
    let decoySpawnedCount = 0;
    let decoyActive = false;

    // Pointer coordinates relative to gameArea
    const shieldPos = { x: -100, y: -100, targetX: -100, targetY: -100 };
    let areaRect = gameArea.getBoundingClientRect();

    // Arrays for snakes and FX particles
    let activeStrikes = [];
    let gameParticles = [];

    // Snake head SVG templates
    const SNAKE_SVG = `
      <svg class="snake-head-svg" viewBox="0 0 50 50">
        <defs>
          <radialGradient id="viperEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff4757" />
            <stop offset="100%" stop-color="#800000" />
          </radialGradient>
        </defs>
        <path d="M25,5 C12,5 5,18 10,32 C13,40 22,46 25,48 C28,46 37,40 40,32 C45,18 38,5 25,5 Z" fill="#1b2d20" stroke="#dfb15b" stroke-width="1.5" />
        <ellipse cx="18" cy="22" rx="3.5" ry="5" fill="url(#viperEye)" />
        <ellipse cx="32" cy="22" rx="3.5" ry="5" fill="url(#viperEye)" />
        <circle cx="18" cy="22" r="1.5" fill="#fff" />
        <circle cx="32" cy="22" r="1.5" fill="#fff" />
        <path d="M25,38 L25,46 M23,46 L25,43 L27,46" stroke="#ff4757" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    `;

    const DECOY_SVG = `
      <svg class="snake-head-svg" viewBox="0 0 50 50">
        <path d="M25,8 C14,8 8,20 12,32 C15,38 22,44 25,45 C28,44 35,38 38,32 C42,20 36,8 25,8 Z" fill="#303833" stroke="#636e72" stroke-width="1.5" />
        <ellipse cx="18" cy="24" rx="3" ry="1.5" fill="#111" />
        <ellipse cx="32" cy="24" rx="3" ry="1.5" fill="#111" />
        <circle cx="25" cy="14" r="2" fill="#4a5550" />
      </svg>
    `;

    function updateAreaRect() {
      if (gameArea) {
        areaRect = gameArea.getBoundingClientRect();
        if (fxCanvas) {
          fxCanvas.width = areaRect.width;
          fxCanvas.height = areaRect.height;
        }
      }
    }

    // Set shield initial center
    function resetShieldPos() {
      updateAreaRect();
      shieldPos.x = shieldPos.targetX = areaRect.width / 2;
      shieldPos.y = shieldPos.targetY = areaRect.height * 0.78;
      updateShieldDOM();
    }

    function updateShieldDOM() {
      if (playerShield) {
        playerShield.style.transform = `translate(${shieldPos.x}px, ${shieldPos.y}px)`;
      }
    }

    // Pointer Tracking (Mouse and Touch)
    function onPointerMove(e) {
      if (!isPlaying || isGameOver) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      shieldPos.targetX = Math.max(25, Math.min(areaRect.width - 25, clientX - areaRect.left));
      shieldPos.targetY = Math.max(25, Math.min(areaRect.height - 25, clientY - areaRect.top));
    }

    gameArea.addEventListener('mousemove', onPointerMove, { passive: true });
    gameArea.addEventListener('touchmove', onPointerMove, { passive: true });
    gameArea.addEventListener('touchstart', onPointerMove, { passive: true });

    // Check if player cursor/finger is directly over Medusa's eyes/face
    function checkGazeHover() {
      if (!medusaFace || !isPlaying || isGameOver) return false;
      const faceRect = medusaFace.getBoundingClientRect();
      const faceCenter = {
        x: faceRect.left + faceRect.width / 2 - areaRect.left,
        y: faceRect.top + faceRect.height / 2 - areaRect.top
      };
      const dist = Math.hypot(shieldPos.x - faceCenter.x, shieldPos.y - faceCenter.y);
      return dist < 65; // Direct gaze danger radius
    }

    // Spawn an attacking snake
    function spawnStrikeSnake() {
      if (!isPlaying || isGameOver) return;

      // Spawn from random boundary edge
      const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
      let startX = 0, startY = 0;

      if (side === 0) {
        startX = Math.random() * areaRect.width;
        startY = -20;
      } else if (side === 1) {
        startX = areaRect.width + 20;
        startY = Math.random() * areaRect.height;
      } else if (side === 2) {
        startX = Math.random() * areaRect.width;
        startY = areaRect.height + 20;
      } else {
        startX = -20;
        startY = Math.random() * areaRect.height;
      }

      // Target Perseus's current shield position
      const targetX = shieldPos.x + (Math.random() - 0.5) * 40;
      const targetY = shieldPos.y + (Math.random() - 0.5) * 40;

      // Create DOM element
      const el = document.createElement('div');
      el.className = 'striking-snake';
      el.innerHTML = SNAKE_SVG;
      activeSnakesLayer.appendChild(el);

      const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI) + 90;

      activeStrikes.push({
        el: el,
        startX: startX,
        startY: startY,
        currentX: startX,
        currentY: startY,
        targetX: targetX,
        targetY: targetY,
        angle: angle,
        progress: 0,
        speed: 0.016 + Math.random() * 0.008, // Strike travels in ~0.8s
        blocked: false
      });
    }

    // Spawn decoy sleeping snake in a corner
    function spawnDecoySnake() {
      if (decoyActive || decoySpawnedCount >= 2 || !isPlaying || isGameOver) return;

      const corners = [
        { x: 50, y: 100 },
        { x: areaRect.width - 50, y: 100 },
        { x: 60, y: areaRect.height - 80 },
        { x: areaRect.width - 60, y: areaRect.height - 80 }
      ];
      const corner = corners[Math.floor(Math.random() * corners.length)];

      const el = document.createElement('div');
      el.className = 'decoy-snake';
      el.innerHTML = DECOY_SVG;
      el.style.left = `${corner.x}px`;
      el.style.top = `${corner.y}px`;
      el.title = "Sleeping sister serpent...";

      // If clicked, trigger Sisters Awoken state
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerGameOver('sisters');
      });
      el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        triggerGameOver('sisters');
      }, { passive: true });

      activeSnakesLayer.appendChild(el);
      decoyActive = true;
      decoySpawnedCount++;

      // Disappears naturally after 6s if not disturbed
      setTimeout(() => {
        if (el && el.parentNode) {
          el.remove();
          decoyActive = false;
        }
      }, 6000);
    }

    // Particle FX on collision
    function createBurstParticles(x, y, color = '#dfb15b') {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        gameParticles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.5 + 1.5,
          color: color,
          alpha: 1,
          decay: Math.random() * 0.04 + 0.02
        });
      }
    }

    function triggerHitFlash() {
      const flash = document.createElement('div');
      flash.className = 'hit-flash';
      gameArea.appendChild(flash);
      setTimeout(() => flash.remove(), 300);
    }

    function updateHitsDisplay() {
      hitsIcons.forEach((icon, idx) => {
        if (idx < MAX_HITS - hitsTaken) {
          icon.classList.add('active');
        } else {
          icon.classList.remove('active');
        }
      });
    }

    // End Game State Handlers
    function triggerGameOver(reason) {
      if (isGameOver) return;
      isGameOver = true;
      isPlaying = false;

      // Clean up snakes
      activeStrikes.forEach(s => s.el.remove());
      activeStrikes = [];

      if (reason === 'gaze') {
        gazeDeathModal.classList.add('active');
      } else if (reason === 'sisters') {
        sistersAwokenModal.classList.add('active');
      } else if (reason === 'victory') {
        victoryModal.classList.add('active');
        victoryStep1.classList.add('active');
        victoryStep2.classList.remove('active');

        // After 1.5 seconds, reveal Pegasus unfurling
        setTimeout(() => {
          victoryStep1.classList.remove('active');
          victoryStep2.classList.add('active');
        }, 1600);
      }
    }

    // Main Game Loop using requestAnimationFrame
    function gameLoop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (isPlaying && !isGameOver) {
        // 1. Smooth shield easing
        shieldPos.x += (shieldPos.targetX - shieldPos.x) * 0.35;
        shieldPos.y += (shieldPos.targetY - shieldPos.y) * 0.35;
        updateShieldDOM();

        // 2. Update Survival Timer
        timeRemaining -= dt;
        if (gameTimerEl) {
          gameTimerEl.textContent = `${Math.max(0, Math.ceil(timeRemaining))}s`;
        }

        if (timeRemaining <= 0) {
          triggerGameOver('victory');
          return;
        }

        // 3. Gaze Danger Meter Logic
        isHoveringGaze = checkGazeHover();
        if (isHoveringGaze) {
          dangerLevel = Math.min(1, dangerLevel + (dt / GAZE_FILL_DURATION));
          if (gazeAura) gazeAura.classList.add('active');
        } else {
          dangerLevel = Math.max(0, dangerLevel - (dt * 0.7)); // Drains when looking away
          if (gazeAura) gazeAura.classList.remove('active');
        }

        if (dangerBar) {
          dangerBar.style.width = `${dangerLevel * 100}%`;
        }

        if (dangerLevel >= 1) {
          triggerGameOver('gaze');
          return;
        }

        // 4. Snake Spawning Schedule
        if (timestamp - lastStrikeSpawn > nextStrikeInterval) {
          spawnStrikeSnake();
          lastStrikeSpawn = timestamp;
          nextStrikeInterval = Math.random() * 1600 + 1000; // 1 to 2.6s interval

          // Random decoy snake spawn chance
          if (Math.random() < 0.25 && decoySpawnedCount < 2) {
            spawnDecoySnake();
          }
        }

        // 5. Update Striking Snakes & Collision Checking
        for (let i = activeStrikes.length - 1; i >= 0; i--) {
          const strike = activeStrikes[i];
          strike.progress += strike.speed;

          // Linear interpolation toward target
          strike.currentX = strike.startX + (strike.targetX - strike.startX) * strike.progress;
          strike.currentY = strike.startY + (strike.targetY - strike.startY) * strike.progress;

          strike.el.style.left = `${strike.currentX}px`;
          strike.el.style.top = `${strike.currentY}px`;
          strike.el.style.transform = `translate(-50%, -50%) rotate(${strike.angle}deg)`;

          // Collision with Perseus's shield
          const distToShield = Math.hypot(strike.currentX - shieldPos.x, strike.currentY - shieldPos.y);

          if (distToShield < SHIELD_RADIUS && !strike.blocked) {
            // Blocked successfully!
            strike.blocked = true;
            createBurstParticles(strike.currentX, strike.currentY, '#ffd875');
            if (shieldRipple) {
              shieldRipple.classList.remove('blocked');
              void shieldRipple.offsetWidth; // trigger reflow
              shieldRipple.classList.add('blocked');
            }
            strike.el.remove();
            activeStrikes.splice(i, 1);
            continue;
          }

          // If reached target without being blocked -> Player takes a HIT!
          if (strike.progress >= 1.0) {
            strike.el.remove();
            activeStrikes.splice(i, 1);
            hitsTaken++;
            triggerHitFlash();
            createBurstParticles(strike.targetX, strike.targetY, '#ff4757');
            updateHitsDisplay();

            if (hitsTaken >= MAX_HITS) {
              triggerGameOver('sisters');
              return;
            }
          }
        }

        // 6. Draw Particle FX Canvas
        if (fxCtx && fxCanvas) {
          fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
          for (let pIdx = gameParticles.length - 1; pIdx >= 0; pIdx--) {
            const p = gameParticles[pIdx];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
              gameParticles.splice(pIdx, 1);
              continue;
            }

            fxCtx.beginPath();
            fxCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            fxCtx.fillStyle = p.color;
            fxCtx.globalAlpha = p.alpha;
            fxCtx.fill();
            fxCtx.globalAlpha = 1.0;
          }
        }
      }

      gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Reset & Start
    function startGame() {
      // Cancel previous loop if running
      if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
      }

      // Clean previous state
      isGameOver = false;
      isPlaying = true;
      timeRemaining = TOTAL_SURVIVAL_TIME;
      dangerLevel = 0;
      hitsTaken = 0;
      lastTime = 0;
      lastStrikeSpawn = performance.now();
      decoySpawnedCount = 0;
      decoyActive = false;

      // Clean DOM
      if (activeSnakesLayer) activeSnakesLayer.innerHTML = '';
      activeStrikes = [];
      gameParticles = [];

      if (dangerBar) dangerBar.style.width = '0%';
      if (gameTimerEl) gameTimerEl.textContent = `${TOTAL_SURVIVAL_TIME}s`;
      if (gazeAura) gazeAura.classList.remove('active');
      updateHitsDisplay();

      // Hide all modals
      if (startModal) startModal.classList.remove('active');
      if (gazeDeathModal) gazeDeathModal.classList.remove('active');
      if (sistersAwokenModal) sistersAwokenModal.classList.remove('active');
      if (victoryModal) victoryModal.classList.remove('active');

      resetShieldPos();
      gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Direct Event Listeners
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startGame();
      });
      startBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startGame();
      });
    }

    // Delegated click & touch event listener on gameArea for retry and continue buttons
    gameArea.addEventListener('click', (e) => {
      const retryBtn = e.target.closest('.retry-btn') || e.target.closest('[data-action="restart"]');
      if (retryBtn) {
        e.preventDefault();
        e.stopPropagation();
        startGame();
        return;
      }

      const victoryBtn = e.target.closest('#victoryContinueBtn');
      if (victoryBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        // Dismiss the game popup overlay
        const gamePopupLayer = document.getElementById('perseus-game');
        if (gamePopupLayer) {
          gamePopupLayer.classList.remove('active');
        }

        // Scroll player to the strike sequence or epilogue
        const epilogue = document.getElementById('epilogue');
        if (epilogue) {
          epilogue.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    gameArea.addEventListener('touchend', (e) => {
      const retryBtn = e.target.closest('.retry-btn') || e.target.closest('[data-action="restart"]');
      if (retryBtn) {
        e.preventDefault();
        e.stopPropagation();
        startGame();
        return;
      }

      const victoryBtn = e.target.closest('#victoryContinueBtn');
      if (victoryBtn) {
        e.preventDefault();
        e.stopPropagation();
        const gamePopupLayer = document.getElementById('perseus-game');
        if (gamePopupLayer) {
          gamePopupLayer.classList.remove('active');
        }
        const epilogue = document.getElementById('epilogue');
        if (epilogue) {
          epilogue.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    window.addEventListener('resize', updateAreaRect);
    updateAreaRect();
    resetShieldPos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

