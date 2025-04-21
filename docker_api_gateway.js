const express = require("express");
const morgan = require("morgan");
const http = require("http");
const fs = require("fs");
const { pipeline } = require("stream");
const Docker = require("dockerode");

// ───────────────── Docker client detection ──────────────────
let docker;
const envHost = process.env.DOCKER_HOST;
if (envHost) {
    // dockerode understands DOCKER_HOST automatically (tcp:// or npipe://)
    docker = new Docker();
} else if (process.platform === "win32") {
    docker = new Docker({ socketPath: "\\\\.\\pipe\\docker_engine" });
} else {
    const sock = "/var/run/docker.sock";
    if (!fs.existsSync(sock)) {
        console.error(`Docker socket not found at ${sock}. Is Docker running?`);
        process.exit(1);
    }
    docker = new Docker({ socketPath: sock });
}

// ───────────────── Express setup ────────────────────────────
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const bool = (v, d = false) => (v === undefined ? d : ["1", "true", "True", true].includes(v));
const handle = fn => (req, res) => fn(req, res).catch(err => {
    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || err.toString() });
});

// ───────────────── Convenience container helpers ────────────
app.get("/containers", handle(async(req, res) => {
    const opts = {
        all: bool(req.query.all),
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        size: bool(req.query.size),
        filters: req.query.filters ? JSON.parse(req.query.filters) : undefined,
    };
    res.json(await docker.listContainers(opts));
}));

app.get("/containers/:id", handle(async(req, res) => {
    res.json(await docker.getContainer(req.params.id).inspect({ size: bool(req.query.size) }));
}));

app.post("/containers", handle(async(req, res) => {
    const ctr = await docker.createContainer({...req.body, name: req.query.name });
    res.status(201).json({ Id: ctr.id, Warnings: [] });
}));

["start", "stop", "restart", "kill", "pause", "unpause"].forEach(action => {
    app.post(`/containers/:id/${action}`, handle(async(req, res) => {
        await docker.getContainer(req.params.id)[action]();
        res.sendStatus(204);
    }));
});


app.post("/containers/:id/rename", handle(async(req, res) => {
    await docker.getContainer(req.params.id).rename({ name: req.query.name });
    res.sendStatus(204);
}));

app.post("/containers/:id/update", handle(async(req, res) => {
    await docker.getContainer(req.params.id).update(req.body);
    res.sendStatus(204);
}));

app.delete("/containers/:id", handle(async(req, res) => {
    await docker.getContainer(req.params.id).remove({
        v: bool(req.query.v),
        force: bool(req.query.force),
        link: bool(req.query.link),
    });
    res.sendStatus(204);
}));

app.get("/containers/:id/logs", handle(async(req, res) => {
    const o = {
        follow: bool(req.query.follow),
        stdout: bool(req.query.stdout, true),
        stderr: bool(req.query.stderr, true),
        since: req.query.since ? Number(req.query.since) : 0,
        until: req.query.until ? Number(req.query.until) : 0,
        timestamps: bool(req.query.timestamps),
        tail: req.query.tail !== undefined ? req.query.tail : "all",
    };
    const stream = await docker.getContainer(req.params.id).logs({...o, stream: o.follow });
    if (o.follow) {
        res.writeHead(200, { "Content-Type": "application/octet-stream" });
        stream.pipe(res);
    } else {
        const chunks = [];
        stream.on("data", c => chunks.push(c));
        stream.on("end", () => res.type("text/plain").send(Buffer.concat(chunks)));
    }
}));

app.get("/containers/:id/stats", handle(async(req, res) => {
    const stream = await docker.getContainer(req.params.id).stats({ stream: bool(req.query.stream, true) });
    res.writeHead(200, { "Content-Type": "application/json" });
    stream.pipe(res);
}));

// ───────────────── Convenience image helpers ────────────────
// 1. List images — already implemented
app.get("/images", handle(async(req, res) => {
    res.json(await docker.listImages({
        all: bool(req.query.all),
        digests: bool(req.query.digests),
        filters: req.query.filters ? JSON.parse(req.query.filters) : undefined,
    }));
}));

// 2. Inspect image
app.get("/images/:name/json", handle(async(req, res) => {
    res.json(await docker.getImage(req.params.name).inspect());
}));

// 3. Image history
app.get("/images/:name/history", handle(async(req, res) => {
    res.json(await docker.getImage(req.params.name).history());
}));

// 4. Pull / create image (remote or local import)
app.post("/images/create", handle(async(req, res) => {
    const opts = {
        fromImage: req.query.fromImage,
        fromSrc: req.query.fromSrc,
        repo: req.query.repo,
        tag: req.query.tag,
        platform: req.query.platform || "",
    };
    const auth = req.headers["x-registry-auth"];
    if (auth) opts.authconfig = JSON.parse(Buffer.from(auth, "base64").toString());
    const stream = await docker.createImage(opts, req);
    stream.pipe(res);
}));

// 5. Pull helper (alias for create with fromImage)
app.post("/images/pull", handle(async(req, res) => {
    if (!req.query.fromImage) throw new Error("fromImage query param required");
    const tag = req.query.tag ? `:${req.query.tag}` : "";
    const stream = await docker.pull(`${req.query.fromImage}${tag}`);
    stream.pipe(res);
}));

// 6. Tag image
app.post("/images/:name/tag", handle(async(req, res) => {
    await docker.getImage(req.params.name).tag({ repo: req.query.repo, tag: req.query.tag });
    res.sendStatus(201);
}));

// 7. Push image
app.post("/images/:name/push", handle(async(req, res) => {
    const opts = { tag: req.query.tag };
    const auth = req.headers["x-registry-auth"];
    if (auth) opts.authconfig = JSON.parse(Buffer.from(auth, "base64").toString());
    const stream = await docker.getImage(req.params.name).push(opts);
    stream.pipe(res);
}));

// 8. Delete image
app.delete("/images/:name", handle(async(req, res) => {
    await docker.getImage(req.params.name).remove({
        force: bool(req.query.force),
        noprune: bool(req.query.noprune),
    });
    res.sendStatus(200);
}));

// 9. Search Docker Hub
app.get("/images/search", handle(async(req, res) => {
    if (!req.query.term) throw new Error("term query param required");
    const opts = { term: req.query.term };
    if (req.query.limit) opts.limit = Number(req.query.limit);
    if (req.query.filters) opts.filters = JSON.parse(req.query.filters);
    res.json(await docker.searchImages(opts));
}));

// 10. Prune unused images
app.post("/images/prune", handle(async(req, res) => {
    const opts = { filters: req.query.filters ? JSON.parse(req.query.filters) : undefined };
    res.json(await docker.pruneImages(opts));
}));

// 11. Load images tarball
app.post("/images/load", handle(async(req, res) => {
    const stream = await docker.loadImage(req, { quiet: bool(req.query.quiet) });
    stream.pipe(res);
}));

// Note: export "get" endpoints and multi-image `/images/get` are handled by
// passthrough to keep the helper lightweight.

// ───────────────── Automatic top‑level passthrough ──────────
const passthroughRoots = [
    "images", "build", "networks", "volumes", "exec", "swarm", "nodes",
    "services", "tasks", "secrets", "configs", "plugins", "distribution",
    "system", "events", "session", "info", "version", "_ping"
];
app.use((req, res, next) => {
    const root = req.path.split("/")[1];
    if (passthroughRoots.includes(root)) {
        req.url = "/engine" + req.originalUrl;
    }
    next();
});

// ───────────────── /engine universal proxy ──────────────────
app.use("/engine", (req, res) => {
    const opts = {};
    if (envHost && envHost.startsWith("tcp://")) {
        const { hostname, port } = new URL(envHost);
        opts.host = hostname;
        opts.port = port;
    } else if (envHost && envHost.startsWith("npipe://")) {
        opts.socketPath = "\\\\.\\pipe\\docker_engine";
    } else {
        opts.socketPath = docker.modem.socketPath || "/var/run/docker.sock";
    }
    opts.path = req.originalUrl.replace(/^\/engine/, "");
    opts.method = req.method;
    opts.headers = {...req.headers, host: "docker" };

    const dReq = http.request(opts, dRes => {
        res.writeHead(dRes.statusCode, dRes.headers);
        pipeline(dRes, res, () => {});
    });
    pipeline(req, dReq, () => {});
});

// ───────────────── Fallback 404 ─────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Unknown endpoint" }));

// ───────────────── Startup ─────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Docker API gateway listening ⇒ http://localhost:${PORT}`));
