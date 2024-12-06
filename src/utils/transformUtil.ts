import {FileSection, Section} from "../model/Section";

export const transformSection = (section: FileSection): Section => {
	// const datasetFields = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
	// const fileFields = ["id", "Course", "Title", "Professor", "Subject", "Year", "Avg", "Pass", "Fail", "Audit"];

	return {
		uuid: String(section.id),
		id: String(section.Course),
		title: String(section.Title),
		instructor: String(section.Professor),
		dept: String(section.Subject),
		year: (section.Section === "overall" ? 1900 : Number(section.Year)),
		avg: Number(section.Avg),
		pass: Number(section.Pass),
		fail: Number(section.Fail),
		audit: Number(section.Audit),
		section: section.Section
	};
};
