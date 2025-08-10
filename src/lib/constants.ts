// Константы приложения

// Порог для прохождения теста (50%)
export const PASS_THRESHOLD_PERCENT = 50;

// Максимальный размер файла для загрузки (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Допустимые типы файлов для заданий
export const ALLOWED_ASSIGNMENT_TYPES = ['.xlsx', '.xls', '.pdf', '.zip'];

// Допустимые типы файлов для Word документов
export const ALLOWED_DOCX_TYPES = ['.docx'];

// Директория для загрузки файлов
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Директория для хранения прогресса студентов
export const PROGRESS_DIR = process.env.PROGRESS_DIR || './data/progress';