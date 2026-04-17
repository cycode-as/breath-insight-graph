import { useMemo } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  type Plugin,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

// Plugin: shaded "Snoring Signature" band 100–300 Hz
const signatureBandPlugin: Plugin<"line"> = {
  id: "signatureBand",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!xScale || !chartArea) return;
    const labels = chart.data.labels as number[] | undefined;
    if (!labels?.length) return;

    // find pixel positions for 100Hz and 300Hz
    const findIdx = (target: number) => {
      let bestIdx = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < labels.length; i++) {
        const d = Math.abs(labels[i] - target);
        if (d < bestDiff) {
          bestDiff = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    };
    const x1 = xScale.getPixelForValue(findIdx(100));
    const x2 = xScale.getPixelForValue(findIdx(300));

    ctx.save();
    const grad = ctx.createLinearGradient(x1, chartArea.top, x2, chartArea.bottom);
    grad.addColorStop(0, "oklch(0.78 0.14 350 / 0.18)");
    grad.addColorStop(1, "oklch(0.78 0.14 320 / 0.10)");
    ctx.fillStyle = grad;
    ctx.fillRect(x1, chartArea.top, x2 - x1, chartArea.bottom - chartArea.top);

    // dashed borders
    ctx.strokeStyle = "oklch(0.65 0.22 350 / 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, chartArea.top);
    ctx.lineTo(x1, chartArea.bottom);
    ctx.moveTo(x2, chartArea.top);
    ctx.lineTo(x2, chartArea.bottom);
    ctx.stroke();

    // label
    ctx.setLineDash([]);
    ctx.fillStyle = "oklch(0.45 0.18 350)";
    ctx.font = "500 11px Inter, sans-serif";
    ctx.fillText("Snoring Signature  100–300 Hz", x1 + 8, chartArea.top + 16);
    ctx.restore();
  },
};

type Props = {
  frequencies: number[];
  magnitudes: number[];
};

export default function FftChart({ frequencies, magnitudes }: Props) {
  const data = useMemo<ChartData<"line", number[], number>>(
    () => ({
      labels: frequencies,
      datasets: [
        {
          data: magnitudes,
          borderColor: "oklch(0.55 0.18 290)",
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "oklch(0.55 0.18 290 / 0.1)";
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "oklch(0.55 0.18 290 / 0.35)");
            g.addColorStop(1, "oklch(0.55 0.18 290 / 0)");
            return g;
          },
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
          segment: {
            borderColor: (c) => {
              const i0 = (c.p0.parsed.x as number | null) ?? 0;
              const i1 = (c.p1.parsed.x as number | null) ?? 0;
              const f0 = frequencies[i0];
              const f1 = frequencies[i1];
              if (f0 >= 100 && f1 <= 300) return "oklch(0.6 0.24 350)";
              return "oklch(0.55 0.18 290)";
            },
          },
        },
      ],
    }),
    [frequencies, magnitudes],
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250, easing: "easeOutQuart" },
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "oklch(0.18 0.02 270)",
          padding: 10,
          titleFont: { family: "Inter", size: 11, weight: 500 },
          bodyFont: { family: "Inter", size: 12 },
          callbacks: {
            title: (items) => `${frequencies[items[0].dataIndex]?.toFixed(1)} Hz`,
            label: (ctx) => `Magnitude: ${(ctx.parsed.y as number).toFixed(3)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "oklch(0.5 0.02 270)",
            font: { family: "Inter", size: 10 },
            maxTicksLimit: 8,
            callback: (_v, i) => {
              const hz = frequencies[i];
              return hz != null ? `${Math.round(hz)}` : "";
            },
          },
          grid: { color: "oklch(0.92 0.015 280 / 0.5)" },
          title: {
            display: true,
            text: "Frequency (Hz)",
            color: "oklch(0.5 0.02 270)",
            font: { family: "Inter", size: 11, weight: 500 },
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "oklch(0.5 0.02 270)", font: { family: "Inter", size: 10 } },
          grid: { color: "oklch(0.92 0.015 280 / 0.5)" },
          title: {
            display: true,
            text: "Magnitude",
            color: "oklch(0.5 0.02 270)",
            font: { family: "Inter", size: 11, weight: 500 },
          },
        },
      },
    }),
    [frequencies],
  );

  return <Line data={data} options={options} plugins={[signatureBandPlugin]} />;
}
