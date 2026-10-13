import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Video, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

/**
 * CameraPreview
 * Provides an optional, local-only camera preview for interview and challenge workspaces.
 * Privacy & Security Safeguards:
 * - Local preview ONLY.
 * - Does NOT record, store, or stream video to any server.
 * - Audio is strictly disabled (audio: false).
 * - Explicitly stops and cleans up all MediaStream tracks when turned off or unmounted.
 */
export default function CameraPreview({ compact = false }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [starting, setStarting] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState(null);
  const videoRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[CameraPreview] Error stopping track:', e);
          }
        });
      } catch (e) {
        console.warn('[CameraPreview] Error cleaning stream:', e);
      }
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {}
      videoRef.current.srcObject = null;
    }

    setMediaStream(null);
    setCameraActive(false);
    setStarting(false);
    setVideoDimensions(null);
  };

  // Synchronize mediaStream with the <video> DOM element via React effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mediaStream) {
      video.muted = true;
      video.srcObject = mediaStream;

      const attemptPlay = async () => {
        try {
          await video.play();
          console.log('[CameraPreview] Video playback started.');
        } catch (playErr) {
          console.warn('[CameraPreview] video.play() note:', playErr);
        }
      };

      const updateDimensions = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoDimensions({
            width: video.videoWidth,
            height: video.videoHeight
          });
          console.log(`[CameraPreview] Active video resolution: ${video.videoWidth}x${video.videoHeight}`);
        }
      };

      video.onloadedmetadata = () => {
        updateDimensions();
        attemptPlay();
      };

      video.oncanplay = () => {
        updateDimensions();
        attemptPlay();
      };

      video.onplaying = () => {
        updateDimensions();
      };

      // If metadata is already present
      if (video.readyState >= 1) {
        updateDimensions();
        attemptPlay();
      }
    } else {
      video.srcObject = null;
    }
  }, [mediaStream]);

  // Start camera preview
  const startCamera = async () => {
    setPermissionError(null);
    setStarting(true);
    setVideoDimensions(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      // Enumerate devices to prefer physical hardware webcam if available
      let preferredDeviceId = null;
      try {
        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          const realCam = videoInputs.find((d) => !d.label?.toLowerCase().includes('virtual'));
          if (realCam && realCam.deviceId) {
            preferredDeviceId = realCam.deviceId;
          }
        }
      } catch (enumErr) {
        console.warn('[CameraPreview] Device enumeration optional warning:', enumErr);
      }

      const videoConstraints = preferredDeviceId
        ? {
            deviceId: { ideal: preferredDeviceId },
            width: { ideal: compact ? 320 : 640 },
            height: { ideal: compact ? 240 : 480 }
          }
        : {
            width: { ideal: compact ? 320 : 640 },
            height: { ideal: compact ? 240 : 480 }
          };

      // Request stream (preview ONLY: audio false)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (constraintErr) {
        console.warn('[CameraPreview] Specific constraint failed, falling back to minimal video: true', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      // Ensure all tracks are active and unmuted
      const tracks = stream.getVideoTracks();
      tracks.forEach((track) => {
        track.enabled = true;
        track.onended = () => {
          console.warn('[CameraPreview] Camera track ended by operating system or device disconnect.');
          stopCamera();
        };
      });

      console.log('[CameraPreview] Acquired video track:', tracks[0]?.label || 'Default Camera');

      // Update state: React will re-render and effect will bind video.srcObject
      setMediaStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.warn('[CameraPreview] Failed to start camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission was denied. Please allow camera access in your browser address bar permissions.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera device was detected on your system. Please verify your webcam is connected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.message?.includes('Timeout')) {
        setPermissionError('Camera is busy or locked by another app (e.g., Zoom, Teams). Please close other video apps and retry.');
      } else {
        setPermissionError(err.message || 'Unable to access local camera device.');
      }
      stopCamera();
    } finally {
      setStarting(false);
    }
  };

  // Toggle on/off
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const minHeightStyle = compact ? '180px' : '220px';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2.5">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Camera Preview
          </span>
          {cameraActive && (
            <span
              className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"
              title="Camera Active"
            />
          )}
        </div>

        <button
          type="button"
          onClick={toggleCamera}
          disabled={starting}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors shadow-xs ${
            cameraActive
              ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
          }`}
          title={cameraActive ? 'Turn Camera Off' : 'Enable Camera Preview'}
        >
          {starting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
              <span>Connecting...</span>
            </>
          ) : cameraActive ? (
            <>
              <CameraOff className="h-3 w-3" />
              <span>Turn Off</span>
            </>
          ) : (
            <>
              <Camera className="h-3 w-3" />
              <span>Turn On</span>
            </>
          )}
        </button>
      </div>

      {/* Video Viewport Container with explicit dimensions and aspect ratio */}
      <div
        className="relative overflow-hidden rounded-lg bg-slate-900 border border-slate-800 w-full flex items-center justify-center"
        style={{
          minHeight: minHeightStyle,
          aspectRatio: '4 / 3',
          width: '100%'
        }}
      >
        {/* Actual Video Element - ALWAYS rendered with full height and width */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 ${
            cameraActive ? 'block opacity-100' : 'hidden opacity-0'
          }`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)'
          }}
        />

        {/* Loading Spinner Overlay */}
        {starting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4">
            <Loader2 className="h-7 w-7 text-indigo-400 animate-spin mb-2" />
            <p className="text-xs font-semibold text-slate-200">Connecting Camera...</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Requesting local video stream and checking dimensions
            </p>
          </div>
        )}

        {/* Standby State Overlay (when inactive) */}
        {!cameraActive && !starting && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-2">
              <CameraOff className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-slate-300">Camera Preview Off</p>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
              Local verification preview. No video is recorded or transmitted.
            </p>
          </div>
        )}

        {/* Live Pill Overlay (when active) */}
        {cameraActive && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE LOCAL PREVIEW</span>
            {videoDimensions && (
              <span className="text-[8px] text-slate-300 font-mono ml-0.5">
                {videoDimensions.width}×{videoDimensions.height}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message with Retry Button if Denied / Failed */}
      {permissionError && (
        <div className="flex items-start justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
          <div className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />
            <span className="leading-snug">{permissionError}</span>
          </div>
          <button
            type="button"
            onClick={startCamera}
            disabled={starting}
            className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Privacy Guarantee Note */}
      <div className="text-[10px] text-slate-400 leading-tight">
        Local in-browser preview only • Zero network video streaming or capture
      </div>
    </div>
  );
}
