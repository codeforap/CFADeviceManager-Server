function render_vis() {
  var width, height, svg_width, projection_scale_factor, projection_translate_factor,
      svg, regions, projection, path, name_arc_path, centered, cutoff_ratio = 10/100,
      region_wise_data, region_overlays, lt_cutoff_list, gt_cutoff_list, min_lt_ratio = 0,
      max_lt_ratio = 1, min_gt_ratio = 0, max_gt_ratio = 1, tab_count = 0, active_count = 0,
      inactive_count = 0, unknown_count = 0, lt_brightness_scale, gt_brightness_scale;

  if( window.innerWidth < 1900 ) {
    svg_width = window.innerWidth-20;
    width = svg_width - window.innerWidth*(30/100);
    height = width*0.8;
    projection_scale_factor = 5.7;
    projection_translate_factor = 4.9;
  } else {
    width = window.innerWidth*(50/100);
    height = width*0.9;
    svg_width = window.innerWidth*(60/100);
    projection_scale_factor = 6.4;
    projection_translate_factor = 5.8;
  }
  document.getElementById("screen_size").innerHTML = screen.height + "x" + screen.width;
 
  function draw_region_overlay_arc(p0, p1) {
    var mid = perpendicular_offset_point(p0, p1);
    regions.append("path")
      .datum([p0, mid, p1])
      .attr("class", "name_arc")
      .attr("d", region_overlay_arc)
      .transition()
      .duration(2000)
      .attrTween("stroke-dasharray", function() {
        var len = this.getTotalLength();
        return function(t) { return (d3.interpolateString("0," + len, len + ",0"))(t) };
      });
  }

  function draw_overlays(overlays_selection) {
    overlays_selection.append("text")
      .text(function(d) {
        if( svg_width < 1000 ) {
          return d.name[0];
        } else {
          return d.name;
        }
      })
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", function(d) { return d.anchor; });

    overlays_selection.append("text")
      .text(function(d) {
        return (d.data.inactive_ratio*100).toFixed(2) + "% Inactive";
      })
      .attr("x", 0)
      .attr("y", 20)
      .attr("text-anchor", function(d) { return d.anchor; });

    overlays_selection.append("text")
      .text(function(d) {
        return "Active: " + d.data.active;
      })
      .attr("x", 0)
      .attr("y", 40)
      .attr("text-anchor", function(d) { return d.anchor; });

    overlays_selection.append("text")
      .text(function(d) {
        return "Inactive: " + d.data.inactive;
      })
      .attr("x", 0)
      .attr("y", 60)
      .attr("text-anchor", function(d) { return d.anchor; });

    overlays_selection.append("text")
      .text(function(d) {
        return "Total: " + d.data.total;
      })
      .attr("x", 0)
      .attr("y", 80)
      .attr("text-anchor", function(d) { return d.anchor; });
  }

  function draw_cutoff_selector(regions_selector) {
    var tabCutOffCount = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    var cutOffMargin = svg_width - (window.innerWidth < 1200 ? 150 : 75);

    var cutOff = regions_selector.selectAll("g.cutOff")
      .data(tabCutOffCount)
      .enter()
      .append("g")
      .attr("id", function(d){ return "cut_off_" + d; })
      .attr("class", "cutOff")
      .attr("transform", function(d) {
        return "translate("+ (cutOffMargin)  +" , " + ( d*8 ) + ")";
      })
      .on("click", function(d){
        d3.selectAll("g.cutOff rect")
          .style("fill","#C0C0C0")
          .attr("class","cutOffRect");

        d3.selectAll("g.cutOff text")
          .style("fill","blue");

        d3.select(this)
          .select("rect")
          .attr("class","active")
          .style("fill","#36454F");

        d3.select(this)
          .select("text")
          .style("fill","white");

        cutoff_ratio = d/100;
        update_regions_shading();
      });

    var button = cutOff.append("rect")
      .attr("width", 60)
      .attr("height", 34)
      .attr("class","cutOffRect")
      .style("fill","#C0C0C0");
    
    cutOff.append("text")
      .text(function(d){
        return d+"%";
      })
      .attr("x", 20)
      .attr("y", 20)
      .style("fill","blue");
  }

  function select_cutOff_selector(cutoff_value) {
    d3.selectAll("g.cutOff rect")
      .style("fill","#C0C0C0")
      .attr("class","cutOffRect");

    d3.selectAll("g.cutOff text")
      .style("fill","blue");

    d3.select("g#cut_off_" + cutoff_value)
      .select("rect")
      .attr("class","active")
      .style("fill","#36454F");

    d3.select("g#cut_off_" + cutoff_value)
      .select("text")
      .style("fill","white");
  }

  function update_regions_shading() {
    regions.selectAll("path.region")
      .style("fill", function(d,i){
        var this_region = _.find(region_wise_data, function(r){
          return r.name.toUpperCase() == d.properties.DNAME.toUpperCase();
        });
        if( this_region.data.inactive_ratio < cutoff_ratio ) {
          return d3.rgb(0,128,0).brighter(
	    gt_brightness_scale(this_region.data.inactive_ratio)
	  ).toString();
        } else {
          return d3.rgb(128,128,128).brighter(
	    gt_brightness_scale(this_region.data.inactive_ratio)
	  ).toString();
        }
      })
  }

  function click_handler(d,i){
  }

  svg = d3.select("#map").append("svg")
    .attr("width", svg_width)
    .attr("height", height)
    .attr("style", "border-bottom:1px solid black;")
    .on("mousedown.log", function(){
      //console.log( d3.mouse(this) );
      //console.log(projection.invert(d3.mouse(this)));
    });

  regions = svg.append("g")
    .attr("id", "regions");
  regions.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", click_handler);

  projection = d3.geo.mercator()
    .center([50.0, 1])
    .scale(projection_scale_factor*width)
    .translate([-1*((projection_translate_factor*width)/2), height*2.33]);
  path = d3.geo.path()
    .projection(projection);

  name_arc_path = d3.svg.line()
    .interpolate("cardinal");

  region_overlay_arc = d3.svg.line()
    .interpolate("basis");

  region_overlays = [
    {  name: "SRIKAKULAM",
       coords: [84.90054681069195, 18.775333508131684],
       arc: [ [84.38468970729693, 18.74869100703183],
              [84.90054681069195, 18.775333508131684] ]
    },
    {
      name: "VIZIANAGARAM",
      coords: [82.3118820736551, 19.11243900583112],
      arc: [ [83.50304302149452, 18.917355606520015],
             [82.3118820736551, 19.11243900583112] ],
      anchor: "end",
      y_offset: -10
    },
    { name: "VISHAKAPATNAM",
      coords: [83.62497288229699, 17.590212511227513],
      arc: [ [83.08097811871677, 17.617032528065565],
             [83.62497288229699, 17.590212511227513] ]
    },
    {  name: "EAST GODAVARI",
       coords: [83.06221967859332, 16.505211934328354],
       arc: [ [82.18057299279091, 16.63106920095874],
              [83.06221967859332, 16.505211934328354] ]
    },
    { name: "WEST GODAVARI",
      coords: [80.46417572149474, 17.71533844720453],
      arc: [ [81.23327176655641, 17.178476951951406],
             [80.46417572149474, 17.71533844720453] ],
      anchor: "middle",
      y_offset: -80
    },
    { name: "KRISHNA",
      coords: [81.92733405112426, 15.703225658602134],
      arc: [ [81.03630814526014, 16.136160445931854],
             [81.92733405112426, 15.703225658602134] ]
    },
    { name: "GUNTUR",
      coords: [79.54501215544542, 17.196397699630875],
      arc: [ [79.75135499680343, 16.550170396982864],
             [79.54501215544542, 17.196397699630875] ],
      anchor: "middle",
      y_offset: -80
    },
    { name: "PRAKASAM",
      coords: [80.5204510418651, 15.215073471328413],
      arc: [ [80.03273159865526, 15.350786433445549],
             [80.5204510418651, 15.215073471328413] ]
    },
    { name: "NELLORE",
      coords: [80.5485887020503, 14.089894738394053],
      arc: [ [80.04211081871699, 14.344469127337526],
             [80.5485887020503, 14.089894738394053] ]
    },
    { name: "CHITTOOR",
      coords: [79.34804853414914, 12.748826664947178],
      arc: [ [78.98225895174176, 13.178413498576326],
             [79.34804853414914, 12.748826664947178] ]
    },
    { name: "ANANTAPUR",
      coords: [76.8344175576061, 16.63106920095874],
      arc: [ [76.97510585853203, 14.861812107905465],
             [76.8344175576061, 16.63106920095874] ],
      anchor: "middle",
      y_offset: -80
    },
    { name: "KURNOOL",
      coords: [78.2881966671739, 16.424260370290757],
      arc: [ [78.3163343273591, 15.793497170460627],
             [78.2881966671739, 16.424260370290757] ],
      anchor: "middle",
      y_offset: -80
    },
    { name: "KADAPA",
      coords: [77.88035687665896, 13.187545545176594],
      arc: [ [78.62131526153546, 14.098991603006356],
             [77.88035687665896, 13.187545545176594] ],
      anchor: "end"
    }
  ], pie_chart_data = [], bar_chart_data = [];

  d3.json("./geojson/DISTRICT.geojson", function(error, subunits) {
    d3.json("./api/dashboard.json", function(error, json_data){
      region_wise_data = json_data;
      region_wise_data.forEach(function(region_entry, ix){
        var region_overlay_ix = _.findIndex(region_overlays, function(ro){ return ro.name == region_entry.name; });
        if( region_overlay_ix != -1 ) {
          region_entry.data.unkonwn = region_entry.data.total - (region_entry.data.inactive + region_entry.data.active);
          region_entry.data.inactive_ratio = (region_entry.data.inactive + region_entry.data.unkonwn) / region_entry.data.total;
          region_overlays[region_overlay_ix].data = region_entry.data;
          region_wise_data[ix].data = region_entry.data;
        }
        pie_chart_data.push({ label: region_entry.name, value: region_entry.data.total });
        tab_count += region_entry.data.total;
        active_count += region_entry.data.active;
        inactive_count += region_entry.data.inactive;
      });
      unkonwn_count = tab_count - (active_count+inactive_count);
      bar_chart_data.push({ dimension: "number of tabs", value: tab_count });
      bar_chart_data.push({ dimension: "Active", value: active_count });
      bar_chart_data.push({ dimension: "InActive", value: inactive_count });
      bar_chart_data.push({ dimension: "Unkonwn", value: unkonwn_count });

      lt_cutoff_list = _.filter(
        region_wise_data,
        function(region_data){
          return region_data.data.inactive_ratio < cutoff_ratio;
        }
      );
      gt_cutoff_list = _.filter(
        region_wise_data,
        function(region_data){
          return region_data.data.inactive_ratio >= cutoff_ratio;
        }
      );
      if( lt_cutoff_list.length > 0 ){
        min_lt_ratio = _.min(
          lt_cutoff_list, function(d){
            return d.data.inactive_ratio;
          }
        );
        min_lt_ratio = min_lt_ratio.data ? min_lt_ratio.data.inactive_ratio : 0;
        max_lt_ratio = _.max(
          lt_cutoff_list, function(d){
            return d.data.inactive_ratio;
          }
        );
        max_lt_ratio = max_lt_ratio.data ? max_lt_ratio.data.inactive_ratio : 1;
      }
      if( gt_cutoff_list.length > 0 ){
        min_gt_ratio = _.min(
          gt_cutoff_list, function(d){
        return d.data.inactive_ratio;
          }
        );
        min_gt_ratio = min_gt_ratio.data ? min_gt_ratio.data.inactive_ratio : 0;
        max_gt_ratio = _.max(
          gt_cutoff_list, function(d){
            return d.data.inactive_ratio;
          }
        );
        max_gt_ratio = max_gt_ratio.data ? max_gt_ratio.data.inactive_ratio : 0;
      }

      lt_brightness_scale = d3.scale.linear()
        .domain([min_lt_ratio, max_lt_ratio]).range([0.0, 2.0]);
      gt_brightness_scale = d3.scale.linear()
        .domain([min_gt_ratio, max_gt_ratio]).range([0.0, 2.0]);

      regions.selectAll("path")
        .data(subunits.features)
        .enter().append("path")
        .attr("class", "region")
        .style("fill", function(d,i){
          var this_region = _.find(region_wise_data, function(r){
            return r.name.toUpperCase() == d.properties.DNAME.toUpperCase();
          });
          if( this_region.data.inactive_ratio < cutoff_ratio ) {
            return d3.rgb(0,128,0).brighter(
	      gt_brightness_scale(this_region.data.inactive_ratio)
	    ).toString();
          } else {
            return d3.rgb(128,128,128).brighter(
	      gt_brightness_scale(this_region.data.inactive_ratio)
	    ).toString();
          }
        })
        .attr("id", function(d){ return d.id; } )
        .attr("d", path)
        .on("click", click_handler);

      var overlays = regions.selectAll("g.overlay")
        .data(region_overlays)
        .enter()
        .append("g")
        .attr("class", "overlay")
        .attr("stroke-width", "0.5")
        .attr("stroke", "blue")
        .attr("transform", function(d) {
          if( d.y_offset ) {
            return "translate(" + projection(d.coords)[0] + ", " + (projection(d.coords)[1]+d.y_offset) + ")";
          } else {
            return "translate(" + projection(d.coords)[0] + ", " + projection(d.coords)[1] + ")";
          }
        });

      if( svg_width > 1000 ) {
        draw_overlays(overlays);
        draw_cutoff_selector(regions);
        select_cutOff_selector(cutoff_ratio*100);
      }

      region_overlays.filter(
        function(n) {
          return n.arc != null;
        }
      ).forEach(
        function(named_arc) {
          var projected_arc = named_arc.arc.map(function(coord){ return projection(coord); });
          draw_region_overlay_arc(projected_arc[0], projected_arc[1]);
        }
      );

      var chart_width = 590;
      if( window.innerWidth < 590 ) {
        chart_width = window.innerWidth - 20;
      }
      var pie_chart = new d3pie(document.getElementById("pie_chart"), {
        size: {
          canvasHeight: 500,
          canvasWidth: chart_width,
          pieInnerRadius: 0,
          pieOuterRadius: null
        },
        data: { content: pie_chart_data }
      });

      var bar_chart_svg = dimple.newSvg("#bar_chart", chart_width, 400);
      var bar_chart = new dimple.chart(bar_chart_svg, bar_chart_data);
      bar_chart.setBounds(30, 30, chart_width-50, 290)
      var x = bar_chart.addCategoryAxis("x", "dimension");
      bar_chart.addMeasureAxis("y", "value");
      bar_chart.addSeries(null, dimple.plot.bar);
      bar_chart.draw();
    });
  });
}

function perpendicular_offset_point(p0, p1) {
  var mid = [((p0[0]+p1[0])/2), (p0[1]+p1[1])/2];
  var dx = p1[0] - p0[0];
  var dy = p1[1] - p0[1];
  var normalize_slope = Math.sqrt((dx * dx) + (dy * dy));
  var resultant_pt_x = mid[0] + 5*(dy/normalize_slope);
  var resultant_pt_y = mid[1] - 5*(dx/normalize_slope);
  return [resultant_pt_x, resultant_pt_y];
}

$(document).ready(function(){
  render_vis();
  window.addEventListener("orientationchange", function() {
    window.location.reload();
  }, false);
});