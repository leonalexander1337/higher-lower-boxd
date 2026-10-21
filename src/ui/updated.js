// Shows when the IMDb data was last refreshed (written by build.js)
export async function initUpdatedDate() {
    const el = document.getElementById("updated");
    if (!el) return;

    try {
        const res = await fetch("data/dist/meta.json");
        const meta = await res.json();

        const date = new Date(meta.updated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC"
        });

        el.textContent = `Data updated: ${date}`;
    } catch (e) {
        console.error("Meta load failed:", e);
    }
}
