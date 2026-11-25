// Initial locked deployment. The console remains unavailable until Access is configured.
export default {
  async fetch() {
    return new Response("LTS Pipeline — Accesso non ancora configurato. Dashboard protetta.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer"
      }
    });
  }
};
