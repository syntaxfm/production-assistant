export function get_filename_from_path(path: string) {
	const fileName = path.split('/').pop() || '';
	return fileName.split('.').slice(0, -1).join('.');
}

export const format_number = (value: number) => value.toString().padStart(2, '0');

export const convert_seconds = (total_seconds: number) => {
	const minutes = format_number(Math.floor(total_seconds / 60));
	const seconds = format_number(Math.floor(total_seconds % 60));
	// TODO: calculate hours
	const result = `${minutes}:${seconds}`;
	return result;
};
