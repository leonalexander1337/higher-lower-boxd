export function initMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const sidebar = document.getElementById("sidebar-left");

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
        if (
            sidebar.classList.contains("mobile-open") &&
            !sidebar.contains(e.target) &&
            !hamburger.contains(e.target)
        ) {
            sidebar.classList.remove("mobile-open");
        }
    });
}
