export function get_filename_from_path(path: string) {
	const fileName = path.split('/').pop() || '';
	return fileName.split('.').slice(0, -1).join('.');
}
