const { createServer } = require("http");

const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const { pathname, searchParams, search, href } = parsedUrl;
      
      const query = {};
      for (const [key, value] of searchParams) {
        if (query[key] === undefined) {
          query[key] = value;
        } else if (Array.isArray(query[key])) {
          query[key].push(value);
        } else {
          query[key] = [query[key], value];
        }
      }

      // Mimic url.parse(req.url, true) output for Next.js compatibility:
      // - pathname: string
      // - query: object
      // - search: string
      // - path: string (pathname + search)
      // - href: string (req.url)
      //
      // IMPORTANT: We do NOT include protocol, host, hostname, port, or origin.
      // Next.js might incorrectly infer https/redirects if these are present and mismatch headers.
      const urlObject = {
        pathname,
        query,
        search,
        path: pathname + (search || ''),
        href: req.url, // Keep original relative URL
      };

      if (pathname === "/a") {
        await app.render(req, res, "/a", query);
      } else if (pathname === "/b") {
        await app.render(req, res, "/b", query);
      } else {
        await handle(req, res, urlObject);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});