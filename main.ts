import { Plugin, TFolder } from "obsidian";

export default class IsolatedFolderView extends Plugin {
    isolatedPath: string | null = null;

    async onload() {
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) =>
                        item
                            .setTitle("Open in Isolated View")
                            .setIcon("eye")
                            .onClick(() => this.isolateFolder(file))
                    );
                }
            })
        );

        this.addCommand({
            id: "restore-full-view",
            name: "Exit Isolated View",
            callback: () => this.restoreFullView(),
        });
    }

    isolateFolder(folder: TFolder) {
        this.isolatedPath = folder.path;
        const explorer = document.querySelector(".nav-files-container");
        if (!explorer) return;

        // Mark isolated view
        explorer.classList.add("isolated-folder-view");
        explorer.setAttribute("data-isolated-path", folder.path);

        // Hide unrelated folders
        const folders = explorer.querySelectorAll(".nav-folder");
        folders.forEach((el) => {
            const path = el.getAttribute("data-path");
            if (!path?.startsWith(folder.path)) {
                el.classList.add("hidden-folder");
            } else {
                el.classList.remove("hidden-folder");
            }
        });

        // Insert fake root header
        this.insertIsolatedHeader(folder.name);
    }

    insertIsolatedHeader(folderName: string) {
        const existingHeader = document.querySelector(".isolated-header");
        if (existingHeader) existingHeader.remove();

        const header = document.createElement("div");
        header.className = "isolated-header";
        header.innerHTML = `
      <div class="isolated-title">${folderName}</div>
      <button class="isolated-back-button">Back to full view</button>
    `;

        header.querySelector(".isolated-back-button")?.addEventListener("click", () => {
            this.restoreFullView();
        });

        const navSide = document.querySelector(".nav-files-container");
        if (navSide) {
            navSide.prepend(header);
        }
    }

    restoreFullView() {
        this.isolatedPath = null;

        const explorer = document.querySelector(".nav-files-container");
        if (!explorer) return;

        explorer.classList.remove("isolated-folder-view");
        explorer.removeAttribute("data-isolated-path");

        const folders = explorer.querySelectorAll(".nav-folder");
        folders.forEach((el) => {
            el.classList.remove("hidden-folder");
        });

        const header = document.querySelector(".isolated-header");
        if (header) header.remove();
    }
}
