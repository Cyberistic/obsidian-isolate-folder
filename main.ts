import { Menu, Plugin, TFolder } from "obsidian";

export default class IsolatedFolderView extends Plugin {
    isolatedPath: string | null = null;

    async onload() {
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                // Only show isolation option if we're not already in isolated view
                // TODO: Handle nested isolated folders, we have an issue where Isolation in Isolation doesn't show children

                if (file instanceof TFolder && !this.isolatedPath) {
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

    async isolateFolder(folder: TFolder) {
        // If we're already in isolated view, restore the full view
        if (this.isolatedPath) {
            await this.restoreFullView();
        }

        await this.doIsolateFolder(folder);
    }

    private async doIsolateFolder(folder: TFolder) {
        this.isolatedPath = folder.path;
        const explorer = document.querySelector(".nav-files-container");
        if (!explorer) return;

        // Add class to mark isolated view
        explorer.classList.add("isolated-folder-view");
        explorer.setAttribute("data-isolated-path", folder.path);

        // Get/add main-nav-list class to first child
        const firstChild = explorer.firstElementChild;
        if (firstChild && !explorer.querySelector(".main-nav-list")) {
            firstChild.classList.add("main-nav-list");
        }

        // Hide the main navigation list
        const mainNavList = explorer.querySelector(".main-nav-list");
        mainNavList?.classList.add("is-hidden");

        // Create isolated container
        let isolatedContainer = explorer.querySelector(".isolated-container");
        if (!isolatedContainer) {
            isolatedContainer = document.createElement("div");
            isolatedContainer.className = "isolated-container";
            explorer.appendChild(isolatedContainer);
        } else {
            isolatedContainer.innerHTML = '';
        }

        // Find and expand target folder
        const targetFolderTitle = explorer.querySelector(`.nav-folder-title[data-path="${folder.path}"]`);
        if (targetFolderTitle && isolatedContainer) {
            const targetFolder = targetFolderTitle.closest('.nav-folder');
            if (targetFolder) {
                // Always expand the folder first
                if (targetFolder.classList.contains('is-collapsed')) {
                    (targetFolderTitle as HTMLElement).click();
                }

                const childrenContainer = targetFolder.querySelector('.nav-folder-children');
                if (childrenContainer) {
                    isolatedContainer.appendChild(childrenContainer);
                }
            }
        }

        this.insertIsolatedHeader(folder.name);
    }

    insertIsolatedHeader(folderName: string) {
        const existingHeader = document.querySelector(".isolated-header");
        if (existingHeader) existingHeader.remove();

        const header = document.createElement("div");
        header.className = "isolated-header";
        header.innerHTML = `
            <div class="isolated-title">${folderName}</div>
        `;

        // Add context menu to header
        header.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            const menu = new Menu();
            menu.addItem((item) => {
                item
                    .setTitle("Back to full view")
                    .setIcon("arrow-left")
                    .onClick(() => this.restoreFullView());
            });
            menu.showAtMouseEvent(e);
        });

        // Create bottom button
        const backButton = document.createElement("button");
        backButton.className = "isolated-back-button";
        backButton.textContent = "Back to vault view";
        backButton.addEventListener("click", () => this.restoreFullView());

        const navSide = document.querySelector(".nav-files-container");
        if (navSide) {
            navSide.prepend(header);
            navSide.appendChild(backButton);
        }
    }

    async restoreFullView() {
        const explorer = document.querySelector(".nav-files-container");
        if (!explorer || !this.isolatedPath) return;

        // Find and toggle the folder state before restoring
        const targetFolderTitle = explorer.querySelector(`.nav-folder-title[data-path="${this.isolatedPath}"]`);
        if (targetFolderTitle) {
            const targetFolder = targetFolderTitle.closest('.nav-folder');
            if (targetFolder) {

                // !NOTE: This is a hack since going back to the main view doesn't
                // !Doesnt rerender children upon moving them back
                // !So we need to collapse the folder to force a rerender
                if (!targetFolder.classList.contains('is-collapsed')) {
                    (targetFolderTitle as HTMLElement).click(); // collapse

                }
            }
        }

        this.isolatedPath = null;

        // Show main nav list
        const mainNavList = explorer.querySelector(".main-nav-list");
        if (mainNavList) {
            mainNavList.classList.remove("is-hidden");
        }

        // Find the isolated container and get the children container
        const isolatedContainer = explorer.querySelector(".isolated-container");
        if (isolatedContainer && isolatedContainer.firstChild) {
            // Find the target folder element
            if (this.isolatedPath) {
                const targetFolderTitle = explorer.querySelector(`.nav-folder-title[data-path="${this.isolatedPath}"]`);
                if (targetFolderTitle) {
                    const targetFolder = targetFolderTitle.closest('.nav-folder');
                    if (targetFolder) {
                        // Move the children container back to the target folder
                        targetFolder.appendChild(isolatedContainer.firstChild);
                    }
                }
            }
        }

        // Remove the isolated container
        const container = explorer.querySelector(".isolated-container");
        if (container) container.remove();

        explorer.classList.remove("isolated-folder-view");
        explorer.removeAttribute("data-isolated-path");

        const header = document.querySelector(".isolated-header");
        if (header) header.remove();

        const backButton = document.querySelector(".isolated-back-button");
        if (backButton) backButton.remove();
    }
}
