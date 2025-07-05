/* --------------------------------------------------------------------------------------
  Root Configurations
  -------------------------------------------------------------------------------------- */

var $root = {
    today: new Date(),
    recordTypes: [],
    recordsDataTable: [],
    eventsDataTable: []
};

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

function handleResponseError(response, message) {
    console.error('Error response:', response);
    let alertMessage = response.body.error ? response.body.error : `Erro ao tentar ${message}`;
    alert(alertMessage);
};

/* --------------------------------------------------------------------------------------
  Load Data Table
  -------------------------------------------------------------------------------------- */

// Função de load dos registros, faz um get do banco, configura os dados e povoa a datatable
function loadRecordsData() {

    // Primeiro busca os tipos de registro no banco
    fetch(
        "http://127.0.0.1:5000/get-record-types"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {

        if (response.status === 200) {

            // Grava os tipos de registro na variável global
            $root.recordTypes = response.body.data.map((item) => item.name);

            // Agora busca o histórico de registros no banco
            fetch(
                "http://127.0.0.1:5000/get-records"
            ).then(response2 => {
                return response2.json().then(json => ({ status: response2.status, body: json }));
            }).then(response2 => {
                
                if (response2.status === 200) {
        
                    const recordsData = [];
                    const recordsColumns = [{ id: 'recordType', label: "Data/Registro" },];
        
                    if (!response2.body.data || response2.body.data.length === 0) {
                        $root.recordsDataTable.loadData(recordsData, recordsColumns, 1);
                        return;
                    }

                    // Prepara dados para formato do dataTable
                    $root.recordTypes.forEach((recordType, index) => {
                        // Adiciona o tipo de registro
                        recordsData.push({ recordType: capitalizeFirstLetter(recordType) });
                        // Adiciona o valor de cada data para o tipo de registro em questão
                        response2.body.data.filter((item) => {
                            return item.record_type_name === recordType
                        }).forEach((item) => {
                            recordsData[index][item.date] = item.average_value;
                        });
                    });
        
                    // Cria um array com as datas distintas
                    distinctDates = new Set(response2.body.data.map((item) => item.date));
        
                    // Adiciona um tipo "total" nos dados da tabela
                    recordsData.push({ recordType: "Total" });
        
                    distinctDates.forEach(date => {
                        // Adiciona as datas distintas como colunas
                        recordsColumns.push({
                            id: date,
                            label: String(date).split("-")[2] + "/" + String(date).split("-")[1]
                        });
                        // Soma os totais com base na data
                        let dateTotal = response2.body.data.filter((item) => {
                            return item.date === date
                        }).reduce(function(n, item) {
                            return n + item.average_value }, 0
                        );
                        // Adiciona o total de cada data na tabela
                        recordsData[recordsData.length - 1][date] = dateTotal;
                    });
        
                    // Configura a última página do datatable como a página atual base na quantidade de datas
                    let page = Math.ceil(Array.from(distinctDates).length / $root.recordsDataTable.options.columnsPerPage);      
        
                    // Carrega os dados na DataTable
                    $root.recordsDataTable.loadData(recordsData, recordsColumns, page);
        
                } else {
                    handleResponseError(response2, "carregar os registros");
                }
        
            }).catch(error => {
                console.error(error);
            });

        } else {
            handleResponseError(response, "carregar os registros");
        }

    })
    .catch(error => {
        console.error(error);
    });

};

// Função de load dos eventos, faz um get do banco, configura os dados e povoa a datatable
function loadEventsData() {

    fetch(
        "http://127.0.0.1:5000/get-events"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        
        if (response.status === 200) {

            const eventsData = [];
            const eventsColumns = [
                { id: "date", label: "Data" },
                { id: "event", label: "Evento" }
            ];

            response.body.data.forEach((item, index) => {
                eventsData.push({
                    date: new Date(item.date+"T"+item.time+"-03:00").toLocaleDateString("pt-BR"),
                    event: item.description + " [" + item.time + "h]"
                });
            });

            $root.eventsDataTable.loadData(eventsData, eventsColumns);

        } else {
            handleResponseError(response, "carregar os registros");
        }

    }).catch(error => {
        console.error(error)
    });

};

/* --------------------------------------------------------------------------------------
  Export PDFs
  -------------------------------------------------------------------------------------- */

function exportRecordsPDF() {

    const doc = new jspdf.jsPDF({
        orientation: "landscape",
        unit: 'mm',
        format: 'a4'
    });

    doc.text("Histórico de Registros", 148, 45, { align: "center" })

    autoTable(doc, {
        html: '#recordsDataTable',
        margin: {
            top: 55,
            left: 12,
            right: 12
        },
        useCss: true
    });

    doc.save('historico-de-registros.pdf')

};

function exportEventsPDF() {

    const doc = new jspdf.jsPDF({
        orientation: "potrait",
        unit: 'mm',
        format: 'a4'
    });

    doc.text("Histórico de Eventos", 105, 20, { align: "center" })

    autoTable(doc, {
        html: '#eventsDataTable',
        margin: { top: 30 },
        useCss: true
    });

    doc.save('historico-de-eventos.pdf')

};

/* --------------------------------------------------------------------------------------
  On DOM Content Loaded
  -------------------------------------------------------------------------------------- */

    document.addEventListener('DOMContentLoaded', function() {

    // Cria uma instância do data table para os registros
    $root.recordsDataTable = new RecordsDataTable("recordsDataTable", {
        fixedColumns: 1,
        columnsPerPage: 14,
        searchable: true,
        showRowAverage: true
    });

    // Busca os dados dos registros no banco
    loadRecordsData();

    // Cria uma instância do data table para os eventos
    $root.eventsDataTable = new NormalDataTable("eventsDataTable", {
        pageSize: 25,
        searchable: true
    });

    // Busca os dados dos eventos no banco
    loadEventsData();

});