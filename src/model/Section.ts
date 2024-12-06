export interface Section {
	[index: string]: string | number;
	uuid: string; // Section id
	id: string; // Course id
	title: string; // Course title
	instructor: string; // Section instructor
	dept: string; // Department offering Course
	year: number; // Section year
	avg: number; // Section average
	pass: number; // Section passing
	fail: number; // Section failing
	audit: number; // Section auditing
	section: string;
}

// Don't use this in the implementation, this is just to support importing
export interface FileSection {
	id: string; // Section id
	Course: string; // Course id
	Title: string; // Course title
	Professor: string; // Section instructor
	Subject: string; // Department offering Course
	Year: number; // Section year
	Avg: number; // Section average
	Pass: number; // Section passing
	Fail: number; // Section failing
	Audit: number; // Section auditing
	Section: string;
}
