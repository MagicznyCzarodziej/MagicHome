const DATE_RANGE = 24 * 60 * 60 * 1000;
const UPDATE_TIME = 60 * 1000;
const API_IP = 'http://' + Cookies.get('API') + ':3000';
const TEMP_ID = window.location.search.substring(1);

let data = [];

// Get period beggining date/time
function getXMin() {
  let now = new Date().getTime();
  return now - DATE_RANGE;
}

// Get minimal temperature in given period
function getYMin() {
  let min = 99;
  let minDate = getXMin();
  for (let i = data.length-1; i > 0; i--){
    let time = data[i][0];
    if(time <= minDate) break;
    if(data[i][1] < min) min = data[i][1];
  }
  return min;
}

// Get maximal temperature in given period
function getYMax() {
  let max = -99;
  let minDate = getXMin();
  for(let i = data.length-1; i > 0; i--){
    let time = data[i][0];
    if(time <= minDate) break;
    if(data[i][1] > max) max = data[i][1];
  }
  return max;
}

// Chart oprions
let options = {
  series:{
    curvedLines:{
      apply: true,
      active: true,
      monotonicFit: true
    }
  },
  lines:{
      fill: 0.6,
      steps: false
  },
  xaxis:{
    mode: 'time',
    timezone: 'browser',
    timeformat: '%H:%M',
    tickSize: [2, 'hour'],
    tickColor: '#32383E',
    font: {color: '#aab5bd', size: 20}
  },
  yaxis:{
    tickSize: 1,
    tickDecimals: 1,
    tickColor: '#32383E',
    font: {color: '#aab5bd', size: 20}
  },
  selection: {
    mode: 'x'
  },
  crosshair: {
    mode: 'x'
  },
  grid:{
    backgroundColor: '#272b30',
    hoverable: true,
    labelMargin: 10
  },
  colors: ['#1977c3']//2ecc71
};

function getDataFromServer() {
  $.ajax({
    url: `${API_IP}/temps/${TEMP_ID}`,
    type: 'GET',
    async: false,
    success: function (temp) {
      if(temp[0] != data[data.length-1][0]) data.push(temp);
    },
    error: function (error) {
      console.error(error.responseText);
    }
  });
}

function updateChart() {
  getDataFromServer();

  $('#temp').html(data[data.length-1][1] + '&#176;C'); // Update temp next to thermometer's name

  options.yaxis.min = getYMin() - 0.3;
  options.xaxis.min = getXMin();
  plot = $.plot($('#chart'), [data], options);
  setTimeout(updateChart, UPDATE_TIME);
}

function refreshLastUpdateTime() {
    let lastUpdateTime = data[data.length-1][0] / 1000;
    let now = new Date().getTime() / 1000;
    let ago = parseInt(now - lastUpdateTime);
    let text = '';

    let minutes = Math.floor(ago / 60);
    if(minutes > 0) text = minutes + 'min. ';

    let seconds = ago - minutes * 60;
    if(seconds > 0) text += seconds + 's. ';

    $('#last-update').html(`Ostatni pomiar ${text} temu.`);
}

$(function() {
  $.ajax({
    url: `${API_IP}/temps/data/${TEMP_ID}`,
    async: false,
    success: function (res) {
      let name = res.description;
      data = res.temps;
      let lastTemp = data[data.length-1][1];

      $('#chart-name').html(name);
      $('#temp').html(lastTemp + '&#176;C');

      updateChart();
      refreshLastUpdateTime();
      setInterval(refreshLastUpdateTime, 5000);
    },
    error: function (error) {
      $('#chart-name').html('Nieprawidlowe ID');
      console.error(error.responseText);
    }
  });

  //Zooming
  $('#chart').bind('plotselected', function (event, ranges) {
    $.each(plot.getXAxes(), function(_, axis) {
      var opts = axis.options;
      opts.min = ranges.xaxis.from;
      opts.max = ranges.xaxis.to;
    });
    plot.setupGrid();
    plot.draw();
    plot.clearSelection();
  });

  //Hovering
  $('#chart').bind('plothover', function (event, pos, item) {
    if(item){
      let y = item.datapoint[1].toFixed(1);
      $('#hovered-temp').html(y + '&#176;C').css({top: item.pageY-10});
    }else{
      $('#hovered-temp').html('');
    }
  });

});
