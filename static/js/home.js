/* --------------------------------------------------------------------------------------
  Root Configurations
  -------------------------------------------------------------------------------------- */

var $root = {
    today: new Date(),
    recordsTypes: [],
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
  Date Picker Configs
  -------------------------------------------------------------------------------------- */

// Configurações do date picker
var datePickerConfigs = {
    format: 'dd/mm/yyyy',
    shortYearCutoff: 99
};

// Configurações da máscara do date picker
const dateMaskOptions = { mask: '00/00/0000' };

const recordDateElement = document.querySelector('#recordDate');
const recordDatePicker = new Datepicker(recordDateElement, datePickerConfigs);
IMask(recordDateElement, dateMaskOptions);

const eventDateElement = document.querySelector('#eventDate');
const eventDatePicker = new Datepicker(eventDateElement, datePickerConfigs);
IMask(eventDateElement, dateMaskOptions);

const batchRecordDateElement = document.querySelector('#batchRecordDate');
const batchRecordDatePicker = new Datepicker(batchRecordDateElement, datePickerConfigs);
IMask(batchRecordDateElement, dateMaskOptions);

// Reseta o valor dos date pickers para hoje
function resetDatePickers() {
    recordDateElement.value = $root.today.toLocaleDateString("pt-BR");
    eventDateElement.value = $root.today.toLocaleDateString("pt-BR");
    batchRecordDateElement.value = $root.today.toLocaleDateString("pt-BR");
};

/* --------------------------------------------------------------------------------------
  Time Picker Configs
  -------------------------------------------------------------------------------------- */

// Configurações das máscaras do time picker
const timeMaskOptions = { mask: '00:00' };

const recordTimeElement = document.getElementById('recordTime');
IMask(recordTimeElement, timeMaskOptions);

const batchRecordTimeElement = document.getElementById('batchRecordTime')
IMask(batchRecordTimeElement, timeMaskOptions);

const eventTimeElement = document.getElementById('eventTime')
IMask(eventTimeElement, timeMaskOptions);

// Reseta o valor dos time pickers para a data de agora
function resetTimePickers() {
    let nowHour = $root.today.getHours() + ':' + ($root.today.getMinutes().toString().padStart(2, '0'));
    recordTimeElement.value = nowHour;
    batchRecordTimeElement.value = nowHour;
    eventTimeElement.value = nowHour;
};

/* --------------------------------------------------------------------------------------
  Reset Pickers
  -------------------------------------------------------------------------------------- */
function resetPickers() {
    resetDatePickers();
    resetTimePickers();
};

/* --------------------------------------------------------------------------------------
  Select Get Data
  -------------------------------------------------------------------------------------- */

// Faz um get dos tipos de registros do banco, povoa o select com eles e cria inputs na aba de inserção em lote
function loadRecordTypes() {

    fetch(
        "http://127.0.0.1:5000/get-record-types"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }))
    }).then(response => {

        if (response.status === 200) {

            // Grava os tipos de registro na variável global
            $root.recordsTypes = response.body.data.map((item) => item.name);

            // Seleciona e limpa o select "Tipo de Registro"
            const select = document.getElementById('recordTypeId');
            document.querySelectorAll("#recordTypeId option:not(:first-child)").forEach(option => option.remove());

            // Seleciona e limpa formulário de inserção em lote
            const batchRecordsForm = document.getElementById('batchRecordsForm');
            const formGroups = batchRecordsForm.querySelectorAll(".record-type-form-group");
            if (formGroups && formGroups.length > 0)
                formGroups.forEach(item => item.remove());

            response.body.data.forEach(recordType => {

                // Povoa o select "Tipo de Registro"
                const option = document.createElement('option');
                option.value = recordType.id;
                option.textContent = capitalizeFirstLetter(recordType.name);
                select.appendChild(option);

                // Povoa o formulário de inserção em lote
                const formGroup = document.createElement('div');
                formGroup.className = "form-section-form-group record-type-form-group";

                const label = document.createElement("label");
                label.setAttribute("for", "recordValue" + capitalizeFirstLetter(recordType.name));
                label.innerHTML = "Valor de " + recordType.name + ":";
                formGroup.appendChild(label);

                const inputValue = document.createElement("input");
                inputValue.setAttribute("type", "number");
                inputValue.setAttribute("name", "recordValue" + capitalizeFirstLetter(recordType.name));
                inputValue.setAttribute("id", "recordValue" + capitalizeFirstLetter(recordType.name));
                inputValue.setAttribute("data-id", recordType.id);
                inputValue.setAttribute("placeholder", "0-10");
                inputValue.setAttribute("step", "0.1");
                inputValue.setAttribute("min", "0");
                inputValue.setAttribute("max", "10");
                formGroup.appendChild(inputValue);

                batchRecordsForm.insertBefore(formGroup, batchRecordsForm.querySelector(".submit-btn"));

            });

        } else {
            handleResponseError(response, "carregar os tipos de registro");
        }

    })
    .catch(error => {
        console.error(error);
    });

};

/* --------------------------------------------------------------------------------------
  Add Records Options Config
  -------------------------------------------------------------------------------------- */

// Configurações das abas de inserção de registros ("Simples" e "Lote")
const addRecordsButtons = document.getElementsByClassName("records-form-section-nav")[0].querySelectorAll("button");
addRecordsButtons.forEach(function (button) {

    button.addEventListener('click', function (event) {

        // Remove classe active dos botões
        addRecordsButtons.forEach(item => item.classList.remove("active"));
        // Adiciona classe active no botão clicado
        button.classList.add("active");

        // Remove classe active dos formulários
        document.getElementById("recordsFormSection").querySelectorAll("form").forEach(item => item.classList.remove("active"));
        // Adiciona classe active no formulário selecionado
        const formId = this.getAttribute('data-form');
        const form = document.getElementById(formId);
        form.classList.add("active");
    
    });

});

/* --------------------------------------------------------------------------------------
  Modal
  -------------------------------------------------------------------------------------- */

//Adiciona um evento de clique ao botão que abre o modal
document.querySelectorAll('[data-open-modal]').forEach(function (button) {
    button.addEventListener('click', function (event) {
        const modalId = this.getAttribute('data-open-modal');
        const modal = document.getElementById(modalId);
        modal.showModal();
    });
});

//Adiciona um evento de clique ao botão que fecha o modal
document.querySelectorAll('[data-close-modal]').forEach(function (button) {
    button.addEventListener('click', function (event) {
        this.closest('dialog').close();
    });
});

/* --------------------------------------------------------------------------------------
  Add data
  -------------------------------------------------------------------------------------- */

// Função genérica para adicionar dados
function addData(event, form, formItens, url, successCallback = function() {}) {

    event.preventDefault();

    // Instancia o FormHelper e processa o formulário passando os formItens recebidos
    formHelper = new FormHelper();
    formHelper.processForm(formItens);

    // Verifica se o formulário é válido com base nos formItens recebidos, senão, retorna um erro
    if (!formHelper.isValid()) {
        alert(formHelper.getValidationError());
        return;
    }

    // Se válido envia os dados do formulário para o servidor
    fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formHelper.getFormObject())
    }).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }))
    }).then(response => {
        if (response.status === 200) {
            form.reset(); // Reseta o formulário
            resetPickers(); // Reseta os pickers
            successCallback(); // Executa a função de callback
            alert(response.body.message); // Mostra a mensagem vinda do back para o usuário
        } else {
            handleResponseError(response, "inserir os dados");
        }
        return response.status;
    }).catch((error) => {
        console.error(error);
        alert("Erro ao tentar inserir os dados");
    });

};

// Configura os dados para adicionar um novo tipo de registro e chama a função genérica
const addRecordType = (event) => {
    const formItens = [
        { id: 'recordTypeName', key: "name", label: "Tipo de Registro", type: "string", required: true }
    ];
    const url = "http://127.0.0.1:5000/add-record-type"
    addData(event, document.getElementById('recordTypeForm'), formItens, url, function() {
        document.querySelector('dialog').close();
        loadRecordTypes();
    });
};

// Configura os dados para adicionar um novo registro e chama a função genérica
const addRecord = (event) => {
    const formItens = [
        { id: "recordTypeId", key: "record_type_id", label: "Tipo de Registro", type: "integer", required: true },
        { id: "recordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "recordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "recordValue", key: "value", label: "Valor", type: "float", required: true, min: 0, max: 10 }
    ];
    const url = "http://127.0.0.1:5000/add-record"
    addData(event, document.getElementById('recordForm'), formItens, url, function() {
        document.getElementById('recordTypeId').dispatchEvent(new Event('change'));
        loadRecordsData();
    });
};

// Configura os dados para adicionar registros em lote e chama a função genérica
const addBatchRecords = (event) => {
    
    let batchRecordsValues = [];
    let batchRecordsInvalid = false;

    // Percorre os tipos de registro existentes e cada um dos inputs correspondentes, verificando se há algum valor inválido ou, senão, adicionando o valor correpondente no array
    for (let recordType of $root.recordsTypes) {

        let recordValueElement = document.getElementById("recordValue"+capitalizeFirstLetter(recordType));
        let recordValue = parseFloat(recordValueElement.value)

        if (!recordValue)
            continue;

        if (isNaN(recordValue)) {
            batchRecordsInvalid = "Valor de registro inválido";
            break;
        }

        if (recordValue < 0 || recordValue > 10) {
            batchRecordsInvalid = "O valor do registro deve estar entre 0 e 10";
            break;
        }

        batchRecordsValues.push({
            record_type_id: recordValueElement.getAttribute("data-id"),
            value: recordValue
        });

    }

    // Se inválido, retorna um erro
    if (batchRecordsInvalid) {
        event.preventDefault();
        return alert(batchRecordsInvalid);
    } else if (batchRecordsValues.length === 0) {
        event.preventDefault();
        return alert("Insira pela menos um valor para fazer a inserção em lote");
    }

    // Senão, configura os formItens e chama a função genérica
    const formItens = [
        { id: "batchRecordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "batchRecordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "batchRecords", key: "batch_records", label: "Valores", type: "self", value: batchRecordsValues, required: true }
    ];

    const url = "http://127.0.0.1:5000/add-batch-records"

    addData(event, document.getElementById('batchRecordsForm'), formItens, url, function() {
        document.getElementById('recordTypeId').dispatchEvent(new Event('change'));
        loadRecordsData();
    });

};

// Configura os dados para adicionar um novo evento e chama a função genérica
const addEvent = (event) => {
    const formItens = [
        { id: "eventDescription", key: "description", label: "Descrição", type: "string", required: true },
        { id: "eventDate", key: "date", label: "Data", type: "date", required: true },
        { id: "eventTime", key: "time", label: "Hora", type: "time", required: true }
    ];
    const url = "http://127.0.0.1:5000/add-event"
    addData(event, document.getElementById('eventsForm'), formItens, url, function() {
        loadEventsData();
    });
};

/* --------------------------------------------------------------------------------------
  Load Data Tables
  -------------------------------------------------------------------------------------- */

// Função de load dos registros, faz um get do banco, configura os dados e povoa a datatable
function loadRecordsData() {

    fetch(
        "http://127.0.0.1:5000/get-records"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }))
    }).then(response => {
        
        if (response.status === 200) {

            const recordsData = [];
            const recordsColumns = [{ id: 'recordType', label: "Data/Registro" },];

            if (!response.body.data || response.body.data.length === 0) {
                $root.recordsDataTable.loadData(recordsData, recordsColumns, 1);
                return;
            }

            // Prepara dados para formato do dataTable
            $root.recordsTypes.forEach((recordType, index) => {
                // Adiciona o tipo de registro
                recordsData.push({ recordType: capitalizeFirstLetter(recordType) });
                // Adiciona o valor de cada data para o tipo de registro em questão
                response.body.data.filter((item) => {
                    return item.record_type_name === recordType
                }).forEach((item) => {
                    recordsData[index][item.date] = item.average_value;
                });
            });

            // Cria um array com as datas distintas
            distinctDates = new Set(response.body.data.map((item) => item.date));

            // Adiciona um tipo "total" nos dados da tabela
            recordsData.push({ recordType: "Total" });

            distinctDates.forEach(date => {
                // Adiciona as datas distintas como colunas
                recordsColumns.push({
                    id: date, label: String(date).split("-")[2] + "/" + String(date).split("-")[1]
                });
                // Soma os totais com base na data
                let dateTotal = response.body.data.filter((item) => {
                    return item.date === date
                }).reduce(function(n, item) {
                    return n + item.average_value }, 0
                );
                // Adiciona o total de cada data na tabela
                recordsData[recordsData.length - 1][date] = dateTotal;
            });

            // Configura a última página do datatable como a página atual com base na quantidade de datas
            let page = Math.ceil(Array.from(distinctDates).length / $root.recordsDataTable.options.columnsPerPage);

            // Carrega os dados na DataTable
            $root.recordsDataTable.loadData(recordsData, recordsColumns, page);

        } else {
            handleResponseError(response, "carregar os registros");
        }

    }).catch(error => {
        console.error('Error loading data:', error)
    });

};

// Função de load dos eventos, faz um get do banco, configura os dados e povoa a datatable
function loadEventsData() {

    fetch(
        "http://127.0.0.1:5000/get-events"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }))
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
            handleResponseError(response, "carregar os eventos");
        }

    }).catch(error => {
        console.error('Error loading data:', error)
    });

};

/* --------------------------------------------------------------------------------------
  On DOM Content Loaded
  -------------------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function() {

    // Reseta os pickers e carrega os dados dos selects
    resetPickers();
    loadRecordTypes();

    // Cria um timeout para ter certeza que os tipos de registro foram carregados antes de chamar os outros dados
    timeout = ($root.recordsTypes && $root.recordsTypes.length) > 0 ? 0 : 200;

    setTimeout(function() {

        // Cria uma instância do data table para os registros
        $root.recordsDataTable = new RecordsDataTable("recordsDataTable", {
            fixedColumns: 1,
            columnsPerPage: 7,
            searchable: true
        });

        // Busca os dados dos registros no banco
        loadRecordsData();

        // Cria uma instância do data table para os eventos
        $root.eventsDataTable = new NormalDataTable("eventsDataTable", {
            pageSize: 10,
            searchable: true
        });

        // Busca os dados dos eventos no banco
        loadEventsData();

    }, timeout);

});