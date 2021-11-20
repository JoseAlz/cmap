//*--- BASIC CONSTANTS -------*/
const width = 1000;
const height = 800;
const bachelors = d3.map();
const path = d3.geoPath();
const urls = [
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json",
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json",
];

/*---- CANVAS --------------------*/
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

/*---- SCALES --------------------*/
const xScale = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);
const colorScale = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemePurples[9]);

/*---- LEGEND --------------------*/
/*---- element -------------------*/
const legend = svg
  .append("g")
  .attr("id", "legend")
  .attr("transform", "translate(0,40)");
/*---- info rects ----------------*/
legend
  .selectAll("rect")
  .data(
    colorScale.range().map(function (d) {
      d = colorScale.invertExtent(d);
      if (d[0] == null) d[0] = xScale.domain()[0];
      if (d[1] == null) d[1] = xScale.domain()[1];
      return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 8)
  .attr("x", (d) => xScale(d[0]))
  .attr("width", (d) => xScale(d[1]) - xScale(d[0]))
  .attr("fill", (d) => colorScale(d[0]));
/*---- legend axis --------------*/
legend
  .call(
    d3
      .axisBottom(xScale)
      .tickSize(8)
      .tickFormat((x, i) => x + "%")
      .tickValues([3, 12, 21, 30, 39, 48, 57, 66])
  )
  .select(".domain")
  .remove();

/*-------------------------------*/
/*---- DATA LOAD FUNCTION -------*/
/*-------------------------------*/
Promise.all(urls.map((url) => d3.json(url))).then(function (values) {
  const attainmentData = values[0];
  const mapData = values[1];

  /*---- TOOLTIP ------------------*/
  /*---- tooltip element ----------*/
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
  /*---- pair data by fips --------*/
  let dataByFIPS = {};
  attainmentData.forEach((d) => (dataByFIPS[d.fips] = d.bachelorsOrHigher));
  let stateByFIPS = {};
  attainmentData.forEach((d) => (stateByFIPS[d.fips] = d.state));
  let countyByFIPS = {};
  attainmentData.forEach((d) => (countyByFIPS[d.fips] = d.area_name));

  /*---- MAP ELEMENTS -------------*/
  /*---- draw states --------------*/
  svg
    .append("path")
    .datum(topojson.mesh(mapData, mapData.objects.states, (a, b) => a !== b))
    .attr("class", "states")
    .attr("d", path);
  /*---- draw counties ------------*/
  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(mapData, mapData.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d, i) => dataByFIPS[d.id])
    .attr("fill", (d) => {
      let result = attainmentData.filter((obj) => obj.fips == d.id);
      return colorScale(result[0].bachelorsOrHigher);
    })
    .attr("d", path)
    /*---- tooltip handler ----------*/
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          countyByFIPS[d.id] +
            ", " +
            stateByFIPS[d.id] +
            "</br>" +
            dataByFIPS[d.id] +
            "% Attainment"
        )
        .style("left", d3.event.pageX + 20 + "px")
        .style("top", d3.event.pageY + 20 + "px");
      tooltip.attr("data-education", dataByFIPS[d.id]);
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });
});
