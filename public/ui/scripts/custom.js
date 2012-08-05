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

  this.fetchValues(expression);

  var data = [4, 8, 15, 16, 23, 42];

// var chart = d3.select("body").append("div").attr("class", "chart");
  var chart = d3.select("#dashboard").attr("class", "chart");

chart.selectAll("div")
  .data(data)
  .enter().append("div")
  .style("width", function(d) { return d * 10 + "px"; })
  .text(function(d) { return d; });
}

Dashboard.prototype.fetchValues = function(expression) {
  var self = this;

  var getArray = function(index, expression, start, stop) {
    var format = d3.time.format.iso;
    var url = self.host+'/1.0/metric?expression='+expression+'&start='+format(start)+'&stop='+format(stop)+'&step=3600000&cachebuster='+ (+new Date());
    
    d3.json(url, function(response) {
      var val = 0;
      for (var i = 0, c = response.length; i < c; i++) {
        var res = response[i];
        val += res.value;
      }
      var el = d3.selectAll('.horizon .title .totals')[0][index];
      el.innerHTML = val;
    });
  };

  var start = d3.time.day.floor(new Date());
  var stop = d3.time.day.offset(start, 1);
  var expression = "sum(api_w_content)";
  // for (var i = 0, c = self.metrics.length; i < c; i++) {
  //   var metric = self.metrics[i];
  //   var expression = metric.expression.toString();
  //   getValues(i, expression, start, stop);
  // }

  // setTimeout(function() { self.fetchValues (); }, 60*1000);
  // self.fetchValues(expression)
};
