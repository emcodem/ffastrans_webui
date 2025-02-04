/**
 * jobchart fires up a dhx8 window and loads chart.js with the supplied jobarray
 * @param {*} jobs serialized data from dhx8 grid, array of jobs 
 */

import '../../../dependencies/chartjs/3.5.1/chart.min.js'
import '../../../dependencies/chartjs/3.5.1/chartjs-adapter-date-fns.bundle.min.js';

export  function doTheMagic(getJobsFunc) {

  console.log("Starting Chart Window.");
  chartWindow(getJobsFunc);
}

function dynamicColors() {
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);
  return "rgba(" + r + "," + g + "," + b + ", 0.5)";
}

async function chartWindow(getJobsFunc){
    let jobs = getJobsFunc();
    /* dhx window */
    const dhxWindow = new dhx8.dhx.Window({
      node: document.body,
      viewportOverflow:true,
      width: window.innerWidth-20,
      height: window.innerHeight-20,
      title: "Jobs Chart",
      modal: false,
      closable: true,
      movable: true,
      resizable:true,
      css:"custom_window_small_borders"
    });
    dhxWindow.header.data.add({ icon: "mdi mdi-fullscreen", id: "fullscreen" }, 2);
    dhxWindow.header.data.add({ icon: "mdi mdi-refresh", id: "refresh" }, 1);
    var isFullScreen = false;
    dhxWindow.header.events.on("click", function (id) {
        if (id === "fullscreen") {
            if (isFullScreen) {
                isFullScreen = false;
                dhxWindow.unsetFullScreen();
            } else {
                isFullScreen = true;
                dhxWindow.setFullScreen();
            }
        }
        if(id=="refresh"){
          renderJobs(getJobsFunc())
        }
    });

    
    dhxWindow.attachHTML('<canvas id="myChart" width="100%" height="100%" />');
    dhxWindow.show();
    await dhx8.dhx.awaitRedraw();
    renderJobs(getJobsFunc())
    /* chart.js, remember, they really love arrays but the array can be generated by function 
      also, once you defined the labels, everything else can be dynamically generated from function, e.g. for each label, the function will be called.
    ... */
   function renderJobs(jobs){
      var ctx = document.getElementById('myChart').getContext('2d');
      let chartLabels = []
      let chartdatataset = []
      let startDates = []
      let endDates = []
      let firstStart;
      let lastEnd;
      jobs.map(j=>{
          chartLabels.push(j.workflow)
          startDates.push(new Date(j.job_start))
          endDates.push(new Date(j.job_end))
          chartdatataset.push(
            [new Date(j.job_start),new Date(j.job_end), {job:j}] //"floating bars" in chartjs terms
          )
      })

      //determine start and end of chart
      firstStart = Math.min(...startDates);
      lastEnd    = Math.max(...endDates);

      //we cannot use css variables for chart.js styles, retrieve current main font color
      const computedStyles = getComputedStyle(document.body);
      const currentFontColor = computedStyles.getPropertyValue('--dhx-font-color-primary').trim();

      //the chart itself
      if (window.chartObj) {
        window.chartObj.destroy();
      }
      window.chartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets:  [
            {
              backgroundColor:dynamicColors,
              data: chartdatataset,
            }
        ]
        },
                
        options: {
            responsive: true,
            maintainAspectRatio: false, //prevent drawing larger than page
            indexAxis: 'y',
            plugins: {
            legend: {
                display: false,
                position: 'top',
            },
            tooltip: {
                        callbacks: {
                            label: function(context) {
                              let job = context.dataset.data[context.dataIndex][2].job;
                              console.log(job)
                              return [job.workflow ,
                                        "Source: " + job.source,
                                        "Start: " + job.job_start, 
                                        "End: " +job.job_end,
                                        "Duration: " +job.duration
                              ]
                            }
                        }}
            
            },

            scales: {
              y: {
                  stacked: false,
                  ticks: {color: currentFontColor}
              },
              x: {
                  type: 'time',
                  ticks: {color: currentFontColor},
                  time: {
                    tooltipFormat: 'yyyy-MM-DD HH:mm',
                    displayFormats: {
                      millisecond: 'HH:mm:ss.SSS',
                      second: 'HH:mm:ss',
                      minute: 'HH:mm',
                      hour: 'MM/dd HH:mm'
                  }
                  
                  },
                  min: firstStart,
                  max: lastEnd
              }
            }
        }
    });
  }
}
  