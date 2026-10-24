(() => {
  const config = window.siteConfig || {};
  const mapContainer = document.getElementById("visitor-map");
  const totalElement = document.getElementById("visitor-total");
  const updatedElement = document.getElementById("visitor-updated");
  const countryList = document.getElementById("country-list");
  const mapKeyPlaceholder = "Please apply for your own key at the Tencent Location Service Open Platform and replace this placeholder";

  const countryAnchors = {
    CN: [35.86, 104.20], HK: [22.32, 114.17], MO: [22.20, 113.54], TW: [23.70, 120.96],
    US: [39.83, -98.58], CA: [56.13, -106.35], GB: [54.00, -2.50], DE: [51.17, 10.45],
    FR: [46.60, 2.40], NL: [52.20, 5.30], IE: [53.30, -8.20], SE: [62.00, 15.00],
    NO: [61.00, 8.50], FI: [64.50, 26.00], DK: [56.00, 10.00], CH: [46.80, 8.20],
    AT: [47.60, 14.10], IT: [42.80, 12.80], ES: [40.20, -3.60], PT: [39.60, -8.00],
    PL: [52.00, 19.40], CZ: [49.80, 15.50], RU: [58.00, 70.00], UA: [49.00, 31.50],
    JP: [36.20, 138.25], KR: [36.50, 127.80], SG: [1.35, 103.82], MY: [4.20, 102.00],
    IN: [22.00, 79.00], ID: [-2.50, 118.00], VN: [16.00, 106.00], TH: [15.50, 101.00],
    PH: [12.90, 121.80], AU: [-25.00, 134.00], NZ: [-41.80, 172.80], BR: [-10.80, -52.90],
    AR: [-35.00, -65.00], CL: [-31.80, -71.00], MX: [23.60, -102.50], ZA: [-29.00, 24.00],
    EG: [26.50, 29.00], IL: [31.00, 35.00], AE: [24.00, 54.00], SA: [24.00, 45.00], TR: [39.00, 35.20]
  };

  const displayNames = { HK: "Hong Kong, China", MO: "Macao, China", TW: "Taiwan, China" };
  const numberFormat = new Intl.NumberFormat("en-US");

  function setMapMessage(title, detail) {
    if (!mapContainer) return;
    mapContainer.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "map-placeholder";
    const icon = document.createElement("span");
    icon.className = "placeholder-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "◎";
    const heading = document.createElement("strong");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = detail;
    panel.append(icon, heading, text);
    mapContainer.append(panel);
  }

  function loadScript(source, attributes = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.async = true;
      Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${source}`));
      document.head.append(script);
    });
  }

  function initializeAnalytics() {
    const code = String(config.goatcounterCode || "").trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(code)) return;
    loadScript("https://gc.zgo.at/count.js", {
      "data-goatcounter": `https://${code}.goatcounter.com/count`
    }).catch(() => {
      const note = document.querySelector(".privacy-note");
      if (note) note.textContent = "Analytics is temporarily unavailable. The rest of the homepage remains fully functional.";
    });
  }

  function renderSummary(data) {
    if (!data.generated_at) {
      totalElement.textContent = "—";
      updatedElement.textContent = "Analytics not connected";
      return [];
    }
    const locations = Array.isArray(data.locations) ? data.locations.filter(item => item && item.code && Number(item.visitors) > 0) : [];
    totalElement.textContent = numberFormat.format(Number(data.total_visitors) || 0);
    const updated = new Date(data.generated_at);
    updatedElement.textContent = Number.isNaN(updated.getTime()) ? "Aggregate statistics" : `Updated ${updated.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;
    countryList.innerHTML = "";
    if (!locations.length) {
      const empty = document.createElement("li");
      empty.className = "country-empty";
      empty.textContent = "No visits recorded in this period.";
      countryList.append(empty);
      return [];
    }
    locations.slice(0, 6).forEach(location => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = displayNames[location.code] || location.name || location.code;
      const count = document.createElement("strong");
      count.textContent = numberFormat.format(Number(location.visitors));
      item.append(name, count);
      countryList.append(item);
    });
    return locations;
  }

  async function initializeMap(locations) {
    const key = String(config.tencentMapKey || "").trim();
    if (!key || key === mapKeyPlaceholder) {
      setMapMessage("Visitor map ready to connect", "Add a Tencent Maps key with a domain whitelist to display aggregate country statistics.");
      return;
    }
    if (!locations.length) {
      setMapMessage("Waiting for the first visitors", "The map will display country-level counts after analytics has collected data.");
      return;
    }
    try {
      await loadScript(`https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}`);
      if (!window.TMap) throw new Error("Tencent Maps is unavailable");
      const map = new TMap.Map(mapContainer, {
        center: new TMap.LatLng(28, 15),
        zoom: 1.4,
        draggable: true,
        scrollable: false,
        doubleClickZoom: false
      });
      const geometries = locations.filter(location => countryAnchors[location.code]).map(location => {
        const [lat, lng] = countryAnchors[location.code];
        const visits = Number(location.visitors);
        return {
          id: location.code,
          styleId: visits >= 100 ? "large" : visits >= 10 ? "medium" : "small",
          position: new TMap.LatLng(lat, lng)
        };
      });
      const dot = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='12' fill='#a7d9b6' fill-opacity='.2'/><circle cx='16' cy='16' r='6' fill='#a7d9b6'/></svg>");
      new TMap.MultiMarker({
        map,
        styles: {
          small: new TMap.MarkerStyle({ width: 18, height: 18, src: dot, anchor: { x: 9, y: 9 } }),
          medium: new TMap.MarkerStyle({ width: 28, height: 28, src: dot, anchor: { x: 14, y: 14 } }),
          large: new TMap.MarkerStyle({ width: 38, height: 38, src: dot, anchor: { x: 19, y: 19 } })
        },
        geometries
      });
      mapContainer.setAttribute("aria-label", `Tencent world map showing aggregate visitors from ${geometries.length} countries and regions`);
    } catch (error) {
      setMapMessage("Map temporarily unavailable", "Country-level statistics remain available in the summary. Check the map key and its domain whitelist.");
    }
  }

  async function initializeVisitors() {
    let locations = [];
    try {
      const response = await fetch("data/visitor-stats.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Visitor statistics are unavailable");
      const data = await response.json();
      locations = renderSummary(data);
    } catch (error) {
      totalElement.textContent = "—";
      updatedElement.textContent = "Statistics temporarily unavailable";
      countryList.innerHTML = "<li class=\"country-empty\">Statistics could not be loaded.</li>";
    }
    await initializeMap(locations);
  }

  initializeAnalytics();
  initializeVisitors();
})();
