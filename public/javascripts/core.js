function setUp(){
  var dropContainer = document.getElementById("files");
  dropContainer.addEventListener("drop",dropHandler,false);
  dropContainer.addEventListener("dragenter", function(event){event.stopPropagation();event.preventDefault();}, false);
  dropContainer.addEventListener("dragover", function(event){event.stopPropagation();event.preventDefault();}, false);
  dropContainer.addEventListener("drop", dropHandler, false);
}
function dropHandler(event){
  var files = event.dataTransfer.files;
  var count = files.length;
  form = new FormData();
  for(var i= 0;i<count;i++){
    form.append("file"+i+new Date().getTime(), files[i]);
  }
  sendData();
}
function sendData(){
  var xhr = new XMLHttpRequest();  
  xhr.upload.addEventListener("progress", uploadProgress, false);  
  xhr.addEventListener("load", uploadComplete, false);
  xhr.addEventListener("error", uploadFailed, false);  
  xhr.open("POST", "/graph", true);
  xhr.send(form);
  //var progressBar = document.getElementById('progressBar');
  //progressBar.style.display = 'block';
  //progressBar.style.width = '0px';
}

function uploadComplete(evt) {
  var json = $.parseJSON(this.responseText);
  options.series = json.series;
  options.yAxis.max = json.maxTime;
  chart = new Highcharts.Chart(options); 
}

function uploadFailed(evt) {
  console.log('failed');
}

function uploadProgress(evt) {
  console.log('progress');
}

var chart;
var options;
$(function init() {
  setUp();
  
  options = {
      chart: {
         animation: false,
         renderTo: 'graph', 
         defaultSeriesType: 'scatter',
         zoomType: 'xy',
         height: 700
      },
      title: {
         text: 'Response Time Graph'
      },
      subtitle: {
         text: 'from JMeter'
      },
      xAxis: {
         title: {
            enabled: true,
            text: 'Time (s)'
         },
         startOnTick: true,
         endOnTick: true,
         showLastLabel: true
      },
      yAxis: {
         title: {
            text: 'Response Time (ms)'
         },
         max: 2000
      },
      tooltip: {
         formatter: function() {
                   return 'at '+
               this.x +', '+ this.y +' ms';
         }
      },
      legend: {
         layout: 'vertical',
         align: 'left',
         verticalAlign: 'top',
         x: 100,
         y: 70,
         floating: true,
         backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
         borderWidth: 1
      },
      plotOptions: {
         scatter: {
            marker: {
               radius: 1,
               states: {
                  hover: {
                     enabled: true,
                     lineColor: 'rgb(100,100,100)'
                  }
               }
            },
            states: {
               hover: {
                  marker: {
                     enabled: false
                  }
               }
            }
         }
      }
   };
});