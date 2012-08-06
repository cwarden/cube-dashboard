Dashboard.prototype.customSetup = function() {
  // #dashboard
  // var chart = d3.select(this.selector).attr("class", "chart");
  // chart.selectAll("div")
  //   .data(data)
  //   .enter().append("div")
  //   .style("width", function(d) { return d * 10 + "px"; })
  //   .text(function(d) { return d; });

  var step = +cubism.option("step", 1e4);
  var context = cubism.context()
    .step(step)
    .size(window.innerWidth - 4);
  
  this.cube = context.cube(this.host);
  console.log("klass: " + this.options.klass);
  console.log("cube: " + this.cube);
  j = this.cube.metric("sum(api_w_content)");
  console.log(j);
  var metric = this.options.metrics[0]
  console.log(metric);

  var chart = d3.select("#dashboard").attr("class", "chart");
  this.fetchValues(metric.expression, chart);

//   var data = [4, 8, 15, 16, 23, 42];

// // var chart = d3.select("body").append("div").attr("class", "chart");

// chart.selectAll("div")
//   .data(data)
//   .enter().append("div")
//   .style("width", function(d) { return d * 10 + "px"; })
//   .text(function(d) { return d; });
}

Dashboard.prototype.fetchValues = function(expression, chart) {
  console.log(expression);
  console.log(chart);
  var self = this;

  var getArray = function(index, expression, start, stop) {
    var format = d3.time.format.iso;
    var url = self.host+'/1.0/metric?expression='+expression+'&start='+format(start)+'&stop='+format(stop)+'&step=3600000&cachebuster='+ (+new Date());

    d3.json(url, function(response) {
      console.log(response);
      var val = [];
      for (var i = 0, c = response.length; i < c; i++) {
        val.push(response[i].value);
      }
      console.log(val)
      var el = d3.selectAll('#dashboard').selectAll("div")
        .data(val)
        .enter().append("div")
        .style("width", function(d) {return d*10 + "px";});
    });
  };

  var start = d3.time.day.floor(new Date());
  var stop = d3.time.day.offset(start, 1);
  var metrics = self.options.metrics;

  for (var i = 0, c = metrics.length; i < c; i++) {
    var metric = metrics[i];
    var expression = metric.expression.toString();
    getArray(i, expression, start, stop);
  }

  // setTimeout(function() { self.fetchValues (); }, 60*1000);
  // self.fetchValues(expression)
};
