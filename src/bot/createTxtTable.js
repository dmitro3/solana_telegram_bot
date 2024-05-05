// Function to create a table string
function createTxtTable(data) {
    let table = '';

    // Add header row
    table += data[0].join('\t : \t') + '\n\n';

    // Add data rows
    for (let i = 1; i < data.length; i++) {
        table += data[i].join('\t : \t') + '\n\n';
    }

    return table;
}

module.exports = { createTxtTable };