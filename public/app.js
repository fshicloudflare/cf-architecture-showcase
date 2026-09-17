// Tab switching
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

const diagramHint = document.getElementById("diagram-hint");
const heroDefault = document.getElementById("hero-default");
const heroPhilosophy = document.getElementById("hero-philosophy");

const DIAGRAM_PANELS = new Set(["panel-request", "panel-platform"]);

function activatePanel(target) {
  const isPhilosophy = target === "panel-philosophy";
  tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("data-target") === target));
  panels.forEach((p) => p.classList.toggle("active", p.id === target));
  if (diagramHint) diagramHint.style.display = DIAGRAM_PANELS.has(target) ? "" : "none";
  if (heroDefault) heroDefault.hidden = isPhilosophy;
  if (heroPhilosophy) heroPhilosophy.hidden = !isPhilosophy;
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activatePanel(tab.getAttribute("data-target")));
});

document.querySelectorAll(".link-btn[data-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    activatePanel(btn.getAttribute("data-target"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// Product catalog — descriptions reflect how each product is actually invoked
// (verified against developers.cloudflare.com), not treated as independent siblings.
const PRODUCTS = [
  // Compute — everything here is reached FROM a Worker's code, never directly from the edge
  { name: "Workers", cat: "compute", icon: "W", desc: "Serverless V8 isolates that run your code at the edge. The single entry point that fans out to everything below." },
  { name: "Durable Objects", cat: "compute", icon: "DO", desc: "Bound to a Worker via a durable_objects binding; a stub is fetched with env.MY_DO.get(id) for strongly consistent, single-instance state." },
  { name: "Containers", cat: "compute", icon: "C", desc: "A Container class extends DurableObject. A Worker calls getContainer(env.MY_CONTAINER, id) to spin up an on-demand container instance running any image." },
  { name: "Sandbox SDK", cat: "compute", icon: "SB", desc: "The Sandbox class extends Container (which extends DurableObject). A Worker calls getSandbox(env.Sandbox, id) to get an isolated Linux environment for untrusted code." },
  { name: "Workflows", cat: "compute", icon: "WF", desc: "Triggered from a Worker via env.MY_WORKFLOW.create(); runs a WorkflowEntrypoint's durable steps with automatic retries, independent of the request lifecycle." },
  { name: "Dynamic Workers", cat: "compute", icon: "DW", desc: "Workers for Platforms: a dispatch Worker holds a dispatch_namespaces binding and calls env.DISPATCHER.get(name).fetch() to invoke a different user Worker at runtime." },
  { name: "Browser Run", cat: "compute", icon: "BR", desc: "A Worker binds to a Browser Run session (Puppeteer/Playwright/CDP) to control headless Chrome; sessions can be persisted in a Durable Object to skip cold starts." },
  { name: "Agents SDK", cat: "compute", icon: "AG", desc: "The Agent class extends DurableObject, giving each agent session durable state, WebSockets, scheduling, and access to Sandbox/Browser/AI Search as tools." },

  // Storage & Data — reached from a Worker via direct bindings
  { name: "KV", cat: "storage", icon: "KV", desc: "Global, low-latency key-value store bound to a Worker for config, sessions, and cached data." },
  { name: "R2", cat: "storage", icon: "R2", desc: "S3-compatible object storage with zero egress fees, accessed via a Worker binding or S3-compatible API." },
  { name: "D1", cat: "storage", icon: "D1", desc: "Serverless SQL database built on SQLite, queried from a Worker binding with read replication." },
  { name: "Hyperdrive", cat: "storage", icon: "HD", desc: "A Worker binding that pools and accelerates connections from Workers to an existing Postgres or MySQL database, including PlanetScale." },
  { name: "PlanetScale", cat: "storage", icon: "PS", desc: "Postgres/MySQL databases provisioned via Cloudflare's partnership with PlanetScale, reached from Workers through a Hyperdrive configuration." },
  { name: "Queues", cat: "storage", icon: "Q", desc: "A Worker producer binding sends messages; a separate consumer Worker binding processes batches asynchronously." },
  { name: "Pipelines", cat: "storage", icon: "PL", desc: "Ingests events via a Worker binding or HTTP endpoint, transforms them with SQL, and delivers exactly-once to R2 as Iceberg tables or Parquet/JSON." },
  { name: "Secrets Store", cat: "security", icon: "SS", desc: "A secrets_store_secrets binding exposes account-level secrets to a Worker at runtime, so values are rotated once and shared, not duplicated." },
  { name: "Artifacts", cat: "storage", icon: "AR", desc: "Versioned storage for build outputs and deployable artifacts, referenced from Workers and CI/CD pipelines." },

  // AI
  { name: "Workers AI", cat: "ai", icon: "AI", desc: "An ai binding lets a Worker call env.AI.run(model, input) to run inference for LLMs, embeddings, image, and speech models on Cloudflare's GPUs." },
  { name: "AI Gateway", cat: "ai", icon: "GW", desc: "A Worker (or any app) routes its Workers AI or third-party provider requests through an AI Gateway endpoint to add caching, rate limiting, retries, and fallback." },
  { name: "Vectorize", cat: "ai", icon: "VZ", desc: "A vectorize binding gives a Worker a globally distributed vector database, typically queried alongside Workers AI embeddings for RAG." },
  { name: "AI Search", cat: "ai", icon: "AS", desc: "A managed retrieval-augmented search service built on Vectorize and Workers AI; a Worker calls it directly instead of assembling its own RAG pipeline." },

  // Media & Realtime
  { name: "Images", cat: "media", icon: "IMG", desc: "An images binding or URL transform lets a Worker resize, optimize, and serve images on the fly at the edge." },
  { name: "Stream", cat: "media", icon: "ST", desc: "Serverless live and on-demand video streaming — upload, store, encode, and deliver video with one API, with adaptive bitrate encoding and global delivery, no infrastructure to configure." },
  { name: "Realtime SFU", cat: "media", icon: "RT", desc: "A Selective Forwarding Unit that routes WebRTC audio/video/data between clients; your Worker or backend issues session credentials and decides who can publish or subscribe." },
  { name: "RealtimeKit", cat: "media", icon: "RK", desc: "Prebuilt meeting SDKs and UI components layered on top of the Realtime SFU, so you don't build signaling and media routing yourself." },

  // Security & Ops (platform-adjacent)
  { name: "Wrangler & CI/CD", cat: "security", icon: "CLI", desc: "CLI, Vitest integration, and CI/CD tooling used to configure bindings and deploy every product on this page." },
  { name: "Observability", cat: "security", icon: "OB", desc: "Workers Logs, tracing, and Analytics Engine, enabled per-Worker via the observability config, for full request-level visibility." },
];

const CAT_LABEL = {
  compute: "Compute",
  storage: "Storage & Data",
  ai: "AI",
  media: "Media & Realtime",
  security: "Security & Ops",
};

const grid = document.getElementById("product-grid");

function render(filter) {
  grid.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.cat = p.cat;
    if (filter !== "all" && p.cat !== filter) card.classList.add("hidden");
    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon icon-${p.cat}">${p.icon}</div>
        <div class="card-title">${p.name}</div>
      </div>
      <div class="card-cat">${CAT_LABEL[p.cat]}</div>
      <p>${p.desc}</p>
    `;
    grid.appendChild(card);
  });
}

render("all");

const filters = document.querySelectorAll(".filter");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.cat);
  });
});

// Customer case studies — crawled from cloudflare.com/case-studies filtered to
// usecase="Deploy custom code at the Edge" & product="Workers" (14 results at time of writing),
// plus a few flagship stories added by request (Shopify, Canva, VSCO — all Workers users,
// filed under other primary use cases on Cloudflare's site) and Discord's own engineering
// blog post about moving voice/video onto Cloudflare's edge network.
const CASE_STUDIES = [
  { company: "Discord", industry: "Gaming", region: "Global", products: ["CDN", "DDoS Protection", "Realtime SFU"], excerpt: "Discord first turned to Cloudflare's CDN and DDoS Protection in 2015 to absorb Layer 7 and websocket-flood attacks while scaling past 2.4M concurrent users. A decade later, Discord moved its voice and video traffic onto Cloudflare's edge network — running its own SFU software across 300+ PoPs instead of ~30 hyperscaler regions — with more than 80% of voice/video traffic now served there and faster pings, lower packet loss in most regions.", logo: "https://images.ctfassets.net/slt3lc6tev37/6tQS6UCCSAYysuY4OIc8sY/135f2e4fb4f46ba6364a55f09bc135a4/discord.svg", url: "https://discord.com/blog/how-we-moved-discord-voice-to-the-edge" },
  { slug: "shopify", company: "Shopify", industry: "eCommerce", region: "North America", products: ["Workers", "Argo Smart Routing", "DNS", "CDN", "SSL for SaaS", "WAF", "SSL/TLS", "Bot Management", "Gateway", "DDoS Protection"], excerpt: "Shopify + Cloudflare: powering 1,000,000 storefronts on the biggest shopping weekend of the year, using Workers and Workers for Platforms to personalize commerce at the edge.", logo: "https://images.ctfassets.net/slt3lc6tev37/7qWZqvPhHknK8R30DVAo8i/5901938d5a777f1e65a2a555a75ad18e/shopify_logo.jpg" },
  { slug: "canva", company: "Canva", industry: "High Technology", region: "Asia-Pacific", products: ["Workers", "Access", "Bot Management", "WAF", "DDoS Protection", "CDN"], excerpt: "Canva connects employees, protects user assets, and builds industry-leading visual communication and content creation in Cloudflare's connectivity cloud — running hundreds of microservices on Workers to offload Layer 7 logic from origin.", logo: "https://images.ctfassets.net/slt3lc6tev37/4JYGVJ3E5jvHzfOCgLIDAT/a6de0a77f73c092ee4f4b074c741b07b/Canva-logo.png" },
  { slug: "vsco", company: "VSCO", industry: "High Technology", region: "North America", products: ["Workers", "Workers AI", "R2", "Images", "WAF", "DDoS Protection", "Bot Management", "CDN"], excerpt: "VSCO cut cloud costs and delivered more responsive experiences globally, using Workers to migrate 2+ petabytes of images into R2 and Workers AI to power real-time generative AI in VSCO Canvas.", logo: "https://images.ctfassets.net/slt3lc6tev37/1D5p7Rz0tOVRgCj2hIc6dq/015d66bbbb9ea9a49a93a6d2346af439/Logo.png" },
  { slug: "tightknit", company: "Tightknit", industry: "High Technology", region: "North America", products: ["Pages", "Workers"], excerpt: "Zach Hawtof, CEO of Tightknit, shares how using Cloudflare allows them to focus on building great features, instead of managing infrastructure, and highlights its affordable, pay-as-you-go pricing.", logo: "https://images.ctfassets.net/slt3lc6tev37/5ZlvPZChipVaij5xBoRtRy/082560ec03add456cd4c342dc131071e/Tightknit_logo.png" },
  { slug: "nasadiya-technologies", company: "Nasadiya Technologies", industry: "High Technology", region: "Asia-Pacific", products: ["Argo Smart Routing", "Bot Management", "CDN", "DDoS Protection", "Rate Limiting", "Workers"], excerpt: "Using Cloudflare's connectivity cloud, Nasadiya Technologies delivers content to readers across India and around the world while protecting its online publishing platform against plagiarism.", logo: "https://images.ctfassets.net/slt3lc6tev37/4gBR4S9BTjtuEvGU9HFX0B/846595fd8ac8b331cef1d2c10d72016c/Nasadiya_Technologies_Logo.png" },
  { slug: "docker", company: "Docker", industry: "High Technology", region: "North America", products: ["Workers"], excerpt: "With Cloudflare Cache Reserve, Docker ensures swift, reliable, and secure delivery of 500+ million downloads daily.", logo: "https://images.ctfassets.net/slt3lc6tev37/371ISH6NzDSX5IoOdA1RpM/5ba2c6e9f6dc86253824fb44baa218c2/docker_logo.png" },
  { slug: "datocms", company: "DatoCMS", industry: "High Technology", region: "Europe, Middle East & Africa", products: ["Workers"], excerpt: "DatoCMS is able to reduce maintenance time and provide a better customer experience with Cloudflare.", logo: "https://images.ctfassets.net/slt3lc6tev37/5oydnO94WV1MhuaeTvwxr/70731e4f27f7dd3bf7044997169f55d1/color_full_logo.png" },
  { slug: "fortune-500-retailer", company: "Fortune 500 Retailer", industry: "eCommerce", region: "North America", products: ["Workers"], excerpt: "With Cloudflare Developer Platform, this retail site scales instantly not only for new product launches but also when the Black Friday holiday season starts.", logo: "https://images.ctfassets.net/slt3lc6tev37/8iJv0JsJa3uKXaZyFdQQr/252d0b874c50a9955d944d44f356c47a/Fortune_500_Retailer_Logo.png" },
  { slug: "dcard", company: "Dcard", industry: "Media & Entertainment", region: "Asia-Pacific", products: ["DDoS Protection", "Rate Limiting", "Workers", "WAF"], excerpt: "Dcard uses Cloudflare solutions to provide users with a safe and efficient community experience.", logo: "https://images.ctfassets.net/slt3lc6tev37/4ZYWZtgB7ult8EkaITkez9/cdbd889e10b41559d4507ae1b961a751/dcard_logo.png" },
  { slug: "kinsta", company: "Kinsta", industry: "Hosting", region: "North America", products: ["Workers", "SSL/TLS", "SSL for SaaS"], excerpt: "Kinsta uses Cloudflare solutions to prevent DDoS attacks and provide a premium tailored hosting experience.", logo: "https://images.ctfassets.net/slt3lc6tev37/1X1A0BFihIS8JMrYHBGmi2/1b831a3b9a0e2f2152da22dcbbb78a93/Kinsta_black.png" },
  { slug: "pagesjaunes", company: "PagesJaunes", industry: "Media & Entertainment", region: "Europe, Middle East & Africa", products: ["Argo Smart Routing", "Workers", "DDoS Protection"], excerpt: "Cloudflare helps PagesJaunes facilitate its digitalization process and offer its users improved protection and ease of access.", logo: "https://images.ctfassets.net/slt3lc6tev37/EJMgeJ9Ov48gqrURuAnfX/96888e97af5ea56c852b4695f815de7b/pages_juanes_logop.png" },
  { slug: "edgemesh", company: "Edgemesh", industry: "High Technology", region: "North America", products: ["Argo Smart Routing", "Workers"], excerpt: "Edgemesh uses Cloudflare Workers to improve eCommerce performance with an advanced client-side solution.", logo: "https://images.ctfassets.net/slt3lc6tev37/5oLwgdSkTOHma3fJWKabyN/6b3feae1be257850b485351a380befad/Edgemesh_Logo_-_With_Label.svg" },
  { slug: "font-awesome", company: "Font Awesome", industry: "High Technology", region: "North America", products: ["Load Balancing", "Workers"], excerpt: "Cloudflare Load Balancing eliminates infrastructure stability issues that hurt Font Awesome's reputation and customer experience.", logo: "https://images.ctfassets.net/slt3lc6tev37/5tMXpKS5YyL4EODxSP4FTC/b503b80652bef1b287978b7915fff5a8/font_awesome_logo.jpg" },
  { slug: "propublica", company: "ProPublica", industry: "Media & Entertainment", region: "North America", products: ["Workers"], excerpt: "ProPublica uses Cloudflare Workers for a webpage caching system that helps guarantee availability and avoids cache stampedes.", logo: "https://images.ctfassets.net/slt3lc6tev37/1s9if3EyH8f1ig9BQKy570/193b79acf5f6c0cfb0a9685e023fef7c/logo_propublica.svg" },
  { slug: "dig", company: "Dig", industry: "Travel & Leisure", region: "North America", products: ["Workers", "Pages", "WAF"], excerpt: "Thanks to Cloudflare Workers and Pages, Dig has a fast, reliable, and secure ordering portal.", logo: "https://images.ctfassets.net/slt3lc6tev37/5NW8YHvmfBtlZD9voktwt6/59e178ff6083355da3a416d8975b387b/dig_logo.png" },
  { slug: "umbraco", company: "Umbraco", industry: "High Technology", region: "Europe, Middle East & Africa", products: ["Workers", "Argo Smart Routing"], excerpt: "Umbraco uses Cloudflare to expand functionality and improve performance for customer sites hosted on Umbraco Cloud.", logo: "https://images.ctfassets.net/slt3lc6tev37/37XSTw3i7E5lJY2t3OWgS7/ed817f2979097d5b338c49a18a2f1d1e/umbraco.png" },
  { slug: "optimizely-video", company: "Optimizely", industry: "High Technology", region: "North America", products: ["Workers"], excerpt: "Optimizely leveraged Cloudflare Workers to reinvent its leading experimentation platform.", logo: "https://images.ctfassets.net/slt3lc6tev37/4v4GHVEpu8apXgJUz8KEKX/0765bdf6580bf3979257778339d2793e/optimizelylogoresized.jpg" },
];

const caseGrid = document.getElementById("case-grid");
if (caseGrid) {
  CASE_STUDIES.forEach((c) => {
    const tile = document.createElement("a");
    tile.className = "case-tile";
    tile.href = c.url || `https://www.cloudflare.com/case-studies/${c.slug}`;
    tile.target = "_blank";
    tile.rel = "noopener";
    tile.innerHTML = `
      <div class="case-logo-wrap"><img src="${c.logo}" alt="${c.company} logo" loading="lazy" /></div>
      <div class="case-meta">${c.industry} · ${c.region}</div>
      <p class="case-excerpt">${c.excerpt}</p>
      <div class="case-products">${c.products.map((p) => `<span class="case-tag">${p}</span>`).join("")}</div>
      <span class="case-read">Read case study ↗</span>
    `;
    caseGrid.appendChild(tile);
  });
}
