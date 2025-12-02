const container = document.getElementById('app-container');
let thresh = 5
container.innerHTML =
    `<div class = "app-container">
        <div class = "ui">
          <div class = "dropdown" id = "params">
              <button>Metrics</button>
              <div class = "content" id = "metric">
                <a>Median Gain (Surface)</a>
                <a>Median Gain (Deep)</a>
                <a>Median Gain (Surface + Deep)</a>
                <a>Float %Sat (Surface)</a>
                <a>Float %Sat (Deep)</a>
                <a>Float %Sat (Surface + Deep)</a>
                <a>Spikiness</a>
              </div>
          </div>
          <form id = 'z_thresh' autocomplete="off" style = "width:250px; display:flex; gap: 4px;">
            <div class="autocomplete" style="flex: 2;">
                <input id="z_input" type="text" placeholder="Z Threshold: ${thresh}" style = "width: 175px; font-size: 14px;">
            </div>
            <input id = "z_submit" type="submit" value = "Filter" style = "flex: 1; width: 75px; margin-bottom: 5px; width: 100px; font-size: 14px; padding: 12px;">
          </form>
          <div id = "reset">
            <button>Reset Selections</button>
          </div>
        </div>
        <div id="map_content"></div>
        <div id="profile_plot_content"></div>
        <div id="timeseries_plot_content"></div>
    </div>`
 
const selected_metric = document.getElementById('metric');
let method = "SURF_GAIN"

get_data(method,thresh)
  .then(input_data => {
    display_map = make_map(input_data)
})


selected_metric.addEventListener("click",function(event){
  refresh();
  if(event.target.textContent == "Median Gain (Surface)"){
    method = "SURF_GAIN"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Median Gain (Deep)"){
    method = "DEEP_GAIN"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Spikiness"){
    method = "SPIKES"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Median Gain (Surface + Deep)"){
    method = "DEEP_SURF_GAIN"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Float %Sat (Surface)"){
    method = "FLT_SURF"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Float %Sat (Deep)"){
    method = "FLT_DEEP"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }

  if(event.target.textContent == "Float %Sat (Surface + Deep)"){
    method = "FLT_SURF_DEEP"
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
  }
})

z_thresh.addEventListener('submit', function(event) {
    //The browser will reload the page by default when a form is submitted. 
    //preventDefault() prevents this behavior.
    event.preventDefault();
    thresh = Number(document.getElementById('z_input').value);
    
    if(Number(document.getElementById('z_input').value)==0){
      thresh = 2;
    }
    refresh();
    get_data(method,thresh)
      .then(input_data => {
        display_map = make_map(input_data)
    })
});
