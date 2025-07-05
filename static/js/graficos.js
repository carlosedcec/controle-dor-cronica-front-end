/* --------------------------------------------------------------------------------------
  Root Configurations
  -------------------------------------------------------------------------------------- */

var $root = {
    chart1: null,
    chart2: null,
    recordTypes: [],
    records: [],
    events: []
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
  Load Data
  -------------------------------------------------------------------------------------- */

// Função de load tipos de registros, faz um get do banco, configura os dados e povoa a variável global
function loadRecordTypes() {

    fetch(
        "http://127.0.0.1:5000/get-record-types"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            $root.recordTypes = response.body.data;
        } else {
            handleResponseError(response, "carregar os registros");
        }
    })
    .catch(error => {
        console.error(error);
    });

};

// Função de load dos registros, faz um get do banco, configura os dados e povoa a variável global
function loadRecordsData() {

    fetch(
        "http://127.0.0.1:5000/get-records"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            $root.records = Object.groupBy(response.body.data, record => record.date);
        } else {
            handleResponseError(response, "carregar os registros");
        }
    }).catch(error => {
        console.error(error)
    });

};

// Função de load dos eventos, faz um get do banco, configura os dados e povoa a variável global
function loadEventsData() {

    fetch(
        "http://127.0.0.1:5000/get-events"
    ).then(response => {
        return response.json().then(json => ({ status: response.status, body: json }));
    }).then(response => {
        if (response.status === 200) {
            $root.events = response.body.data;
        } else {
            handleResponseError(response, "carregar os registros");
        }
    }).catch(error => {
        console.error(error)
    });

};

// Função do Chart 1
function loadChart1(update = false) {

    let range = window.innerWidth > 768 ? 14 : 7;

    // Prepara os dados com base na página e chama a renderização
    function loadChartData(page, update = false) {

        let startIndex = page === 1 ? 0 : range * (page - 1);
        let endIndex = page * range;

        let recordsData = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[1]);
        let recordsDates = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[0]);
        recordsDates = recordsDates.map(date => new Date(date).toLocaleDateString("pt-BR"));

        let series = [];

        $root.recordTypes.forEach(recordType => {
            let serie = { "name": capitalizeFirstLetter(recordType.name), data: [] };
            recordsData.forEach(data => {
                let item = data.filter(item => item.record_type_name === recordType.name)[0];
                item = item && item.average_value ? item.average_value : 0;
                serie.data.push(item);
            });
            series.push(serie);
        });

        if (update)
            updateChart(series, recordsDates);
        else
            renderChart(series, recordsDates);

        configPagesHTML(page);

    };

    function renderChart(series, categories) {

        let chartOptions = {

            chart: {
                height: 500,
                type: 'bar',
                stacked: true,
                zoom: {
                    enabled: true
                },
                redrawOnWindowResize: false
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 10,
                    borderRadiusApplication: 'end', // 'around', 'end'
                    borderRadiusWhenStacked: 'last', // 'all', 'last'
                    dataLabels: {
                        total: {
                            enabled: true,
                            style: {
                                fontSize: '13px',
                                fontWeight: 900
                            }
                        }
                    }
                },
            },
            fill: {
                opacity: 0.6
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }],
            colors: ['#008ffb', '#00e396', '#feb019', '#ff4560', '#775dd0', '#1f836c', '#7a0000', '#f583e1', '#705e5e'],
            title: {
                text: 'Registros - Stacked Columns',
                align: 'left'
            },
            stroke: {
                width: 0,
                dashArray: 0
            },
            legend: {
                tooltipHoverFormatter: function(val, opts) {
                    return val + ' - <strong>' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '</ strong>'
                }
            },
            markers: {
                size: 0,
                hover: {
                    sizeOffset: 6
                }
            },

            series: series,
            xaxis: {
                categories: categories,
            },
            grid: {
                borderColor: '#f1f1f1',
            }
        };

        $root.chart1 = new ApexCharts(document.querySelector("#chart1 .chart-element"), chartOptions);
        $root.chart1.render();

    };

    function updateChart(series, categories) {
        $root.chart1.updateOptions({
            series: series,
            xaxis: {
               categories: categories
            }
        });
    }

    // Configurações de paginação
    let dates = Object.entries($root.records).map(entry => entry[0]);
    let numberOfPages = Math.ceil(dates.length / range);

    function configPagesHTML(currentPage) {
        document.querySelector("#chart1").querySelector(".table-page-info").innerHTML = "Página " + currentPage + " de " + numberOfPages;
        document.querySelector("#chart1").setAttribute("data-current-page", currentPage);
    };

    document.querySelector("#chart1 .previous-page").addEventListener("click", function(event) {
        let currentPage = document.querySelector("#chart1").getAttribute("data-current-page");
        currentPage = --currentPage;
        if (currentPage >= 1)
            loadChartData(currentPage, true);
    });

    document.querySelector("#chart1 .next-page").addEventListener("click", function(event) {
        let currentPage = document.querySelector("#chart1").getAttribute("data-current-page");
        currentPage = ++currentPage;
        if (currentPage <= numberOfPages)
            loadChartData(currentPage, true);
    });

    loadChartData(1, update);

};

function loadChart2(update = false) {

    let range = window.innerWidth > 768 ? 21 : 14;

    // Prepara os dados com base na página e chama a renderização
    function loadChartData(page, update = false) {

        let startIndex = page === 1 ? 0 : range * (page - 1);
        let endIndex = page * range;

        let recordsData = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[1]);
        let recordsDates = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[0]);
        let categories = recordsDates.map(date => new Date(date+"T00:00-03:00").getTime());
        if (endIndex >= Object.keys($root.records).length) {
            let tomorrow = new Date(new Date(recordsDates[recordsDates.length-1]+"T00:00-03:00"));
            tomorrow.setDate(tomorrow.getDate() + 1);
            categories.push(tomorrow.getTime());
        }

        let series = [];

        // Adiciona os valores dos registros
        let registros = ["dor", "fadiga", "sono"];

        registros.forEach(function(registro) {
            let serie = { "name": registro, data: [] };
            recordsData.forEach(data => {
                let item = data.find(item => item.record_type_name === registro);
                item = item && item.average_value ? item.average_value : 0;
                serie.data.push(item);
            });
            series.push(serie);
        });

        // Filtra os eventos de acordo com a página/data e adiciona eles na variável annotations
        let eventsData = $root.events.filter(item => item.date >= recordsDates[0] && item.date <= recordsDates[recordsDates.length-1]);
        let annotations = [];
        eventsData.forEach(function(event, index) {
            annotations.push({
                x: new Date(event.date + "T" + event.time + "-03:00").getTime(),
                strokeDashArray: 0,
                borderColor: '#bbb',
                label: {
                  borderColor: '#bbb',
                  style: {
                    color: '#fff',
                    background: '#bbb',
                    fontSize: "12px",
                  },
                  text: event.description,
                }
            });
        });

        if (update)
            updateChart(series, categories, annotations);
        else
            renderChart(series, categories, annotations);

        configPagesHTML(page);

    };

    function renderChart(series, categories, annotations) {

        let chartOptions = {

            chart: {
                height: 500,
                type: 'line',
                zoom: {
                    enabled: true
                },
                redrawOnWindowResize: false
            },
            fill: {
                opacity: 0.6
            },         
            responsive: [{
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }],
            colors: ['#008ffb', '#00e396', '#feb019', '#ff4560', '#775dd0', '#1f836c', '#7a0000', '#f583e1', '#705e5e'],
            title: {
                text: 'Registros - Progressão e Eventos',
                align: 'left'
            },
            stroke: {
                width: 2,
                curve: 'smooth'
            },
            legend: {
                tooltipHoverFormatter: function(val, opts) {
                    return val + ' - <strong>' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '</ strong>'
                }
            },
            series: series,
            xaxis: {
                categories: categories,
                type: "datetime"
            },
            yaxis: {
                min: 0,
                max: 10
            },
            annotations: {
                xaxis: annotations
            },
            grid: {
                borderColor: '#f1f1f1',
                padding: {
                    right: 30,
                    left: 20
                }
            }

        };

        $root.chart2 = new ApexCharts(document.querySelector("#chart2 .chart-element"), chartOptions);
        $root.chart2.render();

    };

    function updateChart(series, categories, annotations) {
        $root.chart2.updateOptions({
            series: series,
            xaxis: {
               categories: categories
            },
            annotations: {
                xaxis: annotations
            }
        });
    }

    // Configurações de paginação
    let dates = Object.entries($root.records).map(entry => entry[0]);
    let numberOfPages = Math.ceil(dates.length / range);

    function configPagesHTML(currentPage) {
        document.querySelector("#chart2").querySelector(".table-page-info").innerHTML = "Página " + currentPage + " de " + numberOfPages;
        document.querySelector("#chart2").setAttribute("data-current-page", currentPage);
    };

    document.querySelector("#chart2 .previous-page").addEventListener("click", function(event) {
        let currentPage = document.querySelector("#chart2").getAttribute("data-current-page");
        currentPage = --currentPage;
        if (currentPage >= 1)
            loadChartData(currentPage, true);
    });

    document.querySelector("#chart2 .next-page").addEventListener("click", function(event) {
        let currentPage = document.querySelector("#chart2").getAttribute("data-current-page");
        currentPage = ++currentPage;
        if (currentPage <= numberOfPages)
            loadChartData(currentPage, true);
    });

    loadChartData(1, update);

};

/* --------------------------------------------------------------------------------------
  On DOM Content Loaded
  -------------------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function() {

    // Chama as funções que carregam os dados do banco
    loadRecordTypes();
    loadRecordsData();
    loadEventsData();

    // Carrega os graficos depois de um timeout para ter certeza que os dados do banco foram carregados
    setTimeout(function() {
        loadChart1();
        loadChart2();
    }, 400);

    // Função para recarregar e reconfigurar os gráficos no resize da tela (responsividade)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            loadChart1(true);
            loadChart2(true);
        }, 200);
    });

});