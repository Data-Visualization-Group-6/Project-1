import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

// Props:
//   data: array of rows
//   dims: [{ key, label }, ...] axis descriptors
//   norm: 'raw' | 'ten'   (raw values, or normalized to 0–10)
export default function ParallelCoordinates({ data, dims, norm = 'ten' }) {
  // axis order (draggable)
  const [order, setOrder] = useState(dims.map(d => d.key));

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  const margin = { top: 30, right: 30, bottom: 24, left: 70 };

  // per-dimension stats (min/max), with fallback if all-missing
  const stats = useMemo(() => {
    const s = {};
    dims.forEach(d => {
      const vals = data.map(r => r[d.key]).filter(v => Number.isFinite(v));
      const [min, max] = d3.extent(vals);
      s[d.key] = (Number.isFinite(min) && Number.isFinite(max)) ? { min, max } : { min: 0, max: 1 };
    });
    return s;
  }, [data, dims]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const svgNode = svgRef.current;
    if (!wrap || !canvas || !svgNode) return;

    const svg = d3.select(svgNode);
    const ctx = canvas.getContext('2d');

    // live positions while dragging
    let pos = {};
    const getX = (k, x) => (pos[k] ?? x(k));

    const render = () => {
      const rect = wrap.getBoundingClientRect();
      const width  = Math.max(900, rect.width);
      const height = Math.max(420, rect.height || 540);

      // Hi-DPI canvas
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.floor(width  * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      svg.attr('width', width).attr('height', height);

      const x = d3.scalePoint().domain(order).range([margin.left, width - margin.right]);

      // y scales
      const yRaw = {};
      for (const k of order) {
        const { min, max } = stats[k] || { min: 0, max: 1 };
        yRaw[k] = d3.scaleLinear()
          .domain([min, max]).nice()
          .range([height - margin.bottom, margin.top]);
      }
      const yUnit10 = d3.scaleLinear().domain([0, 10]).range([height - margin.bottom, margin.top]);

      const yPos = (k, v) => {
        if (norm === 'raw') return yRaw[k](v);
        const { min, max } = stats[k];
        const t = (v - min) / (max - min || 1); // normalized 0..1
        const clamped = Math.max(0, Math.min(1, t));
        return yUnit10(clamped * 10); // 0–10
      };

      // --- axes (SVG) ---
      const gAxes = svg.selectAll('.axis').data(order, d => d);
      const gEnter = gAxes.enter()
        .append('g')
        .attr('class', 'axis')
        .attr('transform', d => `translate(${x(d)},0)`);

      gEnter.append('g').attr('class', 'y');
      gEnter.append('text')
        .attr('class', 'title')
        .attr('text-anchor', 'middle')
        .attr('y', margin.top - 8)
        .style('fill', '#dde3ea')
        .style('font-size', 12);

      const gAll = gEnter.merge(gAxes);

      gAll.attr('transform', d => `translate(${getX(d, x)},0)`);
      gAll.each(function (k) {
        let axis;
        if (norm === 'raw') {
          axis = d3.axisLeft(yRaw[k]).ticks(8);
        } else {
          axis = d3.axisLeft(yUnit10).ticks(11).tickFormat(d3.format('.0f')); // 0–10
        }
        const gy = d3.select(this).select('g.y').call(axis);
        // dark theme tick styling
        gy.selectAll('text').style('fill', '#b8c1cc').style('font-size', 11);
        gy.selectAll('line,path').style('stroke', '#9aa3ad');

        const label = dims.find(d => d.key === k)?.label ?? k;
        const suffix = norm === 'raw' ? '' : ' (0–10)';
        d3.select(this).select('text.title').text(label + suffix);
      });
      gAxes.exit().remove();

      // --- drag to reorder ---
      gAll.call(
        d3.drag()
          .on('start', function (event, k) {
            pos[k] = x(k);
            d3.select(this).raise().classed('dragging', true);
          })
          .on('drag', function (event, k) {
            pos[k] = Math.max(margin.left, Math.min(width - margin.right, event.x));
            d3.select(this).attr('transform', `translate(${pos[k]},0)`);
            drawLines(true); // live redraw
          })
          .on('end', function () {
            const newOrder = order.slice().sort((a, b) => (pos[a] ?? x(a)) - (pos[b] ?? x(b)));
            pos = {};
            d3.select(this).classed('dragging', false);
            setOrder(newOrder); // triggers full re-render
          })
      );

      // --- lines (Canvas with glow/density) ---
      function drawLines(/* live */) {
        ctx.clearRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = '#5aa0ff';
        ctx.shadowColor = '#5aa0ff';
        ctx.shadowBlur = 6;

        for (const row of data) {
          let first = true;
          let invalid = false;
          ctx.beginPath();
          for (const k of order) {
            const v = row[k];
            if (!Number.isFinite(v)) { invalid = true; break; }
            const xp = getX(k, x);
            const yp = yPos(k, v);
            if (!Number.isFinite(yp)) { invalid = true; break; }
            if (first) { ctx.moveTo(xp, yp); first = false; }
            else { ctx.lineTo(xp, yp); }
          }
          if (!invalid) ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
      }

      drawLines(false);
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [order, stats, data, norm, dims]);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', height: '70vh', background: '#0b0f14' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
