// convert the data array to a data object
const arrayToObject = function () {
  var obj = {};
  for (var i = 0; i < incomeData.length; i++) {
    var ID = incomeData[i].GEOID;
    obj[ID] = incomeData[i];
  }
  return obj;
};

// Some variables/constants for the app
const incomes = arrayToObject();
const keys = incomeData.keys(incomes);
var defaultIncome = "HH_TOTAL";

//set color fill values for the choropleth map based on income values
var colorValue = function (incomes) {
  if (incomes[defaultIncome] <= 1) {
    return "#696969";
  } else if (incomes[defaultIncome] <= 20000) {
    return "#d9f0a3";
  } else if (incomes[defaultIncome] <= 40000) {
    return "#addd8e";
  } else if (incomes[defaultIncome] <= 90000) {
    return "#78c679";
  } else if (incomes[defaultIncome] <= 140000) {
    return "#37a354";
  } else {
    return "#006837";
  }
};

// I call it a chart but it's the bar that provides income comparison
var updateChart = function (d) {
  var id = d.properties.GEOID;
  var county = incomes[id].COUNTY;
  var income = incomes[id][defaultIncome];
  var maxIncome = 175000;
  var barWidth = income / maxIncome * 100;
  console.log(income, barWidth);
  $(".name").html("Selected County" + ": " + county);
  $(".bar1")
    .css({
      width: barWidth + "%",
      "background-color": "#37a354"
    })
    .attr({
      "aria-valuenow": barWidth
    })
    .html("$" + "&nbsp" + income + "&nbsp");
};

// this is where the dropdown retrieves different values from to change the choropleth based on selected race
var createDropdown = function (divId) {
  d3.select(divId).on("change", function () {
    var selected = d3.select(divId)._groups[0][0].value;
    defaultIncome = selected;
    var s = d3.select("#map").selectAll("svg");
    s = s.remove();
    newMap("#map", width, height);
    //set some values inside this function to update the bar; dropdown is now working. 
    var income = incomeData[0][selected];
    var maxIncome = 175000;
    var barWidth = income / maxIncome * 100;
    //now that you have the values that you need, use jQuery to update the bar
    $(".bar0")
      .css({
        width: barWidth + "%",
        "background-color": "green",
      })
      .attr({
        "aria-valuenow": barWidth,
      })
      .html("$" + "&nbsp" + income + "&nbsp");
  });
};

// map vars
var svg
const width = 600;
const height = 600;
const counties = topojson.feature(ohtopo, ohtopo.objects.counties).features;

// I'm adjusting the projection here to move the center of the map to the geographic center of Ohio. I've also scaled way up. I'm not sure this is the best way to present this map, but it was the only way I could find to make this particular topojson render on the screen properly.
const projection = d3
  .geoAlbers()
  .center([0, 40.4173])
  .rotate([82.9071, 0])
  .parallels([41, 44])
  .translate([width / 2, height / 2])
  .scale(9000);

// creates new map, requires div id, width, height
var newMap = function (divId, w, h) {
  svg = d3
    .select(divId)
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var path = d3.geoPath(projection),
    mesh = topojson.mesh(ohtopo),
    transform = topojson.transform(ohtopo);

  svg
    .append("g")
    .selectAll("path")
    .data(counties)
    .enter()
    .append("path")
    .attr("class", "counties")
    .attr("fill", function (d) {
      var inc = incomes[d.properties.GEOID];
      return colorValue(inc);
    })
    .attr("d", path)
    .on("click", function (d) {
      updateChart(d);
    });

  svg
    .append("path")
    .datum(topojson.mesh(ohtopo, ohtopo.objects.counties, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-linejoin", "round")
    .attr("d", path);
};

// use debounce to limit calls for resize function
var debounce = function (func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

var resize = debounce(function () {
  var w = parseInt(d3.select("#map").style("width"));
  var scale = w / width;
  var h = height * scale;
  var xo = (width - w) / -2;
  var yo = (height - h) / -2;
  svg.attr(
    "transform",
    "translate(" + xo + "," + yo + ") scale(" + scale + ")"
  );
  $("#map").css({
    height: h + "px"
  });
}, 80);

// call resize when window changes
d3.select(window).on("resize", resize);

createDropdown("#race");

// call resize function
newMap("#map", width, height);

resize();