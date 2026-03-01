const fs = require('fs');
const path = require('path');

//reads json from hard disk and converts to html table

module.exports = async function(app, passport){
    /* gets allowed variablecolumns */
	app.get('/generic_json_to_html', async (req, res) => {
		try {
			const filePath = req.query.file;
			
			if (!filePath) {
				return sendError(res, JSON.stringify({ error: "Missing 'file' parameter" }));
			}

			// Parse hide_fields parameter
			const hideFieldsParam = req.query.hide_fields || '';
			const hideFields = hideFieldsParam ? hideFieldsParam.split(',').map(f => f.trim()) : [];

			// Read the JSON file
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const jsonData = JSON.parse(fileContent);

			// Convert JSON to HTML table
			const htmlTable = jsonToHtmlTable(jsonData, filePath, hideFields);

			res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
			res.write(htmlTable);
			res.end();
		} catch (error) {
			sendError(res, JSON.stringify({ error: error.message }));
		}
	});

}

function sendError(res,returnobj){
    console.log("ERROR: unxepected error: " + returnobj);
	res.writeHead(500,{"Content-Type" : "application/JSON"});
	res.write(returnobj);//output json array to client
    res.end();
}

function jsonToHtmlTable(data, filePath, hideFields = []) {
	let html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>JSON to HTML Table</title>
			<style>
				body {
					font-family: Arial, sans-serif;
					padding: 20px;
					background-color: #1e1e1e;
					color: #e0e0e0;
					margin: 0;
				}
				h1 {
					color: #64b5f6;
					margin-top: 0;
					font-size: 12px;
					font-weight: normal;
					word-break: break-all;
					font-family: monospace;
				}
				table {
					border-collapse: collapse;
					width: 100%;
					background-color: #2d2d2d;
					box-shadow: 0 2px 8px rgba(0,0,0,0.5);
					margin-bottom: 20px;
					table-layout: auto;
				}
				th {
					background-color: #1565c0;
					color: #ffffff;
					padding: 4px 8px;
					text-align: left;
					font-weight: bold;
					border: 1px solid #404040;
					vertical-align: top;
				}
				td {
					padding: 2px 8px;
					border: 1px solid #404040;
					max-width: 600px;
					white-space: normal;
					word-wrap: break-word;
					overflow-wrap: break-word;
					vertical-align: top;
				}
				tr {
					height: auto !important;
				}
				tr:nth-child(even) {
					background-color: #252525;
				}
				tr:hover {
					background-color: #333333;
				}
				.nested-table {
					background-color: #1a1a1a;
					margin: 5px 0;
					padding: 5px;
					border-radius: 3px;
					border-left: 3px solid #1565c0;
					font-size: 65%;
				}
				.nested-table th,
				.nested-table td {
					padding: 4px;
				}
				.null-value {
					color: #90caf9;
					font-style: italic;
				}
				th, td {
					position: relative;
				}
				th:after, td:after {
					content: '';
					position: absolute;
					right: -8px;
					top: 0;
					width: 16px;
					height: 100%;
					cursor: col-resize;
					background-color: transparent;
					user-select: none;
				}
			</style>
		</head>
		<body>
			<h1>${escapeHtml(filePath)}</h1>
	`;

	if (Array.isArray(data)) {
		html += createTableFromArray(data, hideFields);
	} else if (typeof data === 'object' && data !== null) {
		html += createTableFromObject(data, hideFields);
	} else {
		html += `<p>Data is not an object or array: ${escapeHtml(String(data))}</p>`;
	}

	html += `
		</body>
		<script>
			const headers = document.querySelectorAll('th, td');
			let currentHeader;
			let startX;
			let startWidth;

			headers.forEach(header => {
				header.addEventListener('mousedown', (e) => {
					if (e.offsetX > header.offsetWidth - 15) {
						currentHeader = header;
						startX = e.clientX;
						startWidth = header.offsetWidth;
						e.preventDefault();
					}
				});
			});

			document.addEventListener('mousemove', (e) => {
				if (currentHeader) {
					const diffX = e.clientX - startX;
					currentHeader.style.width = (startWidth + diffX) + 'px';
					currentHeader.style.minWidth = (startWidth + diffX) + 'px';
				}
			});

			document.addEventListener('mouseup', () => {
				currentHeader = null;
			});
		</script>
		</html>
	`;

	return html;
}

function createTableFromArray(dataArray, hideFields = []) {
	if (dataArray.length === 0) {
		return '<p>Array is empty</p>';
	}

	// Check if all items are objects
	if (typeof dataArray[0] === 'object' && dataArray[0] !== null) {
		let html = '';
		let currentKeys = null;
		let currentTable = null;
		let currentGroupItems = [];
		let currentFirstKey = null;

		const flushTable = () => {
			if (currentGroupItems.length > 0) {
				// Collect all unique keys from items in this group
				const allKeysSet = new Set();
				currentGroupItems.forEach(item => {
					Object.keys(item).forEach(key => {
						if (!hideFields.includes(key)) {
							allKeysSet.add(key);
						}
					});
				});
				currentKeys = Array.from(allKeysSet);

				// Create table header
				html += '<table><tr>';
				currentKeys.forEach(key => {
					html += `<th>${escapeHtml(String(key))}</th>`;
				});
				html += '</tr>';

				// Create table rows
				currentGroupItems.forEach(item => {
					html += '<tr>';
					currentKeys.forEach(key => {
						const value = item[key];
						html += `<td>${formatValue(value, hideFields)}</td>`;
					});
					html += '</tr>';
				});

				html += '</table>';
				currentGroupItems = [];
			}
		};

		dataArray.forEach((item, index) => {
			// Get keys for current item, excluding hidden fields
			const itemKeys = Object.keys(item).filter(key => !hideFields.includes(key));
			const firstKey = itemKeys.length > 0 ? itemKeys[0] : null;

			// Check if we need to start a new table
			if (firstKey !== currentFirstKey) {
				// Flush previous table if exists
				flushTable();
				currentFirstKey = firstKey;
			}

			// Add item to current group
			currentGroupItems.push(item);
		});

		// Flush last table
		flushTable();

		return html;
	} else {
		// Array of primitives
		let html = '<table><tr><th>Index</th><th>Value</th></tr>';
		dataArray.forEach((item, index) => {
			html += `<tr><td>${index}</td><td>${formatValue(item, hideFields)}</td></tr>`;
		});
		html += '</table>';
		return html;
	}
}

function createTableFromObject(obj, hideFields = []) {
	let html = '<table>';

	for (const [key, value] of Object.entries(obj)) {
		// Skip hidden fields
		if (hideFields.includes(key)) {
			continue;
		}
		html += '<tr>';
		html += `<td>${escapeHtml(String(key))}</td>`;
		html += `<td>${formatValue(value, hideFields)}</td>`;
		html += '</tr>';
	}

	html += '</table>';
	return html;
}

function getObjectKeys(dataArray) {
	const keysSet = new Set();
	dataArray.forEach(item => {
		if (typeof item === 'object' && item !== null) {
			Object.keys(item).forEach(key => keysSet.add(key));
		}
	});
	return Array.from(keysSet);
}

function formatValue(value, hideFields = []) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'boolean') {
		return `<strong>${value}</strong>`;
	}
	if (typeof value === 'number') {
		return escapeHtml(String(value));
	}
	if (typeof value === 'string') {
		return escapeHtml(value);
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return '';
		}
		// Check if array contains objects
		if (typeof value[0] === 'object' && value[0] !== null) {
			return `<div class="nested-table">${createTableFromArray(value, hideFields)}</div>`;
		}
		// Array of primitives - format each item on its own line
		const items = value.map(v => `<div style="padding: 2px 0;">${formatValue(v, hideFields)}</div>`).join('');
		return `<div class="nested-table">${items}</div>`;
	}
	if (typeof value === 'object') {
		return `<div class="nested-table">${createTableFromObject(value, hideFields)}</div>`;
	}
	return escapeHtml(String(value));
}

function escapeHtml(text) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}