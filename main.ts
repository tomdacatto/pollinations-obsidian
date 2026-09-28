import {
    App,
    Editor,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    normalizePath,
    requestUrl,
} from "obsidian";

interface PollinationsSettings {
    apiKey: string;
    textModel: string;
    imageModel: string;
}

const DEFAULT_SETTINGS: PollinationsSettings = {
    apiKey: "",
    textModel: "openai",
    imageModel: "flux",
};

const BASE_URL = "https://gen.pollinations.ai";

export default class PollinationsPlugin extends Plugin {
    settings!: PollinationsSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "generate-text",
            name: "Generate text from selection or prompt",
            editorCallback: (editor: Editor) => this.generateText(editor),
        });

        this.addCommand({
            id: "generate-image",
            name: "Generate image from selection or prompt",
            editorCallback: (editor: Editor) => this.generateImage(editor),
        });

        this.addSettingTab(new PollinationsSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private requireKey(): string | null {
        if (!this.settings.apiKey) {
            new Notice("Set a Pollinations API key in Settings → Pollinations first.");
            return null;
        }
        return this.settings.apiKey;
    }

    private promptForText(title: string): Promise<string | null> {
        return new Promise((resolve) => new PromptModal(this.app, title, resolve).open());
    }

    async generateText(editor: Editor) {
        const key = this.requireKey();
        if (!key) return;

        const selection = editor.getSelection();
        const prompt = selection || (await this.promptForText("What should Pollinations write?"));
        if (!prompt) return;

        const notice = new Notice("Generating text...", 0);
        try {
            const res = await requestUrl({
                url: `${BASE_URL}/v1/chat/completions`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: this.settings.textModel,
                    messages: [{ role: "user", content: prompt }],
                }),
            });
            const content = res.json?.choices?.[0]?.message?.content;
            if (!content) throw new Error("No content in the response.");

            if (selection) {
                editor.replaceSelection(content);
            } else {
                editor.replaceRange(content, editor.getCursor());
            }
        } catch (error) {
            new Notice(`Pollinations text generation failed: ${errorMessage(error)}`);
        } finally {
            notice.hide();
        }
    }

    async generateImage(editor: Editor) {
        const key = this.requireKey();
        if (!key) return;

        const selection = editor.getSelection();
        const prompt = selection || (await this.promptForText("Describe the image to generate"));
        if (!prompt) return;

        const notice = new Notice("Generating image...", 0);
        try {
            const res = await requestUrl({
                url: `${BASE_URL}/image/${encodeURIComponent(prompt)}?model=${encodeURIComponent(this.settings.imageModel)}`,
                method: "GET",
                headers: { Authorization: `Bearer ${key}` },
            });

            const folder = "pollinations";
            if (!(await this.app.vault.adapter.exists(folder))) {
                await this.app.vault.createFolder(folder);
            }
            const path = normalizePath(`${folder}/${Date.now()}.png`);
            await this.app.vault.createBinary(path, res.arrayBuffer);

            if (selection) {
                editor.replaceSelection(`![[${path}]]`);
            } else {
                editor.replaceRange(`![[${path}]]`, editor.getCursor());
            }
        } catch (error) {
            new Notice(`Pollinations image generation failed: ${errorMessage(error)}`);
        } finally {
            notice.hide();
        }
    }
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

class PromptModal extends Modal {
    private value = "";
    constructor(
        app: App,
        private title: string,
        private resolve: (value: string | null) => void,
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h3", { text: this.title });

        const input = contentEl.createEl("input", { type: "text" });
        input.style.width = "100%";
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.value = input.value;
                this.close();
            }
        });

        new Setting(contentEl).addButton((button) =>
            button
                .setButtonText("Generate")
                .setCta()
                .onClick(() => {
                    this.value = input.value;
                    this.close();
                }),
        );

        window.setTimeout(() => input.focus(), 0);
    }

    onClose() {
        this.contentEl.empty();
        this.resolve(this.value.trim() || null);
    }
}

class PollinationsSettingTab extends PluginSettingTab {
    constructor(
        app: App,
        private plugin: PollinationsPlugin,
    ) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("API key")
            .setDesc("From https://enter.pollinations.ai/keys")
            .addText((text) =>
                text
                    .setPlaceholder("pk_... or sk_...")
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value.trim();
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Text model")
            .setDesc("Any model id from https://gen.pollinations.ai/text/models")
            .addText((text) =>
                text.setValue(this.plugin.settings.textModel).onChange(async (value) => {
                    this.plugin.settings.textModel = value.trim() || DEFAULT_SETTINGS.textModel;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName("Image model")
            .setDesc("Any model id from https://gen.pollinations.ai/image/models")
            .addText((text) =>
                text.setValue(this.plugin.settings.imageModel).onChange(async (value) => {
                    this.plugin.settings.imageModel = value.trim() || DEFAULT_SETTINGS.imageModel;
                    await this.plugin.saveSettings();
                }),
            );
    }
}
