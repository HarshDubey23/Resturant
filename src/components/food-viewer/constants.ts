export const R2_MODELS_BASE_URL = process.env.NEXT_PUBLIC_R2_MODELS_URL || "https://pub-xxxx.r2.dev/models/food";

export const FALLBACK_IMAGE_BASE = "https://b.zmtcdn.com";

export const MODEL_FALLBACK_MAP: Record<string, string> = {
	"pizza-margherita": "pizza-margherita.a1b2c3.glb",
	"burger-veg": "burger-veg.d4e5f6.glb",
	"coffee-cappuccino": "cappuccino.g7h8i9.glb",
};
