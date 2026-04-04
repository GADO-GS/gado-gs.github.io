window.HELP_IMPROVE_VIDEOJS = false;

var SCENE_COMPARE_METRICS = {
  bicycle: {
    ours: { gaussianCount: 483900, fps: 963.7357, trainTimeSec: 165.7 },
    gaussian_splatting: { gaussianCount: 4903061, fps: 74.3678, trainTimeSec: 3971.25 },
    speedy_splat: { gaussianCount: 616841, fps: 642.6031, trainTimeSec: 1117.17 }
  },
  garden: {
    ours: { gaussianCount: 664843, fps: 772.5542, trainTimeSec: 212.79 },
    gaussian_splatting: { gaussianCount: 4143344, fps: 39.5113, trainTimeSec: 2144.98 },
    speedy_splat: { gaussianCount: 534842, fps: 636.6691, trainTimeSec: 1482.55 }
  },
  stump: {
    ours: { gaussianCount: 348135, fps: 1035.4792, trainTimeSec: 144.78 },
    gaussian_splatting: { gaussianCount: 4298695, fps: 119.3522, trainTimeSec: 1725.29 },
    speedy_splat: { gaussianCount: 505340, fps: 718.6418, trainTimeSec: 980.6 }
  },
  kitchen: {
    ours: { gaussianCount: 391535, fps: 674.1119, trainTimeSec: 237.26 },
    gaussian_splatting: { gaussianCount: 1595375, fps: 117.5555, trainTimeSec: 2645.71 },
    speedy_splat: { gaussianCount: 115365, fps: 939.8578, trainTimeSec: 1366.44 }
  },
  bonsai: {
    ours: { gaussianCount: 277980, fps: 867.4829, trainTimeSec: 185.21 },
    gaussian_splatting: { gaussianCount: 1077226, fps: 197.4941, trainTimeSec: 1320.51 },
    speedy_splat: { gaussianCount: 130199, fps: 1012.9427, trainTimeSec: 1248.17 }
  },
  truck: {
    ours: { gaussianCount: 254054, fps: 1057.3866, trainTimeSec: 148.08 },
    gaussian_splatting: { gaussianCount: 2061701, fps: 164.0207, trainTimeSec: 1125.27 },
    speedy_splat: { gaussianCount: 255834, fps: 987.6264, trainTimeSec: 762.95 }
  }
};

function formatCompareGaussianMetric(count) {
  return {
    value: (count / 1000000).toFixed(2) + 'M',
    label: 'Gaussians'
  };
}

function formatCompareFpsMetric(fps) {
  return {
    value: Math.round(fps).toLocaleString('en-US'),
    label: 'FPS'
  };
}

function formatCompareTrainTimeMetric(seconds) {
  return {
    value: (seconds / 60).toFixed(1) + ' min',
    label: 'Train'
  };
}

function getCompareMetrics(sceneKey, methodKey) {
  var sceneMetrics = SCENE_COMPARE_METRICS[sceneKey];
  if (!sceneMetrics) {
    return null;
  }

  return sceneMetrics[methodKey] || null;
}

function observeOnceNearViewport(target, callback, rootMargin) {
  if (!target || typeof callback !== 'function') {
    return null;
  }

  if (!('IntersectionObserver' in window)) {
    callback();
    return null;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) {
        return;
      }

      observer.disconnect();
      callback();
    });
  }, {
    rootMargin: rootMargin || '0px',
    threshold: 0.01
  });

  observer.observe(target);
  return observer;
}

function runWhenBrowserIsIdle(callback, fallbackDelay) {
  var delay = typeof fallbackDelay === 'number' ? fallbackDelay : 1200;

  if (typeof callback !== 'function') {
    return null;
  }

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: Math.max(delay, 1500) });
  }

  return window.setTimeout(callback, delay);
}

function setCompareMetricLine(element, formattedMetric) {
  if (!element) {
    return;
  }

  if (!formattedMetric) {
    element.innerHTML = '';
    return;
  }

  element.innerHTML =
    '<span class="scene-compare-metrics__value">' + formattedMetric.value + '</span>' +
    '<span class="scene-compare-metrics__label">' + formattedMetric.label + '</span>';
}

function attachCompareInteraction(wrapper, overlay, divider) {
  var compareRatio = 0.5;
  var isDragging = false;
  var onPositionChange = null;

  if (!wrapper || !overlay || !divider) {
    return null;
  }

  function setComparePosition(ratio) {
    compareRatio = Math.max(0, Math.min(1, ratio));

    var percentage = compareRatio * 100;
    var hiddenRight = (1 - compareRatio) * 100;

    overlay.style.clipPath = 'inset(0 ' + hiddenRight + '% 0 0)';
    divider.style.left = percentage + '%';
    divider.setAttribute('aria-valuenow', Math.round(percentage));

    if (typeof onPositionChange === 'function') {
      onPositionChange(compareRatio);
    }
  }

  function updateCompareFromClientX(clientX) {
    var rect = wrapper.getBoundingClientRect();
    if (!rect.width) {
      return;
    }

    setComparePosition((clientX - rect.left) / rect.width);
  }

  function shouldFollowPointer(event) {
    return !event.pointerType || event.pointerType === 'mouse';
  }

  wrapper.addEventListener('pointerenter', function(event) {
    if (!shouldFollowPointer(event)) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  wrapper.addEventListener('pointermove', function(event) {
    if (!shouldFollowPointer(event)) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointerdown', function(event) {
    isDragging = true;
    divider.classList.add('is-dragging');
    divider.setPointerCapture(event.pointerId);
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointermove', function(event) {
    if (!isDragging) {
      return;
    }
    updateCompareFromClientX(event.clientX);
  });

  divider.addEventListener('pointerup', function(event) {
    isDragging = false;
    divider.classList.remove('is-dragging');
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
  });

  divider.addEventListener('pointercancel', function(event) {
    isDragging = false;
    divider.classList.remove('is-dragging');
    if (divider.hasPointerCapture(event.pointerId)) {
      divider.releasePointerCapture(event.pointerId);
    }
  });

  divider.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setComparePosition(compareRatio - 0.05);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setComparePosition(compareRatio + 0.05);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setComparePosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setComparePosition(1);
    }
  });

  setComparePosition(0.5);

  return {
    setComparePosition: setComparePosition,
    getComparePosition: function() {
      return compareRatio;
    },
    setOnPositionChange: function(callback) {
      onPositionChange = typeof callback === 'function' ? callback : null;
    }
  };
}

function initSceneShowcase() {
  var showcase = document.querySelector('[data-scene-showcase]');
  if (!showcase) {
    return;
  }

  var showcaseStorageKey = 'gado-gs.scene-showcase.active-scene';
  var buttons = showcase.querySelectorAll('.scene-selector__item');
  var caption = document.getElementById('scene-showcase-caption');
  var activeButton;
  var showcaseViewportActive = true;
  var showcasePageVisible = !document.hidden;

  if (!buttons.length) {
    return;
  }

  function shouldPlayShowcaseMedia() {
    return showcaseViewportActive && showcasePageVisible;
  }

  function buildCompositeVideoPath(sceneKey, baselineKey) {
    return './static/videos/' + sceneKey + '_ours_vs_' + baselineKey + '.mp4';
  }

  function buildCompositePosterPath(sceneKey) {
    return './static/videos/' + sceneKey + '_ours.jpg';
  }

  function readStoredSceneKey() {
    try {
      return window.localStorage.getItem(showcaseStorageKey) || '';
    } catch (error) {
      return '';
    }
  }

  function writeStoredSceneKey(sceneKey) {
    if (!sceneKey) {
      return;
    }

    try {
      window.localStorage.setItem(showcaseStorageKey, sceneKey);
    } catch (error) {}
  }

  function findButtonBySceneKey(sceneKey) {
    if (!sceneKey) {
      return null;
    }

    return Array.prototype.find.call(buttons, function(button) {
      return button.getAttribute('data-scene-key') === sceneKey;
    }) || null;
  }

  function createCompareCard(card) {
    var frame = card.querySelector('.scene-compare-frame');
    var wrapper = card.querySelector('.scene-compare-wrapper');
    var controls = card.querySelector('[data-compare-controls]');
    var overlay = card.querySelector('[data-compare-overlay]');
    var divider = card.querySelector('[data-compare-handle]');
    var loadingOverlay = card.querySelector('[data-compare-loading]');
    var sourceVideo = card.querySelector('[data-compare-source-video]');
    var sourceElement = card.querySelector('.scene-compare-source--combined');
    var leftCanvas = card.querySelector('[data-compare-canvas-left]');
    var rightCanvas = card.querySelector('[data-compare-canvas-right]');
    var leftLabel = card.querySelector('[data-compare-left-label]');
    var rightLabel = card.querySelector('[data-compare-right-label]');
    var leftGaussianMetric = card.querySelector('[data-compare-left-metric-gaussians]');
    var leftFpsMetric = card.querySelector('[data-compare-left-metric-fps]');
    var leftTrainMetric = card.querySelector('[data-compare-left-metric-train]');
    var rightGaussianMetric = card.querySelector('[data-compare-right-metric-gaussians]');
    var rightFpsMetric = card.querySelector('[data-compare-right-metric-fps]');
    var rightTrainMetric = card.querySelector('[data-compare-right-metric-train]');
    var compareCaption = card.querySelector('[data-compare-caption]');
    var playToggle = card.querySelector('[data-compare-play-toggle]');
    var playToggleText = card.querySelector('[data-compare-play-text]');
    var progressInput = card.querySelector('[data-compare-progress]');
    var fullscreenToggle = card.querySelector('[data-compare-fullscreen-toggle]');
    var fullscreenToggleText = card.querySelector('[data-compare-fullscreen-text]');
    var compareInteraction;
    var layoutFrame = null;
    var paintFrame = null;
    var videoFrameRequest = null;
    var initialAspectRatio = parseFloat(wrapper.style.getPropertyValue('--scene-compare-aspect-ratio')) || 0;
    var lastKnownRatio = initialAspectRatio > 0 ? initialAspectRatio : 16 / 9;
    var SCRUB_PREVIEW_INTERVAL = 34;
    var SCRUB_TIME_EPSILON = 0.01;
    var userPaused = false;
    var isScrubbing = false;
    var resumeAfterScrub = false;
    var hasFirstFrame = false;
    var scrubPreviewTimer = null;
    var pendingScrubTime = null;
    var scrubSeekInFlight = false;
    var leftContext;
    var rightContext;

    if (!frame || !wrapper || !controls || !overlay || !divider || !loadingOverlay || !sourceVideo || !sourceElement || !leftCanvas || !rightCanvas || !leftLabel || !rightLabel || !leftGaussianMetric || !leftFpsMetric || !leftTrainMetric || !rightGaussianMetric || !rightFpsMetric || !rightTrainMetric || !playToggle || !progressInput || !fullscreenToggle) {
      return null;
    }

    compareInteraction = attachCompareInteraction(wrapper, overlay, divider);
    if (!compareInteraction) {
      return null;
    }

    leftContext = leftCanvas.getContext('2d', { alpha: false });
    rightContext = rightCanvas.getContext('2d', { alpha: false });
    sourceVideo.muted = true;
    sourceVideo.playsInline = true;
    sourceVideo.loop = true;
    sourceVideo.preload = 'metadata';

    function setLoadingState(isLoading) {
      wrapper.classList.toggle('is-video-loading', isLoading);
      wrapper.classList.toggle('is-video-loading-visible', isLoading);
      loadingOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    }

    function isFrameFullscreen() {
      return document.fullscreenElement === frame || document.webkitFullscreenElement === frame;
    }

    function getFrameReservedHeight() {
      var reserved = 0;

      Array.prototype.forEach.call(frame.children, function(child) {
        var childStyle;

        if (child === wrapper) {
          return;
        }

        childStyle = window.getComputedStyle(child);
        reserved += child.offsetHeight;
        reserved += (parseFloat(childStyle.marginTop) || 0) + (parseFloat(childStyle.marginBottom) || 0);
      });

      return reserved;
    }

    function updateFullscreenToggleState() {
      var fullscreenActive = isFrameFullscreen();
      var label = fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen';

      frame.classList.toggle('is-card-fullscreen', fullscreenActive);
      fullscreenToggle.classList.toggle('is-fullscreen', fullscreenActive);
      fullscreenToggle.setAttribute('aria-label', label);
      if (fullscreenToggleText) {
        fullscreenToggleText.textContent = label;
      }
    }

    function updatePlayToggleState() {
      var paused = sourceVideo.paused;
      var label = paused ? 'Play comparison video' : 'Pause comparison video';

      playToggle.classList.toggle('is-paused', paused);
      playToggle.setAttribute('aria-label', label);
      playToggle.setAttribute('aria-pressed', paused ? 'false' : 'true');
      if (playToggleText) {
        playToggleText.textContent = label;
      }
    }

    function getBufferedEnd() {
      var buffered = sourceVideo.buffered;
      var currentTime = sourceVideo.currentTime || 0;
      var index;

      if (!buffered || !buffered.length) {
        return 0;
      }

      for (index = 0; index < buffered.length; index += 1) {
        if (buffered.start(index) <= currentTime && currentTime <= buffered.end(index)) {
          return buffered.end(index);
        }
      }

      return buffered.end(buffered.length - 1);
    }

    function resetProgressState() {
      progressInput.value = '0';
      progressInput.disabled = true;
      progressInput.style.setProperty('--compare-progress-percent', '0%');
      progressInput.style.setProperty('--compare-progress-buffered-percent', '0%');
    }

    function updateProgressState() {
      var duration = sourceVideo.duration || 0;
      var currentTime = Math.min(sourceVideo.currentTime || 0, duration || 0);
      var bufferedEnd = Math.min(getBufferedEnd(), duration || 0);
      var value = duration > 0 ? Math.round((currentTime / duration) * 1000) : 0;
      var progressPercent = duration > 0 ? ((currentTime / duration) * 100).toFixed(3) + '%' : '0%';
      var bufferedPercent = duration > 0 ? ((Math.max(currentTime, bufferedEnd) / duration) * 100).toFixed(3) + '%' : '0%';

      progressInput.value = String(value);
      progressInput.style.setProperty('--compare-progress-percent', progressPercent);
      progressInput.style.setProperty('--compare-progress-buffered-percent', bufferedPercent);
      progressInput.disabled = duration <= 0;
    }

    function updateProgressPreview(progressValue) {
      var duration = sourceVideo.duration || 0;
      var clampedValue = Math.max(0, Math.min(1000, progressValue));
      var progressPercent = duration > 0 ? ((clampedValue / 1000) * 100).toFixed(3) + '%' : '0%';

      progressInput.value = String(Math.round(clampedValue));
      progressInput.style.setProperty('--compare-progress-percent', progressPercent);
    }

    function syncControlState() {
      updatePlayToggleState();
      updateFullscreenToggleState();
      updateProgressState();
    }

    function requestCardFullscreen() {
      if (frame.requestFullscreen) {
        return frame.requestFullscreen();
      }

      if (frame.webkitRequestFullscreen) {
        return frame.webkitRequestFullscreen();
      }

      return null;
    }

    function exitCardFullscreen() {
      if (document.fullscreenElement && document.exitFullscreen) {
        return document.exitFullscreen();
      }

      if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      }

      return null;
    }

    function getVideoRatio() {
      if (sourceVideo.videoWidth && sourceVideo.videoHeight) {
        return (sourceVideo.videoWidth / 2) / sourceVideo.videoHeight;
      }

      return lastKnownRatio;
    }

    function getContentWidth(element) {
      var style;
      var paddingLeft;
      var paddingRight;

      if (!element) {
        return 0;
      }

      style = window.getComputedStyle(element);
      paddingLeft = parseFloat(style.paddingLeft) || 0;
      paddingRight = parseFloat(style.paddingRight) || 0;

      return Math.max(0, element.clientWidth - paddingLeft - paddingRight);
    }

    function updateWrapperSize() {
      var frame = wrapper.parentElement;
      var frameStyle = window.getComputedStyle(frame);
      var availableWidth = getContentWidth(frame) || card.clientWidth;
      var isMobile = window.innerWidth <= 768;
      var fullscreenActive = isFrameFullscreen();
      var minWidth = Math.min(availableWidth, isMobile ? 265 : 360);
      var minHeight = isMobile ? 180 : 250;
      var maxHeight = isMobile ? 290 : 450;
      var paddingTop = parseFloat(frameStyle.paddingTop) || 0;
      var paddingBottom = parseFloat(frameStyle.paddingBottom) || 0;
      var availableHeight = 0;
      var ratio = getVideoRatio();
      var width;
      var height;

      if (!availableWidth) {
        return;
      }

      lastKnownRatio = ratio;
      if (fullscreenActive) {
        availableHeight = Math.max(220, window.innerHeight - getFrameReservedHeight() - paddingTop - paddingBottom - 24);
        maxHeight = availableHeight;
        minHeight = Math.min(maxHeight, isMobile ? 210 : 300);
      }

      width = availableWidth;
      height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      if (width < minWidth) {
        width = minWidth;
        height = width / ratio;
      }

      if (height < minHeight) {
        height = minHeight;
        width = height * ratio;
      }

      if (width > availableWidth) {
        width = availableWidth;
        height = width / ratio;
      }

      wrapper.style.width = width.toFixed(2) + 'px';
      wrapper.style.height = height.toFixed(2) + 'px';
      controls.style.width = width.toFixed(2) + 'px';
    }

    function scheduleWrapperSize() {
      if (layoutFrame) {
        window.cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = window.requestAnimationFrame(function() {
        layoutFrame = null;
        updateWrapperSize();
      });
    }

    function cancelRenderLoop() {
      if (paintFrame) {
        window.cancelAnimationFrame(paintFrame);
        paintFrame = null;
      }

      if (videoFrameRequest && sourceVideo.cancelVideoFrameCallback) {
        sourceVideo.cancelVideoFrameCallback(videoFrameRequest);
        videoFrameRequest = null;
      }
    }

    function resizeCanvas(canvas) {
      var devicePixelRatio = window.devicePixelRatio || 1;
      var targetWidth = Math.max(1, Math.round(wrapper.clientWidth * devicePixelRatio));
      var targetHeight = Math.max(1, Math.round(wrapper.clientHeight * devicePixelRatio));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
    }

    function clearCanvas(context, canvas) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#0f1218';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }

    function drawFrame() {
      var videoWidth;
      var videoHeight;
      var halfWidth;

      resizeCanvas(leftCanvas);
      resizeCanvas(rightCanvas);

      if (sourceVideo.readyState < 2 || !sourceVideo.videoWidth || !sourceVideo.videoHeight) {
        if (!hasFirstFrame) {
          clearCanvas(leftContext, leftCanvas);
          clearCanvas(rightContext, rightCanvas);
        }
        return;
      }

      videoWidth = sourceVideo.videoWidth;
      videoHeight = sourceVideo.videoHeight;
      halfWidth = Math.floor(videoWidth / 2);

      clearCanvas(leftContext, leftCanvas);
      clearCanvas(rightContext, rightCanvas);

      leftContext.drawImage(sourceVideo, 0, 0, halfWidth, videoHeight, 0, 0, leftCanvas.width, leftCanvas.height);
      rightContext.drawImage(sourceVideo, halfWidth, 0, halfWidth, videoHeight, 0, 0, rightCanvas.width, rightCanvas.height);
    }

    function requestFramePaint() {
      cancelRenderLoop();

      if (sourceVideo.requestVideoFrameCallback) {
        videoFrameRequest = sourceVideo.requestVideoFrameCallback(function() {
          videoFrameRequest = null;
          drawFrame();
          updateProgressState();
          if (!sourceVideo.paused) {
            requestFramePaint();
          }
        });
        return;
      }

      paintFrame = window.requestAnimationFrame(function() {
        paintFrame = null;
        drawFrame();
        updateProgressState();
        if (!sourceVideo.paused) {
          requestFramePaint();
        }
      });
    }

    function stopPlayback() {
      sourceVideo.pause();
      cancelRenderLoop();
      drawFrame();
      syncControlState();
    }

    function requestPlayback() {
      var playPromise;

      if (userPaused || !shouldPlayShowcaseMedia() || sourceVideo.readyState < 2) {
        syncControlState();
        return;
      }

      playPromise = sourceVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function() {});
      }
      syncControlState();
    }

    function clearScrubPreviewTimer() {
      if (scrubPreviewTimer) {
        window.clearTimeout(scrubPreviewTimer);
        scrubPreviewTimer = null;
      }
    }

    function maybeResumeAfterScrub() {
      if (!resumeAfterScrub || isScrubbing || scrubSeekInFlight || pendingScrubTime !== null) {
        return;
      }

      resumeAfterScrub = false;
      if (!userPaused && shouldPlayShowcaseMedia()) {
        requestPlayback();
      } else {
        drawFrame();
        syncControlState();
      }
    }

    function flushScrubPreview() {
      var nextTime;

      clearScrubPreviewTimer();

      if (scrubSeekInFlight || pendingScrubTime === null) {
        maybeResumeAfterScrub();
        return;
      }

      nextTime = pendingScrubTime;

      if (Math.abs((sourceVideo.currentTime || 0) - nextTime) <= SCRUB_TIME_EPSILON) {
        pendingScrubTime = null;
        drawFrame();
        maybeResumeAfterScrub();
        return;
      }

      pendingScrubTime = null;
      scrubSeekInFlight = true;

      try {
        if (typeof sourceVideo.fastSeek === 'function') {
          sourceVideo.fastSeek(nextTime);
        } else {
          sourceVideo.currentTime = nextTime;
        }
      } catch (error) {
        scrubSeekInFlight = false;
        drawFrame();
        maybeResumeAfterScrub();
      }
    }

    function scheduleScrubPreview(immediate) {
      if (scrubSeekInFlight || pendingScrubTime === null || scrubPreviewTimer) {
        return;
      }

      scrubPreviewTimer = window.setTimeout(function() {
        scrubPreviewTimer = null;
        flushScrubPreview();
      }, immediate ? 0 : SCRUB_PREVIEW_INTERVAL);
    }

    function requestScrubPreview(nextTime) {
      pendingScrubTime = nextTime;
      scheduleScrubPreview(!scrubSeekInFlight);
    }

    function ensureVideoSource(nextVideoPath) {
      var currentSource = sourceElement.getAttribute('src');

      if (!nextVideoPath) {
        sourceVideo.pause();
        sourceElement.removeAttribute('src');
        sourceElement.removeAttribute('data-src');
        sourceVideo.removeAttribute('src');
        return false;
      }

      if (currentSource === nextVideoPath) {
        if (sourceVideo.readyState < 1 && sourceVideo.networkState === 0) {
          sourceVideo.load();
        }
        return false;
      }

      sourceElement.setAttribute('src', nextVideoPath);
      sourceElement.setAttribute('data-src', nextVideoPath);
      sourceVideo.load();
      return true;
    }

    function setMetricBlock(sceneKey, methodKey, labelElement, gaussianElement, fpsElement, trainElement) {
      var metrics = getCompareMetrics(sceneKey, methodKey);

      if (!metrics) {
        setCompareMetricLine(gaussianElement, null);
        setCompareMetricLine(fpsElement, null);
        setCompareMetricLine(trainElement, null);
        return;
      }

      setCompareMetricLine(gaussianElement, formatCompareGaussianMetric(metrics.gaussianCount));
      setCompareMetricLine(fpsElement, formatCompareFpsMetric(metrics.fps));
      setCompareMetricLine(trainElement, formatCompareTrainTimeMetric(metrics.trainTimeSec));
    }

    function setContent(content) {
      var sceneKey = content.sceneKey || '';
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';
      var leftMetricMethod = content.leftMetricMethod || 'ours';
      var rightMetricMethod = content.rightMetricMethod || 'gaussian_splatting';
      var nextCompositeVideo = content.videoPath || '';
      var nextPosterPath = content.posterPath || '';
      var nextAspectRatio = content.aspectRatio;

      if (nextAspectRatio > 0) {
        lastKnownRatio = nextAspectRatio;
        wrapper.style.setProperty('--scene-compare-aspect-ratio', String(nextAspectRatio));
      }

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;
      setMetricBlock(sceneKey, leftMetricMethod, leftLabel, leftGaussianMetric, leftFpsMetric, leftTrainMetric);
      setMetricBlock(sceneKey, rightMetricMethod, rightLabel, rightGaussianMetric, rightFpsMetric, rightTrainMetric);
      if (compareCaption) {
        compareCaption.textContent = resolvedLeftLabel + ' vs. ' + resolvedRightLabel;
      }

      hasFirstFrame = false;
      isScrubbing = false;
      resumeAfterScrub = false;
      userPaused = false;
      clearScrubPreviewTimer();
      pendingScrubTime = null;
      scrubSeekInFlight = false;
      cancelRenderLoop();
      compareInteraction.setComparePosition(0.5);
      setLoadingState(true);
      resetProgressState();

      sourceVideo.pause();
      sourceVideo.loop = true;
      sourceVideo.muted = true;
      sourceVideo.playsInline = true;
      sourceVideo.preload = 'metadata';
      sourceVideo.setAttribute('poster', nextPosterPath);
      ensureVideoSource(nextCompositeVideo);

      try {
        sourceVideo.currentTime = 0;
      } catch (error) {}

      drawFrame();
      scheduleWrapperSize();
      syncControlState();
      requestPlayback();
    }

    compareInteraction.setOnPositionChange(function() {
      drawFrame();
    });

    function beginScrub() {
      if (isScrubbing) {
        return;
      }

      isScrubbing = true;
      resumeAfterScrub = !sourceVideo.paused;
      clearScrubPreviewTimer();
      pendingScrubTime = null;
      scrubSeekInFlight = false;
      sourceVideo.pause();
      cancelRenderLoop();
    }

    function seekToProgress(progressValue) {
      var duration = sourceVideo.duration || 0;
      var clampedValue;
      var nextTime;

      if (!(duration > 0)) {
        updateProgressState();
        return;
      }

      clampedValue = Math.max(0, Math.min(1000, progressValue));
      nextTime = (clampedValue / 1000) * duration;

      updateProgressPreview(clampedValue);
      requestScrubPreview(nextTime);
    }

    function endScrub() {
      if (!isScrubbing) {
        return;
      }

      isScrubbing = false;
      clearScrubPreviewTimer();
      if (pendingScrubTime !== null) {
        flushScrubPreview();
      }
      if (!resumeAfterScrub || userPaused || !shouldPlayShowcaseMedia()) {
        resumeAfterScrub = false;
        drawFrame();
        syncControlState();
        return;
      }
      maybeResumeAfterScrub();
    }

    playToggle.addEventListener('click', function() {
      if (sourceVideo.paused) {
        userPaused = false;
        requestPlayback();
      } else {
        userPaused = true;
        stopPlayback();
      }
    });
    progressInput.addEventListener('pointerdown', beginScrub);
    progressInput.addEventListener('pointerup', endScrub);
    progressInput.addEventListener('pointercancel', endScrub);
    progressInput.addEventListener('change', endScrub);
    progressInput.addEventListener('blur', endScrub);
    progressInput.addEventListener('input', function() {
      if (!isScrubbing) {
        beginScrub();
      }
      seekToProgress(parseFloat(progressInput.value) || 0);
    });
    fullscreenToggle.addEventListener('click', function() {
      if (isFrameFullscreen()) {
        exitCardFullscreen();
      } else {
        requestCardFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', function() {
      syncControlState();
      scheduleWrapperSize();
      drawFrame();
    });
    document.addEventListener('webkitfullscreenchange', function() {
      syncControlState();
      scheduleWrapperSize();
      drawFrame();
    });

    sourceVideo.addEventListener('loadedmetadata', function() {
      scheduleWrapperSize();
      updateProgressState();
    });
    sourceVideo.addEventListener('loadeddata', function() {
      hasFirstFrame = true;
      drawFrame();
      setLoadingState(false);
      scheduleWrapperSize();
      requestPlayback();
    });
    sourceVideo.addEventListener('canplay', function() {
      if (!hasFirstFrame) {
        hasFirstFrame = true;
        drawFrame();
        setLoadingState(false);
      }
      requestPlayback();
    });
    sourceVideo.addEventListener('play', function() {
      requestFramePaint();
      syncControlState();
    });
    sourceVideo.addEventListener('pause', function() {
      cancelRenderLoop();
      drawFrame();
      syncControlState();
    });
    sourceVideo.addEventListener('timeupdate', updateProgressState);
    sourceVideo.addEventListener('progress', updateProgressState);
    sourceVideo.addEventListener('durationchange', updateProgressState);
    sourceVideo.addEventListener('seeking', function() {
      if (!sourceVideo.paused) {
        cancelRenderLoop();
      }
    });
    sourceVideo.addEventListener('seeked', function() {
      scrubSeekInFlight = false;
      drawFrame();
      updateProgressState();
      if (pendingScrubTime !== null) {
        scheduleScrubPreview(true);
      }
      maybeResumeAfterScrub();
      if (!sourceVideo.paused) {
        requestFramePaint();
      }
    });
    sourceVideo.addEventListener('waiting', function() {
      if (!hasFirstFrame) {
        setLoadingState(true);
      }
    });
    sourceVideo.addEventListener('error', function() {
      scrubSeekInFlight = false;
      clearScrubPreviewTimer();
      pendingScrubTime = null;
      cancelRenderLoop();
      setLoadingState(false);
      syncControlState();
    });
    window.addEventListener('resize', function() {
      scheduleWrapperSize();
      drawFrame();
    });

    setLoadingState(false);
    drawFrame();
    scheduleWrapperSize();
    syncControlState();

    return {
      setContent: setContent,
      play: function(forceUser) {
        if (forceUser) {
          userPaused = false;
        }
        requestPlayback();
      },
      pause: function(forceUser) {
        if (forceUser) {
          userPaused = true;
        }
        stopPlayback();
      }
    };
  }

  var compareCards = Array.prototype.map.call(
    showcase.querySelectorAll('[data-compare-card]'),
    createCompareCard
  ).filter(function(item) {
    return !!item;
  });

  if (!compareCards.length) {
    return;
  }

  function syncShowcasePlayback() {
    compareCards.forEach(function(compareCard) {
      if (shouldPlayShowcaseMedia()) {
        compareCard.play();
      } else {
        compareCard.pause();
      }
    });
  }

  function activateScene(button, force) {
    if (!button || (!force && button === activeButton)) {
      return;
    }

    var sceneKey = button.getAttribute('data-scene-key') || '';
    var nextLabel = button.getAttribute('data-label');
    var nextAspectRatio = parseFloat(button.getAttribute('data-aspect-ratio')) || 0;
    var compareConfigs = [
      {
        sceneKey: sceneKey,
        aspectRatio: nextAspectRatio,
        videoPath: buildCompositeVideoPath(sceneKey, '3dgs'),
        posterPath: buildCompositePosterPath(sceneKey),
        leftLabel: button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-1'),
        leftMetricMethod: 'ours',
        rightMetricMethod: 'gaussian_splatting'
      },
      {
        sceneKey: sceneKey,
        aspectRatio: nextAspectRatio,
        videoPath: buildCompositeVideoPath(sceneKey, 'speedySplat'),
        posterPath: buildCompositePosterPath(sceneKey),
        leftLabel: button.getAttribute('data-left-label-2') || button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-2') || button.getAttribute('data-right-label-1'),
        leftMetricMethod: 'ours',
        rightMetricMethod: 'speedy_splat'
      }
    ];

    activeButton = button;

    Array.prototype.forEach.call(buttons, function(item) {
      var isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (caption) {
      caption.textContent = nextLabel;
    }

    writeStoredSceneKey(sceneKey);

    compareCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0]);
    });
  }

  function moveFocus(currentButton, direction) {
    var buttonList = Array.prototype.slice.call(buttons);
    var currentIndex = buttonList.indexOf(currentButton);
    var nextIndex = (currentIndex + direction + buttonList.length) % buttonList.length;
    buttonList[nextIndex].focus();
    activateScene(buttonList[nextIndex]);
  }

  Array.prototype.forEach.call(buttons, function(button, index) {
    button.addEventListener('click', function() {
      activateScene(button);
    });

    button.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(button, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(button, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        buttons[0].focus();
        activateScene(buttons[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
        activateScene(buttons[buttons.length - 1]);
      } else if ((event.key === 'Enter' || event.key === ' ') && buttons[index]) {
        event.preventDefault();
        activateScene(button);
      }
    });
  });

  activeButton =
    findButtonBySceneKey(readStoredSceneKey()) ||
    showcase.querySelector('.scene-selector__item.is-active') ||
    buttons[0];
  activateScene(activeButton, true);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        showcaseViewportActive = entry.isIntersecting && entry.intersectionRatio > 0.14;
        syncShowcasePlayback();
      });
    }, {
      threshold: [0, 0.14, 0.35]
    }).observe(showcase);
  }

  document.addEventListener('visibilitychange', function() {
    showcasePageVisible = !document.hidden;
    syncShowcasePlayback();
  });
}

function initImageComparisons() {
  var section = document.querySelector('[data-visual-comparisons]');
  if (!section) {
    return;
  }

  var activeButton;
  var preloadedImages = Object.create(null);
  var backgroundImagePreloadStarted = false;

  function createImageCompareCard(card) {
    var headerInner = card.querySelector('.visual-compare-header__inner');
    var wrapper = card.querySelector('.scene-compare-wrapper');
    var overlay = card.querySelector('[data-compare-overlay]');
    var divider = card.querySelector('[data-compare-handle]');
    var leftImage = card.querySelector('[data-compare-image-left]');
    var rightImage = card.querySelector('[data-compare-image-right]');
    var leftLabel = card.querySelector('[data-compare-left-label]');
    var rightLabel = card.querySelector('[data-compare-right-label]');
    var baselineChip = card.querySelector('[data-compare-baseline-chip]');
    var selectorValue = card.querySelector('[data-compare-method-value]');
    var prevMethodButton = card.querySelector('[data-compare-method-prev]');
    var nextMethodButton = card.querySelector('[data-compare-method-next]');
    var compareInteraction;
    var layoutFrame = null;
    var lastKnownRatio = 16 / 9;
    var activeMethodIndex = 0;
    var latestContent = null;
    var switchTextTimer = null;

    if (!wrapper || !overlay || !divider || !leftImage || !rightImage || !leftLabel || !rightLabel) {
      return null;
    }

    compareInteraction = attachCompareInteraction(wrapper, overlay, divider);
    if (!compareInteraction) {
      return null;
    }

    function getImageRatio() {
      if (leftImage.naturalWidth && leftImage.naturalHeight) {
        return leftImage.naturalWidth / leftImage.naturalHeight;
      }

      if (rightImage.naturalWidth && rightImage.naturalHeight) {
        return rightImage.naturalWidth / rightImage.naturalHeight;
      }

      return lastKnownRatio;
    }

    function updateWrapperSize() {
      var availableWidth = card.clientWidth;
      var ratio = getImageRatio();
      var height;
      var isMobile = window.innerWidth <= 768;
      var minWidth = Math.min(availableWidth, isMobile ? 265 : 360);
      var minHeight = isMobile ? 180 : 250;
      var maxHeight = isMobile ? 290 : 450;
      var width;

      if (!availableWidth || !ratio) {
        return;
      }

      lastKnownRatio = ratio;
      width = availableWidth;
      height = width / ratio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      if (width < minWidth) {
        width = minWidth;
        height = width / ratio;
      }

      if (height < minHeight) {
        height = minHeight;
        width = height * ratio;
      }

      if (width > availableWidth) {
        width = availableWidth;
        height = width / ratio;
      }

      if (headerInner) {
        headerInner.style.width = Math.round(width) + 'px';
      }

      wrapper.style.width = Math.round(width) + 'px';
      wrapper.style.height = Math.round(height) + 'px';
    }

    function scheduleWrapperSize() {
      if (layoutFrame) {
        window.cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = window.requestAnimationFrame(function() {
        layoutFrame = null;
        updateWrapperSize();
      });
    }

    function getEnabledMethodIndexes(methodOptions) {
      return methodOptions.reduce(function(enabledIndexes, option, index) {
        if (option && !option.disabled) {
          enabledIndexes.push(index);
        }

        return enabledIndexes;
      }, []);
    }

    function resolveActiveMethodIndex(methodOptions) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var firstEnabledIndex;

      if (!enabledMethodIndexes.length) {
        return 0;
      }

      if (enabledMethodIndexes.indexOf(activeMethodIndex) !== -1) {
        return activeMethodIndex;
      }

      firstEnabledIndex = enabledMethodIndexes[0];
      return firstEnabledIndex;
    }

    function animateMethodText(nextLabel) {
      var animatedNodes = [baselineChip, selectorValue].filter(function(node) {
        return !!node;
      });

      if (!animatedNodes.length) {
        return;
      }

      if (switchTextTimer) {
        window.clearTimeout(switchTextTimer);
        switchTextTimer = null;
      }

      if (animatedNodes.every(function(node) {
        return node.innerHTML === nextLabel;
      })) {
        return;
      }

      card.classList.add('is-method-switching');
      animatedNodes.forEach(function(node) {
        node.classList.add('is-updating');
      });

      switchTextTimer = window.setTimeout(function() {
        animatedNodes.forEach(function(node) {
          node.innerHTML = nextLabel;
        });

        window.requestAnimationFrame(function() {
          card.classList.remove('is-method-switching');
          animatedNodes.forEach(function(node) {
            node.classList.remove('is-updating');
          });
        });
      }, 120);
    }

    function setMethodSwitcher(methodOptions) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var currentOption = methodOptions[activeMethodIndex];
      var currentLabel = currentOption ? currentOption.rightLabel || 'Method' : 'Method';
      var displayLabel = 'Ours <span class=\"visual-compare-selector__vs\">vs</span> ' + currentLabel;
      var hasMultipleOptions = enabledMethodIndexes.length > 1;

      animateMethodText(displayLabel);

      if (prevMethodButton) {
        prevMethodButton.disabled = !hasMultipleOptions;
      }

      if (nextMethodButton) {
        nextMethodButton.disabled = !hasMultipleOptions;
      }
    }

    function cycleMethod(methodOptions, direction) {
      var enabledMethodIndexes = getEnabledMethodIndexes(methodOptions);
      var currentEnabledIndex;
      var nextEnabledIndex;

      if (enabledMethodIndexes.length <= 1) {
        return;
      }

      currentEnabledIndex = enabledMethodIndexes.indexOf(activeMethodIndex);
      if (currentEnabledIndex === -1) {
        currentEnabledIndex = 0;
      }

      nextEnabledIndex = (currentEnabledIndex + direction + enabledMethodIndexes.length) % enabledMethodIndexes.length;
      activeMethodIndex = enabledMethodIndexes[nextEnabledIndex];
      setMethodSwitcher(methodOptions);
      applyResolvedContent(methodOptions[activeMethodIndex]);
    }

    function applyResolvedContent(content) {
      var nextLeftImage = content.leftImage || '';
      var nextRightImage = content.rightImage || nextLeftImage;
      var resolvedLeftLabel = content.leftLabel || 'Ours';
      var resolvedRightLabel = content.rightLabel || 'Method B';

      leftLabel.textContent = resolvedLeftLabel;
      rightLabel.textContent = resolvedRightLabel;

      if (nextLeftImage) {
        leftImage.setAttribute('src', nextLeftImage);
      }

      if (nextRightImage) {
        rightImage.setAttribute('src', nextRightImage);
      }

      leftImage.setAttribute('alt', resolvedLeftLabel + ' qualitative comparison image.');
      rightImage.setAttribute('alt', resolvedRightLabel + ' qualitative comparison image.');

      compareInteraction.setComparePosition(0.5);
      scheduleWrapperSize();
    }

    function setContent(content) {
      var methodOptions = content.methodOptions || [];
      var resolvedContent = content;

      latestContent = content;

      if (methodOptions.length && (baselineChip || selectorValue || prevMethodButton || nextMethodButton)) {
        activeMethodIndex = resolveActiveMethodIndex(methodOptions);
        setMethodSwitcher(methodOptions);
        resolvedContent = methodOptions[activeMethodIndex];
      }

      applyResolvedContent(resolvedContent);
    }

    leftImage.addEventListener('load', scheduleWrapperSize);
    rightImage.addEventListener('load', scheduleWrapperSize);
    window.addEventListener('resize', scheduleWrapperSize);
    scheduleWrapperSize();

    if (prevMethodButton) {
      prevMethodButton.addEventListener('click', function() {
        if (!latestContent || !latestContent.methodOptions) {
          return;
        }

        cycleMethod(latestContent.methodOptions, -1);
      });
    }

    if (nextMethodButton) {
      nextMethodButton.addEventListener('click', function() {
        if (!latestContent || !latestContent.methodOptions) {
          return;
        }

        cycleMethod(latestContent.methodOptions, 1);
      });
    }

    return {
      setContent: setContent
    };
  }

  var imageCards = Array.prototype.map.call(
    section.querySelectorAll('[data-image-compare-card]'),
    createImageCompareCard
  ).filter(function(item) {
    return !!item;
  });
  var buttons = section.querySelectorAll('.scene-selector__item');
  var sceneSelector = section.querySelector('.visual-scene-selector');
  var sceneSelectorShell = section.querySelector('.visual-scene-selector-shell');
  var prevScenePageButton = section.querySelector('[data-visual-scenes-prev]');
  var nextScenePageButton = section.querySelector('[data-visual-scenes-next]');
  var sceneSelectorLayoutFrame = null;
  var currentScenePage = 0;
  var maxScenePage = 0;

  if (!imageCards.length) {
    return;
  }

  if (!buttons.length) {
    return;
  }

  function getSceneSelectorPageSize() {
    return window.innerWidth <= 768 ? 3 : 6;
  }

  function updateSceneSelectorButtons() {
    var isSinglePage = maxScenePage === 0;

    if (sceneSelectorShell) {
      sceneSelectorShell.classList.toggle('is-single-page', isSinglePage);
    }

    if (prevScenePageButton) {
      prevScenePageButton.disabled = isSinglePage || currentScenePage <= 0;
    }

    if (nextScenePageButton) {
      nextScenePageButton.disabled = isSinglePage || currentScenePage >= maxScenePage;
    }
  }

  function applySceneSelectorPage() {
    var pageSize;
    var firstButtonOnPage;
    var targetOffset;

    if (!sceneSelector) {
      return;
    }

    pageSize = getSceneSelectorPageSize();
    firstButtonOnPage = buttons[currentScenePage * pageSize];
    targetOffset = firstButtonOnPage ? firstButtonOnPage.offsetLeft : 0;
    sceneSelector.style.transform = 'translate3d(' + (-targetOffset) + 'px, 0, 0)';
    updateSceneSelectorButtons();
  }

  function syncSceneSelectorPageToButton(button) {
    var buttonList = Array.prototype.slice.call(buttons);
    var buttonIndex = buttonList.indexOf(button);
    var pageSize = getSceneSelectorPageSize();

    if (buttonIndex === -1) {
      return;
    }

    currentScenePage = Math.floor(buttonIndex / pageSize);
    applySceneSelectorPage();
  }

  function scheduleSceneSelectorLayout(syncToActiveButton) {
    if (!sceneSelector) {
      return;
    }

    if (sceneSelectorLayoutFrame) {
      window.cancelAnimationFrame(sceneSelectorLayoutFrame);
    }

    sceneSelectorLayoutFrame = window.requestAnimationFrame(function() {
      var pageSize = getSceneSelectorPageSize();

      sceneSelectorLayoutFrame = null;
      maxScenePage = Math.max(0, Math.ceil(buttons.length / pageSize) - 1);
      currentScenePage = Math.min(currentScenePage, maxScenePage);

      if (syncToActiveButton && activeButton) {
        syncSceneSelectorPageToButton(activeButton);
        return;
      }

      applySceneSelectorPage();
    });
  }

  function collectSceneImagePaths(button) {
    var seen = Object.create(null);
    var uniquePaths = [];

    [1, 2, 3, 4, 5].forEach(function(slot) {
      [
        button.getAttribute('data-left-image-' + slot),
        button.getAttribute('data-right-image-' + slot)
      ].forEach(function(path) {
        if (!path || seen[path]) {
          return;
        }

        seen[path] = true;
        uniquePaths.push(path);
      });
    });

    return uniquePaths;
  }

  function preloadImagePath(imagePath) {
    var image;

    if (!imagePath || preloadedImages[imagePath]) {
      return;
    }

    image = new Image();
    image.decoding = 'async';
    image.src = imagePath;
    preloadedImages[imagePath] = image;
  }

  function preloadSceneImages(button) {
    if (!button) {
      return;
    }

    collectSceneImagePaths(button).forEach(preloadImagePath);
  }

  function preloadRemainingImages() {
    var remainingButtons;

    if (backgroundImagePreloadStarted) {
      return;
    }

    backgroundImagePreloadStarted = true;
    remainingButtons = Array.prototype.filter.call(buttons, function(button) {
      return button !== activeButton;
    });

    remainingButtons.forEach(function(button, index) {
      window.setTimeout(function() {
        preloadSceneImages(button);
      }, 420 + (index * 360));
    });
  }

  function activateScene(button, force) {
    if (!button || (!force && button === activeButton)) {
      return;
    }

    function buildSelectableMethodOption(slot, fallbackLabel) {
      var leftImage = button.getAttribute('data-left-image-' + slot) ||
        button.getAttribute('data-left-image-2') ||
        button.getAttribute('data-left-image-1');
      var rightImage = button.getAttribute('data-right-image-' + slot) ||
        button.getAttribute('data-right-image-2') ||
        button.getAttribute('data-right-image-1');
      var leftLabel = button.getAttribute('data-left-label-' + slot) ||
        button.getAttribute('data-left-label-2') ||
        button.getAttribute('data-left-label-1');
      var rightLabel = button.getAttribute('data-right-label-' + slot) || fallbackLabel;

      return {
        leftImage: leftImage,
        rightImage: rightImage,
        leftLabel: leftLabel,
        rightLabel: rightLabel
      };
    }

    var compareConfigs = [
      {
        leftImage: button.getAttribute('data-left-image-1'),
        rightImage: button.getAttribute('data-right-image-1'),
        leftLabel: button.getAttribute('data-left-label-1'),
        rightLabel: button.getAttribute('data-right-label-1')
      },
      {
        methodOptions: [
          buildSelectableMethodOption(2, button.getAttribute('data-right-label-2') || button.getAttribute('data-right-label-1') || 'SpeedySplat'),
          buildSelectableMethodOption(3, 'Compact-3DGS'),
          buildSelectableMethodOption(4, 'LightGaussian'),
          buildSelectableMethodOption(5, 'Scaffold-GS')
        ]
      }
    ];

    activeButton = button;

    Array.prototype.forEach.call(buttons, function(item) {
      var isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    syncSceneSelectorPageToButton(button);
    preloadSceneImages(button);
    imageCards.forEach(function(compareCard, index) {
      compareCard.setContent(compareConfigs[index] || compareConfigs[0]);
    });
  }

  function moveFocus(currentButton, direction) {
    var buttonList = Array.prototype.slice.call(buttons);
    var currentIndex = buttonList.indexOf(currentButton);
    var nextIndex = (currentIndex + direction + buttonList.length) % buttonList.length;
    buttonList[nextIndex].focus();
    activateScene(buttonList[nextIndex]);
  }

  Array.prototype.forEach.call(buttons, function(button, index) {
    button.addEventListener('click', function() {
      activateScene(button);
    });

    button.addEventListener('pointerenter', function() {
      preloadSceneImages(button);
    });

    button.addEventListener('focusin', function() {
      preloadSceneImages(button);
    });

    button.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocus(button, 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocus(button, -1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        buttons[0].focus();
        activateScene(buttons[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        buttons[buttons.length - 1].focus();
        activateScene(buttons[buttons.length - 1]);
      } else if ((event.key === 'Enter' || event.key === ' ') && buttons[index]) {
        event.preventDefault();
        activateScene(button);
      }
    });
  });

  if (prevScenePageButton) {
    prevScenePageButton.addEventListener('click', function() {
      currentScenePage = Math.max(0, currentScenePage - 1);
      applySceneSelectorPage();
    });
  }

  if (nextScenePageButton) {
    nextScenePageButton.addEventListener('click', function() {
      currentScenePage = Math.min(maxScenePage, currentScenePage + 1);
      applySceneSelectorPage();
    });
  }

  window.addEventListener('resize', function() {
    scheduleSceneSelectorLayout(true);
  });

  activeButton = section.querySelector('.scene-selector__item.is-active') || buttons[0];
  preloadSceneImages(activeButton);
  activateScene(activeButton, true);
  scheduleSceneSelectorLayout(true);
  observeOnceNearViewport(section, function() {
    runWhenBrowserIsIdle(preloadRemainingImages, 700);
  }, '220px 0px');
}

function initViewportManagedInlineVideos() {
  var videos = document.querySelectorAll('.publication-video video');

  Array.prototype.forEach.call(videos, function(video) {
    var videoIsVisible = true;
    var shouldResumeWhenVisible = false;

    function shouldPauseVideo() {
      return document.hidden || !videoIsVisible;
    }

    function syncVideoPlayback() {
      if (shouldPauseVideo()) {
        if (!video.paused && !video.ended) {
          shouldResumeWhenVisible = true;
          video.pause();
        }
        return;
      }

      if (!shouldResumeWhenVisible) {
        return;
      }

      shouldResumeWhenVisible = false;
      video.play().catch(function() {
        shouldResumeWhenVisible = true;
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          videoIsVisible = entry.isIntersecting && entry.intersectionRatio > 0.14;
          syncVideoPlayback();
        });
      }, {
        threshold: [0, 0.14, 0.35]
      }).observe(video);
    }

    document.addEventListener('visibilitychange', syncVideoPlayback);
    video.addEventListener('pause', function() {
      if (!shouldPauseVideo()) {
        shouldResumeWhenVisible = false;
      }
    });
  });
}

function initResultsGallery() {
  var gallery = document.querySelector('[data-results-gallery]');
  if (!gallery) {
    return;
  }

  var items = Array.prototype.slice.call(gallery.querySelectorAll('[data-results-item]'));
  var displayRoot = gallery.querySelector('[data-results-display]');
  var displayViewport = gallery.querySelector('.results-display__viewport');
  var selectedIndex = 0;
  var hasRendered = false;
  var displayLayoutFrame = 0;

  if (!items.length || !displayRoot || !displayViewport) {
    return;
  }

  function clampSelectedIndex(index) {
    return Math.max(0, Math.min(items.length - 1, index));
  }

  function selectIndex(index) {
    selectedIndex = clampSelectedIndex(index);
    renderSelection();
  }

  function ensureTableFitWrapper(body) {
    var viewport = body.querySelector('.results-display__table-scroll');
    var fit = viewport ? viewport.querySelector('.results-display__table-fit') : null;
    var table;

    if (!viewport) {
      return null;
    }

    if (!fit) {
      table = viewport.querySelector('.results-table');
      if (!table) {
        return null;
      }

      fit = document.createElement('div');
      fit.className = 'results-display__table-fit';
      viewport.insertBefore(fit, table);
      fit.appendChild(table);
    }

    return fit;
  }

  function fitDisplayStage(stage) {
    Array.prototype.slice.call(stage ? stage.querySelectorAll('.results-display__body--table') : []).forEach(function(body) {
      var viewport = body.querySelector('.results-display__table-scroll');
      var fit = ensureTableFitWrapper(body);
      var naturalWidth;
      var naturalHeight;
      var availableWidth;
      var availableHeight;
      var scale;
      var safeGutter = 8;

      if (!viewport || !fit) {
        return;
      }

      fit.style.setProperty('--results-table-scale', '1');
      naturalWidth = fit.offsetWidth;
      naturalHeight = fit.offsetHeight;
      availableWidth = Math.max(0, viewport.clientWidth - safeGutter);
      availableHeight = Math.max(0, viewport.clientHeight - safeGutter);

      if (!naturalWidth || !naturalHeight || !availableWidth || !availableHeight) {
        return;
      }

      scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
      fit.style.setProperty('--results-table-scale', scale.toFixed(4));
    });
  }

  function scheduleDisplayLayout() {
    if (displayLayoutFrame) {
      window.cancelAnimationFrame(displayLayoutFrame);
    }

    displayLayoutFrame = window.requestAnimationFrame(function() {
      displayLayoutFrame = 0;
      fitDisplayStage(getCurrentDisplayStage());
      window.requestAnimationFrame(function() {
        fitDisplayStage(getCurrentDisplayStage());
      });
    });
  }

  function getDisplayDefinition(item) {
    var type = item.getAttribute('data-display-type') || 'image';
    var src = item.getAttribute('data-full-src') || '';
    var caption = item.getAttribute('data-caption') || '';
    var alt = item.querySelector('img') ? item.querySelector('img').getAttribute('alt') : caption;
    var title = item.getAttribute('data-display-title') ||
      (item.querySelector('.is-sr-only') ? item.querySelector('.is-sr-only').textContent.trim() : caption);
    var templateId = item.getAttribute('data-template-id') || '';

    return {
      type: type,
      src: src,
      caption: caption,
      alt: alt,
      title: title,
      templateId: templateId,
      key: type === 'template' ? ('template:' + templateId) : ('image:' + src)
    };
  }

  function createDisplayStage(definition, extraClassName) {
    var stage = document.createElement('div');
    var header = document.createElement('div');
    var heading = document.createElement('h3');
    var divider = document.createElement('div');
    var description = document.createElement('p');
    var body = document.createElement('div');
    var image;
    var template;

    stage.className = 'results-display__stage';
    if (extraClassName) {
      stage.classList.add(extraClassName);
    }
    stage.setAttribute('data-results-key', definition.key);

    header.className = 'results-display__header';

    heading.className = 'results-display__title';
    heading.textContent = definition.title;

    divider.className = 'results-display__section-divider';
    divider.setAttribute('aria-hidden', 'true');

    description.className = 'results-display__description';
    description.textContent = definition.caption;

    body.className = 'results-display__body';

    if (definition.type === 'template' && definition.templateId) {
      body.classList.add('results-display__body--table');
      template = document.getElementById(definition.templateId);

      if (template && 'content' in template) {
        body.appendChild(document.importNode(template.content, true));
      } else if (template) {
        body.innerHTML = template.innerHTML;
      }
    } else {
      body.classList.add('results-display__body--image');
      image = document.createElement('img');
      image.className = 'results-display__image';
      image.setAttribute('src', definition.src);
      image.setAttribute('alt', definition.alt || '');
      body.appendChild(image);
    }

    header.appendChild(heading);
    header.appendChild(divider);

    stage.appendChild(header);
    stage.appendChild(body);
    stage.appendChild(description);

    return stage;
  }

  function getCurrentDisplayStage() {
    return displayViewport.querySelector('.results-display__stage.is-current') ||
      displayViewport.querySelector('.results-display__stage:last-child');
  }

  function cleanupDisplayStages(currentStage) {
    Array.prototype.slice.call(displayViewport.querySelectorAll('.results-display__stage')).forEach(function(stage) {
      if (stage !== currentStage) {
        stage.remove();
      }
    });
  }

  function setDisplay(index, direction, instant) {
    var item = items[index];
    var nextDisplay;
    var currentStage;
    var nextStage;

    if (!item) {
      return;
    }

    nextDisplay = getDisplayDefinition(item);

    currentStage = getCurrentDisplayStage();
    nextStage = createDisplayStage(nextDisplay, 'is-current');

    if (
      currentStage &&
      currentStage.getAttribute('data-results-key') === nextDisplay.key
    ) {
      return;
    }

    displayViewport.innerHTML = '';
    displayViewport.appendChild(nextStage);
    displayViewport.style.height = '';
  }

  function renderSelection() {
    items.forEach(function(item, index) {
      var isActive = index === selectedIndex;
      item.hidden = false;
      item.classList.remove('is-edge', 'is-peek');
      item.classList.add('is-front');
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      item.setAttribute('aria-hidden', 'false');
      item.setAttribute('tabindex', '0');
      item.style.removeProperty('--results-x');
      item.style.removeProperty('--results-y');
      item.style.removeProperty('--results-scale');
      item.style.removeProperty('--results-opacity');
      item.style.removeProperty('--results-rotate');
      item.style.removeProperty('--results-tilt');
      item.style.removeProperty('--results-z');
      item.style.removeProperty('--results-saturate');
      item.style.removeProperty('--results-blur');
      item.style.removeProperty('--results-layer');
    });

    setDisplay(selectedIndex, 0, !hasRendered);
    hasRendered = true;
    scheduleDisplayLayout();
  }

  items.forEach(function(item, index) {
    item.addEventListener('click', function(event) {
      event.preventDefault();
      selectIndex(index);
    });

    item.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectIndex(index);
      }
    });
  });
  selectedIndex = items.findIndex(function(item) {
    return item.hasAttribute('data-results-default');
  });

  if (selectedIndex < 0) {
    selectedIndex = 0;
  }
  renderSelection();

  window.addEventListener('resize', function() {
    scheduleDisplayLayout();
  });
}

function initPlaceholderLinks() {
  Array.prototype.forEach.call(document.querySelectorAll('[data-placeholder-link]'), function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
    });
  });
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    if (window.bulmaSlider && typeof window.bulmaSlider.attach === 'function') {
        window.bulmaSlider.attach();
    }
    initSceneShowcase();
    initImageComparisons();
    initViewportManagedInlineVideos();
    initResultsGallery();
    initPlaceholderLinks();

})
