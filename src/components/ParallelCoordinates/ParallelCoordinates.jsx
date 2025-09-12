// ParallelCoordinates Component
//
// Heavily references the source code from the following sites (mostly from the official D3js site)
//    https://d3-graph-gallery.com/graph/parallel_basic.html
//    https://d3-graph-gallery.com/graph/parallel_custom.html

import React, { useEffect, useState, useRef } from 'react';
import * as d3 from "d3";

export default function ParallelCoordinates () {
 // React Refs
  //   svgRef:  Attaches a ref to the D3JS element to avoid DOM competition
  const svgRef = useRef();

  // React States
  //   data:    Represents the CSV data as an array of objects.
  //   isReady: Determines if the component is ready (i.e. data has successfully loaded)
  const [data, setData] = useState([]);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    try {
      // Data URL (for testing purposes)
      const url = '/data/2019.csv'

      // Parses the csv file data as a raw string from the `url` path, then stores the results in `data` (async operation).
      d3.csv(url).then(parsedData => {
        setData(parsedData)
        setReady(true);

        // Prints the data to the console (debugging)
        console.log(parsedData)
        console.log(data)
      })

    // Catches the errors if there are any
    } catch (error) {
      console.error("Error parsing data:", error);
    }
  }, []);

  // Defines the graph
  useEffect(() => {
    // Checks if the data is available and ready
    if (!ready || !data) {
      return;
    }

    // SVG that defines the whole visualization (i think)
    const svg = d3.select(svgRef.current)

    // Sets the dimensions of the svg
    const margin = {top: 30, right: 10, bottom: 10, left: 0}
    const width = 1600;
    const height = 400;
    svg.attr('width', width).attr('height', height)

    // Extracts the list of dimensions we want to keep
    const dimensions = Object.keys(data[0]).filter(function(d) { 
      return d != "Country or region" && d != "Overall rank" 
    })

    // Builds the X scale for each dimension
    const x = d3.scalePoint()
      .range([0, width - margin.right - margin.left])
      .padding(1)
      .domain(dimensions);

    // Builds the Y linear scale for each dimension (standardizes them from min value to max value)
    const y = {}
    dimensions.forEach (feature => {
      y[feature] = d3.scaleLinear()
        .domain( d3.extent(data, d => d[feature]) )
        .range([height - margin.top - margin.bottom, 0])
    })

    // For each row, return the x and y coords to draw and plot.
    function path(d) {
      return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
    }

    // Appends lines to the visualization
    svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`) // sets margins
      .selectAll("myPath")
      .data(data)
      .join("path")
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", "steelblue")
      .style("opacity", 0.5);
    
    // Draw the axis:
    const axisGroups = svg.selectAll("myAxis")
      .data(dimensions)
      .join("g")
      .attr("transform", d => `translate(${x(d) + margin.left}, ${margin.top})`);

    // Add the axis line and ticks to each group.
    axisGroups.each(function(d) {
      d3.select(this).call(d3.axisLeft().scale(y[d]));
    });

    // Add a title to each axis.
    axisGroups.append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(d => d)
      .style("fill", "white");

  }, [data, ready])

  // Returns the JSX Element (should be the D3JS chart)
  return (
    <>
      <svg ref={svgRef}></svg>
    </>
  )
}
