let margin = ({ top: 20, right: 30, bottom: 30, left: 30 });

let height = 500;

let formatRiders = x => (+(x / 1e3).toFixed(2) >= 1)
  ? `${(x / 1e3).toFixed(2)}T`
  : `${(x / 1e6).toFixed(0)}M`;

let yAxis = g => g
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y)
    .tickFormat(x => (x / 1e3).toFixed(0)))
  .call(g => g.select(".domain").remove())
  .call(g => g.select(".tick:last-of-type text").clone()
    .attr("x", 6)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text(data.y));

xAxis = g => {
  g.attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickValues(d3.ticks(...d3.extent(x.domain()), width / 80))
      .tickSizeOuter(0));
}

let colors = new Map([
  ["East River Bridges", "#24693D"],
  ["", "FFFFFF"],
  ["Midtown", "#EE7423"],
  ["Midtown (estimated)", "#F59D3D"],
  ["Uptown", "#9B6A97"],
  ["Uptown (estimated)", "#BE89AC"]
]);

let color = d3.scaleOrdinal()
  .domain(Array.from(colors.keys()))
  .range(Array.from(colors.values()));

let data = null;

d3.csv("./nyc_bikecounts1985_2019.csv", (d) => {
  data = Object.assign(
    d3.csvParse(
      d, ({ Format, Year, ["Riders (Thousands)"]: Riders }) => (
        {
          name: Location, year: +Year, value: +Riders
        }
      )), { y: "Bicycle Riders (Thousands)" });
  
});


let series = d3.stack()
  .keys(Array.from(colors.keys()))
  .value((group, key) => group.get(key).value)
  .order(d3.stackOrderReverse)
  (Array.from(d3.nest().rollup(data, ([d]) => d, d => d.year, d => d.name).values()))
  .map(s => (s.forEach(d => d.data = d.data.get(s.key)), s));

let y = d3.scaleLinear()
  .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
  .range([height - margin.bottom, margin.top]);

let chart = () => {
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", ({ key }) => color(key))
    .call(g => g.selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.year))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth() - 1)
      .attr("height", d => y(d[0]) - y(d[1]))
      .append("title")
      .text(d => `${d.data.name}, ${d.data.year}
  ${formatRiders(d.data.value)}`));

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  return svg.node();
}

legend = () => {
  const id = DOM.uid().id;
  return html`<style>
  
  .${id} {
    display: block;
    columns: 180px auto;
    font: 10px sans-serif;
    margin-left: ${margin.left}px;
  }
  
  .${id}-item {
    break-inside: avoid;
    display: flex;
    align-items: center;
    padding-bottom: 1px;
  }
  
  .${id}-label {
    white-space: nowrap;
    overflow: hidden;
    width: 120px;
    text-overflow: ellipsis;
  }
  
  .${id}-swatch {
    width: 20px;
    height: 20px;
    margin: 0 5px 0 0;
  }
  
  </style>
  <div class="${id}">${color.domain().map(name => html`
    <div class="${id}-item">
      <div class="${id}-swatch" style="background:${color(name)};"></div>
      <div class="${id}-label" title="${name}">${document.createTextNode(name)}</div>
    </div>`)}
  </div>`;
}