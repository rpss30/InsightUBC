const state = {
	datasets: [],
	selectedDatasetId: "",
	selectedTemplateId: "",
	lastResults: [],
};

const templates = {
	sections: [
		{
			id: "top-departments",
			label: "Top Department Averages",
			chart: {type: "bar", label: (id) => `${id}_dept`, value: "overallAvg", valueLabel: "Average"},
			build: (id) => ({
				WHERE: {},
				OPTIONS: {
					COLUMNS: [`${id}_dept`, "overallAvg"],
					ORDER: {dir: "DOWN", keys: ["overallAvg"]},
				},
				TRANSFORMATIONS: {
					GROUP: [`${id}_dept`],
					APPLY: [{overallAvg: {AVG: `${id}_avg`}}],
				},
			}),
		},
		{
			id: "course-load",
			label: "Course Enrollment Load",
			chart: {type: "bar", label: (id) => `${id}_id`, value: "totalPass", valueLabel: "Total pass"},
			build: (id) => ({
				WHERE: {
					OR: [
						{IS: {[`${id}_dept`]: "cpsc"}},
						{IS: {[`${id}_dept`]: "cpen"}},
						{IS: {[`${id}_dept`]: "stat"}},
						{IS: {[`${id}_dept`]: "math"}},
					],
				},
				OPTIONS: {
					COLUMNS: [`${id}_dept`, `${id}_id`, "totalPass", "totalFail", "totalAudit"],
					ORDER: {dir: "DOWN", keys: ["totalPass"]},
				},
				TRANSFORMATIONS: {
					GROUP: [`${id}_dept`, `${id}_id`],
					APPLY: [
						{totalPass: {SUM: `${id}_pass`}},
						{totalFail: {SUM: `${id}_fail`}},
						{totalAudit: {SUM: `${id}_audit`}},
					],
				},
			}),
		},
		{
			id: "year-trend",
			label: "Yearly Average Trend",
			chart: {type: "line", label: (id) => `${id}_year`, value: "yearlyAvg", valueLabel: "Average"},
			build: (id) => ({
				WHERE: {NOT: {EQ: {[`${id}_year`]: 1900}}},
				OPTIONS: {
					COLUMNS: [`${id}_year`, "yearlyAvg"],
					ORDER: {dir: "UP", keys: [`${id}_year`]},
				},
				TRANSFORMATIONS: {
					GROUP: [`${id}_year`],
					APPLY: [{yearlyAvg: {AVG: `${id}_avg`}}],
				},
			}),
		},
	],
	rooms: [
		{
			id: "largest-rooms",
			label: "Largest Rooms",
			chart: {type: "bar", label: (id) => `${id}_name`, value: (id) => `${id}_seats`, valueLabel: "Seats"},
			build: (id) => ({
				WHERE: {GT: {[`${id}_seats`]: 80}},
				OPTIONS: {
					COLUMNS: [`${id}_name`, `${id}_fullname`, `${id}_seats`, `${id}_furniture`],
					ORDER: {dir: "DOWN", keys: [`${id}_seats`]},
				},
			}),
		},
		{
			id: "room-furniture",
			label: "Furniture Capacity",
			chart: {type: "bar", label: (id) => `${id}_furniture`, value: "averageSeats", valueLabel: "Average seats"},
			build: (id) => ({
				WHERE: {},
				OPTIONS: {
					COLUMNS: [`${id}_furniture`, "averageSeats", "largestRoom"],
					ORDER: {dir: "DOWN", keys: ["averageSeats"]},
				},
				TRANSFORMATIONS: {
					GROUP: [`${id}_furniture`],
					APPLY: [
						{averageSeats: {AVG: `${id}_seats`}},
						{largestRoom: {MAX: `${id}_seats`}},
					],
				},
			}),
		},
	],
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
	bindElements();
	bindEvents();
	refreshIcons();
	checkHealth();
	loadDatasets();
});

function bindElements() {
	for (const id of [
		"apiStatus",
		"uploadForm",
		"datasetId",
		"datasetKind",
		"datasetFile",
		"uploadStatus",
		"refreshDatasets",
		"datasetTableBody",
		"datasetEmpty",
		"datasetSelect",
		"templateSelect",
		"queryEditor",
		"formatQuery",
		"copyQuery",
		"runQuery",
		"resetQuery",
		"queryStatus",
		"resultSummary",
		"chartArea",
		"resultsTableHead",
		"resultsTableBody",
		"resultJson",
	]) {
		els[id] = document.getElementById(id);
	}
}

function bindEvents() {
	els.uploadForm.addEventListener("submit", uploadDataset);
	els.refreshDatasets.addEventListener("click", loadDatasets);
	els.datasetSelect.addEventListener("change", () => {
		state.selectedDatasetId = els.datasetSelect.value;
		setTemplatesForDataset();
		resetQueryFromTemplate();
	});
	els.templateSelect.addEventListener("change", () => {
		state.selectedTemplateId = els.templateSelect.value;
		resetQueryFromTemplate();
	});
	els.runQuery.addEventListener("click", runQuery);
	els.resetQuery.addEventListener("click", resetQueryFromTemplate);
	els.formatQuery.addEventListener("click", formatQuery);
	els.copyQuery.addEventListener("click", copyQuery);
	els.datasetTableBody.addEventListener("click", (event) => {
		const button = event.target.closest("[data-delete-dataset]");
		if (button) {
			deleteDataset(button.dataset.deleteDataset);
		}
	});
}

async function checkHealth() {
	try {
		await apiFetch("/health");
		els.apiStatus.className = "api-pill ok";
		els.apiStatus.querySelector("span:last-child").textContent = "API ready";
	} catch {
		els.apiStatus.className = "api-pill error";
		els.apiStatus.querySelector("span:last-child").textContent = "API unavailable";
	}
}

async function uploadDataset(event) {
	event.preventDefault();
	const id = els.datasetId.value.trim();
	const kind = els.datasetKind.value;
	const file = els.datasetFile.files[0];

	if (!id || id.includes("_")) {
		setStatus(els.uploadStatus, "Use an ID without underscores.", "error");
		return;
	}
	if (!file) {
		setStatus(els.uploadStatus, "Choose a ZIP file first.", "error");
		return;
	}

	setStatus(els.uploadStatus, "Uploading...", "pending");
	try {
		const body = await file.arrayBuffer();
		await apiFetch(`/dataset/${encodeURIComponent(id)}/${kind}`, {
			method: "PUT",
			headers: {"Content-Type": "application/x-zip-compressed"},
			body,
		});
		els.uploadForm.reset();
		els.datasetKind.value = kind;
		setStatus(els.uploadStatus, `Uploaded ${id}.`, "ok");
		await loadDatasets(id);
	} catch (error) {
		setStatus(els.uploadStatus, error.message, "error");
	}
}

async function loadDatasets(preferredId = state.selectedDatasetId) {
	setStatus(els.queryStatus, "Loading datasets...", "pending");
	try {
		const data = await apiFetch("/datasets");
		state.datasets = data.result ?? [];
		renderDatasets();
		const nextId = state.datasets.some((dataset) => dataset.id === preferredId)
			? preferredId
			: state.datasets[0]?.id ?? "";
		state.selectedDatasetId = nextId;
		els.datasetSelect.value = nextId;
		setTemplatesForDataset();
		resetQueryFromTemplate();
		setStatus(els.queryStatus, state.datasets.length ? "Ready." : "Add a dataset to run queries.", "ok");
	} catch (error) {
		setStatus(els.queryStatus, error.message, "error");
	}
}

async function deleteDataset(id) {
	if (!window.confirm(`Delete dataset "${id}"?`)) {
		return;
	}
	try {
		await apiFetch(`/dataset/${encodeURIComponent(id)}`, {method: "DELETE"});
		await loadDatasets();
		setStatus(els.queryStatus, `Deleted ${id}.`, "ok");
	} catch (error) {
		setStatus(els.queryStatus, error.message, "error");
	}
}

function renderDatasets() {
	els.datasetEmpty.hidden = state.datasets.length > 0;
	els.datasetTableBody.innerHTML = state.datasets.map((dataset) => `
		<tr>
			<td><button class="link-button" type="button" data-select-dataset="${escapeHtml(dataset.id)}">${escapeHtml(dataset.id)}</button></td>
			<td><span class="kind-badge">${escapeHtml(dataset.kind)}</span></td>
			<td>${formatNumber(dataset.numRows)}</td>
			<td>
				<button class="icon-button danger" type="button" title="Delete ${escapeHtml(dataset.id)}" aria-label="Delete ${escapeHtml(dataset.id)}" data-delete-dataset="${escapeHtml(dataset.id)}">
					<i data-lucide="trash-2"></i>
				</button>
			</td>
		</tr>
	`).join("");

	els.datasetSelect.innerHTML = state.datasets.map((dataset) => (
		`<option value="${escapeHtml(dataset.id)}">${escapeHtml(dataset.id)} (${escapeHtml(dataset.kind)})</option>`
	)).join("");

	for (const button of els.datasetTableBody.querySelectorAll("[data-select-dataset]")) {
		button.addEventListener("click", () => {
			state.selectedDatasetId = button.dataset.selectDataset;
			els.datasetSelect.value = state.selectedDatasetId;
			setTemplatesForDataset();
			resetQueryFromTemplate();
		});
	}

	refreshIcons();
}

function setTemplatesForDataset() {
	const dataset = getSelectedDataset();
	const availableTemplates = dataset ? templates[dataset.kind] ?? [] : [];
	els.templateSelect.innerHTML = availableTemplates.map((template) => (
		`<option value="${template.id}">${template.label}</option>`
	)).join("");
	state.selectedTemplateId = availableTemplates.some((template) => template.id === state.selectedTemplateId)
		? state.selectedTemplateId
		: availableTemplates[0]?.id ?? "";
	els.templateSelect.value = state.selectedTemplateId;
}

function resetQueryFromTemplate() {
	const dataset = getSelectedDataset();
	const template = getSelectedTemplate();
	if (!dataset || !template) {
		els.queryEditor.value = "";
		renderResults([]);
		return;
	}
	els.queryEditor.value = JSON.stringify(template.build(dataset.id), null, "\t");
	renderResults([]);
}

async function runQuery() {
	let query;
	try {
		query = JSON.parse(els.queryEditor.value);
	} catch {
		setStatus(els.queryStatus, "Query JSON is invalid.", "error");
		return;
	}

	setStatus(els.queryStatus, "Running query...", "pending");
	try {
		const data = await apiFetch("/query", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(query),
		});
		state.lastResults = data.result ?? [];
		renderResults(state.lastResults);
		setStatus(els.queryStatus, "Query complete.", "ok");
	} catch (error) {
		renderResults([]);
		setStatus(els.queryStatus, error.message, "error");
	}
}

function renderResults(results) {
	els.resultSummary.textContent = results.length ? `${formatNumber(results.length)} rows` : "No results.";
	els.resultJson.textContent = JSON.stringify(results, null, "\t");
	renderResultTable(results);
	renderChart(results);
}

function renderResultTable(results) {
	if (!results.length) {
		els.resultsTableHead.innerHTML = "";
		els.resultsTableBody.innerHTML = "";
		return;
	}

	const keys = Object.keys(results[0]);
	els.resultsTableHead.innerHTML = `<tr>${keys.map((key) => `<th>${escapeHtml(key)}</th>`).join("")}</tr>`;
	els.resultsTableBody.innerHTML = results.slice(0, 100).map((row) => `
		<tr>${keys.map((key) => `<td>${escapeHtml(row[key])}</td>`).join("")}</tr>
	`).join("");
}

function renderChart(results) {
	const dataset = getSelectedDataset();
	const template = getSelectedTemplate();
	if (!dataset || !template?.chart || !results.length || typeof d3 === "undefined") {
		els.chartArea.innerHTML = '<p class="empty-state">Run a template query to render a chart.</p>';
		return;
	}

	const chart = template.chart;
	const labelKey = resolveKey(chart.label, dataset.id);
	const valueKey = resolveKey(chart.value, dataset.id);
	const data = results
		.filter((row) => row[labelKey] !== undefined && Number.isFinite(Number(row[valueKey])))
		.slice(0, chart.type === "line" ? 80 : 18);

	if (!data.length) {
		els.chartArea.innerHTML = '<p class="empty-state">No chartable rows returned.</p>';
		return;
	}

	els.chartArea.innerHTML = "";
	const bounds = els.chartArea.getBoundingClientRect();
	const width = Math.max(320, Math.min(900, bounds.width || 720));
	const height = 360;
	const margin = {top: 28, right: 24, bottom: 78, left: 70};
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	const svg = d3.select(els.chartArea).append("svg")
		.attr("viewBox", `0 0 ${width} ${height}`)
		.attr("role", "img");
	const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	if (chart.type === "line") {
		renderLineChart(plot, data, labelKey, valueKey, innerWidth, innerHeight);
	} else {
		renderBarChart(plot, data, labelKey, valueKey, innerWidth, innerHeight);
	}

	svg.append("text")
		.attr("x", margin.left)
		.attr("y", 18)
		.attr("class", "chart-title")
		.text(template.label);
	svg.append("text")
		.attr("x", margin.left)
		.attr("y", height - 14)
		.attr("class", "chart-axis-label")
		.text(labelKey);
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", -margin.top)
		.attr("y", 18)
		.attr("class", "chart-axis-label")
		.text(chart.valueLabel);
}

function renderBarChart(plot, data, labelKey, valueKey, width, height) {
	const x = d3.scaleBand()
		.domain(data.map((row) => String(row[labelKey])))
		.range([0, width])
		.padding(0.18);
	const y = d3.scaleLinear()
		.domain([0, d3.max(data, (row) => Number(row[valueKey])) * 1.1])
		.nice()
		.range([height, 0]);

	plot.append("g")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x).tickSizeOuter(0))
		.selectAll("text")
		.attr("transform", "rotate(-35)")
		.attr("text-anchor", "end")
		.attr("dx", "-0.5em")
		.attr("dy", "0.3em");
	plot.append("g").call(d3.axisLeft(y).ticks(6));
	plot.selectAll("rect")
		.data(data)
		.join("rect")
		.attr("x", (row) => x(String(row[labelKey])))
		.attr("y", (row) => y(Number(row[valueKey])))
		.attr("width", x.bandwidth())
		.attr("height", (row) => height - y(Number(row[valueKey])))
		.attr("rx", 4)
		.attr("fill", "#2563eb");
}

function renderLineChart(plot, data, labelKey, valueKey, width, height) {
	const x = d3.scaleLinear()
		.domain(d3.extent(data, (row) => Number(row[labelKey])))
		.nice()
		.range([0, width]);
	const y = d3.scaleLinear()
		.domain(d3.extent(data, (row) => Number(row[valueKey])))
		.nice()
		.range([height, 0]);
	const line = d3.line()
		.x((row) => x(Number(row[labelKey])))
		.y((row) => y(Number(row[valueKey])));

	plot.append("g")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
	plot.append("g").call(d3.axisLeft(y).ticks(6));
	plot.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "#2563eb")
		.attr("stroke-width", 2.5)
		.attr("d", line);
	plot.selectAll("circle")
		.data(data)
		.join("circle")
		.attr("cx", (row) => x(Number(row[labelKey])))
		.attr("cy", (row) => y(Number(row[valueKey])))
		.attr("r", 3)
		.attr("fill", "#0f172a");
}

function formatQuery() {
	try {
		els.queryEditor.value = JSON.stringify(JSON.parse(els.queryEditor.value), null, "\t");
		setStatus(els.queryStatus, "Query formatted.", "ok");
	} catch {
		setStatus(els.queryStatus, "Query JSON is invalid.", "error");
	}
}

async function copyQuery() {
	try {
		await navigator.clipboard.writeText(els.queryEditor.value);
		setStatus(els.queryStatus, "Copied query.", "ok");
	} catch {
		setStatus(els.queryStatus, "Could not copy query.", "error");
	}
}

async function apiFetch(path, options = {}) {
	const response = await fetch(path, options);
	const text = await response.text();
	const data = text ? JSON.parse(text) : {};
	if (!response.ok) {
		throw new Error(data.error || `${response.status} ${response.statusText}`);
	}
	return data;
}

function getSelectedDataset() {
	return state.datasets.find((dataset) => dataset.id === state.selectedDatasetId);
}

function getSelectedTemplate() {
	const dataset = getSelectedDataset();
	return dataset ? (templates[dataset.kind] ?? []).find((template) => template.id === state.selectedTemplateId) : null;
}

function resolveKey(value, datasetId) {
	return typeof value === "function" ? value(datasetId) : value;
}

function setStatus(element, message, tone) {
	element.textContent = message;
	element.className = `status-text ${tone || ""}`.trim();
}

function formatNumber(value) {
	return new Intl.NumberFormat("en-CA").format(value);
}

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function refreshIcons() {
	if (window.lucide) {
		window.lucide.createIcons();
	}
}
