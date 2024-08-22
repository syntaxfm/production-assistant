import { load, dump } from 'js-yaml';

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

export function modify_yaml(yamlString: string, key: string, newValue: string) {
	try {
		// Parse the YAML string to a JavaScript object
		const data = load(yamlString);

		// Modify the specified key
		data[key] = newValue;

		// Convert the modified object back to a YAML string
		const newYamlString = dump(data, {
			lineWidth: -1, // Prevent line wrapping
			quotingType: '"' // Use double quotes for strings
		});

		return newYamlString;
	} catch (error) {
		console.error('Error modifying YAML:', error);
		return null;
	}
}

export function get_yaml_value(yamlString: string, key: string) {
	try {
		// Parse the YAML string to a JavaScript object
		const data = load(yamlString);
		return data[key];
	} catch (error) {
		console.error('Error getting YAML:', error);
		return null;
	}
}

export function get_today_in_unix_mili() {
	const date = new Date();
	const year = date.getFullYear();
	const month = format_number(date.getMonth() + 1);
	const day = format_number(date.getDate());
	const today = date_string_to_unix_mili(`${year}-${month}-${day}`);
	return today;
}

export function get_date_string_from_unix_mili(unix_mili: number) {
	const date = new Date(unix_mili);
	const year = date.getFullYear();
	const month = format_number(date.getMonth() + 1);
	const day = format_number(date.getDate());
	return `${year}-${month}-${day}`;
}

export function get_date_string_from_frontmatter(frontmatter: string) {
	const date = get_yaml_value(frontmatter, 'date');
	return get_date_string_from_unix_mili(date);
}

export function date_string_to_unix_mili(dateString: string) {
	// Parse the input date string
	const [year, month, day] = dateString.split('-').map(Number);

	// Create a Date object for the given date at 7:00 AM ET
	// Note: We're using a fixed offset of -4 hours (ET during EDT)
	const date = new Date(Date.UTC(year, month - 1, day, 11, 0, 0, 0));

	// Get the Unix timestamp in milliseconds
	return date.getTime();
}

export function get_number_and_title_from_name(name: string) {
	// Regular expression to match the pattern
	const regex = /^(\d+)\s*-\s*(.+)$/;

	// Try to match the input string
	const match = name.match(regex);

	if (match) {
		// If there's a match, return an object with number and title
		return {
			number: parseInt(match[1], 10),
			title: match[2].trim()
		};
	} else {
		// If there's no match, return null or throw an error
		return null; // or throw new Error("Invalid format");
	}
}
