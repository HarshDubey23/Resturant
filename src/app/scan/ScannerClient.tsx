"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { AlertTriangle, Flashlight, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { captureError } from "#utils/helper/sentryWrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IDetectedBarcode {
	rawValue: string;
	raw_value?: string;
	[key: string]: unknown;
}

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
	torch?: boolean;
	zoom?: boolean;
}

const ScannerClient = () => {
	const checkInterval = useRef<NodeJS.Timeout | null>(null);
	const retryCount = useRef(0);
	// FIX (audit D3): cap the capability-check interval so a denied camera
	// (or a video element that never attaches) does not poll forever. 20
	// retries × 500ms = 10s, after which we give up and surface an error
	// instead of burning CPU/battery indefinitely.
	const MAX_CAPABILITY_RETRIES = 20;

	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
	const [torch, setTorch] = useState(false);
	const [zoom, setZoom] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [caps, setCaps] = useState({ torch: false, zoom: false });

	const enumerateDevices = useCallback(async () => {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((device) => device.kind === "videoinput");
			setDevices(videoDevices);
		} catch (err) {
			captureError(err, { route: "/scan", context: "enumerate-devices" });
		}
	}, []);

	useEffect(() => {
		enumerateDevices();
		navigator.mediaDevices.addEventListener("devicechange", enumerateDevices);
		return () => {
			navigator.mediaDevices.removeEventListener("devicechange", enumerateDevices);
		};
	}, [enumerateDevices]);

	useEffect(() => {
		if (devices && devices.length > 0 && !deviceId) {
			const backCamera = devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"));
			if (backCamera) {
				setDeviceId(backCamera.deviceId);
			} else if (devices.length > 0) {
				setDeviceId(devices[devices.length - 1].deviceId);
			}
		}
	}, [devices, deviceId]);

	useEffect(() => {
		// FIX (audit D3): if the camera permission was explicitly denied,
		// there is no point polling for capabilities — the video.srcObject
		// will never attach. Skip the interval entirely in that case.
		if (hasPermission === false) return;

		const checkCapabilities = () => {
			const video = document.querySelector("video");
			if (video?.srcObject) {
				const stream = video.srcObject as MediaStream;
				const track = stream.getVideoTracks()[0];
				if (track) {
					if (devices.some((d) => !d.label)) {
						enumerateDevices();
					}
					const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as ExtendedMediaTrackCapabilities;
					setCaps({
						torch: !!capabilities.torch,
						zoom: !!capabilities.zoom,
					});
					if (checkInterval.current) {
						clearInterval(checkInterval.current);
						checkInterval.current = null;
					}
					retryCount.current = 0;
					return;
				}
			}

			// No video track yet — count this as a retry. After
			// MAX_CAPABILITY_RETRIES, stop polling and surface an error so
			// the UI is not stuck in an invisible "searching for camera"
			// state forever.
			retryCount.current += 1;
			if (retryCount.current >= MAX_CAPABILITY_RETRIES) {
				if (checkInterval.current) {
					clearInterval(checkInterval.current);
					checkInterval.current = null;
				}
				setError("Could not access camera capabilities. Please reload the page or check camera permissions.");
				captureError(new Error("Scanner capability check timed out"), { route: "/scan", retries: retryCount.current });
			}
		};

		if (checkInterval.current) clearInterval(checkInterval.current);
		retryCount.current = 0;
		checkInterval.current = setInterval(checkCapabilities, 500);

		return () => {
			if (checkInterval.current) clearInterval(checkInterval.current);
		};
	}, [devices, enumerateDevices, hasPermission]);

	const handleScan = (detectedCodes: unknown) => {
		const codes = detectedCodes as IDetectedBarcode[];
		if (codes && codes.length > 0 && !isScanning) {
			const result = codes[0];
			const url = result.rawValue || result.raw_value;

			if (url) {
				try {
					const urlObj = new URL(url);
					const isOrderWorder = urlObj.hostname.includes("orderworder");
					const hasTable = urlObj.searchParams.has("table");

					if (isOrderWorder && hasTable) {
						setIsScanning(true);
						window.location.replace(urlObj.pathname + urlObj.search + urlObj.hash);
					} else {
						toast.error("Not an OrderWorder QR");
					}
				} catch {
					toast.error("Invalid QR Code");
				}
			}
		}
	};

	const handleError = (err: unknown) => {
		const errorObj = err as Error;
		if (errorObj?.name === "NotAllowedError" || errorObj?.name === "PermissionDeniedError") {
			setHasPermission(false);
			setError("Camera permission denied. Please allow access.");
		} else if (errorObj?.name === "NotFoundError" || errorObj?.name === "DevicesNotFoundError") {
			setError("No camera found on this device.");
		} else {
			captureError(err, { route: "/scan", context: "scanner-error" });
		}
	};

	const cameraOptions = devices.map((d, index) => ({
		label: d?.label?.replace(/\s*\(.*?\)\s*/g, "") || `Camera ${index + 1}`,
		value: d.deviceId,
	}));

	return (
		<div className="flex min-h-screen flex-col items-center bg-black text-white">
			<h1 className="pt-8 pb-2 text-lg font-semibold">Order Worder</h1>
			<p className="pb-4 text-sm text-gray-400">Scan QR to Order</p>

			{devices.length > 0 && (
				<div className="relative mb-4 w-64">
					<Select value={deviceId || ""} onValueChange={(v) => setDeviceId(v || undefined)}>
						<SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
							<SelectValue placeholder="Select camera" />
						</SelectTrigger>
						<SelectContent>
							{cameraOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			<div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl">
				{error ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-900 p-6 text-center">
						<AlertTriangle className="h-10 w-10 text-yellow-400" />
						<p className="text-sm">{error}</p>
						{!hasPermission && <p className="text-xs text-gray-400">Check your browser settings.</p>}
					</div>
				) : (
					<Scanner
						key={`${deviceId}-${torch}`}
						onScan={handleScan}
						onError={handleError}
						constraints={{
							deviceId: deviceId ? { exact: deviceId } : undefined,
							advanced: [{ torch, zoom } as unknown as MediaTrackConstraintSet],
						}}
						components={{ finder: false }}
						styles={{
							container: { width: "100%", height: "100%", borderRadius: "20px" },
							video: { objectFit: "cover", borderRadius: "20px" },
						}}
					/>
				)}

				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-48 w-48 rounded-xl border-2 border-white/40" />
				</div>

				{caps.torch && (
					<Button
						size="icon"
						variant={torch ? "default" : "secondary"}
						className="absolute bottom-4 right-4"
						onClick={() => setTorch(!torch)}
						disabled={!!error}>
						<Flashlight className="h-5 w-5" />
					</Button>
				)}
			</div>

			{caps.zoom && (
				<div className="mt-4 flex items-center gap-3">
					<Button size="icon" variant="secondary" onClick={() => setZoom(Math.max(1, zoom - 0.5))} disabled={!!error}>
						<ZoomOut className="h-4 w-4" />
					</Button>
					<span className="w-10 text-center text-sm font-medium">{zoom}x</span>
					<Button size="icon" variant="secondary" onClick={() => setZoom(Math.min(5, zoom + 0.5))} disabled={!!error}>
						<ZoomIn className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
};

export default ScannerClient;
