/* --------------------------------------------------------------------------------------
  Root Configurations
  -------------------------------------------------------------------------------------- */

var $root = {
    activeRecordTab: {},
    recordsTypes: [],
    recordsTypesDataTable: [],
    recordsDataTableByType: [],
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
  Date Picker Config
  -------------------------------------------------------------------------------------- */

//Configurações do date picker
let datePickerConfigs = {
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

/* --------------------------------------------------------------------------------------
  Time Picker Configs
  -------------------------------------------------------------------------------------- */

// Configurações das máscaras do time picker
const timeMaskOptions = { mask: '00:00' };
const recordTimeElement = document.getElementById('recordTime');
IMask(recordTimeElement, timeMaskOptions);
const eventTimeElement = document.getElementById('eventTime')
IMask(eventTimeElement, timeMaskOptions);

/* --------------------------------------------------------------------------------------
  Tooltips Configs
  -------------------------------------------------------------------------------------- */

function configTooltips() {
    tippy('.edit-button', { content: 'Editar dados' });
    tippy('.delete-button', { content: 'Deletar dados' });
    tippy('.delete-date-button', { content: 'Deletar dia inteiro' });
};

/* --------------------------------------------------------------------------------------
  Load and Config Records Tabs
  -------------------------------------------------------------------------------------- */

// Faz um get dos tipos de registros do banco e configura as abas de seleção dos tipos de registro
function loadAndConfigRecordsTabs() {

    fetch(
        "http://127.0.0.1:5000/get-record-types"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {

        if (response.status === 200) {

            // Grava os tipos de registro na variável global
            $root.recordsTypes = response.body.data;

            // Pega a ul "recordsTabs"
            let recordsTabs = document.getElementById("recordsTabs");
            recordsTabs.innerHTML = "";

            // Povoa as tabs com os tipos de registros
            response.body.data.forEach(function(item) {
                const li = document.createElement("li");
                li.innerHTML = capitalizeFirstLetter(item.name);
                li.setAttribute("data-tab-id", item.id);
                li.setAttribute("data-tab-name", item.name);
                recordsTabs.appendChild(li);
            });

            // Configura o evento click para as tabs criadas e clica na primeira tab
            configTabsClicks();
            if (recordsTabs.children[0])
                recordsTabs.children[0].click();

        } else {
            handleResponseError(response, "carregar os tipos de registros");
        }

    })
    .catch(error => {
        console.error(error);
    });

};

// Configura o evento click para as tabs
function configTabsClicks() {
    const tabs = document.querySelectorAll(".records-section .tabs-nav li");
    tabs.forEach(function(item) {
        item.addEventListener("click", function(event) {
            tabs.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
            $root.activeRecordTab = {
                id: item.getAttribute("data-tab-id"),
                name: item.getAttribute("data-tab-name")
            };
            loadRecordsDataTableByType($root.activeRecordTab);
        });
    });
};

/* --------------------------------------------------------------------------------------
  Load Data Tables
  -------------------------------------------------------------------------------------- */

function loadRecordsTypesDataTable() {

    fetch(
        "http://127.0.0.1:5000/get-record-types"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        
        if (response.status === 200) {

            const recordsTypesData = [];
            const recordsTypesColumns = [{ id: "name", label: "Tipo de Registro" }];

            response.body.data.forEach((item) => {
                recordsTypesData.push({
                    id: item.id,
                    name: capitalizeFirstLetter(item.name),
                    order: item.order
                });
            });

            $root.recordsTypesDataTable.loadData(recordsTypesData, recordsTypesColumns);

        } else {
            handleResponseError(response, "carregar os registros");
        }

    }).catch(error => {
        console.error(error)
    });

};

function loadRecordsDataTableByType(tab) {

    // Configura a label da tabela
    document.getElementById("recordTabLabel").innerHTML = capitalizeFirstLetter(tab.name);

    // Faz a requisição dos registros para o tipo de registro selecionado na tab
    fetch(
        "http://127.0.0.1:5000/get-records-by-record-type/" + tab.id
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        
        if (response.status === 200) {

            const recordsData = [];
            const recordColumn = [
                { id: "record_type_name", label: "Tipo" },
                { id: "date", label: "Data" },
                { id: "time", label: "Hora" },
                { id: "value", label: "Valor" }
            ];

            if (response.body.data && response.body.data.length > 0) {
                response.body.data.forEach((item, index) => {
                    recordsData.push({
                        id: item.id,
                        record_type_name: item.record_type_name,
                        date: new Date(item.date+"T"+item.time+"-03:00").toLocaleDateString("pt-BR"),
                        raw_date: item.date,
                        time: item.time,
                        value: item.value
                    });
                });
            }

            $root.recordsDataTableByType.loadData(recordsData, recordColumn);

        } else {
            handleResponseError(response, "carregar os tipos de registro");
        }

    }).catch(error => {
        console.error(error)
    });

};

function loadEventsDataTable() {

    fetch(
        "http://127.0.0.1:5000/get-events"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        
        if (response.status === 200) {

            const eventsData = [];
            const eventsColumns = [
                { id: "date", label: "Data" },
                { id: "eventLabel", label: "Evento" }
            ];

            response.body.data.forEach((item, index) => {
                eventsData.push({
                    id: item.id,
                    date: new Date(item.date+"T"+item.time+"-03:00").toLocaleDateString("pt-BR"),
                    time: item.time,
                    description: item.description,
                    eventLabel: item.description + " [" + item.time + "h]"
                });
            });

            $root.eventsDataTable.loadData(eventsData, eventsColumns);

        } else {
            handleResponseError(response, "carregar os eventos");
        }

    }).catch(error => {
        console.error(error)
    });

};

/* --------------------------------------------------------------------------------------
  Generic Functions
  -------------------------------------------------------------------------------------- */

// Função generica para abrir e configurar modal de edição
function openAndConfigEditModal(button, row, fullfillValues = function() {}) {

    // Abre o modal
    const modalId = button.getAttribute('data-open-modal');
    const modal = document.getElementById(modalId);
    modal.showModal();

    // Preenche os inputs do modal com os valores    
    fullfillValues(modal, row);

    // Adiciona event listener de fechar modal
    modal.querySelector("[data-close-modal]").addEventListener('click', function (event) {
        this.closest('dialog').close();
    });

};

// Função genérica para editar dados
function editData(event, url, formItens, successCallback = function() {}) {

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
        method: 'put',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formHelper.getFormObject())
    }).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            successCallback();
            alert(response.body.message);
        } else {
            handleResponseError(response, "editar os dados");
        }
        return response.status;
    }).catch((error) => {
        console.error(error);
        alert("Erro ao tentar editar os dados");
    });

};

// Função genérica para deletar dados
function deleteData(url, successCallback = function() {}) {
    fetch(url, {
        method: "delete"
    }).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            successCallback();
            alert(response.body.message);
        } else {
            handleResponseError(response, "excluir os dados");
        }
    }).catch(error => {        
        console.error(error)
        alert("Erro ao tentar excluir os dados");
    });
};

/* --------------------------------------------------------------------------------------
  Edit Functions
  -------------------------------------------------------------------------------------- */

// Configura os dados para editar um tipo de registro e chama a função genérica
function editRecordType(event) {
    const formItens = [
        { id: 'recordTypeName', key: "name", label: "Tipo de Registro", type: "string", required: true }
    ];
    const url = "http://127.0.0.1:5000/update-record-type/" + document.getElementById("recordTypeId").value;
    editData(event, url, formItens, function () {
        loadRecordsTypesDataTable();
        document.getElementById("recordTypeModal").close();
        loadAndConfigRecordsTabs();
    });
};

// Configura os dados para editar um registro e chama a função genérica
function editRecord(event) {
    const formItens = [
        { id: "recordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "recordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "recordValue", key: "value", label: "Valor", type: "float", required: true, min: 0, max: 10 }
    ];
    const url = "http://127.0.0.1:5000/update-record/" + document.getElementById("recordId").value;
    editData(event, url, formItens, function () {
        loadRecordsDataTableByType($root.activeRecordTab);
        document.getElementById("recordModal").close();
    });
};

// Configura os dados para editar um evento chama a função genérica
function editEvent(event) {
    const formItens = [
        { id: "eventDescription", key: "description", label: "Descrição", type: "string", required: true },
        { id: "eventDate", key: "date", label: "Data", type: "date", required: true },
        { id: "eventTime", key: "time", label: "Hora", type: "time", required: true }
    ];
    const url = "http://127.0.0.1:5000/update-event/" + document.getElementById("eventId").value;
    editData(event, url, formItens, function () {
        loadEventsDataTable();
        document.getElementById("eventModal").close();
    });
};

/* --------------------------------------------------------------------------------------
  RecordType Sorting
  -------------------------------------------------------------------------------------- */

// Função que ativa e configura o recurso de arrastar e soltar dos tipos de registro
function activateRecordTypeSorting() {

    document.getElementById("recordTypeDataSection").setAttribute("data-sorting", "true");

    var el = document.querySelector('#recordsTypesDataTable tbody');

    Sortable.create(el, {

        onSort: function (evt) {

            function configurateNextItemOrder(order, item) {
                item.setAttribute("data-order", order);
                if (item.nextElementSibling)
                    configurateNextItemOrder(order + 1, item.nextElementSibling);
            };

            function configuratePreviousItemOrder(order, item) {
                item.setAttribute("data-order", order);
                if (item.previousElementSibling)
                    configuratePreviousItemOrder(order - 1, item.previousElementSibling);
            };

            if (evt.item.nextElementSibling) {
                let newOrder = parseInt(evt.item.nextElementSibling.getAttribute("data-order"));
                configurateNextItemOrder(newOrder, evt.item);
            } else if (evt.item.previousElementSibling) {
                let newOrder = parseInt(evt.item.previousElementSibling.getAttribute("data-order"));
                configuratePreviousItemOrder(newOrder, evt.item);
            }

        }

    });

};

// Cancela e desativa o recurso de arrastar e soltar
function desactivateRecordTypeSorting() {
    document.getElementById("recordTypeDataSection").setAttribute("data-sorting", "false");
    loadRecordsTypesDataTable();
};

// Salva a nova ordenação no banco
function saveRecordTypeSorting() {

    let recordTypesOrder = [];
    document.querySelectorAll('#recordsTypesDataTable tbody tr').forEach(function(item) {
        recordTypesOrder.push({ id: item.getAttribute("data-id"), order: item.getAttribute("data-order") })
    });

    let formObj = { record_types_order: recordTypesOrder };

    fetch("http://127.0.0.1:5000/update-record-type-order/", {
        method: "put",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObj)
    }).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            loadAndConfigRecordsTabs();
            desactivateRecordTypeSorting();
            alert(response.body.message);
        } else {
            handleResponseError(response, "editar ordem dos tipos de registro");
        }
    }).catch(error => {    
        console.error(error);
        alert("Erro ao tentar editar ordem dos tipos de registro");
    });

};

/* --------------------------------------------------------------------------------------
  On DOM Content Loaded
  -------------------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function() {

    loadAndConfigRecordsTabs();

    // Cria uma instância do data table para os tipos de registros
    $root.recordsTypesDataTable = new NormalDataTable("recordsTypesDataTable", {
        pageSize: 10,
        searchable: true,
        trAttributes: [
            { attributeName: "data-id", attributeId: "id" },
            { attributeName: "data-order", attributeId: "order" },
        ],
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row, button, event) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(button, row, function(modal, row) {
                        modal.querySelector("#recordTypeId").value = row.id;
                        modal.querySelector("#recordTypeName").value = row.name;
                    });
                },
                attributes: {
                    "data-open-modal": "recordTypeModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este tipo de registro?")) {
                        url = "http://127.0.0.1:5000/delete-record-type/" + row.id
                        deleteData(url, function() {
                            loadRecordsTypesDataTable();
                            loadAndConfigRecordsTabs();
                        });
                    }
                }
            }
        ],
        afterRender: function(data, columns, dataTable) {
            configTooltips();
            document.querySelectorAll("#recordsTypesDataTable tr td:first-child").forEach(function(item) {
                let icon = document.createElement("i");
                icon.className = "fa fa-solid fa-arrows-up-down sort-icon"
                item.prepend(icon);
            });
        }
    });

    // Busca os dados dos tipos de registros no banco
    loadRecordsTypesDataTable();

    // Cria uma instância do data table para os registros
    $root.recordsDataTableByType = new NormalDataTable("recordsDataTableByType", {
        pageSize: 10,
        searchable: true,
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row, button, event) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(button, row, function(modal, row) {
                        modal.querySelector("#recordId").value = row.id;
                        modal.querySelector("#recordDate").value = row.date;
                        modal.querySelector("#recordTime").value = row.time;
                        modal.querySelector("#recordValue").value = row.value;
                    });
                },
                attributes: {
                    "data-open-modal": "recordModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este registro?")) {
                        url = "http://127.0.0.1:5000/delete-record/" + row.id
                        deleteData(url, function() {
                            loadRecordsDataTableByType($root.activeRecordTab);
                        });
                    }
                }
            },
            {
                label: "delete-date",
                className: "delete-date-button",
                onClick: (row) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Essa ação ira excluir todos os registros dessa data")) {
                        if (window.confirm("Você realmente deseja excluir todos os registros desse dia?")) {
                            url = "http://127.0.0.1:5000/delete-records-date/" + row.raw_date
                            deleteData(url, function() {
                                loadRecordsDataTableByType($root.activeRecordTab);
                            });
                        }
                    }
                }
            }
        ],
        afterRender: function() {
            configTooltips();
        }
    });

    // Cria uma instância do data table para os eventos
    $root.eventsDataTable = new NormalDataTable("eventsDataTable", {
        pageSize: 10,
        searchable: true,
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row, button, event) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(button, row, function(modal, row) {
                        modal.querySelector("#eventId").value = row.id;
                        modal.querySelector("#eventDescription").value = row.description;
                        modal.querySelector("#eventDate").value = row.date;
                        modal.querySelector("#eventTime").value = row.time;
                    });
                },
                attributes: {
                    "data-open-modal": "eventModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este evento?")) {
                        url = "http://127.0.0.1:5000/delete-event/" + row.id
                        deleteData(url, function() {
                            loadEventsDataTable();
                        });
                    }
                }
            }
        ],
        afterRender: function() {
            configTooltips();
        }
    });

    // Busca os dados dos eventos no banco
    loadEventsDataTable();

});