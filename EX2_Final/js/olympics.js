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
  });
  return result;
}

d3.selectAll("#groupby").on("change",groupbySelection);

d3.selectAll("#havingField").on("change",havingField);
d3.selectAll("#dataPoints").on("change",dataPoints) ;

function havingField() {
  updateGraph(g_olympics_data);
}
function dataPoints() {
  //console.log("dataPoints") ;
  updateGraph(g_olympics_data);
}

// EVENTUALLY THIS SHOULD BE CHANGED
var g_groupby = ["Gender"];

function groupbySelection(){
        //console.log("groupbySelection")

       updateGraph(g_olympics_data);
      }

startup();

var g_olympics_data;
var g_sports_list = [];
var g_medal_list = [];
var g_country_list = [];
var g_gender_list = [];

function startup() {
  d3.csv("/data/olympics.csv", function(data) {
    // generate initial graph
    data.forEach(function(d) {
      d.YYYY = d.Year ;
      d.Year = g_parseDate(d.Year);
    });
    g_olympics_data = data;
    g_olympics_data.forEach(function(d) {
         g_sports_list.push(d.Sport);
    });
    g_sports_list = ["All"].concat(_.uniq(g_sports_list));
    g_olympics_data.forEach(function(d) {
         g_country_list.push(d.Country);
    });
    g_country_list = ["All"].concat(_.uniq(g_country_list));
    g_olympics_data.forEach(function(d) {
         g_medal_list.push(d.Medal);
    });
    g_medal_list = ["All"].concat(_.uniq(g_medal_list));
    g_olympics_data.forEach(function(d) {
         g_gender_list.push(d.Gender);
    });
    g_gender_list = ["All"].concat(_.uniq(g_gender_list));

    d3.select("#medalDropdown")
        .selectAll("option")
        .data(g_medal_list).enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    d3.selectAll("#sportDropdown")
        .selectAll("option")
        .data(g_sports_list).enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    d3.selectAll("#countryDropdown")
        .selectAll("option")
        .data(g_country_list).enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

        d3.select("#countryDropdown").on("change", function() { console.log("countryDropdown"); updateGraph(g_olympics_data) ; });
        d3.select("#sportDropdown").on("change", function() { console.log("sportDropdown"); updateGraph(g_olympics_data) ; });
        d3.select("#medalDropdown").on("change", function() { console.log("medalDropdown"); updateGraph(g_olympics_data) ; }) ;
        d3.select('#countryDropdown').property('value', 'All');
        d3.select('#sportDropdown').property('value', 'All');
        d3.select('#medalDropdown').property('value', 'All');
        d3.select("#inds").on("change", function() {
            //console.log("#ind gender");
            updateGraph(data);
          });
    updateGraph(data);
  });
}

function updateGraph(data) {

  var data = data ;
  d3.select("svg").remove().exit();

  var data_points_only = d3.select("#dataPoints").property("checked");

   // 1) Filtering
   var where_gender = $('#inds').val().filter(function(e) { return e != "All" ; });
   var where_sport = $('#sportDropdown').val().filter(function(e) { return e != "All" ; });
   var where_country = $('#countryDropdown').val().filter(function(e) { return e != "All" ; });
   var where_medal = $('#medalDropdown').val().filter(function(e) { return e != "All" ; });
   if (where_medal.length > 0) {
    data = _.filter(data,function(d){
       return _.indexOf(where_medal,d.Medal) >= 0 ;
    });
   }

   if (where_gender.length > 0) {
     data = _.filter(data,function(d){
        return _.indexOf(where_gender,d.Gender) >= 0 ;
     });
   }
   if (where_sport.length > 0) {
     data = _.filter(data,function(d){
        return _.indexOf(where_sport,d.Sport) >= 0 ;
     });
   }
   if (where_country.length > 0) {
     data = _.filter(data,function(d){
        return _.indexOf(where_country,d.Country) >= 0 ;
     });
   }
   var having = $('#havingField').val();
   var group_by_clause = $('#groupby').val();
   if (typeof having != undefined & having.length > 0 ) {
     having = " HAVING count(*) > " + having;
   }

   var gby = alasql("SELECT count(*) Counts, Year," + group_by_clause + " FROM ? GROUP BY Year," + group_by_clause + having + " ORDER BY Year", [data]);

   gby = _.groupBy(gby, group_by_clause);

     //find the max y
  var ymax = 0;
  var yMax = 0;
  for (var g in gby) {
    var grpdata = gby[g];
    ymax = _.max(grpdata, _.property('Counts')).Counts
    if (ymax > yMax)
    {
      yMax = ymax;
    }
    //console.log(yMax)
  };

// combine 20 and 20b and 20c color scales to get a scale of 60 colors
//45 colors are needed to cover all countries in legend
  var c1 = d3.schemeCategory20;
  var c2 = d3.schemeCategory20b;
  var c3 = d3.schemeCategory20c;
  var newcolorscale = c1.concat(c2).concat(c3);
  // console.log("c1", c1);
  // console.log("c2", c2);
  // console.log("new", newcolorscale);
  var colors = d3.scaleOrdinal(newcolorscale);

  var margin = { left: 100, right: 50, top: 40, bottom: 0 };
  var width = 950 - margin.left - margin.right;
  var height = 440 - margin.top - margin.bottom;

  //define the extremes
  var max = 10* Math.ceil(yMax/10);
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
    .tickFormat(d3.timeFormat("%Y"));



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
      return "rotate(-65)";
    });
  chartGroup.append("g").attr("class", "y axis").call(yAxis);

  // gridlines in x axis function
  function make_x_gridlines() {
    return d3.axisBottom(x).ticks(d3.timeYear, 4);
  }


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
    return d3.axisLeft(y);
  }

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
    .attr("y", 0 - margin.left + 40)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    //.style("text-anchor", "middle")
    .text("Medal Count");

  var i = 0;
  // There weren't Olympic games in 1940 and 1944
  var label = chartGroup.append("text")
      .attr("class", "year label")
      .attr("text-anchor", "end")
      .attr("y", 185)
      .attr("x", -50)
      .text("WWII ~ Cancelled 1940 & 1944")
      .attr("transform", "rotate(-90)");
      
  for (var group in gby) {
    var groupdata = gby[group];

    var ymax = _.max(groupdata, _.property("Counts")).Counts

    //groupdata = groupdata.concat(missing_years);

    var medalsLine = d3.line()
      .defined(d => d.y !== null)
      .x(d => x(d.Year))
      .y(d => y(d.Counts));

    if ( !data_points_only ) {
        chartGroup.append("path")
          .attr("class", "graph.path")
          .attr("d", medalsLine(groupdata))
          .attr("fill", "none")
          .attr("stroke", colors(i))
          .attr("stroke-width", 2);
    }

    chartGroup.selectAll("circle." + group)
      .data(groupdata)
      .enter()
      .append("circle")
      .attr("class", "graph.circle")
      .attr("r", 4)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Counts))
      .style("fill", colors(i))
      .on("mouseover", function(d) {
        //onsole.log(d);
        g_div.transition()
          .duration(200)
          .style("opacity", 0.9);
        g_div.html("Year: " + g_formatTime(d.Year) + "<br/>" + d[group_by_clause] + ": " + d.Counts)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        g_div.transition()
          .duration(500)
          .style("opacity", 0);
      });

	  //legend text
      chartGroup.append("text")
        .attr("id", "graph.label")
        .attr("x", ".35em")
        .attr("transform", "translate(" + ((190)* Math.floor(i/26) + (width + 40)) + "," + (height-15 - (i%26)*15) + ")")
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", colors(i))
        .text(group);
        //legend circle
      chartGroup.append("circle")
      .attr("cy", function (d,i){ return i * 30;})
      .attr("transform", "translate(" + ((190)* Math.floor(i/26) + (width + 35)) + "," + (height- 15 - (i%26)*15) + ")")
      .attr("r", 4)
      .style("fill", colors(i));

     i = i + 1;

  }

}
