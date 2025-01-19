export async function validateFilePath(filePath: string): Promise<{ type: string, message: string }[]> {
    const path = await import('path');
    const fs = await import('fs');

    const errors = [];

    // TODO : Make program usable without absolute path
    // Check if path is an absolute path
    if (!path.isAbsolute(filePath)) {
        errors.push({ type: 'error', message: 'Video path must be an absolute path' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        errors.push({ type: 'error', message: 'Video file not found' });
    }

    return errors;
}