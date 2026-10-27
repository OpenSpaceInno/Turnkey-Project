import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  RefreshCw,
  Check,
  X,
  Upload,
  Sparkles,
  MapPin,
  Clock,
  AlertCircle,
  SwitchCamera,
  Image as ImageIcon,
} from "lucide-react";

export interface CapturedPhoto {
  url: string;
  title: string;
  category?: string;
  location?: string;
  stage?: string;
  caption?: string;
  capturedDate?: string;
  timestamp?: string;
}

interface CameraCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCaptured: (photo: CapturedPhoto) => void;
  projectName?: string;
  defaultLocation?: string;
}

export function CameraCaptureModal({
  open,
  onOpenChange,
  onPhotoCaptured,
  projectName = "Site Project",
  defaultLocation = "",
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Photo Metadata
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoLocation, setPhotoLocation] = useState(defaultLocation);
  const [photoCategory, setPhotoCategory] = useState("progress");
  const [includeWatermark, setIncludeWatermark] = useState(true);

  // Initialize or stop camera stream when modal opens/closes
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Could not start camera stream:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings or use the file upload button below."
          : "Live camera stream unavailable. You can use your device's native camera or upload photos below."
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, capturedImage, startCamera, stopCamera]);

  // Flip Front/Back Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture Frame from Video Stream
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the camera video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add Industry-Standard Watermark if enabled
    if (includeWatermark) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Semi-transparent overlay banner at the bottom
      const bannerHeight = Math.max(50, Math.round(canvas.height * 0.08));
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      // Accent border
      ctx.fillStyle = "#F59E0B"; // Amber primary accent
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, 3);

      // Watermark Text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${Math.max(14, Math.round(canvas.width * 0.016))}px sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const locText = photoLocation || defaultLocation || "On Site";
      const line1 = `🏗️ ${projectName} • 📍 ${locText}`;
      const line2 = `📅 ${dateStr} ${timeStr} • Daily Progress Log`;

      ctx.fillText(line1, 20, canvas.height - bannerHeight / 2 - 8);
      ctx.font = `normal ${Math.max(12, Math.round(canvas.width * 0.013))}px sans-serif`;
      ctx.fillStyle = "#E5E7EB";
      ctx.fillText(line2, 20, canvas.height - bannerHeight / 2 + 12);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Native Device Camera Fallback (works on mobile / tablets directly via file input)
  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          if (includeWatermark) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const timeStr = now.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const bannerHeight = Math.max(50, Math.round(canvas.height * 0.08));
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

            ctx.fillStyle = "#F59E0B";
            ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, 3);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${Math.max(14, Math.round(canvas.width * 0.016))}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            const locText = photoLocation || defaultLocation || "On Site";
            ctx.fillText(
              `🏗️ ${projectName} • 📍 ${locText}`,
              20,
              canvas.height - bannerHeight / 2 - 8
            );
            ctx.font = `normal ${Math.max(12, Math.round(canvas.width * 0.013))}px sans-serif`;
            ctx.fillStyle = "#E5E7EB";
            ctx.fillText(
              `📅 ${dateStr} ${timeStr} • Daily Progress Log`,
              20,
              canvas.height - bannerHeight / 2 + 12
            );
          }
          setCapturedImage(canvas.toDataURL("image/jpeg", 0.88));
        } else {
          setCapturedImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Convert Base64 data URL to Blob for server upload
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Confirm & Upload Photo
  const handleConfirmPhoto = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    let finalUrl = capturedImage;

    try {
      // Upload blob to /api/upload
      const blob = dataURLtoBlob(capturedImage);
      const formData = new FormData();
      const fileName = `dpr-photo-${Date.now()}.jpg`;
      formData.append("file", blob, fileName);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const uploadResult = await res.json();
        if (uploadResult?.fileUrl) {
          finalUrl = uploadResult.fileUrl;
        }
      }
    } catch (err) {
      console.warn("Upload endpoint error, using data URL:", err);
    } finally {
      setIsUploading(false);
    }

    const title =
      photoTitle.trim() ||
      `Site Work Photo - ${photoLocation || "Execution Area"} - ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;

    onPhotoCaptured({
      url: finalUrl,
      title,
      category: photoCategory,
      location: photoLocation || defaultLocation,
      stage: "Civil & Execution",
      caption: photoTitle,
      capturedDate: new Date().toISOString().split("T")[0],
    });

    // Reset and close
    setCapturedImage(null);
    setPhotoTitle("");
    onOpenChange(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5 text-primary" />
            Capture Site Work Photo
          </DialogTitle>
          <DialogDescription className="text-xs">
            Take real-time progress photos directly with the camera to attach to this Daily Progress Report.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* 1. Camera Viewfinder / Preview Container */}
          <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
            {capturedImage ? (
              // Snapshot preview
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              // Fallback error / alternate options screen
              <div className="p-6 text-center text-white space-y-3">
                <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                  {cameraError}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/20 hover:bg-white/10 text-xs gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Open Native Camera
                  </Button>
                </div>
              </div>
            ) : (
              // Live video feed
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Framing Overlay Grid */}
                <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-r border-b border-white/10" />
                  <div className="border-b border-white/10" />
                </div>

                {/* Live Camera Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] text-white">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>LIVE CAM</span>
                </div>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white rounded-full transition-transform active:scale-95 shadow-md"
                  title="Switch Front/Rear Camera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Hidden native input for mobile direct camera capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeFileInput}
          />

          {/* 2. Photo Metadata & Details */}
          {capturedImage && (
            <div className="space-y-3 bg-muted/30 p-3 rounded-xl border text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Photo Title / Work Description</Label>
                <Input
                  placeholder="e.g. Raft rebar binding & cover block verification at Grid C4"
                  className="h-8 text-xs"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Location / Grid</Label>
                  <Input
                    placeholder="e.g. 4th Floor Podium Bay 4"
                    className="h-8 text-xs"
                    value={photoLocation}
                    onChange={(e) => setPhotoLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Category</Label>
                  <select
                    className="w-full h-8 text-xs rounded-md border bg-background px-2"
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                  >
                    <option value="progress">Work Progress</option>
                    <option value="quality">Quality Inspection</option>
                    <option value="safety">Safety & HSE</option>
                    <option value="material">Material Receipt</option>
                    <option value="defect">Hindrance / Snag</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. Action Controls */}
          {!capturedImage ? (
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Device Camera / Files
              </Button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                className="h-14 w-14 rounded-full border-4 border-primary/40 bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground shadow-lg transition-transform active:scale-90 mx-auto"
                title="Capture Photo"
              >
                <div className="h-10 w-10 rounded-full border-2 border-primary-foreground bg-primary flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-9 text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="text-xs gap-1.5 h-9"
                disabled={isUploading}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retake
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPhoto}
                className="text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 shadow-sm"
                disabled={isUploading}
              >
                <Check className="h-3.5 w-3.5" />
                {isUploading ? "Uploading..." : "Attach to DPR"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
