// DataTable.js (feita com ajuda de IA)
class RecordsDataTable {

    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        this.options = {
            fixedColumns: 1, // Number of fixed columns (first column)
            columnsPerPage: 7, // Number of additional columns per page
            currentPage: 1,
            searchable: options.searchable !== false,
            sortable: false,
            showRowSum: options.showRowSum !== false,
            showRowAverage: false,
            rowsToIgnore: 1,
            afterRender: options.afterRender || null, // Callback function to execute after data is rendered
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.columns = [];

        this.init();
    }

    init() {
        // Create table structure if it doesn't exist
        if (!this.table.querySelector('thead')) {
            this.table.innerHTML = `
                <thead>
                    <tr></tr>
                </thead>
                <tbody></tbody>
            `;
        }

        // Initialize controls if they don't exist
        this.initControls();
    }

    initControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'table-controls';
        
        // Search input
        if (this.options.searchable) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Procurar...';
            searchInput.className = 'table-search';
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            controlsDiv.appendChild(searchInput);
        }

        // Insert controls before the table
        this.table.parentNode.insertBefore(controlsDiv, this.table);
    }

    removeControls() {
        this.table.getElement()
    }

    loadData(data, columns, currentPage = 1) {
        this.data = data;
        this.columns = columns;
        this.filteredData = [...data];
        this.options.currentPage = currentPage;
        this.render();
    }

    getVisibleColumns() {
        const fixedColumns = this.columns.slice(0, this.options.fixedColumns);
        const startIndex = this.options.fixedColumns + (this.options.currentPage - 1) * this.options.columnsPerPage;
        const endIndex = Math.min(startIndex + this.options.columnsPerPage, this.columns.length);
        const paginatedColumns = this.columns.slice(startIndex, endIndex);
        
        return [...fixedColumns, ...paginatedColumns];
    }

    calculateRowSum(row, visibleColumns) {
        // Get the columns to sum, excluding the average column
        const columnsToSum = visibleColumns.slice(this.options.columnsPerPage*-1);
        // Calculate sum of numeric values
        return columnsToSum.reduce((sum, column) => {
            const value = parseFloat(row[column.id]);
            return sum + (isNaN(value) ? 0 : value);
        }, 0);
    }

    calculateRowAverage(row, visibleColumns) {
        // Get the columns to calculate average, excluding the average column
        const columnsToAverage = visibleColumns.slice(this.options.columnsPerPage*-1);
        // Calculate average of numeric values
        const sum = columnsToAverage.reduce((sum, column) => {
            const value = parseFloat(row[column.id]);
            return sum + (isNaN(value) ? 0 : value);
        }, 0);
        return sum / columnsToAverage.length;
    }

    hasAtLeastOneNumber(row, visibleColumns) {
        // Check if the row has at least one numeric value (including 0)
        return visibleColumns.some(column => {
            const value = row[column.id];
            // Check if the value is a number (including 0) or can be parsed as a number
            return typeof value === 'number' || 
                   (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '');
        });
    }

    render() {
        // Get the columns that should be visible in the current page
        const visibleColumns = this.getVisibleColumns();

        // Render header
        const headerRow = this.table.querySelector('thead tr');
        headerRow.innerHTML = '';

        visibleColumns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label || column.id;
            if (this.options.sortable) {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => this.sortBy(column.id));
            }
            headerRow.appendChild(th);
        });

        // Add sum column header if enabled
        if (this.options.showRowSum) {
            const sumTh = document.createElement('th');
            sumTh.textContent = 'Total';
            sumTh.className = 'sum-column';
            headerRow.appendChild(sumTh);
        }

        // Add average column header if enabled
        if (this.options.showRowAverage) {
            const avgTh = document.createElement('th');
            avgTh.textContent = 'Média';
            avgTh.className = 'average-column';
            headerRow.appendChild(avgTh);
        }

        // Render body
        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';

        // Add empty row if its empty
        this.table.classList.remove("empty");

        if (this.data && this.data.length === 0) {
            this.table.classList.add("empty");
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = "Nenhum registro encontrado";
            td.className = "empty-record";
            td.setAttribute("colspan", this.columns.length + (this.options.showRowSum ? 1 : 0) + (this.options.showRowAverage ? 1 : 0));
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            // Calculate all sums first to find the maximum and minimum, excluding the last row
            const dataRows = this.filteredData.slice(0, (this.options.rowsToIgnore * -1)); // Exclude the last rows
            const rowSums = dataRows.map(row => this.calculateRowSum(row, visibleColumns));
            const maxSum = Math.max(...rowSums);
            const minSum = Math.min(...rowSums);

            // Get the last row and find the columns with highest and lowest values (excluding first and last columns)
            const lastRow = this.filteredData[this.filteredData.length - 1];
            const lastRowValues = visibleColumns.slice(1).map(column => ({
                columnIndex: visibleColumns.indexOf(column),
                value: parseFloat(lastRow[column.id]) || 0
            }));
            const highestValueColumn = lastRowValues.reduce((max, current) => 
                current.value > max.value ? current : max
            );
            const lowestValueColumn = lastRowValues.reduce((min, current) => 
                current.value < min.value ? current : min
            );

            this.filteredData.forEach((row, index) => {
                // Skip rows that don't have at least one number
                if (!this.hasAtLeastOneNumber(row, visibleColumns)) {
                    return; // Skip this row
                }

                const tr = document.createElement('tr');
                
                visibleColumns.forEach((column, colIndex) => {
                    const td = document.createElement('td');
                    td.textContent = !row[column.id] && row[column.id] !== 0 ? '-' : row[column.id];
                    
                    // Add classes for highest and lowest values in the last row
                    if (index === this.filteredData.length - 1) {
                        if (colIndex === highestValueColumn.columnIndex) {
                            td.classList.add('highest-total-value');
                        }
                        if (colIndex === lowestValueColumn.columnIndex) {
                            td.classList.add('lowest-total-value');
                        }
                    }
                    
                    tr.appendChild(td);
                });

                // Add sum column if enabled
                if (this.options.showRowSum) {
                    const sumTd = document.createElement('td');
                    const sum = this.calculateRowSum(row, visibleColumns);
                    sumTd.textContent = sum.toFixed(2);
                    sumTd.className = 'sum-column';
                    tr.appendChild(sumTd);

                    // Add classes for highest and lowest sums, excluding the last row
                    if (index < this.filteredData.length - 1) {
                        if (sum === maxSum) {
                            tr.classList.add('highest-sum');
                        }
                        if (sum === minSum) {
                            tr.classList.add('lowest-sum');
                        }
                    }
                }

                // Add average column if enabled
                if (this.options.showRowAverage) {
                    const avgTd = document.createElement('td');
                    const avg = this.calculateRowAverage(row, visibleColumns);
                    // Show "-" in the last cell of the last row
                    avgTd.textContent = avg.toFixed(2);
                    avgTd.className = 'average-column';
                    tr.appendChild(avgTd);
                }
                
                tbody.appendChild(tr);
            });

            this.updatePagination();

            // Execute afterRender callback if provided
            if (this.options.afterRender && typeof this.options.afterRender === 'function') {
                this.options.afterRender(this.data, this.columns, this);
            }

        }
    }

    handleSearch(value) {
        const searchTerm = value.toLowerCase();
        this.filteredData = this.data.filter(row => 
            this.columns.some(column => 
                String(row[column.id]).toLowerCase().includes(searchTerm)
            )
        );
        this.render();
    }

    sortBy(columnId) {
        this.filteredData.sort((a, b) => {
            const aValue = a[columnId];
            const bValue = b[columnId];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            }
            
            return String(aValue).localeCompare(String(bValue));
        });
        
        this.render();
    }

    updatePagination() {
        // Calculate total pages based on number of columns (excluding fixed columns)
        const totalColumns = this.columns.length - this.options.fixedColumns;
        const totalPages = Math.ceil(totalColumns / this.options.columnsPerPage);
        
        // Create pagination controls if they don't exist
        let paginationDiv = this.table.parentNode.querySelector('.table-pagination');
        if (!paginationDiv) {
            paginationDiv = document.createElement('div');
            paginationDiv.className = 'table-pagination';
            
            const prevButton = document.createElement('button');
            prevButton.textContent = '< Anterior';
            prevButton.addEventListener('click', () => this.previousPage());
            
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Próximo >';
            nextButton.addEventListener('click', () => this.nextPage());
            
            const pageInfo = document.createElement('span');
            pageInfo.className = 'table-page-info';
            
            paginationDiv.appendChild(prevButton);
            paginationDiv.appendChild(pageInfo);
            paginationDiv.appendChild(nextButton);
            
            this.table.parentNode.appendChild(paginationDiv);
        }

        // Update pagination info
        const pageInfo = paginationDiv.querySelector('.table-page-info');
        pageInfo.textContent = `Página ${this.options.currentPage} de ${totalPages}`;

        // Update button states
        const prevButton = paginationDiv.querySelector('button:first-child');
        const nextButton = paginationDiv.querySelector('button:last-child');
        
        prevButton.disabled = this.options.currentPage === 1;
        nextButton.disabled = this.options.currentPage === totalPages;
    }

    previousPage() {
        if (this.options.currentPage > 1) {
            this.options.currentPage--;
            this.render();
        }
    }

    nextPage() {
        const totalColumns = this.columns.length - this.options.fixedColumns;
        const totalPages = Math.ceil(totalColumns / this.options.columnsPerPage);
        if (this.options.currentPage < totalPages) {
            this.options.currentPage++;
            this.render();
        }
    }
}

// DataTable.js (feita com ajuda de IA)
class NormalDataTable {

    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        this.options = {
            pageSize: options.pageSize || 10,
            currentPage: 1,
            searchable: options.searchable !== false,
            sortable: false,
            trAttributes: [],
            actions: options.actions || [], // Array of action configurations
            afterRender: options.afterRender || null, // Callback function to execute after data is rendered
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.columns = [];
        
        this.init();
    }

    init() {

        // Create table structure if it doesn't exist
        if (!this.table.querySelector('thead')) {
            this.table.innerHTML = `
                <thead>
                    <tr></tr>
                </thead>
                <tbody></tbody>
            `;
        }

        // Initialize controls if they don't exist
        this.initControls();

    }

    initControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'table-controls';
        
        // Search input
        if (this.options.searchable) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Procurar...';
            searchInput.className = 'table-search';
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            controlsDiv.appendChild(searchInput);
        }

        // Page size selector
        const pageSizeSelect = document.createElement('select');
        pageSizeSelect.className = 'table-page-size';
        [5, 10, 25, 50].forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `${size} por página`;
            if (size === this.options.pageSize) option.selected = true;
            pageSizeSelect.appendChild(option);
        });
        pageSizeSelect.addEventListener('change', (e) => this.changePageSize(parseInt(e.target.value)));
        controlsDiv.appendChild(pageSizeSelect);

        // Insert controls before the table
        this.table.parentNode.insertBefore(controlsDiv, this.table);
    }

    loadData(data, columns) {
        this.data = data;
        this.columns = columns;
        this.filteredData = [...data];
        this.render();
    }

    render() {

        // Render header
        const headerRow = this.table.querySelector('thead tr');
        headerRow.innerHTML = '';

        // Add regular columns
        this.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label || column.id;
            if (this.options.sortable) {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => this.sortBy(column.id));
            }
            headerRow.appendChild(th);
        });

        // Add actions column if actions are configured
        if (this.options.actions && this.options.actions.length > 0) {
            const actionsTh = document.createElement('th');
            actionsTh.textContent = 'Ações';
            actionsTh.classList.add("actions");
            headerRow.appendChild(actionsTh);
        }

        // Render body
        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';

        // Add empty row if its empty
        this.table.classList.remove("empty");

        if (this.data && this.data.length === 0) {

            this.table.classList.add("empty");
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = "Nenhum registro encontrado";
            td.className = "empty-record";
            td.setAttribute("colspan", this.columns.length+1);
            tr.appendChild(td);
            tbody.appendChild(tr);

        } else {

            const start = (this.options.currentPage - 1) * this.options.pageSize;
            const end = start + this.options.pageSize;
            const pageData = this.filteredData.slice(start, end);

            pageData.forEach((row, rowIndex) => {
    
                const tr = document.createElement('tr');
                
                // Add regular columns
                this.columns.forEach(column => {
                    const td = document.createElement('td');
                    td.textContent = row[column.id] || '';
                    tr.appendChild(td);
                });

                if (this.options.trAttributes && typeof this.options.trAttributes === "object" && this.options.trAttributes.length > 0) {
                    this.options.trAttributes.forEach(function(attribute) {
                        tr.setAttribute(attribute.attributeName, row[attribute.attributeId]);
                    });
                }

                // Add actions column if actions are configured
                if (this.options.actions && this.options.actions.length > 0) {
                    const actionsTd = document.createElement('td');
                    actionsTd.className = 'actions';

                    this.options.actions.forEach(action => {
                        const button = document.createElement('button');
                        let icons = { "edit": "fa-pencil", "delete": "fa-trash", "delete-date": "fa-fire" }
                        button.innerHTML = '<i class="fa fa-solid ' + icons[action.label] + '"></i>';
                        button.className = `action-button ${action.className || ''}`;
                        
                        // Add click handler if provided
                        if (action.onClick) {
                            button.addEventListener('click', (event) => action.onClick(row, button, event));
                        }

                        // Add any additional attributes
                        if (action.attributes) {
                            Object.entries(action.attributes).forEach(([key, value]) => {
                                button.setAttribute(key, value);
                            });
                        }

                        actionsTd.appendChild(button);
                    });

                    tr.appendChild(actionsTd);
                }
                
                tbody.appendChild(tr);
            });

            this.updatePagination();

            // Execute afterRender callback if provided
            if (this.options.afterRender && typeof this.options.afterRender === 'function') {
                this.options.afterRender(this.data, this.columns, this);
            }

        }

    }

    handleSearch(value) {
        const searchTerm = value.toLowerCase();
        this.filteredData = this.data.filter(row => 
            this.columns.some(column => 
                String(row[column.id]).toLowerCase().includes(searchTerm)
            )
        );
        this.options.currentPage = 1;
        this.render();
    }

    sortBy(columnId) {
        this.filteredData.sort((a, b) => {
            const aValue = a[columnId];
            const bValue = b[columnId];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            }
            
            return String(aValue).localeCompare(String(bValue));
        });
        
        this.render();
    }

    changePageSize(size) {
        this.options.pageSize = size;
        this.options.currentPage = 1;
        this.render();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        // Create pagination controls if they don't exist
        let paginationDiv = this.table.parentNode.querySelector('.table-pagination');
        if (!paginationDiv) {
            paginationDiv = document.createElement('div');
            paginationDiv.className = 'table-pagination';
            
            const prevButton = document.createElement('button');
            prevButton.textContent = '< Anterior';
            prevButton.addEventListener('click', () => this.previousPage());
            
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Próximo >';
            nextButton.addEventListener('click', () => this.nextPage());
            
            const pageInfo = document.createElement('span');
            pageInfo.className = 'table-page-info';
            
            paginationDiv.appendChild(prevButton);
            paginationDiv.appendChild(pageInfo);
            paginationDiv.appendChild(nextButton);
            
            this.table.parentNode.appendChild(paginationDiv);
        }

        // Update pagination info
        const pageInfo = paginationDiv.querySelector('.table-page-info');
        pageInfo.textContent = `Página ${this.options.currentPage} de ${totalPages}`;

        // Update button states
        const prevButton = paginationDiv.querySelector('button:first-child');
        const nextButton = paginationDiv.querySelector('button:last-child');
        
        prevButton.disabled = this.options.currentPage === 1;
        nextButton.disabled = this.options.currentPage === totalPages;
    }

    previousPage() {
        if (this.options.currentPage > 1) {
            this.options.currentPage--;
            this.render();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        if (this.options.currentPage < totalPages) {
            this.options.currentPage++;
            this.render();
        }
    }
}
