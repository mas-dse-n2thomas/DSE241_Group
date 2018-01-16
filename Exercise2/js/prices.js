var g_parseDate = d3.timeParse("%Y");
var g_formatTime = d3.timeFormat("%Y");
var g_div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function filterJSON(json, key, value) {
  var result = [];
  json.forEach(function(val, idx, arr) {
    if (val[key] == value) {

      result.push(val);
    }
  })
  return result;
}
startup();

var g_olympics_data;

function startup() {
  d3.csv("/data/MWX.csv", function(data) {
    // generate initial graph
    data.forEach(function(d) {
      d.Year = g_parseDate(d.Year);
    });
    g_olympics_data = data;
    d3.select('#inds')
      .on("change", function() {
        var sect = document.getElementById("inds");
        var section = sect.options[sect.selectedIndex].value;
        data = g_olympics_data;
        if (section.length > 0) {
          data = filterJSON(data, 'Gender', section);
        }
        data.forEach(function(d) {
          d.value = +d.value;
          //d.Year = parseDate(String(d.Year));
          d.active = true;
        });
        //debugger
        updateGraph(data);
        jQuery('h1.page-header').html(section);
      });

    //data = filterJSON(json, 'Gender', 'M');
    updateGraph(data);
  });
}

function updateGraph(data) {

  d3.select("svg").remove().exit()

  var gby = _.groupBy(data, 'Gender');
  var colors = d3.scaleOrdinal(d3.schemeCategory20);

  var height = 300;
  var width = 500;
  //define the extremes
  var max = 150;
  //d3.max(data, function(d){ return d.Counts;});
  var minDate = d3.min(data, function(d) {
    return d.Year;
  });
  var maxDate = d3.max(data, function(d) {
    return d.Year;
  });
  // define x and y scales
  var y = d3.scaleLinear()
    .domain([0, max])
    .range([height, 0]);

  var x = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width]);
  //declare x and y axis generators
  var yAxis = d3.axisLeft(y);
  var xAxis = d3.axisBottom(x)
    .tickFormat(d3.timeFormat("%Y"));;

    var margin = {
      left: 50,
      right: 50,
      top: 40,
      bottom: 0
    };

  var svg = d3.select("body").append("svg").attr("height", "100%").attr("width", "100%");

  //now add all elements into a group
  var chartGroup = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  chartGroup.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + height + ")")
    .call(xAxis.ticks(d3.timeYear, 4))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function(d) {
      return "rotate(-65)"
    });
  chartGroup.append("g").attr("class", "y axis").call(yAxis);

  // gridlines in x axis function
  function make_x_gridlines() {
    return d3.axisBottom(x).ticks(d3.timeYear, 4)
  };




  // add the X gridlines
  chartGroup.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height + ")")
    .call(make_x_gridlines()
      .tickSize(-height)
      .tickFormat("")
    );
  // gridlines in y axis function
  function make_y_gridlines() {
    return d3.axisLeft(y)
  };

  // add the Y gridlines
  chartGroup.append("g")
    .attr("class", "grid")
    .call(make_y_gridlines()
      .tickSize(-width)
      .tickFormat("")
    );
  // text label for the x axis
  chartGroup.append("text")
    .attr("class", "x-label")
    .attr("transform",
      "translate(" + (width / 2) + " ," +
      (height + margin.top + 20) + ")")
    //.style("text-anchor", "middle")
    .text("Year");

  // text label for the y axis
  chartGroup.append("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    //.style("text-anchor", "middle")
    .text("Medal Count");

  var svg = d3.select("svg");

  var i = 0;
  // There weren't Olympic games in 1940 and 1944

  for (var group in gby) {
    var groupdata = gby[group];

    var ymax = _.max(groupdata, _.property('Counts')).Counts

    //groupdata = groupdata.concat(missing_years);

    var medalsLine = d3.line()
      .defined(d => d.y !== null)
      .x(d => x(d.Year))
      .y(d => y(d.Counts));

    chartGroup.append("path")
      .attr("class", "graph.path")
      .attr("d", medalsLine(groupdata))
      .attr("fill", "none")
      .attr("stroke", colors(i))
      .attr("stroke-width", 2);

    chartGroup.selectAll("circle." + group)
      .data(groupdata)
      .enter()
      .append("circle")
      .attr("class", "graph.circle")
      .attr("r", 5)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Counts))
      .style("fill", colors(i))
      .on("mouseover", function(d) {
        g_div.transition()
          .duration(200)
          .style("opacity", .9);
        g_div.html("Year: " + g_formatTime(d.Year) + "<br/>Medals: " + d.Counts)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        g_div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    chartGroup.append("text")
      .attr("id", "graph.label")
      .attr("transform", "translate(" + (width + 3) + "," + y(ymax) + ")")
      .attr("dy", ".35em")
      .attr("text-anchor", "start")
      .style("fill", colors(i))
      .text(group);




    i = i + 1;

  }

}
