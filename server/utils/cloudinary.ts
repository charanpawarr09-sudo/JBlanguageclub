import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

// Configure Cloudinary from env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

interface UploadOptions {
    folder?: string;
    transformation?: { width: number; height: number; crop: string; quality?: number; format?: string };
}

interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
}

/**
 * Upload a file to Cloudinary.
 * @param filePath - Local file path of the uploaded file
 * @param options - Optional folder and transformation settings
 */
export async function uploadToCloudinary(filePath: string, options: UploadOptions = {}): Promise<UploadResult> {
    const uploadOptions: Record<string, any> = {
        folder: options.folder || 'jblc',
        resource_type: 'image' as const,
        overwrite: true,
    };

    if (options.transformation) {
        uploadOptions.transformation = [
            {
                width: options.transformation.width,
                height: options.transformation.height,
                crop: options.transformation.crop,
                quality: options.transformation.quality || 'auto',
                format: options.transformation.format || 'webp',
            },
        ];
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logger.info(`Cloudinary upload: ${result.public_id} (${result.bytes} bytes, ${result.width}x${result.height})`);

    return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
    };
}
